import prisma from "@/lib/prisma";
import { normalizePhoneNumber, getPhoneSuffix10 } from "@/lib/whatsapp-shared";
import { logActivity } from "@/lib/activity-log";

export async function processWhatsAppWebhookPayload(
  payload: any,
  fallbackDisplayPhone: string
): Promise<void> {
  if (payload?.object !== "whatsapp_business_account" || !Array.isArray(payload?.entry)) {
    throw new Error("Unrecognized webhook object");
  }

  for (const entry of payload.entry) {
    for (const change of entry?.changes || []) {
      if (change?.field !== "messages") continue;

      const val = change.value;
      const metadata = val?.metadata || {};
      const displayPhone = metadata.display_phone_number || fallbackDisplayPhone;

      if (Array.isArray(val?.statuses) && val.statuses.length > 0) {
        for (const s of val.statuses) {
          await handleStatusUpdate(s, displayPhone);
        }
      }

      if (Array.isArray(val?.messages) && val.messages.length > 0) {
        for (const m of val.messages) {
          await handleInboundMessage(m, val.contacts || [], displayPhone);
        }
      }
    }
  }
}

async function handleStatusUpdate(statusObj: any, displayPhone: string) {
  try {
    const wamid = typeof statusObj?.id === "string" ? statusObj.id.slice(0, 191) : undefined;
    const newStatus = String(statusObj?.status || "").toLowerCase().slice(0, 40);
    if (!newStatus) return;

    const recipient =
      normalizePhoneNumber(statusObj?.recipient_id || "") ||
      String(statusObj?.recipient_id || "").slice(0, 40);
    const pricingCat = statusObj?.pricing?.category ? String(statusObj.pricing.category).slice(0, 60) : null;
    const errCode = statusObj?.errors?.[0]?.code ? String(statusObj.errors[0].code).slice(0, 40) : null;
    const errMsg = statusObj?.errors?.[0]?.title || statusObj?.errors?.[0]?.message || null;

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
          errorMessage: errMsg ? String(errMsg).slice(0, 500) : existingLog.errorMessage,
          rawPayload: statusObj,
        },
      });
    } else {
      await prisma.whatsAppLog.create({
        data: {
          messageId: wamid || null,
          direction: "STATUS_UPDATE",
          fromNumber: normalizePhoneNumber(displayPhone) || displayPhone || "BUSINESS",
          toNumber: recipient || "UNKNOWN",
          status: newStatus,
          errorCode: errCode,
          errorMessage: errMsg ? String(errMsg).slice(0, 500) : null,
          pricingCategory: pricingCat,
          rawPayload: statusObj,
        },
      });
    }

    if (wamid) {
      const existingCampaignEvent = await prisma.campaignEvent.findFirst({
        where: { providerEventId: wamid },
        select: { campaignId: true },
      });
      const campaignId = existingCampaignEvent?.campaignId || existingLog?.campaignId;

      if (campaignId) {
        const statusEventKey = `${wamid}_${newStatus}`;
        let createdNewEvent = false;

        try {
          await prisma.campaignEvent.create({
            data: {
              campaignId,
              provider: "WHATSAPP",
              eventType: newStatus.toUpperCase(),
              providerEventId: statusEventKey,
              recipientEmail: recipient,
              payload: statusObj,
            },
          });
          createdNewEvent = true;
        } catch (err: any) {
          if (err?.code !== "P2002") {
            console.warn("[WhatsApp Webhook] CampaignEvent create failed:", err);
          }
        }

        if (createdNewEvent) {
          if (newStatus === "delivered") {
            await prisma.campaign
              .update({
                where: { id: campaignId },
                data: { deliveredCount: { increment: 1 }, lastEventAt: new Date() },
              })
              .catch(() => {});
          } else if (newStatus === "read") {
            await prisma.campaign
              .update({
                where: { id: campaignId },
                data: { readCount: { increment: 1 }, lastEventAt: new Date() },
              })
              .catch(() => {});
          } else if (newStatus === "failed") {
            await prisma.campaign
              .update({
                where: { id: campaignId },
                data: { failedCount: { increment: 1 }, lastEventAt: new Date() },
              })
              .catch(() => {});
          }
        }
      }
    }

    if (wamid) {
      const activities = await prisma.leadActivity.findMany({
        where: {
          type: "WHATSAPP",
          ...(existingLog?.inquiryId ? { inquiryId: existingLog.inquiryId } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: existingLog?.inquiryId ? 50 : 200,
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
                ...(errMsg ? { error: String(errMsg).slice(0, 500), errorCode: errCode } : {}),
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

async function handleInboundMessage(msg: any, contacts: any[], displayPhone: string) {
  try {
    const rawFrom = msg?.from;
    const senderNumber = normalizePhoneNumber(rawFrom || "");
    if (!senderNumber) return;

    const wamid = typeof msg?.id === "string" ? msg.id.slice(0, 191) : null;

    if (wamid) {
      const duplicate = await prisma.whatsAppLog.findFirst({
        where: { messageId: wamid, direction: "INBOUND" },
        select: { id: true },
      });
      if (duplicate) return;
    }

    const contactProfile = contacts.find((c: any) => c.wa_id === rawFrom);
    const profileName =
      typeof contactProfile?.profile?.name === "string"
        ? contactProfile.profile.name.trim().slice(0, 100)
        : "";

    let messageContent = "";
    const messageType = typeof msg?.type === "string" ? msg.type.slice(0, 40) : "text";
    let mediaUrl: string | null = null;
    let mediaMimeType: string | null = null;

    if (msg.type === "text") {
      messageContent = String(msg.text?.body || "").slice(0, 4000);
    } else if (msg.type === "image") {
      messageContent = String(msg.image?.caption || "[Image Attachment]").slice(0, 4000);
      mediaUrl = msg.image?.id ? String(msg.image.id).slice(0, 191) : null;
      mediaMimeType = msg.image?.mime_type ? String(msg.image.mime_type).slice(0, 100) : null;
    } else if (msg.type === "document") {
      messageContent = String(
        msg.document?.caption || msg.document?.filename || "[Document Attachment]"
      ).slice(0, 4000);
      mediaUrl = msg.document?.id ? String(msg.document.id).slice(0, 191) : null;
      mediaMimeType = msg.document?.mime_type ? String(msg.document.mime_type).slice(0, 100) : null;
    } else if (msg.type === "audio") {
      messageContent = "[Voice Note / Audio]";
      mediaUrl = msg.audio?.id ? String(msg.audio.id).slice(0, 191) : null;
      mediaMimeType = msg.audio?.mime_type ? String(msg.audio.mime_type).slice(0, 100) : null;
    } else if (msg.type === "video") {
      messageContent = String(msg.video?.caption || "[Video Attachment]").slice(0, 4000);
      mediaUrl = msg.video?.id ? String(msg.video.id).slice(0, 191) : null;
      mediaMimeType = msg.video?.mime_type ? String(msg.video.mime_type).slice(0, 100) : null;
    } else if (msg.type === "interactive") {
      messageContent = String(
        msg.interactive?.button_reply?.title ||
          msg.interactive?.list_reply?.title ||
          "[Interactive Button Reply]"
      ).slice(0, 4000);
    } else if (msg.type === "button") {
      messageContent = String(msg.button?.text || "[Quick Reply Button]").slice(0, 4000);
    } else {
      messageContent = `[${messageType.toUpperCase()} Message]`;
    }

    let linkedInquiryId: string | null = null;
    const phoneSuffix10 = getPhoneSuffix10(senderNumber);
    const last4 = phoneSuffix10.slice(-4);

    let existingLead = await prisma.inquiry.findFirst({
      where: {
        OR: [
          { phone: senderNumber },
          { phone: `+${senderNumber}` },
          ...(phoneSuffix10 ? [{ phone: { endsWith: phoneSuffix10 } }] : []),
        ],
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!existingLead && phoneSuffix10 && last4) {
      const candidates = await prisma.inquiry.findMany({
        where: { phone: { contains: last4 } },
        orderBy: { updatedAt: "desc" },
        take: 50,
      });
      existingLead =
        candidates.find((c) => getPhoneSuffix10(c.phone || "") === phoneSuffix10) || null;
    }

    if (existingLead) {
      linkedInquiryId = existingLead.id;

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
          },
          performedBy: profileName ? `${profileName} (Client)` : "Client (WhatsApp)",
        },
      });

      await prisma.inquiry.update({
        where: { id: existingLead.id },
        data: { updatedAt: new Date() },
      });
    } else {
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
          },
          performedBy: profileName ? `${profileName} (Client)` : "Client (WhatsApp)",
        },
      });

      await logActivity(
        "CREATED",
        "Inquiry",
        `New lead captured from WhatsApp: ${newLead.name} (${senderNumber})`,
        newLead.id
      );
    }

    await prisma.whatsAppLog.create({
      data: {
        messageId: wamid,
        direction: "INBOUND",
        fromNumber: senderNumber,
        toNumber: normalizePhoneNumber(displayPhone) || displayPhone || "BUSINESS",
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

