import pool from "../config/db.js";
import { recordActivityLog } from "../services/activityLogService.js";
import { mapJobOpening, mapJobPosition } from "../utils/formatters.js";

const allowedJobStatuses = ["open", "closed", "draft"];
const allowedPositionCategories = ["Teaching", "Non-Teaching"];

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function getPagination(query = {}, { defaultLimit = 60, maxLimit = 100 } = {}) {
  const limit = Number.parseInt(query.limit || String(defaultLimit), 10);
  const offset = Number.parseInt(query.offset || "0", 10);

  return {
    limit: Number.isInteger(limit) ? Math.min(Math.max(limit, 1), maxLimit) : defaultLimit,
    offset: Number.isInteger(offset) ? Math.max(offset, 0) : 0,
  };
}

function normalizeDeadlineTime(value, fallback = "23:59") {
  const raw = String(value || "").trim();
  if (!raw) return fallback;

  const match = raw.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  return match ? `${match[1]}:${match[2]}` : null;
}

function isDeadlinePast(deadline, deadlineTime) {
  if (!deadline) return false;

  const time = normalizeDeadlineTime(deadlineTime);
  if (!time) return true;

  const deadlineAt = new Date(`${deadline}T${time}:00`);
  return Number.isNaN(deadlineAt.getTime()) || deadlineAt < new Date();
}

function slugifyRequirement(label, index) {
  const slug = String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return slug || `requirement_${index + 1}`;
}

function normalizeRequirements(requirements = []) {
  if (!Array.isArray(requirements)) return [];

  const used = new Set();

  return requirements
    .map((requirement, index) => {
      const label = String(requirement?.label || "").trim();
      if (!label) return null;

      let field = String(requirement?.field || slugifyRequirement(label, index))
        .trim()
        .replace(/[^a-zA-Z0-9_]/g, "_");

      if (!field) field = `requirement_${index + 1}`;

      const baseField = field;
      let suffix = 2;
      while (used.has(field)) {
        field = `${baseField}_${suffix}`;
        suffix += 1;
      }
      used.add(field);

      return {
        field,
        label,
        description: String(requirement?.description || "").trim(),
        required: requirement?.required !== false,
      };
    })
    .filter(Boolean);
}

