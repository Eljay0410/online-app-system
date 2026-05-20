import bcrypt from "bcryptjs";
import pool from "../config/db.js";
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
  };
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

export async function listManagementUsers(_req, res) {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, middle_name, no_middle_name, last_name,
         contact_number, role, is_active, email_verified_at, created_at, last_login
       FROM users
       WHERE role IN ('admin', 'superadmin')
       ORDER BY role DESC, created_at DESC`
    );

    res.json({
      success: true,
      users: result.rows.map(mapUserAccount),
    });
  } catch (error) {
    console.error("Error fetching management users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch management users",
    });
  }
}

export async function listApplicantUsers(_req, res) {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, middle_name, no_middle_name, last_name,
         contact_number, role, is_active, email_verified_at, created_at, last_login
       FROM users
       WHERE role = 'applicant'
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      users: result.rows.map(mapUserAccount),
    });
  } catch (error) {
    console.error("Error fetching applicant users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user accounts",
    });
  }
}

export async function listOfficeUsers(_req, res) {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, middle_name, no_middle_name, last_name,
         contact_number, role, is_active, email_verified_at, created_at, last_login
       FROM users
       WHERE role IN ('admin', 'superadmin')
       ORDER BY role DESC, created_at DESC`
    );

    res.json({
      success: true,
      users: result.rows.map(mapUserAccount),
    });
  } catch (error) {
    console.error("Error fetching office users:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch office accounts",
    });
  }
}

export async function createAdminAccount(req, res) {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const firstName = String(req.body?.firstName || "").trim();
  const lastName = String(req.body?.lastName || "").trim();

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      message: "First name, last name, email, and password are required.",
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters.",
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users
        (email, password_hash, first_name, last_name, role, is_active, email_verified_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'admin', true, NOW(), NOW(), NOW())
       RETURNING id, email, first_name, last_name, role, is_active, email_verified_at, created_at, last_login`,
      [email, passwordHash, firstName, lastName]
    );

    const user = result.rows[0];

    res.status(201).json({
      success: true,
      user: {
        ...mapUserAccount(user),
      },
    });
  } catch (error) {
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
       RETURNING id, email, first_name, middle_name, no_middle_name, last_name,
         contact_number, role, is_active, email_verified_at, created_at, last_login`,
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
  const isActive = Boolean(req.body?.isActive);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid user account.",
    });
  }

  if (userId === req.user?.id && isActive === false) {
    return res.status(400).json({
      success: false,
      message: "You cannot suspend your own account.",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE users
       SET is_active = $2,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, first_name, middle_name, no_middle_name, last_name,
         contact_number, role, is_active, email_verified_at, created_at, last_login`,
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
