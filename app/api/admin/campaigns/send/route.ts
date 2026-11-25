import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";
import { logActivity } from "@/lib/activity-log";
import { requireRole } from "@/lib/auth";
import { sendWhatsAppMessage, normalizePhoneNumber } from "@/lib/whatsapp";
import { isBlockedInternalHost } from "@/lib/email-delivery";
import { sanitizeHtml } from "@/lib/sanitize-html";
import {
  buildUnsubscribeUrl,
  chunkValues,
  EMAIL_SETTING_KEYS,
  getBaseUrl,
  getProviderLabel,
  getProviderStatuses,
  normalizeEmailProvider,
  resolveEmailProviderConfig,
  settingsToMap,
  wrapEmailHtml,
  type EmailProvider,
} from "@/lib/email-campaigns";

type SendPayload = {
  audience?: string;
  channel?: "EMAIL" | "WHATSAPP";
  content?: string;
  fromEmail?: string;
  fromName?: string;
  id?: string;
  name?: string;
  preheader?: string;
  provider?: string;
  replyTo?: string;
  subject?: string;
  templateId?: string | null;
  testRecipient?: string;
};

type ProviderSendResult = {
  errors: string[];
  externalId: string | null;
  failedCount: number;
  sentCount: number;
};

type ProviderConfig = ReturnType<typeof resolveEmailProviderConfig>;

function getFromHeader(fromName: string, fromEmail: string) {
  const safeName = fromName.replace(/["\r\n]/g, "").trim();
  return safeName ? `"${safeName}" <${fromEmail}>` : fromEmail;
}

function buildAudienceWhere(requestedAudience: string, requirePhone: boolean) {
  const audienceFilter: Record<string, any> = { isActive: true };
  if (requirePhone) {
    audienceFilter.phone = { not: null };
  }

  if (requestedAudience === "NEWSLETTER") {
    audienceFilter.source = "NEWSLETTER";
  } else if (requestedAudience === "INQUIRY") {
    audienceFilter.source = "INQUIRY";
  } else if (requestedAudience === "APPOINTMENT") {
    audienceFilter.source = "APPOINTMENT";
  } else if (requestedAudience === "CSV_IMPORT" || requestedAudience === "IMPORTED") {
    audienceFilter.source = "CSV_IMPORT";
  } else if (requestedAudience === "MANUAL") {
    audienceFilter.source = "MANUAL";
  }

  return audienceFilter;
}

async function sendViaWhatsApp(
  campaignId: string,
  recipients: Array<{
    name: string | null;
    phone: string;
    company?: string | null;
    service?: string | null;
  }>,
  messageBody: string
): Promise<ProviderSendResult> {
  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    try {
      const personalizedText = messageBody
        .replace(/\{\{\s*name\s*\}\}/gi, recipient.name || "Valued Client")
        .replace(/\{\{\s*company\s*\}\}/gi, recipient.company || "")
        .replace(/\{\{\s*service\s*\}\}/gi, recipient.service || "our advisory services");

      const res = await sendWhatsAppMessage({
        to: recipient.phone,
        text: personalizedText,
        campaignId: campaignId && campaignId !== "test-campaign" ? campaignId : undefined,
      });

      if (res.success) {
        sentCount++;
        if (campaignId && campaignId !== "test-campaign") {
          await prisma.campaignEvent
            .create({
              data: {
                campaignId,
                provider: "WHATSAPP",
                eventType: "SENT",
                providerEventId: res.messageId || null,
                recipientEmail: recipient.phone,
                payload: { phone: recipient.phone, name: recipient.name },
              },
            })
            .catch(() => {});
        }
      } else {
        failedCount++;
        errors.push(`Failed for ${recipient.phone}: ${res.error}`);
        if (campaignId && campaignId !== "test-campaign") {
          await prisma.campaignEvent
            .create({
              data: {
                campaignId,
                provider: "WHATSAPP",
                eventType: "FAILED",
                recipientEmail: recipient.phone,
                payload: { error: res.error, code: res.code },
              },
            })
            .catch(() => {});
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 80));
    } catch (err: any) {
      failedCount++;
      errors.push(err?.message || "WhatsApp send exception");
    }
  }

  return { errors, externalId: null, failedCount, sentCount };
}

interface EmailContentContext {
  baseUrl: string;
  content: string;
  preheader: string | null;
  subject: string;
}

async function sendViaSmtp(
  config: ProviderConfig,
  recipients: string[],
  emailCtx: EmailContentContext
): Promise<ProviderSendResult> {
  const port = Number.parseInt(config.smtpPort, 10);

  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error("SMTP port is missing or invalid.");
  }

  if (isBlockedInternalHost(config.smtpHost)) {
    throw new Error("SMTP host cannot target a private or loopback network address.");
  }

  const transporter = nodemailer.createTransport({
    auth: {
      pass: config.smtpPass,
      user: config.smtpUser,
    },
    host: config.smtpHost,
    port,
    secure: port === 465,
    pool: true,
    maxConnections: 5,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });

  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];
  const from = getFromHeader(config.fromName, config.fromEmail || config.smtpUser);

  try {
    const batches = chunkValues(recipients, 5);
    for (const batch of batches) {
      await Promise.all(
        batch.map(async (recipientEmail) => {
          try {
            const unsubUrl = buildUnsubscribeUrl(recipientEmail, emailCtx.baseUrl);
            const html = wrapEmailHtml({
              baseUrl: emailCtx.baseUrl,
              content: emailCtx.content,
              fromName: config.fromName,
              preheader: emailCtx.preheader,
              recipientEmail,
              subject: emailCtx.subject,
            });

            await transporter.sendMail({
              from,
              to: recipientEmail,
              replyTo: config.replyTo || undefined,
              subject: emailCtx.subject,
              html,
              headers: {
                "List-Unsubscribe": `<${unsubUrl}>`,
              },
            });
            sentCount++;
          } catch (error) {
            failedCount++;
            console.error(`SMTP campaign delivery failed for ${recipientEmail}:`, error);
            errors.push(`${recipientEmail}: SMTP delivery failed.`);
          }
        })
      );
    }
  } finally {
    transporter.close();
  }

  return { errors, externalId: null, failedCount, sentCount };
}

