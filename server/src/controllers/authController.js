import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { transporter } from "../config/mailer.js";
import {
  createActivationToken,
  sendActivationEmail,
  TOKEN_PURPOSES,
} from "../services/activationService.js";
import { assignUan } from "../services/uanService.js";
import {
  createSession,
  revokeSessionToken,
} from "../services/sessionService.js";
import { normalizeEmail } from "../utils/formatters.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const contactPattern = /^\+?[0-9\s().-]{7,20}$/;

function normalizeRole(role) {
  const value = String(role || "applicant").toLowerCase();

  if (value === "super_admin" || value === "super-admin") {
    return "superadmin";
  }

  return value;
}

function validatePassword(password) {
  if (String(password || "").length < 8) {
    return "Password must be at least 8 characters.";
  }

  return "";
}

function mapLoginUser(user) {
  const profileData = user.profile_data || {};
  const applicationDetails = profileData.applicationDetails || {};

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name || "",
    middleName: user.middle_name || "",
    noMiddleName: Boolean(user.no_middle_name),
    lastName: user.last_name || "",
    contactNumber: user.contact_number || "",
    role: normalizeRole(user.role),
    uan: String(user.profile_uan || user.uan || "").toUpperCase(),
    profileId: user.profile_id || null,
    profileComplete: Boolean(applicationDetails.completedAt),
    profileUpdatedAt: user.profile_updated_at || null,
    emailVerifiedAt: user.email_verified_at || null,
  };
}

export async function registerApplicant(req, res) {
  const firstName = String(req.body?.firstName || "").trim();
  const middleName = String(req.body?.middleName || "").trim();
  const noMiddleName = Boolean(req.body?.noMiddleName);
  const lastName = String(req.body?.lastName || "").trim();
  const contactNumber = String(req.body?.contactNumber || "").trim();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!firstName || !lastName || !contactNumber || !email || !password) {
    return res.status(400).json({
      success: false,
      message:
        "First name, last name, contact number, email, and password are required.",
    });
  }

  if (!noMiddleName && !middleName) {
    return res.status(400).json({
      success: false,
      message: "Middle name is required unless the checkbox is selected.",
    });
  }

  if (!emailPattern.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
    });
  }

  if (!contactPattern.test(contactNumber)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid contact number.",
    });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({
      success: false,
      message: passwordError,
    });
  }

  const client = await pool.connect();
  let createdUser = null;
  let activationPayload = null;

  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id, email, role, is_active, email_verified_at FROM users WHERE LOWER(email) = LOWER($1) FOR UPDATE",
      [email]
    );

    if (existing.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists. Please log in or resend the verification email.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const inserted = await client.query(
      `INSERT INTO users (
         email,
         password_hash,
         first_name,
         middle_name,
         no_middle_name,
         last_name,
         contact_number,
         role,
         is_active,
         created_at,
         updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'applicant', FALSE, NOW(), NOW())
       RETURNING id, email, first_name, middle_name, no_middle_name, last_name,
         contact_number, role, uan, last_activation_sent_at`,
      [
        email,
        passwordHash,
        firstName,
        noMiddleName ? null : middleName,
        noMiddleName,
        lastName,
        contactNumber,
      ]
    );

    let user = inserted.rows[0];
    const assignedUan = await assignUan(client, user.id, user.uan);

    const profileData = {
      personalInfo: {
        firstName,
        middleName: noMiddleName ? "" : middleName,
        noMiddleName,
        lastName,
        contactNumber,
        emailAddress: email,
      },
      applicationDetails: {},
      uploads: {},
      uan: assignedUan,
    };

    await client.query(
      `INSERT INTO applicant_profiles (user_id, uan, data, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())`,
      [user.id, assignedUan, profileData]
    );

    user = {
      ...user,
      uan: assignedUan,
    };

    activationPayload = await createActivationToken(
      client,
      user,
      TOKEN_PURPOSES.EMAIL_VERIFICATION
    );
    createdUser = user;

    await client.query("COMMIT");

    let emailSent = false;
    let emailMessage = activationPayload?.skippedReason || "";

    if (activationPayload?.token && transporter) {
      try {
        emailSent = await sendActivationEmail(
          createdUser.email,
          createdUser.uan,
          activationPayload.token,
          TOKEN_PURPOSES.EMAIL_VERIFICATION
        );
      } catch (error) {
        console.error("Failed to send verification email:", error);
        emailMessage =
          "Account created, but the verification email could not be sent.";
      }
    } else if (!transporter) {
      emailMessage =
        "Account created, but email is not configured on the server.";
    }

    return res.status(201).json({
      success: true,
      emailSent,
      message:
        emailMessage ||
        "Account created. Please check your email to verify the account before logging in.",
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});

    if (error?.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    console.error("Register applicant error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create applicant account.",
    });
  } finally {
    client.release();
  }
}

