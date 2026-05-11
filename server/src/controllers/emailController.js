import {
  MAIL_FROM_ADDRESS,
  MAIL_FROM_NAME,
  MAIL_USER,
  transporter,
} from "../config/mailer.js";

export async function sendTestEmail(req, res) {
  const { to } = req.body || {};
  const target = to || MAIL_USER || MAIL_FROM_ADDRESS;

  if (!transporter) {
    return res.status(400).json({
      success: false,
      message: "Mailer is not configured.",
    });
  }

  if (!target) {
    return res.status(400).json({
      success: false,
      message: "Missing target email",
    });
  }

  try {
    const from = MAIL_FROM_NAME
      ? `${MAIL_FROM_NAME} <${MAIL_FROM_ADDRESS}>`
      : MAIL_FROM_ADDRESS;

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
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to send test email",
    });
  }
}
