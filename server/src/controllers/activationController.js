import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import {
  revokeExpiredTokens,
  TOKEN_PURPOSES,
} from "../services/activationService.js";
import { revokeUserSessions } from "../services/sessionService.js";
import {
  hasPasswordStrength,
  passwordPolicyMessage,
} from "../utils/password.js";

const legacyPlainTokenPattern = /^[a-f0-9]{64}$/i;
const passwordTokenPurposes = new Set([
  TOKEN_PURPOSES.PASSWORD_RESET,
  TOKEN_PURPOSES.PASSWORD_SETUP,
]);

function hashToken(token) {
  return `sha256:${createHash("sha256").update(token).digest("hex")}`;
}

function tokenError(res, message) {
  return res.status(400).json({
    success: false,
    message,
  });
}

async function getTokenForUpdate(client, token) {
  const params = [hashToken(token)];
  const legacyTokenWhere = legacyPlainTokenPattern.test(token)
    ? " OR at.token = $2"
    : "";

  if (legacyTokenWhere) {
    params.push(token);
  }

  const tokenResult = await client.query(
    `SELECT
       at.id,
       at.user_id,
       at.purpose,
       at.expires_at,
       at.used,
       at.revoked_at,
       u.is_active
      FROM activation_tokens at
      JOIN users u ON u.id = at.user_id
      WHERE at.token = $1${legacyTokenWhere}
      FOR UPDATE`,
    params
  );

  return tokenResult.rows[0] || null;
}

export async function inspectActivationToken(req, res) {
  const token = String(req.query?.token || "").trim();

  if (!token) {
    return tokenError(res, "Missing token.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await revokeExpiredTokens(client);
    const activationToken = await getTokenForUpdate(client, token);

    if (!activationToken) {
      await client.query("ROLLBACK");
      return tokenError(res, "Invalid token.");
    }

    if (activationToken.used || activationToken.revoked_at) {
      await client.query("ROLLBACK");
      return tokenError(res, "Token already used or revoked.");
    }

    if (new Date(activationToken.expires_at) <= new Date()) {
      await client.query(
        `UPDATE activation_tokens
         SET used = TRUE,
             used_at = COALESCE(used_at, NOW()),
             revoked_at = COALESCE(revoked_at, NOW())
         WHERE id = $1`,
        [activationToken.id]
      );
      await client.query("COMMIT");
      return tokenError(res, "Token expired.");
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      purpose:
        activationToken.purpose || TOKEN_PURPOSES.EMAIL_VERIFICATION,
      expiresAt: activationToken.expires_at,
      alreadyActive: Boolean(activationToken.is_active),
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Inspect activation token error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify token.",
    });
  } finally {
    client.release();
  }
}

export async function activateAccount(req, res) {
  const { token, password } = req.body || {};
  const safeToken = String(token || "").trim();

  if (!safeToken) {
    return tokenError(res, "Missing token.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await revokeExpiredTokens(client);
    const activationToken = await getTokenForUpdate(client, safeToken);

    if (!activationToken) {
      await client.query("ROLLBACK");
      return tokenError(res, "Invalid token.");
    }

    if (activationToken.used || activationToken.revoked_at) {
      await client.query("ROLLBACK");
      return tokenError(res, "Token already used.");
    }

    if (new Date(activationToken.expires_at) <= new Date()) {
      await client.query(
        `UPDATE activation_tokens
         SET used = TRUE,
             used_at = COALESCE(used_at, NOW()),
             revoked_at = COALESCE(revoked_at, NOW())
         WHERE id = $1`,
        [activationToken.id]
      );
      await client.query("COMMIT");
      return tokenError(res, "Token expired.");
    }

    const purpose =
      activationToken.purpose || TOKEN_PURPOSES.EMAIL_VERIFICATION;

    const wasInactive = activationToken.is_active === false;

    if (passwordTokenPurposes.has(purpose)) {
      if (!hasPasswordStrength(password)) {
        await client.query("ROLLBACK");
        return tokenError(res, passwordPolicyMessage);
      }

      const hash = await bcrypt.hash(String(password), 10);
      const updateFields = [
        "password_hash = $1",
        "updated_at = NOW()",
      ];

      if (wasInactive || purpose === TOKEN_PURPOSES.PASSWORD_SETUP) {
        updateFields.push(
          "is_active = TRUE",
          "email_verified_at = COALESCE(email_verified_at, NOW())"
        );
      }

      await client.query(
        `UPDATE users
         SET ${updateFields.join(", ")}
         WHERE id = $2`,
        [hash, activationToken.user_id]
      );
      await revokeUserSessions(client, activationToken.user_id);
    } else {
      await client.query(
        `UPDATE users
         SET is_active = TRUE,
             email_verified_at = COALESCE(email_verified_at, NOW()),
             updated_at = NOW()
         WHERE id = $1`,
        [activationToken.user_id]
      );
    }

    await client.query(
      `UPDATE activation_tokens
       SET used = TRUE,
           used_at = NOW(),
           revoked_at = COALESCE(revoked_at, NOW())
       WHERE user_id = $1
         AND purpose = $2
         AND used = FALSE`,
      [activationToken.user_id, purpose]
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      purpose,
      message:
        passwordTokenPurposes.has(purpose)
          ? purpose === TOKEN_PURPOSES.PASSWORD_SETUP || wasInactive
            ? "Account activated successfully."
            : "Password reset successfully."
          : "Email verified successfully.",
    });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("/api/activate error:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Server error",
    });
  } finally {
    client.release();
  }
}
