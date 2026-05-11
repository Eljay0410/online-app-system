import pool from "../config/db.js";
import { transporter } from "../config/mailer.js";
import {
  createActivationToken,
  sendActivationEmail,
} from "../services/activationService.js";
import { assignUan } from "../services/uanService.js";
import { mapApplication, normalizeEmail } from "../utils/formatters.js";

export async function listAdminApplications(_req, res) {
  try {
    const result = await pool.query(`
      SELECT ja.id, ja.uan, ja.data, ja.status, ja.created_at, ja.updated_at,
             u.email, u.first_name, u.last_name
      FROM job_applications ja
      JOIN users u ON u.id = ja.user_id
      ORDER BY ja.created_at DESC
    `);

    res.json({
      success: true,
      applications: result.rows.map(mapApplication),
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
}

export async function updateApplicationStatus(req, res) {
  const { status } = req.body || {};
  const allowedStatuses = [
    "submitted",
    "under_review",
    "for_interview",
    "qualified",
    "rejected",
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid application status.",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE job_applications
       SET status = $2, updated_at = NOW()
       WHERE id = $1
       RETURNING id, uan, data, status, created_at, updated_at`,
      [req.params.id, status]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    res.json({ success: true, application: mapApplication(result.rows[0]) });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update application status",
    });
  }
}

export async function listApplicantApplications(req, res) {
  const email = normalizeEmail(req.query.email);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  try {
    const result = await pool.query(
      `SELECT ja.id, ja.uan, ja.data, ja.status, ja.created_at, ja.updated_at,
              u.email, u.first_name, u.last_name
       FROM job_applications ja
       JOIN users u ON u.id = ja.user_id
       WHERE LOWER(u.email) = LOWER($1)
       ORDER BY ja.created_at DESC`,
      [email]
    );

    res.json({
      success: true,
      applications: result.rows.map(mapApplication),
    });
  } catch (error) {
    console.error("Error fetching applicant applications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch applications",
    });
  }
}

export async function submitApplication(req, res) {
  const personalInfo = req.body?.personalInfo || {};
  const email = normalizeEmail(personalInfo.emailAddress);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Missing applicant email.",
    });
  }

  const client = await pool.connect();
  let emailPayload = null;

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id, uan, last_activation_sent_at FROM users WHERE LOWER(email) = LOWER($1) FOR UPDATE",
      [email]
    );

    let user;

    if (existing.rowCount === 0) {
      const inserted = await client.query(
        `INSERT INTO users (email, first_name, last_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, 'applicant', NOW(), NOW())
         RETURNING id, uan, last_activation_sent_at`,
        [email, personalInfo.firstName || null, personalInfo.lastName || null]
      );
      user = inserted.rows[0];
    } else {
      user = existing.rows[0];
      await client.query(
        `UPDATE users
         SET first_name = COALESCE($2, first_name),
             last_name = COALESCE($3, last_name),
             updated_at = NOW()
         WHERE id = $1`,
        [user.id, personalInfo.firstName || null, personalInfo.lastName || null]
      );
    }

    const assignedUan = await assignUan(client, user.id, user.uan);
    user = { ...user, uan: assignedUan };

    await client.query(
      `INSERT INTO job_applications (user_id, uan, data, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'submitted', NOW(), NOW())`,
      [
        user.id,
        assignedUan,
        {
          ...req.body,
          uan: assignedUan,
          submittedAt: new Date().toISOString(),
        },
      ]
    );

    const activation = await createActivationToken(client, user);

    await client.query("COMMIT");

    emailPayload = {
      token: activation.token,
      skippedReason: activation.skippedReason,
      email,
      uan: assignedUan,
    };

    let emailSent = false;
    let emailMessage = activation.skippedReason;

    if (activation.token && transporter) {
      try {
        emailSent = await sendActivationEmail(email, assignedUan, activation.token);
      } catch (err) {
        console.error("Failed to send activation email:", err);
        emailMessage =
          "Application saved, but the activation email could not be sent.";
      }
    } else if (!transporter) {
      emailMessage =
        "Application saved, but email is not configured on the server.";
    }

    return res.json({
      success: true,
      uan: String(assignedUan).toUpperCase(),
      userId: user.id,
      emailSent,
      emailMessage,
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("/api/submit-application error:", err, emailPayload || "");
    return res.status(500).json({
      success: false,
      message: err?.message || "Server error",
    });
  } finally {
    client.release();
  }
}

export function saveApplicationRemoved(_req, res) {
  res.status(410).json({
    success: false,
    message:
      "This endpoint has been replaced. Submit applications through /api/submit-application.",
  });
}