async function sendViaResend(
  campaignId: string,
  config: ProviderConfig,
  recipients: string[],
  emailCtx: EmailContentContext
): Promise<ProviderSendResult> {
  // Resend Batch API accepts up to 100 individual messages per request (fixes 50-recipient BCC 422
  // limit AND gives every recipient a unique signed unsubscribe link & accurate webhook tracking)
  const chunks = chunkValues(recipients, 100);
  let sentCount = 0;
  let failedCount = 0;
  let externalId: string | null = null;
  const errors: string[] = [];
  const from = getFromHeader(config.fromName, config.fromEmail);

  for (const chunk of chunks) {
    try {
      if (chunk.length === 1) {
        const recipientEmail = chunk[0];
        const unsubUrl = buildUnsubscribeUrl(recipientEmail, emailCtx.baseUrl);
        const html = wrapEmailHtml({
          baseUrl: emailCtx.baseUrl,
          content: emailCtx.content,
          fromName: config.fromName,
          preheader: emailCtx.preheader,
          recipientEmail,
          subject: emailCtx.subject,
        });

        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [recipientEmail],
            reply_to: config.replyTo || undefined,
            subject: emailCtx.subject,
            html,
            headers: { "List-Unsubscribe": `<${unsubUrl}>` },
            tags: [{ name: "campaign_id", value: campaignId }],
          }),
          signal: AbortSignal.timeout(20000),
        });

        const data = (await response.json().catch(() => ({}))) as {
          error?: { message?: string };
          message?: string;
          id?: string;
        };

        if (!response.ok) {
          throw new Error(data.error?.message || data.message || `Resend HTTP ${response.status}`);
        }

        externalId = externalId || data.id || null;
        sentCount += 1;
      } else {
        const batchPayload = chunk.map((recipientEmail) => {
          const unsubUrl = buildUnsubscribeUrl(recipientEmail, emailCtx.baseUrl);
          return {
            from,
            to: [recipientEmail],
            reply_to: config.replyTo || undefined,
            subject: emailCtx.subject,
            html: wrapEmailHtml({
              baseUrl: emailCtx.baseUrl,
              content: emailCtx.content,
              fromName: config.fromName,
              preheader: emailCtx.preheader,
              recipientEmail,
              subject: emailCtx.subject,
            }),
            headers: { "List-Unsubscribe": `<${unsubUrl}>` },
            tags: [{ name: "campaign_id", value: campaignId }],
          };
        });

        const response = await fetch("https://api.resend.com/emails/batch", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(batchPayload),
          signal: AbortSignal.timeout(25000),
        });

        const data = (await response.json().catch(() => ({}))) as {
          data?: Array<{ id?: string }>;
          error?: { message?: string };
          message?: string;
        };

        if (!response.ok) {
          throw new Error(data.error?.message || data.message || `Resend batch HTTP ${response.status}`);
        }

        externalId = externalId || data.data?.[0]?.id || null;
        sentCount += chunk.length;
      }
    } catch (error) {
      failedCount += chunk.length;
      console.error("Resend campaign chunk failed:", error);
      errors.push("Resend delivery failed for recipient batch.");
    }
  }

  return { errors, externalId, failedCount, sentCount };
}