async function getPosition(positionId) {
  const id = Number.parseInt(positionId, 10);

  if (!Number.isInteger(id) || id <= 0) return null;

  const result = await pool.query(
    `SELECT id, category, title, requirements, created_at, updated_at
     FROM job_positions
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
}

const jobOpeningSelect = `
  id, title, location, district, barangay, vacancy, deadline, deadline_time,
  position_id, position_category, status, description, requirements,
  deadline + COALESCE(deadline_time, TIME '23:59') AS deadline_at,
  created_at, updated_at
`;

const jobPositionsCacheTtlMs = 30 * 1000;
let jobPositionsCache = {
  expiresAt: 0,
  positions: null,
};

function clearJobPositionsCache() {
  jobPositionsCache = {
    expiresAt: 0,
    positions: null,
  };
}

function isApplicantUser(user) {
  return String(user?.role || "").toLowerCase() === "applicant";
}

function requirementSnapshot(requirements = []) {
  return normalizeRequirements(requirements).map((requirement) => ({
    field: requirement.field,
    label: requirement.label,
    description: requirement.description,
    required: requirement.required !== false,
  }));
}

function requirementsChanged(beforeRequirements = [], afterRequirements = []) {
  return (
    JSON.stringify(requirementSnapshot(beforeRequirements)) !==
    JSON.stringify(requirementSnapshot(afterRequirements))
  );
}

async function getApplicantJobContext(
  jobIds,
  user,
  { includeUploads = false } = {}
) {
  const ids = Array.from(
    new Set(
      (jobIds || [])
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  );

  if (!isApplicantUser(user) || ids.length === 0) {
    return {
      applications: new Map(),
      activeUploads: new Map(),
    };
  }

  const [applicationResult, uploadResult] = await Promise.all([
    pool.query(
      `SELECT id, job_opening_id, status
       FROM job_applications
       WHERE user_id = $1
         AND job_opening_id = ANY($2::int[])`,
      [user.id, ids]
    ),
    includeUploads
      ? pool.query(
          `SELECT job_opening_id, ARRAY_AGG(DISTINCT requirement_field) AS fields
           FROM uploaded_files
           WHERE owner_user_id = $1
             AND job_opening_id = ANY($2::int[])
             AND status = 'active'
           GROUP BY job_opening_id`,
          [user.id, ids]
        )
      : Promise.resolve({ rows: [] }),
  ]);

  return {
    applications: new Map(
      applicationResult.rows.map((row) => [Number(row.job_opening_id), row])
    ),
    activeUploads: new Map(
      uploadResult.rows.map((row) => [
        Number(row.job_opening_id),
        row.fields || [],
      ])
    ),
  };
}

function mapJobOpeningForApplicant(row, context) {
  const job = mapJobOpening(row);
  const application = context.applications.get(Number(job.id));
  const activeRequirementFields = context.activeUploads.get(Number(job.id));

  return {
    ...job,
    applied: Boolean(application),
    applicationId: application?.id || null,
    applicationStatus: application?.status || "",
    ...(activeRequirementFields ? { activeRequirementFields } : {}),
  };
}

async function archiveUploadsForRequirementChange(jobId) {
  const result = await pool.query(
    `UPDATE uploaded_files
     SET status = 'archived',
         deleted_at = NOW(),
         updated_at = NOW()
     WHERE job_opening_id = $1
       AND status = 'active'`,
    [jobId]
  );

  return result.rowCount;
}

function buildJobFilters(query = {}, { publicOnly = false } = {}) {
  const conditions = [];
  const values = [];
  const q = normalizeSearch(query.q || query.search);
  const location = normalizeSearch(query.location || query.school);
  const district = normalizeSearch(query.district);
  const barangay = normalizeSearch(query.barangay);

  if (publicOnly) {
    conditions.push("status = 'open'");
    conditions.push("(deadline + COALESCE(deadline_time, TIME '23:59')) >= NOW()");
  } else if (query.status && query.status !== "all") {
    if (query.status === "expired") {
      conditions.push("status = 'open'");
      conditions.push("(deadline + COALESCE(deadline_time, TIME '23:59')) < NOW()");
    } else if (allowedJobStatuses.includes(query.status)) {
      values.push(query.status);
      conditions.push(`status = $${values.length}`);
    }
  }

  if (q) {
    values.push(`%${q.toLowerCase()}%`);
    conditions.push(
      `(LOWER(title) LIKE $${values.length} OR LOWER(description) LIKE $${values.length})`
    );
  }

  if (location) {
    values.push(`%${location.toLowerCase()}%`);
    conditions.push(
      `(LOWER(location) LIKE $${values.length} OR LOWER(district) LIKE $${values.length} OR LOWER(barangay) LIKE $${values.length})`
    );
  }

  if (district) {
    values.push(district.toLowerCase());
    conditions.push(`LOWER(district) = $${values.length}`);
  }

  if (barangay) {
    values.push(barangay.toLowerCase());
    conditions.push(`LOWER(barangay) = $${values.length}`);
  }

  return {
    where: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    values,
  };
}

export async function listOpenJobOpenings(req, res) {
  try {
    const { limit, offset } = getPagination(req.query);
    const { where, values } = buildJobFilters(req.query, {
      publicOnly: true,
    });
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM job_openings
       ${where}`,
      values
    );

    values.push(limit);
    values.push(offset);

    const result = await pool.query(
      `SELECT ${jobOpeningSelect}
       FROM job_openings
       ${where}
       ORDER BY deadline ASC, deadline_time ASC, created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );
    const applicantContext = await getApplicantJobContext(
      result.rows.map((row) => row.id),
      req.user
    );

    res.json({
      success: true,
      jobs: result.rows.map((row) =>
        mapJobOpeningForApplicant(row, applicantContext)
      ),
      pagination: {
        limit,
        offset,
        total: countResult.rows[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching job openings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job openings",
    });
  }
}

export async function getJobOpening(req, res) {
  try {
    const result = await pool.query(
      `SELECT ${jobOpeningSelect}
       FROM job_openings
       WHERE id = $1
         AND status = 'open'
         AND (deadline + COALESCE(deadline_time, TIME '23:59')) >= NOW()
       LIMIT 1`,
      [req.params.id]
    );

    const job = result.rows[0];

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job opening not found.",
      });
    }
    const applicantContext = await getApplicantJobContext([job.id], req.user, {
      includeUploads: true,
    });
    const mappedJob = mapJobOpeningForApplicant(job, applicantContext);
    if (isApplicantUser(req.user)) {
      mappedJob.activeRequirementFields =
        applicantContext.activeUploads.get(Number(job.id)) || [];
    }

    return res.json({
      success: true,
      job: mappedJob,
    });
  } catch (error) {
    console.error("Error fetching job opening:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job opening",
    });
  }
}

export async function listAdminJobOpenings(req, res) {
  try {
    const { limit, offset } = getPagination(req.query);
    const { where, values } = buildJobFilters(req.query);
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM job_openings
       ${where}`,
      values
    );

    values.push(limit);
    values.push(offset);

    const result = await pool.query(
      `SELECT ${jobOpeningSelect}
       FROM job_openings
       ${where}
       ORDER BY created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values
    );

    res.json({
      success: true,
      jobs: result.rows.map(mapJobOpening),
      pagination: {
        limit,
        offset,
        total: countResult.rows[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching admin job openings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch job openings",
    });
  }
}

export async function deleteJobOpening(req, res) {
  try {
    const existingResult = await pool.query(
      `SELECT id, title, status
       FROM job_openings
       WHERE id = $1
       LIMIT 1`,
      [req.params.id]
    );
    const existingJob = existingResult.rows[0];

    const result = await pool.query(
      "DELETE FROM job_openings WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Job opening not found.",
      });
    }

    await recordActivityLog(pool, {
      actor: req.user,
      action: "job_opening.deleted",
      entityType: "job_opening",
      entityId: Number(req.params.id),
      entityLabel: existingJob?.title || "Job opening",
      metadata: {
        previousStatus: existingJob?.status || "",
      },
    });

    return res.json({
      success: true,
      message: "Job opening deleted.",
    });
  } catch (error) {
    console.error("deleteJobOpening error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete job opening",
    });
  }
}

export async function listJobPositions(_req, res) {
  try {
    if (
      jobPositionsCache.positions &&
      jobPositionsCache.expiresAt > Date.now()
    ) {
      return res.json({
        success: true,
        positions: jobPositionsCache.positions,
      });
    }

    const result = await pool.query(
      `SELECT id, category, title, requirements, created_at, updated_at
       FROM job_positions
       ORDER BY category ASC, title ASC`
    );
    const positions = result.rows.map(mapJobPosition);
    jobPositionsCache = {
      positions,
      expiresAt: Date.now() + jobPositionsCacheTtlMs,
    };

    return res.json({
      success: true,
      positions,
    });
  } catch (error) {
    console.error("Error fetching job positions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch job positions",
    });
  }
}

export async function createJobPosition(req, res) {
  const category = String(req.body?.category || "").trim();
  const title = String(req.body?.title || "").trim();
  const requirements = normalizeRequirements(req.body?.requirements || []);

  if (!allowedPositionCategories.includes(category) || !title) {
    return res.status(400).json({
      success: false,
      message: "Position category and title are required.",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO job_positions (category, title, requirements, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, category, title, requirements, created_at, updated_at`,
      [category, title, JSON.stringify(requirements)]
    );
    const position = mapJobPosition(result.rows[0]);
    clearJobPositionsCache();

    await recordActivityLog(pool, {
      actor: req.user,
      action: "job_position.created",
      entityType: "job_position",
      entityId: position.id,
      entityLabel: position.title,
      metadata: {
        category: position.category,
      },
    });

    return res.status(201).json({
      success: true,
      position,
    });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "That position already exists.",
      });
    }

    console.error("Error creating job position:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create job position",
    });
  }
}

