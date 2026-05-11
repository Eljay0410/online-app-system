import bcrypt from "bcryptjs";
import pool from "../config/db.js";

export async function activateAccount(req, res) {
  const { token, password } = req.body || {};

  if (!token || !password) {
    return res.status(400).json({
      success: false,
      message: "Missing token or password",
    });
  }

  if (String(password).length < 8) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const tokenResult = await client.query(
      "SELECT id, user_id, expires_at, used FROM activation_tokens WHERE token = $1 FOR UPDATE",
      [token]
    );

    if (tokenResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Invalid token",
      });
    }

    const activationToken = tokenResult.rows[0];

    if (activationToken.used) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Token already used",
      });
    }

    if (new Date(activationToken.expires_at) < new Date()) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Token expired",
      });
    }

    const hash = await bcrypt.hash(password, 10);
    await client.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [hash, activationToken.user_id]
    );

    // Revoke all activation/reset tokens for this user so tokens cannot be reused.
    await client.query(
      "UPDATE activation_tokens SET used = true, expires_at = NOW() WHERE user_id = $1",
      [activationToken.user_id]
    );

    await client.query("COMMIT");

    return res.json({ success: true });
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
