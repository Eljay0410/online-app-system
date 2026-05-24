import nodemailer from "nodemailer";
import "./env.js";

export const MAIL_HOST = process.env.MAIL_HOST || process.env.SMTP_HOST;
export const MAIL_PORT = process.env.MAIL_PORT || process.env.SMTP_PORT || 587;
export const MAIL_ENCRYPTION = (
  process.env.MAIL_ENCRYPTION || ""
).toLowerCase();
export const MAIL_SECURE =
  MAIL_ENCRYPTION === "ssl" || process.env.SMTP_SECURE === "true";
export const MAIL_USER = process.env.MAIL_USERNAME || process.env.SMTP_USER;
export const MAIL_PASS = process.env.MAIL_PASSWORD || process.env.SMTP_PASS;
export const MAIL_FROM_ADDRESS =
  process.env.MAIL_FROM_ADDRESS ||
  process.env.SMTP_FROM ||
  "no-reply@depedcsjdm.org";
export const MAIL_FROM_NAME =
  process.env.MAIL_FROM_NAME || process.env.SMTP_FROM_NAME || "";

export const transporter = MAIL_HOST
  ? nodemailer.createTransport({
      host: MAIL_HOST,
      port: Number(MAIL_PORT),
      secure: MAIL_SECURE,
      auth: MAIL_USER ? { user: MAIL_USER, pass: MAIL_PASS } : undefined,
    })
  : null;

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
