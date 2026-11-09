import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getWhatsAppConfig } from "@/lib/whatsapp";
import { normalizePhoneNumber } from "@/lib/whatsapp-shared";
import { ingestContact } from "@/lib/audience-service";
import { logActivity } from "@/lib/activity-log";

/**
 * GET: Meta Webhook Verification Handshake
 * Meta sends hub.mode, hub.verify_token, and hub.challenge
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const config = await getWhatsAppConfig();
    const expectedToken = config.webhookVerifyToken || "taxfiling24_wa_webhook_verify_2026";

    if (mode === "subscribe" && token === expectedToken) {
      console.log("[WhatsApp Webhook] Handshake verified successfully with challenge:", challenge);
      return new Response(challenge || "", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    console.warn("[WhatsApp Webhook] Verification token mismatch. Expected:", expectedToken, "Received:", token);
    return new Response("Forbidden: Invalid verification token", { status: 403 });
  } catch (error) {
    console.error("[WhatsApp Webhook] Verification error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * POST: Meta Webhook Ingestion Engine
 * Receives delivery status updates (sent, delivered, read, failed) and incoming messages.
 */
export async function POST(request: NextRequest) {
  let rawBodyText = "";
  try {
    rawBodyText = await request.text();
    const config = await getWhatsAppConfig();

    // Optional: Validate X-Hub-Signature-256 if WHATSAPP_APP_SECRET is set
    if (config.appSecret) {
      const signature = request.headers.get("x-hub-signature-256");
      if (signature) {
        const expectedSignature = `sha256=${crypto
          .createHmac("sha256", config.appSecret)
          .update(rawBodyText)
          .digest("hex")}`;

        const sigBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expectedSignature);

        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
          console.warn("[WhatsApp Webhook] Signature verification failed.");
          return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }
      }
    }

    const payload = JSON.parse(rawBodyText);

    if (payload.object !== "whatsapp_business_account" && !payload.entry) {
      return NextResponse.json({ error: "Unrecognized webhook object" }, { status: 400 });
    }

    // Process entries asynchronously but ensure core DB updates execute
    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages") continue;

        const val = change.value;
        const metadata = val?.metadata || {};
        const displayPhone = metadata.display_phone_number || config.phoneNumber;

        // 1. Process Delivery Status Updates (statuses)
        if (Array.isArray(val?.statuses) && val.statuses.length > 0) {
          for (const s of val.statuses) {
            await handleStatusUpdate(s, displayPhone);
          }
        }

        // 2. Process Incoming Messages (messages)
        if (Array.isArray(val?.messages) && val.messages.length > 0) {
          for (const m of val.messages) {
            await handleInboundMessage(m, val.contacts || [], displayPhone);
          }
        }
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error: any) {
    console.error("[WhatsApp Webhook] Processing error:", error);
    // Always return 200 to prevent Meta from spamming retries unless payload was unparseable
    return NextResponse.json(
      { status: "error", error: error.message || "Webhook processing error" },
      { status: 200 }
    );
  }
}

/**
 * Handles message delivery status updates (sent, delivered, read, failed)
 */
