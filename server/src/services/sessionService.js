import { createHash, randomBytes } from "crypto";
import pool from "../config/db.js";
import { sessionTokenTtlMinutes } from "../config/env.js";

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function normalizeRole(role) {
  const value = String(role || "applicant").toLowerCase();
  return value === "super_admin" || value === "super-admin"
    ? "superadmin"
    : value;
}

export async function createSession(client, userId) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + sessionTokenTtlMinutes * 60 * 1000);

  await client.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
     VALUES ($1, $2, $3, NOW())`,
    [userId, tokenHash, expiresAt.toISOString()]
  );

  return {
    token,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getUserBySessionToken(token) {
  const rawToken = String(token || "").trim();

  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);
  const result = await pool.query(
    `SELECT
       rt.id AS session_id,
       rt.expires_at AS session_expires_at,
       u.id,
       u.email,
       u.first_name,
       u.middle_name,
       u.no_middle_name,
       u.last_name,
       u.contact_number,
       u.role,
       u.is_active,
       u.email_verified_at,
       u.uan
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token = $1
       AND rt.revoked_at IS NULL
       AND rt.created_at >= NOW() - ($2::integer * INTERVAL '1 minute')
       AND (rt.expires_at IS NULL OR rt.expires_at > NOW())
     LIMIT 1`,
    [tokenHash, sessionTokenTtlMinutes]
  );

  const user = result.rows[0];
  if (!user || user.is_active === false) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name || "",
    middleName: user.middle_name || "",
    noMiddleName: Boolean(user.no_middle_name),
    lastName: user.last_name || "",
    contactNumber: user.contact_number || "",
    role: normalizeRole(user.role),
    isActive: user.is_active,
    emailVerifiedAt: user.email_verified_at,
    uan: String(user.uan || "").toUpperCase(),
    sessionId: user.session_id,
    sessionExpiresAt: user.session_expires_at,
  };
}

export async function revokeSessionToken(token) {
  const rawToken = String(token || "").trim();

  if (!rawToken) return;

  await pool.query(
    "UPDATE refresh_tokens SET revoked_at = NOW() WHERE token = $1",
    [hashToken(rawToken)]
  );
}

export async function revokeUserSessions(client, userId) {
  await client.query(
    "UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
    [userId]
  );
}
