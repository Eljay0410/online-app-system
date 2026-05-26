import nodemailer from "nodemailer";
import "./env.js";

function cleanEnv(value = "") {
  return String(value || "")
    .trim()
    .replace(/^["']|["']$/g, "");
}

export const MAIL_HOST = cleanEnv(process.env.MAIL_HOST || process.env.SMTP_HOST);
export const MAIL_PORT = Number(
  cleanEnv(process.env.MAIL_PORT || process.env.SMTP_PORT || "587")
);
export const MAIL_ENCRYPTION = (
  cleanEnv(process.env.MAIL_ENCRYPTION || "")
).toLowerCase();
export const MAIL_REQUIRE_TLS =
  MAIL_ENCRYPTION === "tls" || MAIL_ENCRYPTION === "starttls";
export const MAIL_SECURE =
  MAIL_ENCRYPTION === "ssl" ||
  MAIL_PORT === 465 ||
  cleanEnv(process.env.SMTP_SECURE).toLowerCase() === "true";
export const MAIL_USER = cleanEnv(process.env.MAIL_USERNAME || process.env.SMTP_USER);
export const MAIL_PASS = cleanEnv(process.env.MAIL_PASSWORD || process.env.SMTP_PASS);
export const MAIL_FROM_ADDRESS =
  cleanEnv(process.env.MAIL_FROM_ADDRESS || process.env.SMTP_FROM) ||
  "no-reply@depedcsjdm.org";
export const MAIL_FROM_NAME =
  cleanEnv(process.env.MAIL_FROM_NAME || process.env.SMTP_FROM_NAME) ||
  "DepEd CSJDM Online Application System";

export function formatMailerAddress(name = MAIL_FROM_NAME, address = MAIL_FROM_ADDRESS) {
  const safeName = cleanEnv(name).replace(/"/g, "'");
  const safeAddress = cleanEnv(address);

  return safeName ? `"${safeName}" <${safeAddress}>` : safeAddress;
}

export const transporter = MAIL_HOST
  ? nodemailer.createTransport({
      host: MAIL_HOST,
      port: MAIL_PORT,
      secure: MAIL_SECURE,
      requireTLS: MAIL_REQUIRE_TLS,
      auth: MAIL_USER ? { user: MAIL_USER, pass: MAIL_PASS } : undefined,
      tls: {
        servername: MAIL_HOST,
      },
    })
  : null;

export async function sendSystemMail({ to, subject, text, html, headers = {} }) {
  if (!transporter || !to) return false;

  await transporter.sendMail({
    from: formatMailerAddress(),
    sender: MAIL_FROM_ADDRESS,
    replyTo: formatMailerAddress(),
    envelope: {
      from: MAIL_FROM_ADDRESS,
      to,
    },
    to,
    subject,
    text,
    html,
    headers: {
      "Auto-Submitted": "auto-generated",
      "X-Auto-Response-Suppress": "All",
      "X-Mailer": "DepEd CSJDM OAS",
      ...headers,
    },
  });

  return true;
}

export function verifyMailer() {
  if (!transporter) {
    console.warn("Mailer is not configured. Applications will still be saved.");
    return;
  }

  transporter
    .verify()
    .then(() => {
      console.log(`Mailer configured on ${MAIL_HOST}:${MAIL_PORT}`);
    })
    .catch((err) => {
      console.error("Mailer configuration error:", err?.message || err);
    });
}
