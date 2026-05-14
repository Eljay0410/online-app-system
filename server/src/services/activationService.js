import { randomBytes } from "crypto";
import { clientUrl } from "../config/env.js";
import {
  MAIL_FROM_ADDRESS,
  MAIL_FROM_NAME,
  transporter,
} from "../config/mailer.js";

export const TOKEN_PURPOSES = {
  EMAIL_VERIFICATION: "email_verification",
  PASSWORD_RESET: "password_reset",
};

function buildActivationEmail({ actionLink, intro, purpose, ttlHours, uan }) {
  const isReset = purpose === TOKEN_PURPOSES.PASSWORD_RESET;
  const title = isReset ? "Reset your password" : "Verify your email";
  const actionLabel = isReset ? "Reset Password" : "Verify Email";
  const uanValue = String(uan || "N/A").toUpperCase();

  const text = [
    "DepEd City of San Jose del Monte Online Application System",
    "",
    title,
    "",
    `Unique Application Number (UAN): ${uanValue}`,
    intro,
    "",
    `${actionLabel}: ${actionLink}`,
    "",
    `This secure link expires in ${ttlHours} hours.`,
    "If you did not request this email, you can safely ignore it.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;margin:0;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="background:#0056b3;padding:24px 28px;color:#ffffff;">
                <div style="font-size:12px;letter-spacing:1.4px;text-transform:uppercase;opacity:.86;">Department of Education</div>
                <div style="font-size:20px;font-weight:700;margin-top:6px;">City of San Jose del Monte</div>
                <div style="font-size:13px;margin-top:6px;opacity:.9;">Online Application System</div>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px 10px;">
                <h1 style="margin:0;font-size:24px;line-height:1.25;color:#0f172a;">${title}</h1>
                <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#475569;">${intro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <div style="font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#1d4ed8;">Unique Application Number</div>
                      <div style="margin-top:8px;font-size:28px;font-weight:800;letter-spacing:2px;color:#0f172a;">${uanValue}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:18px 28px 12px;">
                <a href="${actionLink}" style="display:inline-block;background:#0056b3;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 24px;border-radius:10px;">${actionLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 30px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;text-align:center;">This secure link expires in <strong>${ttlHours} hours</strong>.</p>
                <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#64748b;">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin:6px 0 0;font-size:12px;line-height:1.6;word-break:break-all;color:#2563eb;">${actionLink}</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 28px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">If you did not request this email, you can safely ignore it.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { html, text };
}

function parseCooldownSchedule(purpose) {
  const envKey =
    purpose === TOKEN_PURPOSES.PASSWORD_RESET
      ? "PASSWORD_RESET_COOLDOWN_MINUTES"
      : "ACTIVATION_COOLDOWN_MINUTES";

  return (process.env[envKey] || "0,2,5,15,30,60")
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value >= 0);
}

function getCooldownMinutes(purpose, sentCount) {
  const schedule = parseCooldownSchedule(purpose);
  const fallbackSchedule = [0, 2, 5, 15, 30, 60];
  const activeSchedule = schedule.length ? schedule : fallbackSchedule;
  const index = Math.min(sentCount, activeSchedule.length - 1);

  return activeSchedule[index];
}

function getTokenTtlHours(purpose) {
  const key =
    purpose === TOKEN_PURPOSES.PASSWORD_RESET
      ? "PASSWORD_RESET_TOKEN_HOURS"
      : "ACTIVATION_TOKEN_HOURS";

  return Number.parseInt(
    process.env[key] ||
      (purpose === TOKEN_PURPOSES.PASSWORD_RESET ? "2" : "24"),
    10
  );
}

function getLastSentAt(user, purpose) {
  return purpose === TOKEN_PURPOSES.PASSWORD_RESET
    ? user.last_password_reset_sent_at
    : user.last_activation_sent_at;
}

function getLastSentColumn(purpose) {
  return purpose === TOKEN_PURPOSES.PASSWORD_RESET
    ? "last_password_reset_sent_at"
    : "last_activation_sent_at";
}

export async function revokeExpiredTokens(client, userId = null) {
  const params = [];
  const userWhere = userId ? "AND user_id = $1" : "";

  if (userId) params.push(userId);

  await client.query(
    `UPDATE activation_tokens
     SET used = TRUE,
         used_at = COALESCE(used_at, NOW()),
         revoked_at = COALESCE(revoked_at, NOW())
     WHERE used = FALSE
       AND revoked_at IS NULL
       AND expires_at <= NOW()
       ${userWhere}`,
    params
  );
}

export async function createActivationToken(
  client,
  user,
  purpose = TOKEN_PURPOSES.EMAIL_VERIFICATION
) {
  const safePurpose = Object.values(TOKEN_PURPOSES).includes(purpose)
    ? purpose
    : TOKEN_PURPOSES.EMAIL_VERIFICATION;

  await revokeExpiredTokens(client, user.id);

  const attemptWindowHours = Number.parseInt(
    process.env.ACTIVATION_ATTEMPT_WINDOW_HOURS || "24",
    10
  );
  const recentTokens = await client.query(
    `SELECT COUNT(*)::int AS sent_count
     FROM activation_tokens
     WHERE user_id = $1
       AND purpose = $2
       AND created_at >= NOW() - ($3::int * INTERVAL '1 hour')`,
    [user.id, safePurpose, attemptWindowHours]
  );
  const sentCount = recentTokens.rows[0]?.sent_count || 0;
  const cooldownMinutes = getCooldownMinutes(safePurpose, sentCount);
  const lastSentAt = getLastSentAt(user, safePurpose);

  if (cooldownMinutes > 0 && lastSentAt) {
    const elapsedMinutes =
      (Date.now() - new Date(lastSentAt).getTime()) / 1000 / 60;

    if (elapsedMinutes < cooldownMinutes) {
      return {
        token: null,
        skippedReason: `A secure email was recently sent. Try again in ${Math.ceil(
          cooldownMinutes - elapsedMinutes
        )} minute(s).`,
        attempts: sentCount,
        cooldownMinutes,
      };
    }
  }

  await client.query(
    `UPDATE activation_tokens
     SET used = TRUE,
         used_at = COALESCE(used_at, NOW()),
         revoked_at = COALESCE(revoked_at, NOW())
     WHERE user_id = $1
       AND purpose = $2
       AND used = FALSE
       AND revoked_at IS NULL`,
    [user.id, safePurpose]
  );

  const token = randomBytes(32).toString("hex");
  const ttlHours = getTokenTtlHours(safePurpose);
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

  await client.query(
    `INSERT INTO activation_tokens
       (user_id, token, purpose, expires_at, used, created_at)
     VALUES ($1, $2, $3, $4, FALSE, NOW())`,
    [user.id, token, safePurpose, expiresAt.toISOString()]
  );
  await client.query(
    `UPDATE users SET ${getLastSentColumn(safePurpose)} = NOW() WHERE id = $1`,
    [user.id]
  );

  return {
    token,
    skippedReason: "",
    attempts: sentCount + 1,
    cooldownMinutes: getCooldownMinutes(safePurpose, sentCount + 1),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function sendActivationEmail(
  to,
  uan,
  token,
  purpose = TOKEN_PURPOSES.EMAIL_VERIFICATION
) {
  if (!transporter || !token) return false;

  const safePurpose = Object.values(TOKEN_PURPOSES).includes(purpose)
    ? purpose
    : TOKEN_PURPOSES.EMAIL_VERIFICATION;
  const ttlHours = getTokenTtlHours(safePurpose);
  const actionLink = `${clientUrl}/activate?token=${token}`;
  const from = MAIL_FROM_NAME
    ? `${MAIL_FROM_NAME} <${MAIL_FROM_ADDRESS}>`
    : MAIL_FROM_ADDRESS;
  const isReset = safePurpose === TOKEN_PURPOSES.PASSWORD_RESET;
  const subject = isReset
    ? "Reset your Online Application System password"
    : "Verify your Online Application System email";
  const intro = isReset
    ? "Use the link below to set a new password for your account."
    : "Use the link below to verify your email. Your password will not activate the account until this verification is completed.";
  const emailContent = buildActivationEmail({
    actionLink,
    intro,
    purpose: safePurpose,
    ttlHours,
    uan,
  });

  await transporter.sendMail({
    from,
    to,
    subject,
    text: emailContent.text,
    html: emailContent.html,
  });

  return true;
}
