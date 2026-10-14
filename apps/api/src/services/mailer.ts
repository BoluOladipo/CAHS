import nodemailer from "nodemailer";
import { config } from "../config.js";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!config.smtp.user || !config.smtp.pass) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
  return transporter;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(opts: SendMailOptions): Promise<{ ok: boolean; messageId?: string; error?: string }> {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[mock-mailer fallback] to=${opts.to} subject="${opts.subject}"`);
    return { ok: true, messageId: "simulated-no-smtp-creds" };
  }

  try {
    const info = await mailer.sendMail({
      from: config.smtp.from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text ?? opts.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      html: opts.html,
    });
    console.log(`[mailer] Sent email to ${opts.to} id=${info.messageId}`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    const message = (err as Error).message || String(err);
    console.error(`[mailer] Failed to send email to ${opts.to}:`, message);
    return { ok: false, error: message };
  }
}

export async function sendOtpEmail(to: string, code: string, fullName?: string) {
  const greeting = fullName ? `Hello ${fullName},` : "Hello,";
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your CAHS Verification Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; color: #1b2e23;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f7f6f2; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e7dfd5;">
          <!-- Header -->
          <tr>
            <td style="background-color: #1b4332; padding: 24px 32px; text-align: left;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #fbf7ee; letter-spacing: -0.02em;">
                Centralized Agro Hub (CAHS)
              </h1>
              <p style="margin: 4px 0 0; font-size: 13px; color: #95d5b2;">
                Connected Agricultural Trade, Logistics &amp; Finance · Zenith Bank Zecathon 6.0
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #1b2e23;">
                ${greeting}
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.5; color: #40514e;">
                Your one-time security verification code (OTP) for accessing your Centralized Agro Hub account is:
              </p>

              <!-- OTP Code Box -->
              <div style="background-color: #eef5f0; border: 2px dashed #2d6a4f; border-radius: 10px; padding: 20px; text-align: center; margin: 0 0 24px;">
                <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1b4332;">
                  ${code}
                </span>
                <p style="margin: 8px 0 0; font-size: 12px; color: #52796f;">
                  Valid for 10 minutes · Do not share this code with anyone
                </p>
              </div>

              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.5; color: #555;">
                If you did not request this verification code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #faf8f5; padding: 20px 32px; border-top: 1px solid #e7dfd5; font-size: 12px; line-height: 1.5; color: #7f8c8d; text-align: center;">
              <p style="margin: 0 0 6px;">
                <strong>Prototype Notice:</strong> Centralized Agro Hub (CAHS) is a concept proposal and prototype for Zenith Bank Zecathon 6.0. Simulated payments, loans, and savings; no real banking funds are handled.
              </p>
              <p style="margin: 0; color: #999;">
                &copy; ${new Date().getFullYear()} Centralized Agro Hub (CAHS). All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return sendMail({
    to,
    subject: `${code} is your Centralized Agro Hub (CAHS) verification code`,
    html,
  });
}

export async function sendNotificationEmail(to: string, title: string, body: string, fullName?: string) {
  const greeting = fullName ? `Hello ${fullName},` : "Hello,";
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f6f2; color: #1b2e23;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f7f6f2; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e7dfd5;">
          <tr>
            <td style="background-color: #1b4332; padding: 20px 32px;">
              <h1 style="margin: 0; font-size: 18px; font-weight: 700; color: #fbf7ee;">Centralized Agro Hub (CAHS)</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 12px; font-size: 15px;">${greeting}</p>
              <h2 style="margin: 0 0 12px; font-size: 18px; color: #1b4332;">${title}</h2>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #333;">${body}</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #faf8f5; padding: 16px 32px; border-top: 1px solid #e7dfd5; font-size: 12px; color: #888; text-align: center;">
              Centralized Agro Hub (CAHS) · Concept prototype for Zenith Bank Zecathon 6.0
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  return sendMail({
    to,
    subject: `CAHS Notification: ${title}`,
    html,
  });
}
