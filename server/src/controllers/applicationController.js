import pool from "../config/db.js";
import {
  createActivationToken,
  sendActivationEmail,
} from "../services/activationService.js";
import {
  createJobApplicationFromProfile,
  getApplicantEmail,
  getApplicantProfileRecord,
  upsertApplicantProfile,
} from "../services/applicantService.js";
import {
  mapApplicantProfile,
  mapApplication,
  normalizeEmail,
} from "../utils/formatters.js";

function sendControllerError(res, error, fallbackMessage) {
  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || fallbackMessage,
  });
}

function getJobOpeningId(payload = {}) {
  return (
    payload.jobOpeningId ||
    payload.job_opening_id ||
    payload.jobPosition?.jobOpeningId ||
    payload.job?.id ||
    null
  );
}

function mapProfileResponse(user, profile) {
  return mapApplicantProfile({
    ...profile,
    user_id: user.id,
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    user_uan: user.uan,
  });
}

async function createProfileActivationEmail(client, user) {
  if (user.password_hash) {
    return {
      emailSent: false,
      emailMessage: "",
    };
  }

  const activation = await createActivationToken(client, user);

  return {
    token: activation.token,
    skippedReason: activation.skippedReason,
  };
}

export async function listAdminApplications(_req, res) {
  try {
    const result = await pool.query(`
      SELECT
        ja.id,
        ja.user_id,
        ja.applicant_profile_id,
        ja.job_opening_id,
        ja.uan,
        ja.data,
        ja.status,
        ja.created_at,
        ja.updated_at,
        u.email,
        u.first_name,
        u.last_name,
        jo.title AS job_title,
        jo.location AS job_location,
        jo.deadline AS job_deadline
      FROM job_applications ja
      JOIN users u ON u.id = ja.user_id
      LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id
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
      `WITH updated AS (
         UPDATE job_applications
         SET status = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING *
       )
       SELECT
         ja.id,
         ja.user_id,
         ja.applicant_profile_id,
         ja.job_opening_id,
         ja.uan,
         ja.data,
         ja.status,
         ja.created_at,
         ja.updated_at,
         u.email,
         u.first_name,
         u.last_name,
         jo.title AS job_title,
         jo.location AS job_location,
         jo.deadline AS job_deadline
       FROM updated ja
       JOIN users u ON u.id = ja.user_id
       LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id`,
      [req.params.id, status]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    res.json({
      success: true,
      application: mapApplication(result.rows[0]),
    });
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
      `SELECT
         ja.id,
         ja.user_id,
         ja.applicant_profile_id,
         ja.job_opening_id,
         ja.uan,
         ja.data,
         ja.status,
         ja.created_at,
         ja.updated_at,
         u.email,
         u.first_name,
         u.last_name,
         jo.title AS job_title,
         jo.location AS job_location,
         jo.deadline AS job_deadline
       FROM job_applications ja
       JOIN users u ON u.id = ja.user_id
       LEFT JOIN job_openings jo ON jo.id = ja.job_opening_id
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

export async function getApplicantProfile(req, res) {
  const email = normalizeEmail(req.query.email);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  try {
    const record = await getApplicantProfileRecord(pool, email);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Applicant account not found.",
      });
    }

    return res.json({
      success: true,
      profileComplete: Boolean(record.id),
      profile: mapApplicantProfile(record),
      user: {
        id: record.user_id,
        email: record.email,
        firstName: record.first_name || "",
        lastName: record.last_name || "",
        role: record.role,
        uan: String(record.uan || record.user_uan || "").toUpperCase(),
      },
    });
  } catch (error) {
    console.error("Error fetching applicant profile:", error);
    return sendControllerError(
      res,
      error,
      "Failed to fetch applicant profile"
    );
  }
}

export async function saveApplicantProfile(req, res) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { user, profile } = await upsertApplicantProfile(client, req.body);

    await client.query("COMMIT");

    return res.json({
      success: true,
      profileComplete: true,
      uan: String(profile.uan).toUpperCase(),
      userId: user.id,
      profile: mapProfileResponse(user, profile),
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("saveApplicantProfile error:", error);
    return sendControllerError(res, error, "Failed to save applicant profile");
  } finally {
    client.release();
  }
}

export async function applyToJob(req, res) {
  const email = normalizeEmail(req.body?.email);
  const jobOpeningId = getJobOpeningId(req.body);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const record = await getApplicantProfileRecord(client, email);

    if (!record?.id) {
      const error = new Error(
        "Complete your applicant profile before applying to a job."
      );
      error.statusCode = 409;
      throw error;
    }

    const user = {
      id: record.user_id,
      email: record.email,
      first_name: record.first_name,
      last_name: record.last_name,
      uan: record.uan || record.user_uan,
    };

    const profile = {
      id: record.id,
      uan: record.uan || record.user_uan,
      data: record.data || {},
    };

    const { application, job } = await createJobApplicationFromProfile(client, {
      user,
      profile,
      jobOpeningId,
      applicationData: req.body?.applicationData || {},
    });

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      application: mapApplication({
        ...application,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        job_title: job.title,
        job_location: job.location,
        job_deadline: job.deadline,
      }),
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("applyToJob error:", error);
    return sendControllerError(res, error, "Failed to submit application");
  } finally {
    client.release();
  }
}

export async function submitApplication(req, res) {
  const profileData = req.body?.profileData || req.body || {};
  const email = getApplicantEmail(profileData);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Missing applicant email.",
    });
  }

  const client = await pool.connect();
  let activationPayload = null;
  let createdApplication = null;

  try {
    await client.query("BEGIN");

    const { user, profile } = await upsertApplicantProfile(client, profileData);
    const jobOpeningId = getJobOpeningId(profileData);

    if (jobOpeningId) {
      const { application, job } = await createJobApplicationFromProfile(
        client,
        {
          user,
          profile,
          jobOpeningId,
          applicationData: profileData,
        }
      );

      createdApplication = mapApplication({
        ...application,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        job_title: job.title,
        job_location: job.location,
        job_deadline: job.deadline,
      });
    }

    activationPayload = await createProfileActivationEmail(client, user);

    await client.query("COMMIT");

    let emailSent = false;
    let emailMessage = activationPayload?.skippedReason || "";

    if (activationPayload?.token) {
      try {
        emailSent = await sendActivationEmail(
          email,
          profile.uan,
          activationPayload.token
        );
      } catch (error) {
        console.error("Failed to send activation email:", error);
        emailMessage =
          "Profile saved, but the activation email could not be sent.";
      }
    }

    return res.json({
      success: true,
      profileComplete: true,
      uan: String(profile.uan).toUpperCase(),
      userId: user.id,
      profile: mapProfileResponse(user, profile),
      application: createdApplication,
      applicationCreated: Boolean(createdApplication),
      emailSent,
      emailMessage,
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});

    console.error("/api/submit-application error:", err);

    return sendControllerError(res, err, "Server error");
  } finally {
    client.release();
  }
}
