import pool from "../config/db.js";
import { mapJobOpening } from "../utils/formatters.js";

const allowedJobStatuses = ["open", "closed", "draft"];

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function parseLimit(value) {
  const limit = Number.parseInt(value || "60", 10);
  return Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : 60;
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
    conditions.push("deadline >= CURRENT_DATE");
  } else if (query.status && query.status !== "all") {
    if (query.status === "expired") {
      conditions.push("status = 'open'");
      conditions.push("deadline < CURRENT_DATE");
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
      `SELECT id, title, location, district, barangay, vacancy, deadline, status, description, created_at, updated_at
       FROM job_openings
       ${where}
       ORDER BY deadline ASC, created_at DESC
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
      `SELECT id, title, location, district, barangay, vacancy, deadline, status, description, created_at, updated_at
       FROM job_openings
       WHERE id = $1
         AND status = 'open'
         AND deadline >= CURRENT_DATE
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
      `SELECT id, title, location, district, barangay, vacancy, deadline, status, description, created_at, updated_at
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

export async function createJobOpening(req, res) {
  const title = String(req.body?.title || "").trim();
  const district = String(req.body?.district || "").trim();
  const barangay = String(req.body?.barangay || "").trim();
  const location = String(
    req.body?.location || [barangay, district].filter(Boolean).join(", ")
  ).trim();
  const vacancy = Number.parseInt(req.body?.vacancy || "1", 10);
  const deadline = String(req.body?.deadline || "").trim();
  const status = String(req.body?.status || "open").toLowerCase();
  const description = String(req.body?.description || "").trim();

  if (!title || !district || !barangay || !deadline) {
    return res.status(400).json({
      success: false,
      message: "Title, district, barangay, and expiration date are required.",
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

  if (status === "open" && deadline < getTodayDate()) {
    return res.status(400).json({
      success: false,
      message: "Open job postings cannot have an expired date.",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO job_openings
        (title, location, district, barangay, vacancy, deadline, status, description, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, title, location, district, barangay, vacancy, deadline, status, description, created_at, updated_at`,
      [
        title,
        location,
        district,
        barangay,
        vacancy,
        deadline,
        status,
        description || null,
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
  const updates = {
    title:
      req.body?.title === undefined
        ? undefined
        : String(req.body.title || "").trim(),
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
    status:
      req.body?.status === undefined
        ? undefined
        : String(req.body.status || "").toLowerCase(),
    description:
      req.body?.description === undefined
        ? undefined
        : String(req.body.description || "").trim(),
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

  if (updates.status === "open" && updates.deadline && updates.deadline < getTodayDate()) {
    return res.status(400).json({
      success: false,
      message: "Open job postings cannot have an expired date.",
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
            status = COALESCE($8, status),
            description = COALESCE($9, description),
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, title, location, district, barangay, vacancy, deadline, status, description, created_at, updated_at`,
      [
        req.params.id,
        updates.title || null,
        updates.location || null,
        updates.district || null,
        updates.barangay || null,
        updates.vacancy ?? null,
        updates.deadline || null,
        updates.status || null,
        updates.description ?? null,
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
