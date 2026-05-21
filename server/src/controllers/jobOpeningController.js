import pool from "../config/db.js";
import { mapJobOpening, mapJobPosition } from "../utils/formatters.js";

const allowedJobStatuses = ["open", "closed", "draft"];
const allowedPositionCategories = ["Teaching", "Non-Teaching"];

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function parseLimit(value) {
  const limit = Number.parseInt(value || "60", 10);
  return Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : 60;
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
    const limit = parseLimit(req.query.limit);
    const { where, values } = buildJobFilters(req.query, {
      publicOnly: true,
    });

    values.push(limit);

    const result = await pool.query(
      `SELECT ${jobOpeningSelect}
       FROM job_openings
       ${where}
       ORDER BY deadline ASC, deadline_time ASC, created_at DESC
       LIMIT $${values.length}`,
      values
    );

    res.json({ success: true, jobs: result.rows.map(mapJobOpening) });
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

    return res.json({
      success: true,
      job: mapJobOpening(job),
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
    const limit = parseLimit(req.query.limit);
    const { where, values } = buildJobFilters(req.query);

    values.push(limit);

    const result = await pool.query(
      `SELECT ${jobOpeningSelect}
       FROM job_openings
       ${where}
       ORDER BY created_at DESC
       LIMIT $${values.length}`,
      values
    );

    res.json({ success: true, jobs: result.rows.map(mapJobOpening) });
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
    const result = await pool.query(
      `SELECT id, category, title, requirements, created_at, updated_at
       FROM job_positions
       ORDER BY category ASC, title ASC`
    );

    return res.json({
      success: true,
      positions: result.rows.map(mapJobPosition),
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

    return res.status(201).json({
      success: true,
      position: mapJobPosition(result.rows[0]),
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

    return res.json({
      success: true,
      position: mapJobPosition(result.rows[0]),
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
         created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
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

    res.status(201).json({
      success: true,
      job: mapJobOpening(result.rows[0]),
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
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Job opening not found.",
      });
    }

    res.json({ success: true, job: mapJobOpening(result.rows[0]) });
  } catch (error) {
    console.error("Error updating job opening:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update job opening",
    });
  }
}
