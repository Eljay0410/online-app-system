import pool from "../config/db.js";
import { mapJobOpening } from "../utils/formatters.js";

export async function listOpenJobOpenings(_req, res) {
  try {
    const result = await pool.query(`
      SELECT id, title, location, vacancy, deadline, status, description, created_at, updated_at
      FROM job_openings
      WHERE status = 'open'
      ORDER BY deadline ASC
    `);

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
      `SELECT id, title, location, vacancy, deadline, status, description, created_at, updated_at
       FROM job_openings
       WHERE id = $1
       LIMIT 1`,
      [req.params.id]
    );

    const job = result.rows[0];

    if (!job || job.status !== "open") {
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

export async function listAdminJobOpenings(_req, res) {
  try {
    const result = await pool.query(`
      SELECT id, title, location, vacancy, deadline, status, description, created_at, updated_at
      FROM job_openings
      ORDER BY created_at DESC
    `);

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
  const { title, location, vacancy, deadline, status, description } =
    req.body || {};

  if (!title || !location || !deadline) {
    return res.status(400).json({
      success: false,
      message: "Title, location, and deadline are required.",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO job_openings
        (title, location, vacancy, deadline, status, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, title, location, vacancy, deadline, status, description, created_at, updated_at`,
      [
        title.trim(),
        location.trim(),
        Number.parseInt(vacancy || "1", 10),
        deadline,
        status || "open",
        description || null,
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
  const { title, location, vacancy, deadline, status, description } =
    req.body || {};

  try {
    const result = await pool.query(
      `UPDATE job_openings
       SET title = COALESCE($2, title),
           location = COALESCE($3, location),
           vacancy = COALESCE($4, vacancy),
           deadline = COALESCE($5, deadline),
           status = COALESCE($6, status),
           description = COALESCE($7, description),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, title, location, vacancy, deadline, status, description, created_at, updated_at`,
      [
        req.params.id,
        title || null,
        location || null,
        vacancy ? Number.parseInt(vacancy, 10) : null,
        deadline || null,
        status || null,
        description ?? null,
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
