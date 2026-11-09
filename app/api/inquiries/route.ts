import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { ingestContact } from "@/lib/audience-service";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// Simple in-memory rate limiting map (IP -> timestamp & count)
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 5; // 5 inquiries per minute per IP

    const rateData = rateLimitMap.get(clientIp) || { count: 0, lastRequest: now };

    if (now - rateData.lastRequest > windowMs) {
      rateData.count = 1;
      rateData.lastRequest = now;
    } else {
      rateData.count = (rateData.count || 0) + 1;
    }

    rateLimitMap.set(clientIp, { count: rateData.count, lastRequest: now });

    if (rateData.count > maxRequests) {
      return NextResponse.json(
        { error: "Too many inquiries submitted. Please wait a minute before trying again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { fullName, name, email, phone, service, message } = body;

    const clientName = (fullName || name || "").trim();
    const clientPhone = (phone || "").trim();
    const clientEmail = (email || "").trim();
    const clientService = (service || "").trim();
    const clientMessage = (message || "").trim();

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
        status: "PENDING",
      },
    });

    await logActivity(
      "CREATED",
      "Inquiry",
      `New inquiry from ${inquiry.name} (${inquiry.service || "General"})`,
      inquiry.id
    );

    // Send automated WhatsApp confirmation to prospective client
    if (clientPhone) {
      sendWhatsAppMessage({
        to: clientPhone,
        text: `Hello ${clientName}! 👋\n\nThank you for reaching out to *TaxFiling24* regarding *${clientService || "our corporate tax & advisory services"}*.\n\nOur CA advisory team has received your inquiry and will connect with you shortly. You can also reply directly to this WhatsApp chat for immediate assistance.\n\nWarm regards,\n*TaxFiling24 Client Desk*`,
      }).catch((waErr) => console.warn("[WhatsApp] Automated inquiry acknowledgement skipped/failed:", waErr));
    }

    // Automatically synchronize valid inquiry leads into Campaign Audience
    if (clientEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
      ingestContact({
        email: clientEmail,
        name: clientName,
        phone: clientPhone || null,
        source: "INQUIRY",
        tags: clientService ? [clientService] : ["Contact Inquiry"],
        updateIfExists: true,
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