async function handleStatusUpdate(statusObj: any, displayPhone: string) {
  try {
    const wamid = statusObj.id;
    const newStatus = statusObj.status; // "sent" | "delivered" | "read" | "failed"
    const recipient = normalizePhoneNumber(statusObj.recipient_id || "");
    const pricingCat = statusObj.pricing?.category;
    const errCode = statusObj.errors?.[0]?.code ? String(statusObj.errors[0].code) : null;
    const errMsg = statusObj.errors?.[0]?.title || statusObj.errors?.[0]?.message || null;

    // 1. Update or create WhatsAppLog record
    const existingLog = wamid
      ? await prisma.whatsAppLog.findFirst({ where: { messageId: wamid } })
      : null;

    if (existingLog) {
      await prisma.whatsAppLog.update({
        where: { id: existingLog.id },
        data: {
          status: newStatus,
          pricingCategory: pricingCat || existingLog.pricingCategory,
          errorCode: errCode || existingLog.errorCode,
          errorMessage: errMsg || existingLog.errorMessage,
          rawPayload: statusObj,
        },
      });
    } else {
      await prisma.whatsAppLog.create({
        data: {
          messageId: wamid,
          direction: "STATUS_UPDATE",
          fromNumber: normalizePhoneNumber(displayPhone),
          toNumber: recipient,
          status: newStatus,
          errorCode: errCode,
          errorMessage: errMsg,
          pricingCategory: pricingCat,
          rawPayload: statusObj,
        },
      });
    }

    // 2. If belongs to a Campaign: update Campaign Event and counters
    if (wamid) {
      const existingCampaignEvent = await prisma.campaignEvent.findFirst({
        where: { providerEventId: wamid },
      });

      if (existingCampaignEvent) {
        // Record status event
        await prisma.campaignEvent.create({
          data: {
            campaignId: existingCampaignEvent.campaignId,
            provider: "WHATSAPP",
            eventType: newStatus.toUpperCase(),
            providerEventId: `${wamid}_${newStatus}`,
            recipientEmail: recipient,
            payload: statusObj,
          },
        }).catch(() => {});

        // Increment campaign metrics
        if (newStatus === "delivered") {
          await prisma.campaign.update({
            where: { id: existingCampaignEvent.campaignId },
            data: { deliveredCount: { increment: 1 } },
          }).catch(() => {});
        } else if (newStatus === "read") {
          await prisma.campaign.update({
            where: { id: existingCampaignEvent.campaignId },
            data: { openedCount: { increment: 1 } },
          }).catch(() => {});
        } else if (newStatus === "failed") {
          await prisma.campaign.update({
            where: { id: existingCampaignEvent.campaignId },
            data: { failedCount: { increment: 1 } },
          }).catch(() => {});
        }
      }
    }

    // 3. If linked to a LeadActivity: update activity metadata with delivery tick
    if (wamid) {
      const activities = await prisma.leadActivity.findMany({
        where: {
          type: "WHATSAPP",
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });

      for (const act of activities) {
        const meta = act.metadata as Record<string, any> | null;
        if (meta?.messageId === wamid) {
          await prisma.leadActivity.update({
            where: { id: act.id },
            data: {
              metadata: {
                ...meta,
                deliveryStatus: newStatus,
                statusUpdatedAt: new Date().toISOString(),
                ...(errMsg ? { error: errMsg, errorCode: errCode } : {}),
              },
            },
          });
          break;
        }
      }
    }
  } catch (err) {
    console.warn("[WhatsApp Webhook] Status update handler error:", err);
  }
}

/**
 * Handles incoming client messages from WhatsApp (text, media, interactive)
 */
async function handleInboundMessage(msg: any, contacts: any[], displayPhone: string) {
  try {
    const rawFrom = msg.from;
    const senderNumber = normalizePhoneNumber(rawFrom);
    if (!senderNumber) return;

    const contactProfile = contacts.find((c: any) => c.wa_id === rawFrom);
    const profileName = contactProfile?.profile?.name || "";
    const wamid = msg.id;

    // Extract human-readable message text
    let messageContent = "";
    let messageType = msg.type || "text";
    let mediaUrl: string | null = null;
    let mediaMimeType: string | null = null;

    if (msg.type === "text") {
      messageContent = msg.text?.body || "";
    } else if (msg.type === "image") {
      messageContent = msg.image?.caption || "[Image Attachment]";
      mediaUrl = msg.image?.id || null;
      mediaMimeType = msg.image?.mime_type || null;
    } else if (msg.type === "document") {
      messageContent = msg.document?.caption || msg.document?.filename || "[Document Attachment]";
      mediaUrl = msg.document?.id || null;
      mediaMimeType = msg.document?.mime_type || null;
    } else if (msg.type === "audio") {
      messageContent = "[Voice Note / Audio]";
      mediaUrl = msg.audio?.id || null;
      mediaMimeType = msg.audio?.mime_type || null;
    } else if (msg.type === "video") {
      messageContent = msg.video?.caption || "[Video Attachment]";
      mediaUrl = msg.video?.id || null;
      mediaMimeType = msg.video?.mime_type || null;
    } else if (msg.type === "interactive") {
      messageContent =
        msg.interactive?.button_reply?.title ||
        msg.interactive?.list_reply?.title ||
        "[Interactive Button Reply]";
    } else if (msg.type === "button") {
      messageContent = msg.button?.text || "[Quick Reply Button]";
    } else {
      messageContent = `[${msg.type?.toUpperCase() || "WHATSAPP"} Message]`;
    }

    // Step A: Link or Create Lead in CRM
    let linkedInquiryId: string | null = null;

    // Search for existing lead matching phone number (full digits or last 10 digits)
    const phoneSuffix = senderNumber.slice(-10);
    const existingLead = await prisma.inquiry.findFirst({
      where: {
        OR: [
          { phone: senderNumber },
          { phone: `+${senderNumber}` },
          { phone: { endsWith: phoneSuffix } },
        ],
      },
      orderBy: { updatedAt: "desc" },
    });

    if (existingLead) {
      linkedInquiryId = existingLead.id;

      // Append incoming message to Lead Activity Timeline
      await prisma.leadActivity.create({
        data: {
          inquiryId: existingLead.id,
          type: "WHATSAPP",
          title: "Incoming WhatsApp Message",
          description: messageContent,
          metadata: {
            direction: "INBOUND",
            messageId: wamid,
            senderPhone: senderNumber,
            senderName: profileName,
            messageType,
            mediaUrl,
            raw: msg,
          },
          performedBy: profileName ? `${profileName} (Client)` : "Client (WhatsApp)",
        },
      });

      // Touch lead timestamp
      await prisma.inquiry.update({
        where: { id: existingLead.id },
        data: { updatedAt: new Date() },
      });
    } else {
      // Auto-create new qualified Inquiry lead
      const newLead = await prisma.inquiry.create({
        data: {
          name: profileName || `WhatsApp User (+${senderNumber})`,
          email: `wa-${senderNumber}@taxfiling24.com`,
          phone: senderNumber,
          service: "Direct WhatsApp Client Inquiry",
          message: messageContent,
          source: "WHATSAPP",
          status: "NEW",
          priority: "HIGH",
        },
      });

      linkedInquiryId = newLead.id;

      // Log initial touchpoint
      await prisma.leadActivity.create({
        data: {
          inquiryId: newLead.id,
          type: "WHATSAPP",
          title: "Initial Contact via WhatsApp",
          description: messageContent,
          metadata: {
            direction: "INBOUND",
            messageId: wamid,
            senderPhone: senderNumber,
            senderName: profileName,
            messageType,
            raw: msg,
          },
          performedBy: profileName ? `${profileName} (Client)` : "Client (WhatsApp)",
        },
      });

      // Synchronize into Audience Hub
      ingestContact({
        email: newLead.email,
        name: newLead.name,
        phone: senderNumber,
        source: "WHATSAPP",
        tags: ["WhatsApp Inbound"],
        updateIfExists: true,
      }).catch((e) => console.warn("[Audience] Failed to ingest WhatsApp contact:", e));

      // Log system activity
      await logActivity(
        "CREATED",
        "Inquiry",
        `New lead captured from WhatsApp: ${newLead.name} (${senderNumber})`,
        newLead.id
      );
    }

    // Step B: Persist in WhatsAppLog table
    await prisma.whatsAppLog.create({
      data: {
        messageId: wamid,
        direction: "INBOUND",
        fromNumber: senderNumber,
        toNumber: normalizePhoneNumber(displayPhone),
        senderName: profileName || null,
        messageType,
        content: messageContent,
        mediaUrl,
        mediaMimeType,
        status: "received",
        rawPayload: msg,
        inquiryId: linkedInquiryId,
      },
    });
  } catch (err) {
    console.error("[WhatsApp Webhook] Inbound message handler error:", err);
  }
}

