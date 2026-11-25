import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import {
  sendWhatsAppMessage,
  normalizePhoneNumber,
  buildWhatsAppWebUrl,
  getWhatsAppConfig,
} from "@/lib/whatsapp";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const lead = await prisma.inquiry.findUnique({
    where: { id },
    select: { id: true, name: true, phone: true, service: true },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  const config = await getWhatsAppConfig();
  const normalizedPhone = normalizePhoneNumber(lead.phone || "");
  const waWebUrl = buildWhatsAppWebUrl(
    lead.phone || "",
    `Hello ${lead.name}, thank you for contacting TaxFiling24 regarding ${lead.service || "our advisory services"}.`
  );

  return NextResponse.json({
    leadId: lead.id,
    leadName: lead.name,
    phone: lead.phone,
    normalizedPhone,
    hasValidPhone: Boolean(normalizedPhone),
    isConfigured: config.isConfigured,
    senderPhone: config.phoneNumber,
    waWebUrl,
  });
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const lead = await prisma.inquiry.findUnique({
    where: { id },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  }

  if (!lead.phone || !lead.phone.trim()) {
    return NextResponse.json(
      { error: "This lead does not have a registered phone number." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { text, templateName, templateLanguage } = body;

    if (!text && !templateName) {
      return NextResponse.json(
        { error: "Please enter a message or choose a template." },
        { status: 400 }
      );
    }

    const sendResult = await sendWhatsAppMessage({
      to: lead.phone,
      text: text?.trim(),
      templateName,
      templateLanguage,
      inquiryId: lead.id,
    });

    if (!sendResult.success) {
      return NextResponse.json(
        {
          error: sendResult.error || "Failed to dispatch WhatsApp message.",
          code: sendResult.code,
          waWebUrl: buildWhatsAppWebUrl(lead.phone, text?.trim() || ""),
        },
        { status: 400 }
      );
    }

    const actor = auth.user.name || auth.user.username || auth.user.role;

    // Record interaction in the Lead's Activity Audit Trail
    await prisma.leadActivity.create({
      data: {
        inquiryId: lead.id,
        type: "WHATSAPP",
        title: "WhatsApp Message Sent via Cloud API",
        description: text?.trim() || `Template: ${templateName}`,
        metadata: {
          messageId: sendResult.messageId,
          recipientPhone: lead.phone,
          sentBy: actor,
          provider: "META_CLOUD_API",
        },
        performedBy: actor,
      },
    });

    // Automatically advance lead stage from NEW to CONTACTED
    if (lead.status === "NEW" || lead.status === "PENDING") {
      await prisma.inquiry.update({
        where: { id: lead.id },
        data: { status: "CONTACTED" },
      });
      await prisma.leadActivity
        .create({
          data: {
            inquiryId: lead.id,
            type: "STATUS_CHANGE",
            title: `Stage Changed: ${lead.status} -> CONTACTED`,
            description: "Automatically advanced after WhatsApp interaction.",
            performedBy: actor,
          },
        })
        .catch((e) => console.warn("Failed to log WA status change:", e));
    }

    return NextResponse.json({
      success: true,
      messageId: sendResult.messageId,
    });
  } catch (error: any) {
    console.error("WhatsApp Send Error:", error);
    return NextResponse.json(
      { error: "Failed to send WhatsApp message" },
      { status: 500 }
    );
  }
}
