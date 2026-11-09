import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { sendTransactionalEmail } from "@/lib/email-delivery";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    const { subject, message, markAsResolved = true } = body;

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
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://taxfiling24.com";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">TaxFiling24</h1>
        <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Statutory Tax Filing & Corporate Legal Advisory</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px;">
        <p style="margin: 0 0 16px; font-size: 15px; color: #0f172a; font-weight: 600;">
          Dear ${inquiry.name || "Client"},
        </p>
        
        <div style="font-size: 14px; line-height: 1.65; color: #334155; white-space: pre-wrap; margin-bottom: 24px;">${sanitizedMessage}</div>

        <!-- Original Inquiry Quote -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-left: 3px solid #6366f1; border-radius: 8px; margin: 24px 0;">
          <tr>
            <td style="padding: 16px 20px;">
              <p style="margin: 0 0 6px; font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px;">
                Reference: Your Inquiry (${inquiry.service || "General Inquiry"})
              </p>
              <p style="margin: 0; font-size: 13px; color: #475569; font-style: italic; line-height: 1.5;">
                "${inquiry.message}"
              </p>
            </td>
          </tr>
        </table>

        <!-- Direct Actions -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
          <tr>
            <td>
              <a href="${siteUrl}/book" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 20px; rounded-radius: 8px; border-radius: 8px;">
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

    // Dispatch via transactional email engine (SMTP/Resend/Mailgun)
    const deliveryResult = await sendTransactionalEmail({
      html: emailHtml,
      subject: emailSubject,
      text: textVersion,
      to: inquiry.email,
    });

    // Optionally mark status as RESOLVED
    if (markAsResolved && inquiry.status !== "RESOLVED") {
      await prisma.inquiry.update({
        data: { status: "RESOLVED" },
        where: { id },
      });
    }

    await logActivity(
      "SENT",
      "Inquiry",
      `Sent email response to ${inquiry.email} (${deliveryResult.provider})`,
      inquiry.id
    );

    // Also record in LeadActivity timeline
    await prisma.leadActivity.create({
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
        performedBy: (admin as any).name || admin.role || "Admin",
      },
    }).catch((e) => console.error("LeadActivity logging failed:", e));

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

