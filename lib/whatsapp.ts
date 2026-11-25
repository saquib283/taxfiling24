import prisma from "@/lib/prisma";
import {
  WhatsAppConfig,
  SendWhatsAppParams,
  WhatsAppSendResult,
  normalizePhoneNumber,
} from "./whatsapp-shared";

export * from "./whatsapp-shared";

/**
 * Resolves Meta WhatsApp Cloud API credentials from environment variables or database settings.
 */
export async function getWhatsAppConfig(): Promise<WhatsAppConfig> {
  let phoneNumber =
    process.env.WHATSAPP_PHONE_NUMBER || process.env.PHONE_NUMBER || "";
  let phoneNumberId =
    process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.PHONE_NUMBER_ID || "";
  let wabaId =
    process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || process.env.MESSAGING_ACCOUNT_ID || "";
  let accessToken =
    process.env.WHATSAPP_ACCESS_TOKEN || process.env.ACCESS_TOKEN || "";
  let webhookVerifyToken =
    process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "";
  let appSecret = process.env.WHATSAPP_APP_SECRET || "";

  // Check database settings for override
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "WHATSAPP_PHONE_NUMBER",
            "WHATSAPP_PHONE_NUMBER_ID",
            "WHATSAPP_BUSINESS_ACCOUNT_ID",
            "WHATSAPP_ACCESS_TOKEN",
            "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
            "WHATSAPP_APP_SECRET",
          ],
        },
      },
    });

    for (const s of settings) {
      if (s.key === "WHATSAPP_PHONE_NUMBER" && s.value.trim()) phoneNumber = s.value.trim();
      if (s.key === "WHATSAPP_PHONE_NUMBER_ID" && s.value.trim()) phoneNumberId = s.value.trim();
      if (s.key === "WHATSAPP_BUSINESS_ACCOUNT_ID" && s.value.trim()) wabaId = s.value.trim();
      if (s.key === "WHATSAPP_ACCESS_TOKEN" && s.value.trim()) accessToken = s.value.trim();
      if (s.key === "WHATSAPP_WEBHOOK_VERIFY_TOKEN" && s.value.trim()) webhookVerifyToken = s.value.trim();
      if (s.key === "WHATSAPP_APP_SECRET" && s.value.trim()) appSecret = s.value.trim();
    }
  } catch {
    // Fall back to process.env
  }

  return {
    phoneNumber,
    phoneNumberId,
    wabaId,
    accessToken,
    webhookVerifyToken,
    appSecret,
    isConfigured: Boolean(phoneNumberId && accessToken),
  };
}

/**
 * Sends a message via Meta WhatsApp Cloud API.
 * Supports both freeform text and official approved templates.
 */
export async function sendWhatsAppMessage(
  params: SendWhatsAppParams
): Promise<WhatsAppSendResult> {
  const config = await getWhatsAppConfig();

  if (!config.isConfigured) {
    return {
      success: false,
      error: "Meta WhatsApp Cloud API is not configured. Missing Phone Number ID or Access Token.",
    };
  }

  const recipient = normalizePhoneNumber(params.to);
  if (!recipient) {
    return {
      success: false,
      error: `Invalid recipient phone number: "${params.to}".`,
    };
  }

  const url = `https://graph.facebook.com/v21.0/${encodeURIComponent(config.phoneNumberId)}/messages`;

  // Build payload (Template or Freeform text)
  let payload: Record<string, any>;

  if (params.templateName) {
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: "template",
      template: {
        name: params.templateName,
        language: {
          code: params.templateLanguage || "en_US",
        },
        ...(params.templateComponents ? { components: params.templateComponents } : {}),
      },
    };
  } else if (params.text) {
    payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: "text",
      text: {
        preview_url: false,
        body: params.text,
      },
    };
  } else {
    return {
      success: false,
      error: "Either message text or templateName is required to send a WhatsApp message.",
    };
  }

  const fromNormalized = normalizePhoneNumber(config.phoneNumber) || config.phoneNumber || "BUSINESS";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.error) {
      const errMsg = data.error?.message || `WhatsApp API returned HTTP ${res.status}`;
      const errCode = data.error?.code;

      let friendlyError = errMsg;
      if (errCode === 131030 || errCode === 131026) {
        friendlyError = `Meta Test Account: Recipient (+${recipient}) has not been added to your WhatsApp Test Numbers list in Meta App Dashboard.`;
      } else if (errCode === 131047 && !params.templateName) {
        friendlyError = "24-hour service window expired for this contact. A pre-approved template message must be used.";
      }

      // Record failed outbound attempt in WhatsAppLog
      await prisma.whatsAppLog.create({
        data: {
          direction: "OUTBOUND",
          fromNumber: fromNormalized,
          toNumber: recipient,
          messageType: params.templateName ? "template" : "text",
          content: params.text || `Template: ${params.templateName}`,
          status: "failed",
          errorCode: errCode ? String(errCode) : String(res.status),
          errorMessage: friendlyError,
          rawPayload: data,
          inquiryId: params.inquiryId || null,
          campaignId: params.campaignId || null,
        },
      }).catch((e) => console.warn("[WhatsAppLog] Failed log write error:", e));

      return {
        success: false,
        error: friendlyError,
        code: errCode,
      };
    }

    const messageId = data.messages?.[0]?.id;
    const waId = data.contacts?.[0]?.wa_id;

    // Record successful outbound in WhatsAppLog for complete audit history
    if (messageId) {
      await prisma.whatsAppLog.create({
        data: {
          messageId,
          direction: "OUTBOUND",
          fromNumber: fromNormalized,
          toNumber: recipient,
          messageType: params.templateName ? "template" : "text",
          content: params.text || `Template: ${params.templateName}`,
          status: "sent",
          rawPayload: data,
          inquiryId: params.inquiryId || null,
          campaignId: params.campaignId || null,
        },
      }).catch((e) => console.warn("[WhatsAppLog] Outbound log write error:", e));
    }

    return {
      success: true,
      messageId,
      waId,
    };
  } catch (err: any) {
    const errMsg =
      err?.name === "TimeoutError"
        ? "Timed out waiting for Meta WhatsApp Cloud API."
        : err?.message || "Failed to reach Meta WhatsApp Cloud API.";

    // Log network/timeout failures too so audits remain accurate
    await prisma.whatsAppLog.create({
      data: {
        direction: "OUTBOUND",
        fromNumber: fromNormalized,
        toNumber: recipient,
        messageType: params.templateName ? "template" : "text",
        content: params.text || `Template: ${params.templateName}`,
        status: "failed",
        errorCode: err?.name === "TimeoutError" ? "TIMEOUT" : "NETWORK_ERROR",
        errorMessage: errMsg,
        inquiryId: params.inquiryId || null,
        campaignId: params.campaignId || null,
      },
    }).catch(() => {});

    return {
      success: false,
      error: errMsg,
    };
  }
}
