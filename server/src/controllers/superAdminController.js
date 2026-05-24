import pool from "../config/db.js";
import {
  createActivationToken,
  sendActivationEmail,
  TOKEN_PURPOSES,
} from "../services/activationService.js";
import { assignUan } from "../services/uanService.js";
import { normalizeEmail } from "../utils/formatters.js";

function mapUserAccount(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name || "",
    middleName: user.middle_name || "",
    noMiddleName: Boolean(user.no_middle_name),
    lastName: user.last_name || "",
    contactNumber: user.contact_number || "",
    role: user.role,
    isActive: user.is_active,
    emailVerifiedAt: user.email_verified_at,
    createdAt: user.created_at,
    lastLogin: user.last_login,
    hasPassword: Boolean(user.password_hash),
    uan: String(user.uan || "").toUpperCase(),
  };
}

function getPagination(query = {}) {
  const limit = Number.parseInt(query.limit || "10", 10);
  const offset = Number.parseInt(query.offset || "0", 10);

  return {
    limit: Number.isInteger(limit) ? Math.min(Math.max(limit, 1), 100) : 10,
    offset: Number.isInteger(offset) ? Math.max(offset, 0) : 0,
  };
}

async function listUsersByRole(req, res, role, errorLabel) {
  try {
    const { limit, offset } = getPagination(req.query);
    const [result, countResult] = await Promise.all([
      pool.query(
        `SELECT id, email, first_name, middle_name, no_middle_name, last_name,
           contact_number, role, is_active, email_verified_at, created_at,
           last_login, password_hash, uan
         FROM users
         WHERE role = $1
           AND id <> $2
         ORDER BY created_at DESC
         LIMIT $3 OFFSET $4`,
        [role, req.user?.id || 0, limit, offset]
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total
         FROM users
         WHERE role = $1
           AND id <> $2`,
        [role, req.user?.id || 0]
      ),
    ]);

    res.json({
      success: true,
      users: result.rows.map(mapUserAccount),
      pagination: {
        limit,
        offset,
        total: countResult.rows[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error(`Error fetching ${errorLabel}:`, error);
    res.status(500).json({
      success: false,
      message: `Failed to fetch ${errorLabel}`,
    });
  }
}

export async function getOverview(_req, res) {
  try {
    const [users, jobs, applications] = await Promise.all([
      pool.query("SELECT role, COUNT(*)::int AS count FROM users GROUP BY role"),
      pool.query(
        "SELECT status, COUNT(*)::int AS count FROM job_openings GROUP BY status"
      ),
      pool.query(
        "SELECT status, COUNT(*)::int AS count FROM job_applications GROUP BY status"
      ),
    ]);

    res.json({
      success: true,
      users: users.rows,
      jobs: jobs.rows,
      applications: applications.rows,
    });
  } catch (error) {
    console.error("Error fetching superadmin overview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch system overview",
    });
  }
}

export async function listManagementUsers(req, res) {
  return listUsersByRole(req, res, "admin", "management users");
}

export async function listApplicantUsers(req, res) {
  return listUsersByRole(req, res, "applicant", "user accounts");
}

export async function listOfficeUsers(req, res) {
  return listUsersByRole(req, res, "admin", "office accounts");
}

export async function createAdminAccount(req, res) {
  const email = normalizeEmail(req.body?.email);
  const firstName = String(req.body?.firstName || "").trim();
  const lastName = String(req.body?.lastName || "").trim();

  if (!email || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      message: "First name, last name, and email are required.",
    });
  }

  const client = await pool.connect();
  let user = null;
  let activation = null;
  let emailSent = false;
  let emailMessage = "";

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO users
        (email, password_hash, first_name, last_name, role, is_active, email_verified_at, created_at, updated_at)
       VALUES ($1, NULL, $2, $3, 'admin', FALSE, NULL, NOW(), NOW())
       RETURNING id, email, first_name, last_name, role, is_active,
         email_verified_at, created_at, last_login, last_activation_sent_at,
         last_password_reset_sent_at, password_hash, uan`,
      [email, firstName, lastName]
    );

    user = result.rows[0];
    const assignedUan = await assignUan(client, user.id, user.uan);
    user = {
      ...user,
      uan: assignedUan,
    };
    activation = await createActivationToken(
      client,
      user,
      TOKEN_PURPOSES.PASSWORD_SETUP
    );

    await client.query("COMMIT");

    if (activation?.token) {
      try {
        emailSent = await sendActivationEmail(
          user.email,
          activation.token,
          TOKEN_PURPOSES.PASSWORD_SETUP,
          {
            recipientName: [user.first_name, user.last_name]
              .filter(Boolean)
              .join(" "),
            uan: user.uan,
          }
        );
      } catch (error) {
        console.error("Failed to send admin setup email:", error);
        emailMessage =
          "Office account created, but the password setup email could not be sent.";
      }
    }

    if (!emailSent && !emailMessage) {
      emailMessage =
        activation?.skippedReason ||
        "Office account created, but email is not configured on the server.";
    }

    res.status(201).json({
      success: true,
      emailSent,
      message:
        emailMessage ||
        "Office account created. A password setup email was sent.",
      user: {
        ...mapUserAccount(user),
      },
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});

    if (error?.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Error creating admin account:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create admin account",
    });
  } finally {
    client.release();
  }
}

export async function updateUserAccount(req, res) {
  const userId = Number.parseInt(req.params.id, 10);
  const firstName = String(req.body?.firstName || "").trim();
  const middleName = String(req.body?.middleName || "").trim();
  const noMiddleName = Boolean(req.body?.noMiddleName);
  const lastName = String(req.body?.lastName || "").trim();
  const contactNumber = String(req.body?.contactNumber || "").trim();
  const email = normalizeEmail(req.body?.email);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid user account.",
    });
  }

  if (!firstName || !lastName || !email) {
    return res.status(400).json({
      success: false,
      message: "First name, last name, and email are required.",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET first_name = $2,
           middle_name = $3,
           no_middle_name = $4,
           last_name = $5,
           email = $6,
           contact_number = $7,
           updated_at = NOW()
       WHERE id = $1
         AND role <> 'superadmin'
       RETURNING id, email, first_name, middle_name, no_middle_name, last_name,
         contact_number, role, is_active, email_verified_at, created_at,
         last_login, password_hash, uan`,
      [
        userId,
        firstName,
        noMiddleName ? "" : middleName,
        noMiddleName,
        lastName,
        email,
        contactNumber || null,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    res.json({
      success: true,
      user: mapUserAccount(result.rows[0]),
    });
  } catch (error) {
    if (error?.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Error updating user account:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user account",
    });
  }
}

export async function updateUserStatus(req, res) {
  const userId = Number.parseInt(req.params.id, 10);
  const isActive = req.body?.isActive;

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid user account.",
    });
  }

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Account status must be active or suspended.",
    });
  }

  if (userId === req.user?.id && isActive === false) {
    return res.status(400).json({
      success: false,
      message: "You cannot suspend your own account.",
    });
  }

  try {
    if (isActive) {
      const accountResult = await pool.query(
        `SELECT id, password_hash
         FROM users
         WHERE id = $1
           AND role <> 'superadmin'
         LIMIT 1`,
        [userId]
      );
      const account = accountResult.rows[0];

      if (!account) {
        return res.status(404).json({
          success: false,
          message: "User account not found.",
        });
      }

      if (!account.password_hash) {
        return res.status(400).json({
          success: false,
          message:
            "This account must set a password from the emailed setup link before it can be activated.",
        });
      }
    }

    const result = await pool.query(
      `UPDATE users
       SET is_active = $2,
           updated_at = NOW()
       WHERE id = $1
         AND role <> 'superadmin'
       RETURNING id, email, first_name, middle_name, no_middle_name, last_name,
         contact_number, role, is_active, email_verified_at, created_at,
         last_login, password_hash, uan`,
      [userId, isActive]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    res.json({
      success: true,
      user: mapUserAccount(result.rows[0]),
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update account status",
    });
  }
}
