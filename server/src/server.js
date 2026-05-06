import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import pg from "pg";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      success: true,
      message: "Database connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});
app.get("/api/job-openings", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        title,
        location,
        vacancy,
        deadline,
        status
      FROM job_openings
      WHERE status = 'open'
      ORDER BY deadline ASC
    `);

    res.json({
      success: true,
      jobs: result.rows,
    });
  } catch (error) {
    console.error("Error fetching job openings:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch job openings",
    });
  }

});

const PORT = process.env.SERVER_PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// setup mailer (supports MAIL_* or SMTP_* env vars)
const MAIL_HOST = process.env.MAIL_HOST || process.env.SMTP_HOST;
const MAIL_PORT = process.env.MAIL_PORT || process.env.SMTP_PORT || 587;
const MAIL_ENCRYPTION = (process.env.MAIL_ENCRYPTION || "").toLowerCase();
const MAIL_SECURE = MAIL_ENCRYPTION === "ssl" || process.env.SMTP_SECURE === "true";
const MAIL_USER = process.env.MAIL_USERNAME || process.env.SMTP_USER;
const MAIL_PASS = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;
const MAIL_FROM_ADDRESS = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_FROM || "no-reply@example.com";
const MAIL_FROM_NAME = process.env.MAIL_FROM_NAME || process.env.SMTP_FROM_NAME || "";

const transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: Number(MAIL_PORT),
  secure: MAIL_SECURE,
  auth: MAIL_USER ? { user: MAIL_USER, pass: MAIL_PASS } : undefined,
});

transporter.verify().then(() => {
  console.log("Mailer configured (host:", MAIL_HOST, "port:", MAIL_PORT, ")");
}).catch((err) => {
  console.error("Mailer configuration error:", err && err.message ? err.message : err);
});

// Helper to send activation email (returns true if sent)
async function sendActivationEmail(to, uan, token) {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const ttlHours = parseInt(process.env.ACTIVATION_TOKEN_HOURS || "24", 10);
  const activationLink = `${clientUrl}/activate?token=${token}`;

  const from = MAIL_FROM_NAME ? `${MAIL_FROM_NAME} <${MAIL_FROM_ADDRESS}>` : MAIL_FROM_ADDRESS;

  const mailOptions = {
    from,
    to,
    subject: "Activate your account",
    text: `Your Unique Application Number (UAN): ${uan}\nActivate your account here: ${activationLink}\nThis link expires in ${ttlHours} hours.`,
    html: `<p>Your Unique Application Number (UAN): <strong>${uan}</strong></p><p>Activate your account <a href="${activationLink}">here</a>. This link expires in ${ttlHours} hours.</p>`,
  };

  await transporter.sendMail(mailOptions);
  return true;
}

// Test email endpoint
app.post("/api/test-email", async (req, res) => {
  const { to } = req.body || {};
  const target = to || MAIL_USER || MAIL_FROM_ADDRESS;
  if (!target) return res.status(400).json({ success: false, message: "Missing target email" });

  try {
    const from = MAIL_FROM_NAME ? `${MAIL_FROM_NAME} <${MAIL_FROM_ADDRESS}>` : MAIL_FROM_ADDRESS;
    await transporter.sendMail({
      from,
      to: target,
      subject: "Test email from Online Application System",
      text: "This is a test email to verify SMTP settings.",
      html: "<p>This is a test email to verify SMTP settings.</p>",
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("/api/test-email error:", err);
    return res.status(500).json({ success: false, message: err && err.message ? err.message : "Failed to send test email" });
  }
});

// Save full application and send activation email (rate-limited)
app.post("/api/save-application", async (req, res) => {
  const { uan, personalInfo } = req.body || {};
  const email = personalInfo?.emailAddress;

  if (!email) return res.status(400).json({ success: false, message: "Missing applicant email" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Find user by email and lock
    const userRes = await client.query("SELECT id, uan, last_activation_sent_at FROM users WHERE email = $1 FOR UPDATE", [email]);
    if (userRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "User not found. Please submit to obtain a UAN first." });
    }

    const user = userRes.rows[0];
    if (!user.uan) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "UAN not assigned yet. Please submit to get a UAN first." });
    }

    // Insert application
    await client.query(
      "INSERT INTO job_applications (user_id, uan, data, created_at) VALUES ($1, $2, $3, NOW())",
      [user.id, user.uan, req.body]
    );

    // Rate limit check
    const rateLimitMinutes = parseInt(process.env.ACTIVATION_RATE_LIMIT_MINUTES || "60", 10);
    if (user.last_activation_sent_at) {
      const last = new Date(user.last_activation_sent_at);
      const diffMin = (Date.now() - last.getTime()) / 1000 / 60;
      if (diffMin < rateLimitMinutes) {
        await client.query("COMMIT");
        return res.status(429).json({ success: false, rate_limited: true, retryAfter: Math.ceil(rateLimitMinutes - diffMin), message: `Activation email recently sent. Try again in ${Math.ceil(rateLimitMinutes - diffMin)} minutes.` });
      }
    }

    // Create activation token
    const token = randomBytes(32).toString("hex");
    const ttlHours = parseInt(process.env.ACTIVATION_TOKEN_HOURS || "24", 10);
    const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

    await client.query(
      "INSERT INTO activation_tokens (user_id, token, expires_at, used, created_at) VALUES ($1, $2, $3, false, NOW())",
      [user.id, token, expiresAt.toISOString()]
    );

    await client.query("UPDATE users SET last_activation_sent_at = NOW() WHERE id = $1", [user.id]);

    await client.query("COMMIT");

    try {
      await sendActivationEmail(email, user.uan, token);
    } catch (err) {
      console.error("Failed to send activation email:", err);
      return res.status(500).json({ success: false, message: "Failed to send activation email" });
    }

    return res.json({ success: true, email_sent: true });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("/api/save-application error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  } finally {
    client.release();
  }
});

// Activation endpoint: exchange token for password set
app.post("/api/activate", async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ success: false, message: "Missing token or password" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tokRes = await client.query("SELECT id, user_id, expires_at, used FROM activation_tokens WHERE token = $1 FOR UPDATE", [token]);
    if (tokRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    const tok = tokRes.rows[0];
    if (tok.used) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Token already used" });
    }

    if (new Date(tok.expires_at) < new Date()) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Token expired" });
    }

    const hash = await bcrypt.hash(password, 10);
    await client.query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, tok.user_id]);
    await client.query("UPDATE activation_tokens SET used = true WHERE id = $1", [tok.id]);
    await client.query("COMMIT");

    return res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("/api/activate error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  } finally {
    client.release();
  }
});

// Submit application and assign unique UAN bound to user
app.post("/api/submit-application", async (req, res) => {
  const { personalInfo } = req.body || {};
  const email = personalInfo?.emailAddress;

  if (!email) {
    return res.status(400).json({ success: false, message: "Missing applicant email" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock or fetch existing user row
    const userSel = await client.query("SELECT id, uan FROM users WHERE email = $1 FOR UPDATE", [email]);
    let userId;
    let assignedUan = null;

    if (userSel.rowCount === 0) {
      const ins = await client.query(
        `INSERT INTO users (email, first_name, last_name, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, uan`,
        [
          email,
          personalInfo?.firstName || null,
          personalInfo?.lastName || null,
          "applicant",
        ]
      );

      userId = ins.rows[0].id;
      assignedUan = ins.rows[0].uan;
    } else {
      userId = userSel.rows[0].id;
      assignedUan = userSel.rows[0].uan;
      // Optionally update names
      await client.query(
        `UPDATE users SET first_name = COALESCE($2, first_name), last_name = COALESCE($3, last_name), updated_at = NOW() WHERE id = $1`,
        [userId, personalInfo?.firstName || null, personalInfo?.lastName || null]
      );
    }

    // If user has no UAN yet, generate and persist one (ensure uniqueness)
    if (!assignedUan) {
      const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef"; // 41 chars

      const gen = () => {
        const buf = randomBytes(8);
        let s = "";
        for (let i = 0; i < 8; i++) s += alphabet[buf[i] % alphabet.length];
        return s;
      };

      let tries = 0;
      while (tries < 10) {
        tries++;
        const candidate = gen();
        try {
          const upd = await client.query(
            "UPDATE users SET uan = $1, updated_at = NOW() WHERE id = $2 AND (uan IS NULL OR uan = '') RETURNING uan",
            [candidate, userId]
          );

          if (upd.rowCount === 1) {
            assignedUan = upd.rows[0].uan;
            break;
          }

          // If update didn't set (race), re-fetch
          const chk = await client.query("SELECT uan FROM users WHERE id = $1", [userId]);
          if (chk.rowCount > 0 && chk.rows[0].uan) {
            assignedUan = chk.rows[0].uan;
            break;
          }
        } catch (err) {
          // unique violation, try again
          if (err && err.code === "23505") continue;
          throw err;
        }
      }

      if (!assignedUan) throw new Error("Unable to assign unique UAN");
    }

    await client.query("COMMIT");
    return res.json({ success: true, uan: assignedUan, userId });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("/api/submit-application error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  } finally {
    client.release();
  }
});