import pool from "../config/db.js";
import {
  getFixedApplicationRequirements,
} from "../config/applicationRequirements.js";
import { recordActivityLog } from "../services/activityLogService.js";
import { mapJobOpening, mapJobPosition } from "../utils/formatters.js";

const allowedJobStatuses = ["open", "closed", "draft"];
const allowedPositionCategories = ["Teaching", "Non-Teaching"];

const jobOpeningSelect = `
  id, title, location, district, barangay, vacancy, deadline, deadline_time,
  position_id, position_category, salary_grade, salary_amount, education,
  training, experience, eligibility, status, description,
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

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function getPagination(query = {}, { defaultLimit = 60, maxLimit = 100 } = {}) {
  const limit = Number.parseInt(query.limit || String(defaultLimit), 10);
  const offset = Number.parseInt(query.offset || "0", 10);

  return {
    limit: Number.isInteger(limit)
      ? Math.min(Math.max(limit, 1), maxLimit)
      : defaultLimit,
    offset: Number.isInteger(offset) ? Math.max(offset, 0) : 0,
  };
}

function normalizeDeadlineTime(value, fallback = "23:59") {
  const raw = String(value || "").trim();
  if (!raw) return fallback;

  const match = raw.match(/^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  return match ? `${match[1]}:${match[2]}` : null;
}

function getDateInputValue(value) {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

function isDeadlinePast(deadline, deadlineTime) {
  if (!deadline) return false;

  const time = normalizeDeadlineTime(deadlineTime);
  if (!time) return true;

  const deadlineAt = new Date(`${deadline}T${time}:00`);
  return Number.isNaN(deadlineAt.getTime()) || deadlineAt < new Date();
}

function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeMoney(value) {
  return String(value || "").trim();
}

function normalizeVacancyItems(payload = {}, { allowFallback = true } = {}) {
  const incomingItems =
    payload.vacancyItems || payload.items || payload.jobPostingItems || [];
  const items = Array.isArray(incomingItems) ? incomingItems : [];
  const normalized = items
    .map((item) => {
      const vacancyCount = Number.parseInt(item?.vacancyCount ?? item?.vacancy_count, 10);

      return {
        id: Number.parseInt(item?.id, 10) || null,
        schoolStation: normalizeSearch(
          item?.schoolStation || item?.school_station || item?.school || item?.station
        ),
        subjectArea: normalizeSearch(
          item?.subjectArea || item?.subject_area || item?.subject || item?.learningArea
        ),
        vacancyCount,
      };
    })
    .filter((item) => item.schoolStation || Number.isInteger(item.vacancyCount));

  if (normalized.length === 0 && allowFallback) {
    const fallbackStation = normalizeSearch(payload.school || payload.location);
    const fallbackCount = Number.parseInt(payload.vacancy || "1", 10);

    if (fallbackStation) {
      normalized.push({
        id: null,
        schoolStation: fallbackStation,
        subjectArea: normalizeSearch(payload.subjectArea || payload.subject),
        vacancyCount: Number.isInteger(fallbackCount) ? fallbackCount : 1,
      });
    }
  }

  normalized.forEach((item, index) => {
    if (!item.schoolStation) {
      throw createHttpError(`School/station is required for vacancy item ${index + 1}.`);
    }

    if (!Number.isInteger(item.vacancyCount) || item.vacancyCount < 1) {
      throw createHttpError(
        `Vacancy count must be at least 1 for ${item.schoolStation}.`
      );
    }
  });

  return normalized;
}

function getVacancyTotal(items = []) {
  return items.reduce((total, item) => total + Number(item.vacancyCount || 0), 0);
}

function summarizeVacancyLocation(items = []) {
  const stations = Array.from(
    new Set(items.map((item) => item.schoolStation).filter(Boolean))
  );

  if (stations.length <= 3) return stations.join(", ");
  return `${stations.slice(0, 3).join(", ")} +${stations.length - 3} more`;
}

function mapPositionForClient(row) {
  return mapJobPosition(row);
}

async function getPosition(positionId) {
  const id = Number.parseInt(positionId, 10);

  if (!Number.isInteger(id) || id <= 0) return null;

  const result = await pool.query(
    `SELECT id, category, title, created_at, updated_at
     FROM job_positions
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
}

