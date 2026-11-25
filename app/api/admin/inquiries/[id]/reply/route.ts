import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { sendTransactionalEmail } from "@/lib/email-delivery";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const ALLOWED_TARGET_STAGES = new Set([
  "NEW",
  "CONTACTED",
  "FOLLOW_UP_SCHEDULED",
  "CONSULTATION_BOOKED",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
  "ARCHIVED",
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    if (!inquiry.email) {
      return NextResponse.json(
        { error: "This inquiry does not contain a valid email address." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { subject, message, markAsResolved, targetStage } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Response message cannot be empty." },
        { status: 400 }
      );
    }

    const emailSubject =
      subject?.trim() ||
      `Re: Your inquiry regarding ${inquiry.service || "TaxFiling24 services"}`;

    const sanitizedMessage = message.trim();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://taxfiling24.com";

    const safeSubject = escapeHtml(emailSubject);
    const safeName = escapeHtml(inquiry.name || "Client");
    const safeBodyHtml = escapeHtml(sanitizedMessage).replace(/\n/g, "<br>");
    const safeService = escapeHtml(inquiry.service || "General Inquiry");
    const safeOrigMessage = escapeHtml(inquiry.message || "");
    const safeSiteUrl = escapeHtml(siteUrl);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeSubject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">TaxFiling24</h1>
        <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Statutory Tax Filing &amp; Corporate Legal Advisory</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #0f172a; font-weight: 600;">
          Dear ${safeName},
        </p>

        <div style="font-size: 14px; line-height: 1.65; color: #334155; margin-bottom: 24px;">${safeBodyHtml}</div>

        <!-- Original Inquiry Quote -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-left: 3px solid #6366f1; border-radius: 8px; margin: 24px 0;">
          <tr>
            <td style="padding: 16px 20px;">
              <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px;">
                Reference: Your Inquiry (${safeService})
              </p>
              <p style="margin: 0; font-size: 13px; color: #475569; font-style: italic; line-height: 1.5;">
                &ldquo;${safeOrigMessage}&rdquo;
              </p>
            </td>
          </tr>
        </table>

        <!-- Direct Actions -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
          <tr>
            <td>
              <a href="${safeSiteUrl}/book" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 8px;">
                Schedule CA Consultation
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
        <p style="margin: 0 0 4px; font-size: 12px; color: #64748b; font-weight: 500;">
          TaxFiling24 Advisory Team
        </p>
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
          This response was sent directly from TaxFiling24 Client Relations. If you have questions, reply directly to this email.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    const textVersion = `Dear ${inquiry.name || "Client"},\n\n${sanitizedMessage}\n\n---\nOriginal Inquiry (${inquiry.service || "General"}):\n"${inquiry.message}"\n\n---\nTaxFiling24 Advisory Team\nSchedule consultation: ${siteUrl}/book`;

    const deliveryResult = await sendTransactionalEmail({
      html: emailHtml,
      subject: emailSubject,
      text: textVersion,
      to: inquiry.email,
    });

    const actor = auth.user.name || auth.user.username || auth.user.role;

    // Never falsely advance an email reply to RESOLVED/WON (which inflates Won Revenue).
    // Valid explicit targetStage is respected; otherwise advance NEW/PENDING -> CONTACTED.
    let newStage: string | undefined;
    if (targetStage && ALLOWED_TARGET_STAGES.has(String(targetStage))) {
      newStage = String(targetStage);
    } else if (markAsResolved || inquiry.status === "NEW" || inquiry.status === "PENDING") {
      if (inquiry.status === "NEW" || inquiry.status === "PENDING") {
        newStage = "CONTACTED";
      }
    }

    if (newStage && newStage !== inquiry.status) {
      await prisma.inquiry.update({
        data: { status: newStage },
        where: { id },
      });

      await prisma.leadActivity
        .create({
          data: {
            inquiryId: inquiry.id,
            type: "STATUS_CHANGE",
            title: `Stage Changed: ${inquiry.status} -> ${newStage}`,
            description: "Automatically advanced following outbound client email dispatch.",
            performedBy: actor,
          },
        })
        .catch((e) => console.warn("Failed to log status change activity:", e));
    }

    await logActivity(
      "SENT",
      "Inquiry",
      `Sent email response to ${inquiry.email} (${deliveryResult.provider})`,
      inquiry.id,
      auth.user.userId
    );

    await prisma.leadActivity
      .create({
        data: {
          inquiryId: inquiry.id,
          type: "EMAIL",
          title: `Outbound Email: ${emailSubject}`,
          description: sanitizedMessage,
          metadata: {
            to: inquiry.email,
            provider: deliveryResult.provider,
            subject: emailSubject,
          },
          performedBy: actor,
        },
      })
      .catch((e) => console.error("LeadActivity logging failed:", e));

    return NextResponse.json({
      message: `Email response sent successfully to ${inquiry.email}`,
      provider: deliveryResult.provider,
      success: true,
    });
  } catch (error) {
    console.error("Failed to send inquiry response:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send email response. Please check your SMTP / email provider settings in admin.",
      },
      { status: 500 }
    );
  }
}