export async function updateJobPosition(req, res) {
  const category =
    req.body?.category === undefined
      ? undefined
      : String(req.body.category || "").trim();
  const title =
    req.body?.title === undefined
      ? undefined
      : String(req.body.title || "").trim();
  const requirements =
    req.body?.requirements === undefined
      ? undefined
      : normalizeRequirements(req.body.requirements || []);

  if (category !== undefined && !allowedPositionCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: "Invalid position category.",
    });
  }

  if (title !== undefined && !title) {
    return res.status(400).json({
      success: false,
      message: "Position title is required.",
    });
  }

  try {
    const beforeResult = await pool.query(
      `SELECT id, category, title, requirements
       FROM job_positions
       WHERE id = $1
       LIMIT 1`,
      [req.params.id]
    );

    const result = await pool.query(
      `UPDATE job_positions
       SET category = COALESCE($2, category),
           title = COALESCE($3, title),
           requirements = COALESCE($4, requirements),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, category, title, requirements, created_at, updated_at`,
      [
        req.params.id,
        category || null,
        title || null,
        requirements === undefined ? null : JSON.stringify(requirements),
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Position not found.",
      });
    }

    const position = mapJobPosition(result.rows[0]);
    clearJobPositionsCache();

    await recordActivityLog(pool, {
      actor: req.user,
      action: "job_position.updated",
      entityType: "job_position",
      entityId: position.id,
      entityLabel: position.title,
      metadata: {
        before: beforeResult.rows[0] || null,
        after: {
          category: position.category,
          title: position.title,
          requirements: position.requirements,
        },
      },
    });

    return res.json({
      success: true,
      position,
    });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "That position already exists.",
      });
    }

    console.error("Error updating job position:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update job position",
    });
  }
}