async function sendViaMailgun(
  campaignId: string,
  config: ProviderConfig,
  recipients: string[],
  emailCtx: EmailContentContext
): Promise<ProviderSendResult> {
  const cleanDomain = (config.mailgunDomain || "").trim();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(cleanDomain)) {
    throw new Error("Configured Mailgun domain is invalid.");
  }
  const apiHost =
    config.mailgunRegion === "EU" ? "api.eu.mailgun.net" : "api.mailgun.net";
  const endpoint = `https://${apiHost}/v3/${encodeURIComponent(cleanDomain)}/messages`;
  const auth = Buffer.from(`api:${config.mailgunApiKey}`).toString("base64");
  const from = getFromHeader(config.fromName, config.fromEmail);

  let sentCount = 0;
  let failedCount = 0;
  let externalId: string | null = null;
  const errors: string[] = [];

  // Send individualized messages with bounded concurrency so every recipient gets their signed unsubscribe link
  const batches = chunkValues(recipients, 10);
  for (const batch of batches) {
    await Promise.all(
      batch.map(async (recipientEmail) => {
        const unsubUrl = buildUnsubscribeUrl(recipientEmail, emailCtx.baseUrl);
        const html = wrapEmailHtml({
          baseUrl: emailCtx.baseUrl,
          content: emailCtx.content,
          fromName: config.fromName,
          preheader: emailCtx.preheader,
          recipientEmail,
          subject: emailCtx.subject,
        });

        const formData = new FormData();
        formData.set("from", from);
        formData.set("to", recipientEmail);
        formData.set("subject", emailCtx.subject);
        formData.set("html", html);
        formData.set("h:List-Unsubscribe", `<${unsubUrl}>`);
        formData.set("o:tracking", "yes");
        formData.set("o:tracking-clicks", "yes");
        formData.set("o:tracking-opens", "yes");
        formData.set("v:campaign_id", campaignId);

        if (config.replyTo) {
          formData.set("h:Reply-To", config.replyTo);
        }

        try {
          const response = await fetch(endpoint, {
            body: formData,
            headers: {
              Authorization: `Basic ${auth}`,
            },
            method: "POST",
            signal: AbortSignal.timeout(20000),
          });

          const data = (await response.json().catch(() => ({}))) as {
            id?: string;
            message?: string;
          };

          if (!response.ok) {
            throw new Error(data.message || `Mailgun HTTP ${response.status}`);
          }

          externalId = externalId || data.id || null;
          sentCount += 1;
        } catch (error) {
          failedCount += 1;
          console.error(`Mailgun campaign delivery failed for ${recipientEmail}:`, error);
          errors.push(`${recipientEmail}: Mailgun delivery failed.`);
        }
      })
    );
  }

  return { errors, externalId, failedCount, sentCount };
}

