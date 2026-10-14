import { sendMail } from "../apps/api/src/services/mailer.js";

async function main() {
  const recipient = process.argv[2] ?? "davidiwuji1@gmail.com";
  console.log(`Sending test email to ${recipient}...`);

  const result = await sendMail({
    to: recipient,
    subject: "Centralized Agro Hub (CAHS) - Live Email Integration Test",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background-color: #f7f6f2; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; padding: 28px; border-radius: 8px; border: 1px solid #ddd;">
    <h2 style="color: #1b4332; margin-top: 0;">Centralized Agro Hub (CAHS)</h2>
    <p>This email verifies that your CAHS Gmail SMTP dispatch is properly configured and delivering messages.</p>
    <div style="background: #eef5f0; padding: 16px; border-radius: 6px; text-align: center; margin: 20px 0;">
      <span style="font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #1b4332;">${Math.floor(100000 + Math.random() * 900000)}</span>
      <p style="margin: 4px 0 0; font-size: 12px; color: #555;">Sample 6-digit OTP code</p>
    </div>
    <p style="font-size: 12px; color: #888;">Centralized Agro Hub · Zenith Bank Zecathon 6.0 Prototype</p>
  </div>
</body>
</html>
`,
  });

  if (result.ok) {
    console.log(`Test email sent successfully! Message ID: ${result.messageId}`);
  } else {
    console.error(`Failed to send test email: ${result.error}`);
    process.exit(1);
  }
}

main().catch(console.error);