async function getVacancyItemsByJobIds(queryable, jobIds = []) {
  const ids = Array.from(
    new Set(
      jobIds
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  );

  if (ids.length === 0) return new Map();

  const result = await queryable.query(
    `SELECT id, job_opening_id, school_station, subject_area, vacancy_count,
       assigned_count, created_at, updated_at
     FROM job_opening_items
     WHERE job_opening_id = ANY($1::int[])
     ORDER BY school_station ASC, subject_area ASC, id ASC`,
    [ids]
  );

  return result.rows.reduce((groups, row) => {
    const key = Number(row.job_opening_id);
    const next = groups.get(key) || [];
    next.push(row);
    groups.set(key, next);
    return groups;
  }, new Map());
}

async function attachVacancyItems(queryable, rows = []) {
  const itemMap = await getVacancyItemsByJobIds(
    queryable,
    rows.map((row) => row.id)
  );

  return rows.map((row) => ({
    ...row,
    vacancy_items: itemMap.get(Number(row.id)) || [],
  }));
}

async function replaceVacancyItems(client, jobId, nextItems = []) {
  const existingResult = await client.query(
    `SELECT id, assigned_count
     FROM job_opening_items
     WHERE job_opening_id = $1
     FOR UPDATE`,
    [jobId]
  );
  const existingById = new Map(
    existingResult.rows.map((item) => [Number(item.id), item])
  );
  const keptIds = [];

  for (const item of nextItems) {
    if (item.id && existingById.has(Number(item.id))) {
      const result = await client.query(
        `UPDATE job_opening_items
         SET school_station = $3,
             subject_area = $4,
             vacancy_count = $5,
             assigned_count = LEAST(assigned_count, $5),
             updated_at = NOW()
         WHERE id = $1
           AND job_opening_id = $2
         RETURNING id`,
        [
          item.id,
          jobId,
          item.schoolStation,
          item.subjectArea || null,
          item.vacancyCount,
        ]
      );
      keptIds.push(Number(result.rows[0].id));
      continue;
    }

    const result = await client.query(
      `INSERT INTO job_opening_items (
         job_opening_id, school_station, subject_area, vacancy_count,
         assigned_count, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, 0, NOW(), NOW())
       RETURNING id`,
      [jobId, item.schoolStation, item.subjectArea || null, item.vacancyCount]
    );
    keptIds.push(Number(result.rows[0].id));
  }

  const removable = existingResult.rows.filter(
    (item) => !keptIds.includes(Number(item.id))
  );
  const assignedRemoved = removable.find((item) => Number(item.assigned_count) > 0);

  if (assignedRemoved) {
    throw createHttpError(
      "Vacancy items with assigned applicants cannot be removed.",
      409
    );
  }

  if (removable.length > 0) {
    await client.query(
      `DELETE FROM job_opening_items
       WHERE job_opening_id = $1
         AND id = ANY($2::int[])`,
      [jobId, removable.map((item) => item.id)]
    );
  }
}

function isApplicantUser(user) {
  return String(user?.role || "").toLowerCase() === "applicant";
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
          `SELECT ARRAY_AGG(DISTINCT requirement_field) AS fields
           FROM uploaded_files
           WHERE owner_user_id = $1
             AND job_opening_id IS NULL
             AND status = 'active'`,
          [user.id]
        )
      : Promise.resolve({ rows: [] }),
  ]);
  const libraryFields = uploadResult.rows[0]?.fields || [];

  return {
    applications: new Map(
      applicationResult.rows.map((row) => [Number(row.job_opening_id), row])
    ),
    activeUploads: new Map(ids.map((id) => [id, libraryFields])),
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

function buildJobFilters(query = {}, { publicOnly = false } = {}) {
  const conditions = [];
  const values = [];
  const q = normalizeSearch(query.q || query.search);
  const station = normalizeSearch(query.station || query.location || query.school);
  const subject = normalizeSearch(query.subject || query.subjectArea);

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
      `(LOWER(title) LIKE $${values.length}
        OR LOWER(COALESCE(description, '')) LIKE $${values.length}
        OR LOWER(COALESCE(education, '')) LIKE $${values.length}
        OR LOWER(COALESCE(training, '')) LIKE $${values.length}
        OR LOWER(COALESCE(experience, '')) LIKE $${values.length}
        OR LOWER(COALESCE(eligibility, '')) LIKE $${values.length}
        OR EXISTS (
          SELECT 1 FROM job_opening_items joi
          WHERE joi.job_opening_id = job_openings.id
            AND (
              LOWER(joi.school_station) LIKE $${values.length}
              OR LOWER(COALESCE(joi.subject_area, '')) LIKE $${values.length}
            )
        ))`
    );
  }

  if (station) {
    values.push(`%${station.toLowerCase()}%`);
    conditions.push(
      `(LOWER(location) LIKE $${values.length}
        OR EXISTS (
          SELECT 1 FROM job_opening_items joi
          WHERE joi.job_opening_id = job_openings.id
            AND LOWER(joi.school_station) LIKE $${values.length}
        ))`
    );
  }

  if (subject) {
    values.push(`%${subject.toLowerCase()}%`);
    conditions.push(
      `EXISTS (
        SELECT 1 FROM job_opening_items joi
        WHERE joi.job_opening_id = job_openings.id
          AND LOWER(COALESCE(joi.subject_area, '')) LIKE $${values.length}
      )`
    );
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
    const rows = await attachVacancyItems(pool, result.rows);
    const applicantContext = await getApplicantJobContext(
      rows.map((row) => row.id),
      req.user
    );

    res.json({
      success: true,
      jobs: rows.map((row) => mapJobOpeningForApplicant(row, applicantContext)),
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

    const [job] = await attachVacancyItems(pool, result.rows);

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
    const rows = await attachVacancyItems(pool, result.rows);

    res.json({
      success: true,
      jobs: rows.map(mapJobOpening),
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

    return res.status(error?.code === "23503" ? 409 : 500).json({
      success: false,
      message:
        error?.code === "23503"
          ? "This job opening has assignments or applications and cannot be deleted."
          : "Failed to delete job opening",
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
        requirements: getFixedApplicationRequirements(),
      });
    }

    const result = await pool.query(
      `SELECT id, category, title, created_at, updated_at
       FROM job_positions
       ORDER BY category ASC, title ASC`
    );
    const positions = result.rows.map(mapPositionForClient);
    jobPositionsCache = {
      positions,
      expiresAt: Date.now() + jobPositionsCacheTtlMs,
    };

    return res.json({
      success: true,
      positions,
      requirements: getFixedApplicationRequirements(),
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

  if (!allowedPositionCategories.includes(category) || !title) {
    return res.status(400).json({
      success: false,
      message: "Position category and title are required.",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO job_positions (category, title, created_at, updated_at)
       VALUES ($1, $2, NOW(), NOW())
       RETURNING id, category, title, created_at, updated_at`,
      [category, title]
    );
    const position = mapPositionForClient(result.rows[0]);
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
      message: "Failed to create position",
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
      `SELECT id, category, title
       FROM job_positions
       WHERE id = $1
       LIMIT 1`,
      [req.params.id]
    );

    const result = await pool.query(
      `UPDATE job_positions
       SET category = COALESCE($2, category),
           title = COALESCE($3, title),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, category, title, created_at, updated_at`,
      [req.params.id, category || null, title || null]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Position not found.",
      });
    }

    const position = mapPositionForClient(result.rows[0]);
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
      message: "Failed to update position",
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
      message: "Failed to delete position",
    });
  }
}

function normalizeJobOpeningPayload(req, selectedPosition = null, { partial = false } = {}) {
  const hasItems =
    req.body?.vacancyItems !== undefined ||
    req.body?.items !== undefined ||
    req.body?.jobPostingItems !== undefined;
  const vacancyItems = partial && !hasItems
    ? undefined
    : normalizeVacancyItems(req.body || {}, { allowFallback: !partial });
  const title =
    req.body?.title === undefined && partial
      ? undefined
      : String(req.body?.title || selectedPosition?.title || "").trim();
  const deadline =
    req.body?.deadline === undefined && partial
      ? undefined
      : String(req.body?.deadline || "").trim();
  const deadlineTime =
    req.body?.deadlineTime === undefined && partial
      ? undefined
      : normalizeDeadlineTime(req.body?.deadlineTime);
  const status =
    req.body?.status === undefined && partial
      ? undefined
      : String(req.body?.status || "open").toLowerCase();
  const positionCategory =
    req.body?.positionCategory === undefined && partial && !selectedPosition
      ? undefined
      : String(req.body?.positionCategory || selectedPosition?.category || "").trim();
  const positionId =
    req.body?.positionId === undefined && partial
      ? undefined
      : selectedPosition?.id || null;

  return {
    title,
    vacancyItems,
    vacancy:
      vacancyItems === undefined ? undefined : getVacancyTotal(vacancyItems),
    location:
      vacancyItems === undefined ? undefined : summarizeVacancyLocation(vacancyItems),
    deadline,
    deadlineTime,
    positionId,
    positionCategory,
    status,
    description:
      req.body?.description === undefined && partial
        ? undefined
        : String(req.body?.description || ""),
    salaryGrade:
      req.body?.salaryGrade === undefined && partial
        ? undefined
        : String(req.body?.salaryGrade || "").trim(),
    salaryAmount:
      req.body?.salaryAmount === undefined && partial
        ? undefined
        : normalizeMoney(req.body?.salaryAmount),
    education:
      req.body?.education === undefined && partial
        ? undefined
        : String(req.body?.education || "").trim(),
    training:
      req.body?.training === undefined && partial
        ? undefined
        : String(req.body?.training || "").trim(),
    experience:
      req.body?.experience === undefined && partial
        ? undefined
        : String(req.body?.experience || "").trim(),
    eligibility:
      req.body?.eligibility === undefined && partial
        ? undefined
        : String(req.body?.eligibility || "").trim(),
  };
}

function validateJobOpeningPayload(payload, currentJob = null) {
  const nextStatus = payload.status ?? currentJob?.status ?? "open";
  const nextDeadline = payload.deadline ?? getDateInputValue(currentJob?.deadline);
  const nextDeadlineTime = payload.deadlineTime ?? currentJob?.deadline_time ?? "23:59";

  if (payload.title !== undefined && !payload.title) {
    throw createHttpError("Position title is required.");
  }

  if (payload.vacancyItems !== undefined && payload.vacancyItems.length === 0) {
    throw createHttpError("At least one school/station vacancy item is required.");
  }

  if (payload.deadline !== undefined && !payload.deadline) {
    throw createHttpError("Application deadline is required.");
  }

  if (payload.deadlineTime === null) {
    throw createHttpError("Invalid application deadline time.");
  }

  if (payload.status !== undefined && !allowedJobStatuses.includes(payload.status)) {
    throw createHttpError("Invalid job status.");
  }

  if (
    payload.positionCategory !== undefined &&
    payload.positionCategory &&
    !allowedPositionCategories.includes(payload.positionCategory)
  ) {
    throw createHttpError("Invalid position category.");
  }

  ["salaryGrade", "salaryAmount", "education", "training", "experience", "eligibility"].forEach(
    (field) => {
      if (payload[field] !== undefined && !payload[field]) {
        throw createHttpError(`${field} is required.`);
      }
    }
  );

  if (nextStatus === "open" && nextDeadline && isDeadlinePast(nextDeadline, nextDeadlineTime)) {
    throw createHttpError("Open job postings cannot have an expired application deadline.");
  }
}

export async function createJobOpening(req, res) {
  try {
    const selectedPosition = await getPosition(req.body?.positionId);
    if (req.body?.positionId && !selectedPosition) {
      return res.status(400).json({
        success: false,
        message: "Selected position was not found.",
      });
    }

    const payload = normalizeJobOpeningPayload(req, selectedPosition);
    validateJobOpeningPayload(payload);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `INSERT INTO job_openings
          (title, location, district, barangay, vacancy, deadline, deadline_time,
           position_id, position_category, salary_grade, salary_amount, education,
           training, experience, eligibility, status, description,
           created_by, updated_by, created_at, updated_at)
         VALUES ($1, $2, NULL, NULL, $3, $4, $5, $6, $7, $8, $9, $10,
           $11, $12, $13, $14, $15, $16, $16, NOW(), NOW())
         RETURNING ${jobOpeningSelect}`,
        [
          payload.title,
          payload.location,
          payload.vacancy,
          payload.deadline,
          payload.deadlineTime,
          payload.positionId,
          payload.positionCategory || null,
          payload.salaryGrade,
          payload.salaryAmount,
          payload.education,
          payload.training,
          payload.experience,
          payload.eligibility,
          payload.status,
          payload.description.trim() ? payload.description : null,
          req.user?.id || null,
        ]
      );

      await replaceVacancyItems(client, result.rows[0].id, payload.vacancyItems);
      await client.query("COMMIT");

      const [rowWithItems] = await attachVacancyItems(pool, result.rows);
      const job = mapJobOpening(rowWithItems);

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
          vacancyItems: job.vacancyItems,
        },
      });

      return res.status(201).json({
        success: true,
        job,
      });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating job opening:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create job opening",
    });
  }
}

export async function updateJobOpening(req, res) {
  try {
    const selectedPosition =
      req.body?.positionId === undefined
        ? undefined
        : await getPosition(req.body.positionId);
    if (req.body?.positionId && !selectedPosition) {
      return res.status(400).json({
        success: false,
        message: "Selected position was not found.",
      });
    }

    const beforeResult = await pool.query(
      `SELECT ${jobOpeningSelect}
       FROM job_openings
       WHERE id = $1
       LIMIT 1`,
      [req.params.id]
    );
    const beforeRow = beforeResult.rows[0];

    if (!beforeRow) {
      return res.status(404).json({
        success: false,
        message: "Job opening not found.",
      });
    }

    const payload = normalizeJobOpeningPayload(req, selectedPosition, {
      partial: true,
    });
    validateJobOpeningPayload(payload, beforeRow);

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `UPDATE job_openings
         SET title = COALESCE($2, title),
             location = COALESCE($3, location),
             district = NULL,
             barangay = NULL,
             vacancy = COALESCE($4, vacancy),
             deadline = COALESCE($5, deadline),
             deadline_time = COALESCE($6, deadline_time),
             position_id = COALESCE($7, position_id),
             position_category = COALESCE($8, position_category),
             salary_grade = COALESCE($9, salary_grade),
             salary_amount = COALESCE($10, salary_amount),
             education = COALESCE($11, education),
             training = COALESCE($12, training),
             experience = COALESCE($13, experience),
             eligibility = COALESCE($14, eligibility),
             status = COALESCE($15, status),
             description = COALESCE($16, description),
             updated_by = $17,
             updated_at = NOW()
         WHERE id = $1
         RETURNING ${jobOpeningSelect}`,
        [
          req.params.id,
          payload.title || null,
          payload.location || null,
          payload.vacancy ?? null,
          payload.deadline || null,
          payload.deadlineTime || null,
          payload.positionId ?? null,
          payload.positionCategory || null,
          payload.salaryGrade || null,
          payload.salaryAmount || null,
          payload.education || null,
          payload.training || null,
          payload.experience || null,
          payload.eligibility || null,
          payload.status || null,
          payload.description ?? null,
          req.user?.id || null,
        ]
      );

      if (payload.vacancyItems !== undefined) {
        await replaceVacancyItems(client, req.params.id, payload.vacancyItems);
      }

      await client.query("COMMIT");

      const [rowWithItems] = await attachVacancyItems(pool, result.rows);
      const job = mapJobOpening(rowWithItems);
      const [beforeWithItems] = await attachVacancyItems(pool, [beforeRow]);
      const beforeJob = mapJobOpening(beforeWithItems);

      await recordActivityLog(pool, {
        actor: req.user,
        action: "job_opening.updated",
        entityType: "job_opening",
        entityId: job.id,
        entityLabel: job.title,
        metadata: {
          before: beforeJob,
          after: job,
          requirementsChanged: false,
          fixedRequirements: true,
        },
      });

      return res.json({ success: true, job });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating job opening:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update job opening",
    });
  }
}
