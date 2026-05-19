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
const contactPattern = /^09\d{9}$/;

function normalizeRole(role) {
  const value = String(role || "applicant").toLowerCase();

  if (value === "super_admin" || value === "super-admin") {
    return "superadmin";
  }

  return value;
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
    isActive: Boolean(user.is_active),
    uan: String(user.profile_uan || user.uan || "").toUpperCase(),
    profileId: user.profile_id || null,
    profileComplete: Boolean(applicationDetails.completedAt),
    profileUpdatedAt: user.profile_updated_at || null,
    emailVerifiedAt: user.email_verified_at || null,
    createdAt: user.created_at || null,
    lastLogin: user.last_login || null,
  };
}

function mapAccountUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name || "",
    middleName: user.middle_name || "",
    noMiddleName: Boolean(user.no_middle_name),
    lastName: user.last_name || "",
    contactNumber: user.contact_number || "",
    role: normalizeRole(user.role),
    isActive: Boolean(user.is_active),
    emailVerifiedAt: user.email_verified_at || null,
    createdAt: user.created_at || null,
    lastLogin: user.last_login || null,
    uan: String(user.uan || "").toUpperCase(),
  };
}

function hasPasswordStrength(password) {
  return (
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

export async function checkEmail(req, res) {
  const email = normalizeEmail(req.body?.email);

  if (!email || !emailPattern.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, is_active, password_hash
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email]
    );

    const user = result.rows[0];

    return res.json({
      success: true,
      exists: Boolean(user),
      hasPassword: Boolean(user?.password_hash),
      isActive: Boolean(user?.is_active),
    });
  } catch (error) {
    console.error("Email lookup error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify email.",
    });
  }
}

export async function registerApplicant(req, res) {
  const firstName = String(req.body?.firstName || "").trim();
  const middleName = String(req.body?.middleName || "").trim();
  const noMiddleName = Boolean(req.body?.noMiddleName);
  const lastName = String(req.body?.lastName || "").trim();
  const contactNumber = String(req.body?.contactNumber || "").trim();
  const email = normalizeEmail(req.body?.email);

  if (!firstName || !lastName || !contactNumber || !email) {
    return res.status(400).json({
      success: false,
      message:
        "First name, last name, contact number, and email are required.",
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
      message: "Contact number must start with 09 and be 11 digits.",
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
        null,
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
      TOKEN_PURPOSES.PASSWORD_RESET
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
        "Account created. Please check your email to set your password and activate your account.",
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
         u.created_at,
         u.last_login,
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

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
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
      "If the account needs activation, an email will be sent.",
  };
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT id, email, uan, is_active, password_hash,
              last_activation_sent_at, last_password_reset_sent_at
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

    const purpose = user.password_hash
      ? TOKEN_PURPOSES.EMAIL_VERIFICATION
      : TOKEN_PURPOSES.PASSWORD_RESET;

    const activation = await createActivationToken(client, user, purpose);
    await client.query("COMMIT");

    if (activation.token && transporter) {
      await sendActivationEmail(
        user.email,
        user.uan,
        activation.token,
        purpose
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

export async function updateAccountProfile(req, res) {
  const userId = req.user?.id;
  const firstName = String(req.body?.firstName || "").trim();
  const middleName = String(req.body?.middleName || "").trim();
  const noMiddleName = Boolean(req.body?.noMiddleName);
  const lastName = String(req.body?.lastName || "").trim();
  const contactNumber = String(
    req.body?.contactNumber ?? req.body?.mobile ?? ""
  ).trim();
  const email = normalizeEmail(req.body?.email);

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Please log in to continue.",
    });
  }

  if (!firstName || !lastName || !email) {
    return res.status(400).json({
      success: false,
      message: "First name, last name, and email address are required.",
    });
  }

  if (!emailPattern.test(email)) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid email address.",
    });
  }

  if (contactNumber && !contactPattern.test(contactNumber)) {
    return res.status(400).json({
      success: false,
      message: "Mobile number must start with 09 and be 11 digits.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const duplicateEmail = await client.query(
      `SELECT id
       FROM users
       WHERE LOWER(email) = LOWER($1)
         AND id <> $2
       LIMIT 1`,
      [email, userId]
    );

    if (duplicateEmail.rowCount > 0) {
      await client.query("ROLLBACK");
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const updated = await client.query(
      `UPDATE users
       SET email = $1,
           first_name = $2,
           middle_name = $3,
           no_middle_name = $4,
           last_name = $5,
           contact_number = $6,
           updated_at = NOW()
       WHERE id = $7
       RETURNING id, email, first_name, middle_name, no_middle_name, last_name,
         contact_number, role, is_active, email_verified_at, created_at,
         last_login, uan`,
      [
        email,
        firstName,
        noMiddleName ? null : middleName || null,
        noMiddleName,
        lastName,
        contactNumber || null,
        userId,
      ]
    );

    const user = updated.rows[0];

    if (!user) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Account not found.",
      });
    }

    if (normalizeRole(user.role) === "applicant") {
      const profileResult = await client.query(
        "SELECT id, data FROM applicant_profiles WHERE user_id = $1 FOR UPDATE",
        [userId]
      );
      const profile = profileResult.rows[0];

      if (profile) {
        const data = profile.data || {};
        const personalInfo = data.personalInfo || {};
        const nextData = {
          ...data,
          personalInfo: {
            ...personalInfo,
            firstName,
            middleName: noMiddleName ? "" : middleName,
            noMiddleName,
            lastName,
            contactNumber,
            emailAddress: email,
          },
        };

        await client.query(
          `UPDATE applicant_profiles
           SET data = $1,
               updated_at = NOW()
           WHERE id = $2`,
          [nextData, profile.id]
        );
      }
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Account details updated.",
      user: mapAccountUser(user),
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Update account profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update account details.",
    });
  } finally {
    client.release();
  }
}

export async function changePassword(req, res) {
  const userId = req.user?.id;
  const currentPassword = String(req.body?.currentPassword || "");
  const newPassword = String(req.body?.newPassword || "");
  const confirmPassword = String(req.body?.confirmPassword || "");

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Please log in to continue.",
    });
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Current password, new password, and confirmation are required.",
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "New password and confirmation do not match.",
    });
  }

  if (!hasPasswordStrength(newPassword)) {
    return res.status(400).json({
      success: false,
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
    });
  }

  try {
    const result = await pool.query(
      "SELECT id, password_hash FROM users WHERE id = $1 LIMIT 1",
      [userId]
    );
    const user = result.rows[0];

    if (!user?.password_hash) {
      return res.status(400).json({
        success: false,
        message: "This account does not have a password set yet.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password_hash
    );

    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [passwordHash, userId]
    );

    return res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to change password.",
    });
  }
}
