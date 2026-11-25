import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { ingestContact } from "@/lib/audience-service";
import { sendWhatsAppMessage, normalizePhoneNumber } from "@/lib/whatsapp";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rate = checkRateLimit("public-inquiry", clientIp, {
      limit: 5,
      windowMs: 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many inquiries submitted. Please wait a minute before trying again." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { fullName, name, email, phone, service, message } = body;

    const clientName = String(fullName || name || "").trim().slice(0, 120);
    const clientPhone = String(phone || "").trim().slice(0, 30);
    const clientEmail = String(email || "").trim().slice(0, 180);
    const clientService = String(service || "").trim().slice(0, 150);
    const clientMessage = String(message || "").trim().slice(0, 4000);

    if (!clientName) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    if (!clientPhone && !clientEmail) {
      return NextResponse.json(
        { error: "Please provide either a phone number or email address." },
        { status: 400 }
      );
    }

    if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      return NextResponse.json({ error: "Invalid email address format." }, { status: 400 });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        name: clientName,
        phone: clientPhone || null,
        email: clientEmail || "no-email-provided@taxfiling24.com",
        service: clientService || null,
        message: clientMessage || "Inquiry from website contact form",
        status: "NEW",
        source: "WEBSITE_FORM",
      },
    });

    await prisma.leadActivity
      .create({
        data: {
          inquiryId: inquiry.id,
          type: "NOTE",
          title: "Inbound Lead Submitted via Website",
          description: `Client submitted inquiry for ${clientService || "General Services"}.\nRequirement: "${clientMessage || "N/A"}"`,
          performedBy: "Website Client",
        },
      })
      .catch((e) => console.warn("[CRM] Failed to create initial lead activity:", e));

    await logActivity(
      "CREATED",
      "Inquiry",
      `New inquiry from ${inquiry.name} (${inquiry.service || "General"})`,
      inquiry.id
    );

    // Send automated WhatsApp confirmation with strict per-phone cooldown to prevent SMS/WA bombing
    const normalizedPhone = normalizePhoneNumber(clientPhone);
    if (normalizedPhone) {
      const waPhoneCooldown = checkRateLimit("wa-inquiry-ack", normalizedPhone, {
        limit: 1,
        windowMs: 10 * 60 * 1000,
      });
      if (waPhoneCooldown.allowed) {
        sendWhatsAppMessage({
          to: normalizedPhone,
          inquiryId: inquiry.id,
          text: `Hello! Thank you for reaching out to *TaxFiling24*.\n\nOur CA advisory team has received your inquiry and will connect with you shortly. You can also reply directly to this WhatsApp chat for immediate assistance.\n\nWarm regards,\n*TaxFiling24 Client Desk*`,
        }).catch((waErr) =>
          console.warn("[WhatsApp] Automated inquiry acknowledgement skipped/failed:", waErr)
        );
      }
    }

    // Automatically synchronize new valid inquiry leads into Campaign Audience without overwriting existing PII
    if (clientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      ingestContact({
        email: clientEmail,
        name: clientName,
        phone: clientPhone || null,
        source: "INQUIRY",
        tags: clientService ? [clientService] : ["Contact Inquiry"],
        updateIfExists: false,
      }).catch((e) => console.warn("[Audience] Failed to auto-ingest inquiry lead:", e));
    }

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! Your inquiry has been submitted. Our team will contact you shortly.",
        id: inquiry.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Public Inquiry Error:", error);
    return NextResponse.json(
      { error: "Failed to submit inquiry. Please try again or contact us directly." },
      { status: 500 }
    );
  }
}