async function sendCampaign(
  campaignId: string,
  provider: EmailProvider,
  config: ProviderConfig,
  recipients: string[],
  emailCtx: EmailContentContext
) {
  switch (provider) {
    case "RESEND":
      return sendViaResend(campaignId, config, recipients, emailCtx);
    case "MAILGUN":
      return sendViaMailgun(campaignId, config, recipients, emailCtx);
    case "SMTP":
    default:
      return sendViaSmtp(config, recipients, emailCtx);
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  let activeCampaignId: string | null = null;
  let targetRecipientCount = 1;

  try {
    const payload = (await request.json()) as SendPayload;

    if (!payload.subject?.trim() || !payload.content?.trim()) {
      return NextResponse.json(
        { error: "Subject and content are required." },
        { status: 400 }
      );
    }

    const isWhatsApp = payload.channel === "WHATSAPP" || payload.provider === "WHATSAPP";
    const isTestSend = Boolean(payload.testRecipient?.trim());
    const testRecipient = payload.testRecipient?.trim();

    if (isTestSend && testRecipient) {
      if (isWhatsApp) {
        const normalized = normalizePhoneNumber(testRecipient);
        if (!normalized) {
          return NextResponse.json(
            { error: "Please provide a valid test phone number." },
            { status: 400 }
          );
        }
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(testRecipient.toLowerCase())) {
          return NextResponse.json(
            { error: "Please provide a valid test recipient email address." },
            { status: 400 }
          );
        }
      }
    }

    // ── Handle WhatsApp Campaign Dispatch ────────────────────────────
    if (isWhatsApp) {
      if (isTestSend && testRecipient) {
        const normalized = normalizePhoneNumber(testRecipient);
        const res = await sendWhatsAppMessage({
          to: normalized,
          text: payload.content.trim(),
        });

        if (!res.success) {
          return NextResponse.json(
            { error: res.error || "Failed to dispatch test WhatsApp message." },
            { status: 400 }
          );
        }

        await logActivity(
          "SENT",
          "Campaign",
          `Sent test WhatsApp message for "${payload.subject.trim()}" to ${normalized}`,
          payload.id || undefined,
          auth.user.userId
        );

        return NextResponse.json({
          isTest: true,
          provider: "WHATSAPP",
          recipient: normalized,
          success: true,
        });
      }

      const requestedAudience = (payload.audience || "ALL_ACTIVE").trim();
      const audienceFilter = buildAudienceWhere(requestedAudience, true);

      let rawSubscribers = await prisma.subscriber.findMany({
        where: audienceFilter,
        orderBy: { createdAt: "desc" },
      });

      if (requestedAudience.startsWith("TAG:")) {
        const targetTag = requestedAudience.replace(/^TAG:/, "").trim();
        rawSubscribers = rawSubscribers.filter((s) => {
          if (!s.tags || !Array.isArray(s.tags)) return false;
          return (s.tags as string[]).includes(targetTag);
        });
      }

      const phoneRecipients = rawSubscribers
        .filter((s) => s.phone && normalizePhoneNumber(s.phone))
        .map((s) => ({
          name: s.name,
          phone: normalizePhoneNumber(s.phone!),
          company: s.company,
          service: Array.isArray(s.tags) && s.tags.length > 0 ? String(s.tags[0]) : null,
        }));

      if (phoneRecipients.length === 0) {
        return NextResponse.json(
          {
            error: `No contacts with valid phone numbers found for selected audience (${requestedAudience}).`,
          },
          { status: 400 }
        );
      }

      targetRecipientCount = phoneRecipients.length;

      const draftData = {
        audience: requestedAudience,
        bouncedCount: 0,
        clickedCount: 0,
        complaintCount: 0,
        content: payload.content.trim(),
        deliveredCount: 0,
        externalId: null,
        failedCount: 0,
        fromEmail: "WHATSAPP",
        fromName: "TaxFiling24 WhatsApp",
        lastEventAt: null,
        name: payload.name?.trim() || payload.subject.trim(),
        openedCount: 0,
        preheader: null,
        provider: "WHATSAPP",
        readCount: 0,
        recipientCount: phoneRecipients.length,
        replyTo: null,
        sentCount: 0,
        sentAt: null,
        status: "SENDING",
        subject: payload.subject.trim(),
        templateId: payload.templateId || null,
        unsubscribedCount: 0,
      };

      let campaign;
      if (payload.id) {
        // Atomic DRAFT -> SENDING lock prevents double-send or overwriting SENT history
        const lock = await prisma.campaign.updateMany({
          where: { id: payload.id, status: "DRAFT" },
          data: draftData,
        });
        if (lock.count === 0) {
          return NextResponse.json(
            {
              error:
                "This campaign has already been dispatched or is currently sending. Duplicate it as a new draft to send again.",
            },
            { status: 409 }
          );
        }
        campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: payload.id } });
      } else {
        campaign = await prisma.campaign.create({ data: draftData });
      }

      activeCampaignId = campaign.id;

      const result = await sendViaWhatsApp(
        campaign.id,
        phoneRecipients,
        payload.content.trim()
      );

      const finalStatus =
        result.sentCount === phoneRecipients.length
          ? "SENT"
          : result.sentCount > 0
          ? "PARTIAL_FAILURE"
          : "FAILED";

      // Do NOT set deliveredCount on API accept — Meta webhook updates deliveredCount & readCount
      const updatedCampaign = await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          failedCount: result.failedCount,
          sentAt: result.sentCount > 0 ? new Date() : null,
          sentCount: result.sentCount,
          status: finalStatus,
        },
      });

      await logActivity(
        "SENT",
        "Campaign",
        `Broadcasted WhatsApp campaign "${campaign.subject}" to ${result.sentCount}/${phoneRecipients.length} recipients.`,
        campaign.id,
        auth.user.userId
      );

      if (result.sentCount === 0) {
        return NextResponse.json(
          {
            campaign: updatedCampaign,
            error: result.errors[0] || "All WhatsApp deliveries failed.",
            errors: result.errors,
            recipientCount: phoneRecipients.length,
            sentCount: 0,
            failedCount: result.failedCount,
            status: finalStatus,
            success: false,
          },
          { status: 502 }
        );
      }

      return NextResponse.json({
        campaign: updatedCampaign,
        errors: result.errors,
        recipientCount: phoneRecipients.length,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        status: finalStatus,
        success: true,
      });
    }

    // ── Handle Email Campaign Dispatch ───────────────────────────────
    const requestedAudience = (payload.audience || "ALL_ACTIVE").trim();
    const audienceFilter = buildAudienceWhere(requestedAudience, false);

    const [settings, rawSubscribers] = await Promise.all([
      prisma.setting.findMany({
        where: {
          key: { in: [...EMAIL_SETTING_KEYS] },
        },
        select: {
          key: true,
          value: true,
        },
      }),
      isTestSend
        ? Promise.resolve([])
        : prisma.subscriber.findMany({
            where: audienceFilter,
            orderBy: { createdAt: "desc" },
          }),
    ]);

    let subscribers = rawSubscribers;
    if (!isTestSend && requestedAudience.startsWith("TAG:")) {
      const targetTag = requestedAudience.replace(/^TAG:/, "").trim();
      subscribers = rawSubscribers.filter((s) => {
        if (!s.tags || !Array.isArray(s.tags)) return false;
        return (s.tags as string[]).includes(targetTag);
      });
    }

    if (!isTestSend && subscribers.length === 0) {
      return NextResponse.json(
        { error: `No active contacts found for selected audience (${requestedAudience}).` },
        { status: 400 }
      );
    }

    const baseConfig = resolveEmailProviderConfig(settingsToMap(settings));
    const provider = normalizeEmailProvider(
      payload.provider || baseConfig.selectedProvider
    );
    const isAdmin = auth.user.role === "ADMIN";
    const config = {
      ...baseConfig,
      fromEmail: (isAdmin ? payload.fromEmail?.trim() : "") || baseConfig.fromEmail,
      fromName: payload.fromName?.trim() || baseConfig.fromName,
      replyTo: (isAdmin ? payload.replyTo?.trim() : "") || baseConfig.replyTo,
      selectedProvider: provider,
    };
    const providerStatuses = getProviderStatuses(config);

    if (!providerStatuses[provider]) {
      return NextResponse.json(
        {
          error: `${getProviderLabel(
            provider
          )} is not fully configured yet. Complete the provider setup first.`,
        },
        { status: 400 }
      );
    }

    if (!config.fromEmail) {
      return NextResponse.json(
        { error: "A sender email address is required before sending." },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl(request);
    const subject = isTestSend
      ? `[TEST] ${payload.subject.trim()}`
      : payload.subject.trim();
    const content = sanitizeHtml(payload.content.trim());
    const preheader = payload.preheader?.trim() || null;
    const recipients = isTestSend
      ? [testRecipient as string]
      : subscribers.map((subscriber) => subscriber.email);

    const emailCtx: EmailContentContext = {
      baseUrl,
      content,
      preheader,
      subject,
    };

    if (isTestSend) {
      const testResult = await sendCampaign(
        payload.id || "test-campaign",
        provider,
        config,
        recipients,
        emailCtx
      );

      if (testResult.sentCount === 0) {
        return NextResponse.json(
          {
            error: testResult.errors[0] || "Failed to deliver test email.",
            errors: testResult.errors,
          },
          { status: 502 }
        );
      }

      await logActivity(
        "SENT",
        "Campaign",
        `Sent test email for "${payload.subject.trim()}" to ${testRecipient}`,
        payload.id || undefined,
        auth.user.userId
      );

      return NextResponse.json({
        errors: testResult.errors,
        isTest: true,
        provider,
        recipient: testRecipient,
        success: true,
      });
    }

    targetRecipientCount = recipients.length;

    const draftData = {
      audience: requestedAudience,
      bouncedCount: 0,
      clickedCount: 0,
      complaintCount: 0,
      content,
      deliveredCount: 0,
      externalId: null,
      failedCount: 0,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
      lastEventAt: null,
      name: payload.name?.trim() || subject,
      openedCount: 0,
      preheader,
      provider,
      readCount: 0,
      recipientCount: recipients.length,
      replyTo: config.replyTo || null,
      sentCount: 0,
      sentAt: null,
      status: "SENDING",
      subject,
      templateId: payload.templateId || null,
      unsubscribedCount: 0,
    };

    let campaign;
    if (payload.id) {
      const lock = await prisma.campaign.updateMany({
        where: { id: payload.id, status: "DRAFT" },
        data: draftData,
      });
      if (lock.count === 0) {
        return NextResponse.json(
          {
            error:
              "This campaign has already been dispatched or is currently sending. Duplicate it as a new draft to send again.",
          },
          { status: 409 }
        );
      }
      campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: payload.id } });
    } else {
      campaign = await prisma.campaign.create({ data: draftData });
    }

    activeCampaignId = campaign.id;

    const result = await sendCampaign(
      campaign.id,
      provider,
      config,
      recipients,
      emailCtx
    );

    const finalStatus =
      result.sentCount === recipients.length
        ? "SENT"
        : result.sentCount > 0
        ? "PARTIAL_FAILURE"
        : "FAILED";

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        externalId: result.externalId,
        failedCount: result.failedCount,
        sentAt: result.sentCount > 0 ? new Date() : null,
        sentCount: result.sentCount,
        status: finalStatus,
      },
    });

    await logActivity(
      "SENT",
      "Campaign",
      `Sent "${subject}" via ${getProviderLabel(provider)} to ${result.sentCount} of ${recipients.length} subscribers`,
      updatedCampaign.id,
      auth.user.userId
    );

    if (result.sentCount === 0) {
      return NextResponse.json(
        {
          campaign: updatedCampaign,
          error: result.errors[0] || "All email deliveries failed.",
          errors: result.errors,
          failedCount: result.failedCount,
          provider,
          success: false,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      campaign: updatedCampaign,
      errors: result.errors,
      failedCount: result.failedCount,
      provider,
      success: true,
    });
  } catch (error) {
    console.error("Failed to send campaign", error);

    if (activeCampaignId) {
      try {
        await prisma.campaign.update({
          where: { id: activeCampaignId },
          data: {
            failedCount: targetRecipientCount,
            status: "FAILED",
          },
        });
      } catch (recoveryError) {
        console.error("Failed to update failed campaign state", recoveryError);
      }
    }

    return NextResponse.json(
      {
        error: "Failed to send campaign. Please check provider configuration and try again.",
      },
      { status: 500 }
    );
  }
}
