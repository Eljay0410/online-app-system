import bcrypt from "bcryptjs";
import pool from "../src/config/db.js";

const email = String(process.env.TARGET_EMAIL || "").trim().toLowerCase();
const password = String(process.env.TARGET_PASSWORD || "");
const role = String(process.env.TARGET_ROLE || "admin").trim().toLowerCase();

if (!email || !password) {
  console.error("TARGET_EMAIL and TARGET_PASSWORD are required.");
  process.exit(1);
}

if (!["admin", "superadmin"].includes(role)) {
  console.error("TARGET_ROLE must be admin or superadmin.");
  process.exit(1);
}

try {
  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO users
      (email, password_hash, role, is_active, email_verified_at, created_at, updated_at)
     VALUES ($1, $2, $3, true, NOW(), NOW(), NOW())
     ON CONFLICT (email)
     DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role,
       is_active = true,
       email_verified_at = NOW(),
       updated_at = NOW()`,
    [email, passwordHash, role]
  );

  const result = await pool.query(
    "SELECT email, role, is_active FROM users WHERE email = $1",
    [email]
  );

  console.log(JSON.stringify(result.rows[0]));
} catch (error) {
  console.error(error.message || error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