export async function deleteJobPosition(req, res) {
  try {
    const existingResult = await pool.query(
      `SELECT id, category, title
       FROM job_positions
       WHERE id = $1
       LIMIT 1`,
      [req.params.id]
    );
    const existingPosition = existingResult.rows[0];

    const result = await pool.query(
      "DELETE FROM job_positions WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Position not found.",
      });
    }
    clearJobPositionsCache();

    await recordActivityLog(pool, {
      actor: req.user,
      action: "job_position.deleted",
      entityType: "job_position",
      entityId: Number(req.params.id),
      entityLabel: existingPosition?.title || "Position",
      metadata: {
        category: existingPosition?.category || "",
      },
    });

    return res.json({
      success: true,
      message: "Position deleted.",
    });
  } catch (error) {
    console.error("Error deleting job position:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete job position",
    });
  }
}

export async function createJobOpening(req, res) {
  const selectedPosition = await getPosition(req.body?.positionId);
  if (req.body?.positionId && !selectedPosition) {
    return res.status(400).json({
      success: false,
      message: "Selected position was not found.",
    });
  }

  const title = String(req.body?.title || selectedPosition?.title || "").trim();
  const district = String(req.body?.district || "").trim();
  const barangay = String(req.body?.barangay || "").trim();
  const location = String(
    req.body?.location || [barangay, district].filter(Boolean).join(", ")
  ).trim();
  const vacancy = Number.parseInt(req.body?.vacancy || "1", 10);
  const deadline = String(req.body?.deadline || "").trim();
  const deadlineTime = normalizeDeadlineTime(req.body?.deadlineTime);
  const status = String(req.body?.status || "open").toLowerCase();
  const description = String(req.body?.description || "");
  const positionId = selectedPosition?.id || null;
  const positionCategory = String(
    req.body?.positionCategory || selectedPosition?.category || ""
  ).trim();
  const requirements = normalizeRequirements(
    req.body?.requirements?.length
      ? req.body.requirements
      : selectedPosition?.requirements || []
  );

  if (!title || !district || !barangay || !deadline || !deadlineTime) {
    return res.status(400).json({
      success: false,
      message: "Title, district, barangay, application deadline, and time are required.",
    });
  }

  if (!Number.isInteger(vacancy) || vacancy < 1) {
    return res.status(400).json({
      success: false,
      message: "Vacancy must be at least 1.",
    });
  }

  if (!allowedJobStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid job status.",
    });
  }

  if (positionCategory && !allowedPositionCategories.includes(positionCategory)) {
    return res.status(400).json({
      success: false,
      message: "Invalid position category.",
    });
  }

  if (status === "open" && isDeadlinePast(deadline, deadlineTime)) {
    return res.status(400).json({
      success: false,
      message: "Open job postings cannot have an expired application deadline.",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO job_openings
        (title, location, district, barangay, vacancy, deadline, deadline_time,
         position_id, position_category, status, description, requirements,
         created_by, updated_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13, NOW(), NOW())
       RETURNING ${jobOpeningSelect}`,
      [
        title,
        location,
        district,
        barangay,
        vacancy,
        deadline,
        deadlineTime,
        positionId,
        positionCategory || null,
        status,
        description.trim() ? description : null,
        JSON.stringify(requirements),
        req.user?.id || null,
      ]
    );
    const job = mapJobOpening(result.rows[0]);

    await recordActivityLog(pool, {
      actor: req.user,
      action: "job_opening.created",
      entityType: "job_opening",
      entityId: job.id,
      entityLabel: job.title,
      metadata: {
        status: job.status,
        deadline: job.deadline,
        vacancy: job.vacancy,
      },
    });

    res.status(201).json({
      success: true,
      job,
    });
  } catch (error) {
    console.error("Error creating job opening:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create job opening",
    });
  }
}

export async function updateJobOpening(req, res) {
  const selectedPosition =
    req.body?.positionId === undefined ? undefined : await getPosition(req.body.positionId);
  if (req.body?.positionId && !selectedPosition) {
    return res.status(400).json({
      success: false,
      message: "Selected position was not found.",
    });
  }

  const updates = {
    title:
      req.body?.title === undefined
        ? selectedPosition?.title
        : String(req.body.title || selectedPosition?.title || "").trim(),
    location:
      req.body?.location === undefined
        ? undefined
        : String(req.body.location || "").trim(),
    district:
      req.body?.district === undefined
        ? undefined
        : String(req.body.district || "").trim(),
    barangay:
      req.body?.barangay === undefined
        ? undefined
        : String(req.body.barangay || "").trim(),
    vacancy:
      req.body?.vacancy === undefined
        ? undefined
        : Number.parseInt(req.body.vacancy, 10),
    deadline:
      req.body?.deadline === undefined
        ? undefined
        : String(req.body.deadline || "").trim(),
    deadlineTime:
      req.body?.deadlineTime === undefined
        ? undefined
        : normalizeDeadlineTime(req.body.deadlineTime),
    positionId:
      req.body?.positionId === undefined
        ? undefined
        : selectedPosition?.id || null,
    positionCategory:
      req.body?.positionCategory === undefined && selectedPosition === undefined
        ? undefined
        : String(req.body?.positionCategory || selectedPosition?.category || "").trim(),
    status:
      req.body?.status === undefined
        ? undefined
        : String(req.body.status || "").toLowerCase(),
    description:
      req.body?.description === undefined
        ? undefined
        : String(req.body.description || ""),
    requirements:
      req.body?.requirements === undefined && selectedPosition === undefined
        ? undefined
        : normalizeRequirements(
            req.body?.requirements !== undefined
              ? req.body.requirements
              : selectedPosition?.requirements || []
          ),
  };

  if (updates.vacancy !== undefined) {
    if (!Number.isInteger(updates.vacancy) || updates.vacancy < 0) {
      return res.status(400).json({
        success: false,
        message: "Vacancy cannot be negative.",
      });
    }
  }

  if (updates.status !== undefined && !allowedJobStatuses.includes(updates.status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid job status.",
    });
  }

  if (updates.deadlineTime === null) {
    return res.status(400).json({
      success: false,
      message: "Invalid application deadline time.",
    });
  }

  if (
    updates.positionCategory !== undefined &&
    updates.positionCategory &&
    !allowedPositionCategories.includes(updates.positionCategory)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid position category.",
    });
  }

  if (
    updates.status === "open" &&
    updates.deadline &&
    isDeadlinePast(updates.deadline, updates.deadlineTime || req.body?.deadlineTime)
  ) {
    return res.status(400).json({
      success: false,
      message: "Open job postings cannot have an expired application deadline.",
    });
  }

  try {
    const beforeResult = await pool.query(
      `SELECT ${jobOpeningSelect}
       FROM job_openings
       WHERE id = $1
       LIMIT 1`,
      [req.params.id]
    );

    const result = await pool.query(
      `UPDATE job_openings
       SET title = COALESCE($2, title),
            location = COALESCE($3, location),
            district = COALESCE($4, district),
            barangay = COALESCE($5, barangay),
            vacancy = COALESCE($6, vacancy),
            deadline = COALESCE($7, deadline),
            deadline_time = COALESCE($8, deadline_time),
            position_id = COALESCE($9, position_id),
            position_category = COALESCE($10, position_category),
            status = COALESCE($11, status),
            description = COALESCE($12, description),
            requirements = COALESCE($13, requirements),
            updated_by = $14,
            updated_at = NOW()
        WHERE id = $1
        RETURNING ${jobOpeningSelect}`,
      [
        req.params.id,
        updates.title || null,
        updates.location || null,
        updates.district || null,
        updates.barangay || null,
        updates.vacancy ?? null,
        updates.deadline || null,
        updates.deadlineTime || null,
        updates.positionId ?? null,
        updates.positionCategory || null,
        updates.status || null,
        updates.description ?? null,
        updates.requirements === undefined ? null : JSON.stringify(updates.requirements),
        req.user?.id || null,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Job opening not found.",
      });
    }

    const job = mapJobOpening(result.rows[0]);
    const beforeJob = beforeResult.rows[0] ? mapJobOpening(beforeResult.rows[0]) : null;
    const didRequirementsChange =
      updates.requirements !== undefined &&
      requirementsChanged(beforeJob?.requirements || [], job.requirements || []);
    const archivedRequirementUploads = didRequirementsChange
      ? await archiveUploadsForRequirementChange(job.id)
      : 0;

    await recordActivityLog(pool, {
      actor: req.user,
      action: "job_opening.updated",
      entityType: "job_opening",
      entityId: job.id,
      entityLabel: job.title,
      metadata: {
        before: beforeJob,
        after: job,
        requirementsChanged: didRequirementsChange,
        archivedRequirementUploads,
      },
    });

    res.json({ success: true, job });
  } catch (error) {
    console.error("Error updating job opening:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update job opening",
    });
  }
}
