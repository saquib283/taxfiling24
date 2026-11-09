import * as dotenv from "dotenv";
dotenv.config({ path: "c:/Projects/taxfiling24/.env" });

import { sendTransactionalEmail } from "./lib/email-delivery";

async function main() {
  console.log("Testing application's sendTransactionalEmail()...");
  console.log("Target:", "mdray283@gmail.com");

  try {
    const result = await sendTransactionalEmail({
      to: "mdray283@gmail.com",
      subject: "TaxFiling24 - Application Integration Test",
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:20px;border:1px solid #e2e8f0;">
          <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);color:#ffffff;padding:28px;border-radius:16px;margin-bottom:24px;">
            <span style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#93c5fd;background:rgba(255,255,255,0.1);padding:4px 10px;border-radius:999px;">
              TaxFiling24 Advisory Desk
            </span>
            <h1 style="margin:16px 0 6px;font-size:22px;color:#ffffff;font-weight:800;">
              Application Integration Verified
            </h1>
            <p style="margin:0;color:#cbd5e1;font-size:14px;">
              Live test sent directly via lib/email-delivery.ts
            </p>
          </div>

          <p style="color:#1e293b;font-size:15px;line-height:1.7;">
            Hello Md Rehan,
          </p>
          <p style="color:#475569;font-size:15px;line-height:1.7;">
            This email confirms that the core application's <code>sendTransactionalEmail</code> service is functioning with your <code>.env</code> credentials!
          </p>

          <table style="width:100%;margin:20px 0;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;border-spacing:0;">
            <tr>
              <td style="padding:6px 12px;font-size:13px;color:#64748b;font-weight:600;">Status</td>
              <td style="padding:6px 12px;font-size:13px;color:#16a34a;font-weight:700;">Delivered Successfully</td>
            </tr>
            <tr>
              <td style="padding:6px 12px;font-size:13px;color:#64748b;font-weight:600;">Sender</td>
              <td style="padding:6px 12px;font-size:13px;color:#0f172a;">${process.env.EMAIL_FROM_EMAIL}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px;font-size:13px;color:#64748b;font-weight:600;">SMTP Host</td>
              <td style="padding:6px 12px;font-size:13px;color:#0f172a;">${process.env.SMTP_HOST}:${process.env.SMTP_PORT}</td>
            </tr>
          </table>

          <p style="color:#94a3b8;font-size:12px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:16px;text-align:center;">
            TaxFiling24 Advisory Services · Automatic Verification
          </p>
        </div>
      `,
      text: "TaxFiling24 - Application Integration Test. Your email credentials in .env are fully working and verified!"
    });

    console.log("✓ Success! Result:", result);
  } catch (error) {
    console.error("✗ Failed to send via application:", error);
  }
}

main();

