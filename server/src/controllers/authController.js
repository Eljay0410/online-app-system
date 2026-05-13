import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { transporter } from "../config/mailer.js";
import {
  createActivationToken,
  sendActivationEmail,
} from "../services/activationService.js";
import { normalizeEmail } from "../utils/formatters.js";

function normalizeRole(role) {
  const value = String(role || "applicant").toLowerCase();

  if (value === "super_admin" || value === "super-admin") {
    return "superadmin";
  }

  return value;
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
         u.last_name,
         u.role,
         u.is_active,
         u.uan,
         p.id AS profile_id,
         p.uan AS profile_uan,
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
          "This account does not have a password yet. Please activate the account first.",
      });
    }

    if (user.is_active === false) {
      return res.status(403).json({
        success: false,
        message: "This account is inactive.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    await pool.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
      user.id,
    ]);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        role: normalizeRole(user.role),
        uan: String(user.profile_uan || user.uan || "").toUpperCase(),
        profileId: user.profile_id || null,
        profileComplete: Boolean(user.profile_id),
        profileUpdatedAt: user.profile_updated_at || null,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to log in.",
    });
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
      "If the account exists, password setup instructions will be sent to the email address.",
  };

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT id, email, uan, last_activation_sent_at
       FROM users
       WHERE LOWER(email) = LOWER($1)
       FOR UPDATE`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      await client.query("COMMIT");
      return res.json(genericResponse);
    }

    const activation = await createActivationToken(client, user);
    await client.query("COMMIT");

    if (activation.token && transporter) {
      await sendActivationEmail(
        user.email,
        user.uan,
        activation.token,
        "reset-password"
      );
    }

    return res.json({
      ...genericResponse,
      emailSent: Boolean(activation.token && transporter),
      message:
        activation.skippedReason ||
        (transporter
          ? genericResponse.message
          : "Password setup request saved, but email is not configured on the server."),
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process password reset request.",
    });
  } finally {
    client.release();
  }
}