export async function login(req, res) {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required.",
    });
  }

  try {
    const result = await pool.query(
      `SELECT
         u.id,
         u.email,
         u.password_hash,
         u.first_name,
         u.middle_name,
         u.no_middle_name,
         u.last_name,
         u.contact_number,
         u.role,
         u.is_active,
         u.email_verified_at,
         u.uan,
         p.id AS profile_id,
         p.uan AS profile_uan,
         p.data AS profile_data,
         p.updated_at AS profile_updated_at
       FROM users u
       LEFT JOIN applicant_profiles p ON p.user_id = u.id
       WHERE LOWER(u.email) = LOWER($1)
       LIMIT 1`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.password_hash) {
      return res.status(403).json({
        success: false,
        message:
          "This account does not have a password yet. Please use password reset.",
      });
    }

    if (user.is_active === false) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message:
          "Please verify your email before logging in. You can resend the verification email from the login page.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      const session = await createSession(client, user.id);
      await client.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
        user.id,
      ]);
      await client.query("COMMIT");

      return res.json({
        success: true,
        user: mapLoginUser(user),
        token: session.token,
        tokenExpiresAt: session.expiresAt,
      });
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to log in.",
    });
  }
}

export async function resendActivationEmail(req, res) {
  const email = normalizeEmail(req.body?.email);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  const genericResponse = {
    success: true,
    message:
      "If the account needs verification, a verification email will be sent.",
  };
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT id, email, uan, is_active, last_activation_sent_at
       FROM users
       WHERE LOWER(email) = LOWER($1)
       FOR UPDATE`,
      [email]
    );

    const user = result.rows[0];

    if (!user || user.is_active) {
      await client.query("COMMIT");
      return res.json(genericResponse);
    }

    const activation = await createActivationToken(
      client,
      user,
      TOKEN_PURPOSES.EMAIL_VERIFICATION
    );
    await client.query("COMMIT");

    if (activation.token && transporter) {
      await sendActivationEmail(
        user.email,
        user.uan,
        activation.token,
        TOKEN_PURPOSES.EMAIL_VERIFICATION
      );
    }

    return res.json({
      ...genericResponse,
      emailSent: Boolean(activation.token && transporter),
      message: activation.skippedReason || genericResponse.message,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Resend activation error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process verification resend request.",
    });
  } finally {
    client.release();
  }
}

export async function forgotPassword(req, res) {
  const email = normalizeEmail(req.body?.email);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required.",
    });
  }

  const genericResponse = {
    success: true,
    message:
      "If the account exists, password reset instructions will be sent to the email address.",
  };

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT id, email, uan, is_active, last_password_reset_sent_at
       FROM users
       WHERE LOWER(email) = LOWER($1)
       FOR UPDATE`,
      [email]
    );

    const user = result.rows[0];

    if (!user || user.is_active === false) {
      await client.query("COMMIT");
      return res.json(genericResponse);
    }

    const activation = await createActivationToken(
      client,
      user,
      TOKEN_PURPOSES.PASSWORD_RESET
    );
    await client.query("COMMIT");

    if (activation.token && transporter) {
      await sendActivationEmail(
        user.email,
        user.uan,
        activation.token,
        TOKEN_PURPOSES.PASSWORD_RESET
      );
    }

    return res.json({
      ...genericResponse,
      emailSent: Boolean(activation.token && transporter),
      message:
        activation.skippedReason ||
        (transporter
          ? genericResponse.message
          : "Password reset request saved, but email is not configured on the server."),
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process password reset request.",
    });
  } finally {
    client.release();
  }
}

export async function logout(req, res) {
  await revokeSessionToken(req.authToken);

  return res.json({
    success: true,
    message: "Logged out.",
  });
}
