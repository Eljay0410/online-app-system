import { randomBytes } from "crypto";
import { clientUrl } from "../config/env.js";
import {
  MAIL_FROM_ADDRESS,
  MAIL_FROM_NAME,
  transporter,
} from "../config/mailer.js";

function buildActivationEmail({ activationLink, intro, isReset, ttlHours, uan }) {
  const title = isReset ? "Set your password" : "Activate your account";
  const actionLabel = isReset ? "Set Password" : "Activate Account";
  const uanValue = String(uan || "N/A").toUpperCase();

  const text = [
    "DepEd City of San Jose del Monte Online Application System",
    "",
    title,
    "",
    `Unique Application Number (UAN): ${uanValue}`,
    intro,
    "",
    `${actionLabel}: ${activationLink}`,
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
                <a href="${activationLink}" style="display:inline-block;background:#0056b3;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 24px;border-radius:10px;">${actionLabel}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 28px 30px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;text-align:center;">This secure link expires in <strong>${ttlHours} hours</strong>.</p>
                <p style="margin:18px 0 0;font-size:12px;line-height:1.6;color:#64748b;">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin:6px 0 0;font-size:12px;line-height:1.6;word-break:break-all;color:#2563eb;">${activationLink}</p>
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

function parseCooldownSchedule() {
  return (process.env.ACTIVATION_COOLDOWN_MINUTES || "0,2,5,15,30,60")
    .split(",")
    .map((value) => Number.parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value >= 0);
}

function getCooldownMinutes(sentCount) {
  const schedule = parseCooldownSchedule();
  const fallbackSchedule = [0, 2, 5, 15, 30, 60];
  const activeSchedule = schedule.length ? schedule : fallbackSchedule;
  const index = Math.min(sentCount, activeSchedule.length - 1);

  return activeSchedule[index];
}

export async function createActivationToken(client, user) {
  const attemptWindowHours = Number.parseInt(
    process.env.ACTIVATION_ATTEMPT_WINDOW_HOURS || "24",
    10
  );
  const recentTokens = await client.query(
    `SELECT COUNT(*)::int AS sent_count
     FROM activation_tokens
     WHERE user_id = $1
       AND created_at >= NOW() - ($2::int * INTERVAL '1 hour')`,
    [user.id, attemptWindowHours]
  );
  const sentCount = recentTokens.rows[0]?.sent_count || 0;
  const cooldownMinutes = getCooldownMinutes(sentCount);

  if (cooldownMinutes > 0 && user.last_activation_sent_at) {
    const lastSentAt = new Date(user.last_activation_sent_at).getTime();
    const elapsedMinutes = (Date.now() - lastSentAt) / 1000 / 60;

    if (elapsedMinutes < cooldownMinutes) {
      return {
        token: null,
        skippedReason: `Activation email was recently sent. Try again in ${Math.ceil(
          cooldownMinutes - elapsedMinutes
        )} minute(s).`,
        attempts: sentCount,
        cooldownMinutes,
      };
    }
  }

  const token = randomBytes(32).toString("hex");
  const ttlHours = Number.parseInt(process.env.ACTIVATION_TOKEN_HOURS || "24", 10);
  const expiresAt = new Date(Date.now() + ttlHours * 3600 * 1000);

  await client.query(
    `INSERT INTO activation_tokens (user_id, token, expires_at, used, created_at)
     VALUES ($1, $2, $3, false, NOW())`,
    [user.id, token, expiresAt.toISOString()]
  );
  await client.query(
    "UPDATE users SET last_activation_sent_at = NOW() WHERE id = $1",
    [user.id]
  );

  return {
    token,
    skippedReason: "",
    attempts: sentCount + 1,
    cooldownMinutes: getCooldownMinutes(sentCount + 1),
  };
}

export async function sendActivationEmail(to, uan, token, purpose = "activate") {
  if (!transporter || !token) return false;

  const ttlHours = Number.parseInt(process.env.ACTIVATION_TOKEN_HOURS || "24", 10);
  const activationLink = `${clientUrl}/activate?token=${token}`;
  const from = MAIL_FROM_NAME
    ? `${MAIL_FROM_NAME} <${MAIL_FROM_ADDRESS}>`
    : MAIL_FROM_ADDRESS;
  const isReset = purpose === "reset-password";
  const subject = isReset
    ? "Set your Online Application System password"
    : "Activate your Online Application System account";
  const intro = isReset
    ? "Use the link below to set a new password for your account."
    : "Use the link below to activate your account and set your password.";
  const emailContent = buildActivationEmail({
    activationLink,
    intro,
    isReset,
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
