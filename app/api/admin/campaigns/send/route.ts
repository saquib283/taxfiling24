import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";
import { logActivity } from "@/lib/activity-log";
import { requireAdmin } from "@/lib/auth";
import { sendWhatsAppMessage, normalizePhoneNumber } from "@/lib/whatsapp";
import {
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

async function sendViaWhatsApp(
  campaignId: string,
  recipients: Array<{ name: string | null; phone: string; company?: string | null }>,
  messageBody: string
): Promise<ProviderSendResult> {
  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const recipient of recipients) {
    try {
      const personalizedText = messageBody
        .replace(/\{\{\s*name\s*\}\}/gi, recipient.name || "Valued Client")
        .replace(/\{\{\s*company\s*\}\}/gi, recipient.company || "");

      const res = await sendWhatsAppMessage({
        to: recipient.phone,
        text: personalizedText,
      });

      if (res.success) {
        sentCount++;
        if (campaignId && campaignId !== "test-campaign") {
          await prisma.campaignEvent.create({
            data: {
              campaignId,
              provider: "WHATSAPP",
              eventType: "DELIVERED",
              providerEventId: res.messageId || null,
              recipientEmail: recipient.phone,
              payload: { phone: recipient.phone, name: recipient.name },
            },
          }).catch(() => {});
        }
      } else {
        failedCount++;
        errors.push(`Failed for ${recipient.phone}: ${res.error}`);
        if (campaignId && campaignId !== "test-campaign") {
          await prisma.campaignEvent.create({
            data: {
              campaignId,
              provider: "WHATSAPP",
              eventType: "FAILED",
              recipientEmail: recipient.phone,
              payload: { error: res.error, code: res.code },
            },
          }).catch(() => {});
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 80));
    } catch (err: any) {
      failedCount++;
      errors.push(err.message || "WhatsApp send exception");
    }
  }

  return { errors, externalId: null, failedCount, sentCount };
}

type ProviderConfig = ReturnType<typeof resolveEmailProviderConfig>;

function getFromHeader(fromName: string, fromEmail: string) {
  return fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;
}

async function sendViaSmtp(
  config: ProviderConfig,
  recipients: string[],
  subject: string,
  html: string
): Promise<ProviderSendResult> {
  const port = Number.parseInt(config.smtpPort, 10);

  if (!Number.isFinite(port)) {
    throw new Error("SMTP port is missing or invalid.");
  }

  const transporter = nodemailer.createTransport({
    auth: {
      pass: config.smtpPass,
      user: config.smtpUser,
    },
    host: config.smtpHost,
    port,
    secure: port === 465,
  });

  const chunks = chunkValues(recipients, 100);
  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const chunk of chunks) {
    try {
      await transporter.sendMail({
        bcc: chunk,
        from: getFromHeader(config.fromName, config.fromEmail || config.smtpUser),
        html,
        replyTo: config.replyTo || undefined,
        subject,
        to: config.fromEmail || config.smtpUser,
      });
      sentCount += chunk.length;
    } catch (error) {
      failedCount += chunk.length;
      errors.push(error instanceof Error ? error.message : "SMTP send failed.");
    }
  }

  return { errors, externalId: null, failedCount, sentCount };
}

async function sendViaResend(
  campaignId: string,
  config: ProviderConfig,
  recipients: string[],
  subject: string,
  html: string
): Promise<ProviderSendResult> {
  const chunks = chunkValues(recipients, 50);
  let sentCount = 0;
  let failedCount = 0;
  let externalId: string | null = null;
  const errors: string[] = [];

  for (const chunk of chunks) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        body: JSON.stringify({
          bcc: chunk,
          from: getFromHeader(config.fromName, config.fromEmail),
          html,
          reply_to: config.replyTo || undefined,
          subject,
          tags: [{ name: "campaign_id", value: campaignId }],
          to: [config.fromEmail],
        }),
        headers: {
          Authorization: `Bearer ${config.resendApiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const data = (await response.json()) as { error?: { message?: string }; id?: string };

      if (!response.ok) {
        throw new Error(data.error?.message || "Resend rejected the request.");
      }

      externalId = externalId || data.id || null;
      sentCount += chunk.length;
    } catch (error) {
      failedCount += chunk.length;
      errors.push(error instanceof Error ? error.message : "Resend send failed.");
    }
  }

  return { errors, externalId, failedCount, sentCount };
}

async function sendViaMailgun(
  campaignId: string,
  config: ProviderConfig,
  recipients: string[],
  subject: string,
  html: string
): Promise<ProviderSendResult> {
  const apiHost =
    config.mailgunRegion === "EU" ? "api.eu.mailgun.net" : "api.mailgun.net";
  const endpoint = `https://${apiHost}/v3/${config.mailgunDomain}/messages`;
  const chunks = chunkValues(recipients, 200);
  const auth = Buffer.from(`api:${config.mailgunApiKey}`).toString("base64");
  let sentCount = 0;
  let failedCount = 0;
  let externalId: string | null = null;
  const errors: string[] = [];

  for (const chunk of chunks) {
    const formData = new FormData();
    formData.set("from", getFromHeader(config.fromName, config.fromEmail));
    formData.set("to", config.fromEmail);
    chunk.forEach((email) => formData.append("bcc", email));
    formData.set("subject", subject);
    formData.set("html", html);
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
      });

      const data = (await response.json()) as {
        id?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data.message || "Mailgun rejected the request.");
      }

      externalId = externalId || data.id || null;
      sentCount += chunk.length;
    } catch (error) {
      failedCount += chunk.length;
      errors.push(error instanceof Error ? error.message : "Mailgun send failed.");
    }
  }

  return { errors, externalId, failedCount, sentCount };
}

async function sendCampaign(
  campaignId: string,
  provider: EmailProvider,
  config: ProviderConfig,
  recipients: string[],
  subject: string,
  html: string
) {
  switch (provider) {
    case "RESEND":
      return sendViaResend(campaignId, config, recipients, subject, html);
    case "MAILGUN":
      return sendViaMailgun(campaignId, config, recipients, subject, html);
    case "SMTP":
    default:
      return sendViaSmtp(config, recipients, subject, html);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let activeCampaignId: string | null = null;

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

    // Handle WhatsApp Campaign Dispatch
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
          payload.id || undefined
        );

        return NextResponse.json({
          isTest: true,
          provider: "WHATSAPP",
          recipient: normalized,
          success: true,
        });
      }

      // Production WhatsApp broadcast
      const audienceFilter: any = { isActive: true, phone: { not: null } };
      const requestedAudience = (payload.audience || "ALL_ACTIVE").trim();

      if (requestedAudience === "NEWSLETTER") {
        audienceFilter.source = "NEWSLETTER";
      } else if (requestedAudience === "INQUIRY") {
        audienceFilter.source = "INQUIRY";
      } else if (requestedAudience === "APPOINTMENT") {
        audienceFilter.source = "APPOINTMENT";
      } else if (requestedAudience === "CSV_IMPORT" || requestedAudience === "IMPORTED") {
        audienceFilter.source = "CSV_IMPORT";
      }

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
        }));

      if (phoneRecipients.length === 0) {
        return NextResponse.json(
          { error: `No contacts with valid phone numbers found for selected audience (${requestedAudience}).` },
          { status: 400 }
        );
      }

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

      const campaign = payload.id
        ? await prisma.campaign.update({
            where: { id: payload.id },
            data: draftData,
          })
        : await prisma.campaign.create({
            data: draftData,
          });

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

      const updatedCampaign = await prisma.campaign.update({
        where: { id: campaign.id },
        data: {
          deliveredCount: result.sentCount,
          failedCount: result.failedCount,
          sentAt: result.sentCount > 0 ? new Date() : null,
          sentCount: result.sentCount,
          status: finalStatus,
        },
      });

      await logActivity(
        "SENT",
        "Campaign",
        `Broadcasted WhatsApp campaign "${campaign.subject}" to ${result.sentCount} recipients.`,
        campaign.id
      );

      return NextResponse.json({
        campaign: updatedCampaign,
        errors: result.errors,
        recipientCount: phoneRecipients.length,
        sentCount: result.sentCount,
        failedCount: result.failedCount,
        status: finalStatus,
        success: result.sentCount > 0,
      });
    }

    // Build audience filter criteria
    const audienceFilter: any = { isActive: true };
    const requestedAudience = (payload.audience || "ALL_ACTIVE").trim();

    if (requestedAudience === "NEWSLETTER") {
      audienceFilter.source = "NEWSLETTER";
    } else if (requestedAudience === "INQUIRY") {
      audienceFilter.source = "INQUIRY";
    } else if (requestedAudience === "APPOINTMENT") {
      audienceFilter.source = "APPOINTMENT";
    } else if (requestedAudience === "CSV_IMPORT" || requestedAudience === "IMPORTED") {
      audienceFilter.source = "CSV_IMPORT";
    }

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

    // Apply tag-based audience filter if requested (e.g. TAG:GST)
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
    const config = {
      ...baseConfig,
      fromEmail: payload.fromEmail?.trim() || baseConfig.fromEmail,
      fromName: payload.fromName?.trim() || baseConfig.fromName,
      replyTo: payload.replyTo?.trim() || baseConfig.replyTo,
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
    const content = payload.content.trim();
    const preheader = payload.preheader?.trim() || null;
    const recipients = isTestSend
      ? [testRecipient as string]
      : subscribers.map((subscriber) => subscriber.email);

    const html = wrapEmailHtml({
      baseUrl,
      content,
      fromName: config.fromName,
      preheader,
      subject,
    });

    // If it's a test send, dispatch directly without altering production campaign status
    if (isTestSend) {
      const testResult = await sendCampaign(
        payload.id || "test-campaign",
        provider,
        config,
        recipients,
        subject,
        html
      );

      if (testResult.sentCount === 0) {
        return NextResponse.json(
          {
            error: testResult.errors[0] || "Failed to deliver test email.",
            errors: testResult.errors,
          },
          { status: 500 }
        );
      }

      await logActivity(
        "SENT",
        "Campaign",
        `Sent test email for "${payload.subject.trim()}" to ${testRecipient}`,
        payload.id || undefined
      );

      return NextResponse.json({
        errors: testResult.errors,
        isTest: true,
        provider,
        recipient: testRecipient,
        success: true,
      });
    }

    // Production broadcast
    const draftData = {
      audience: payload.audience || "ALL_ACTIVE",
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

    const campaign = payload.id
      ? await prisma.campaign.update({
          where: { id: payload.id },
          data: draftData,
        })
      : await prisma.campaign.create({
          data: draftData,
        });

    activeCampaignId = campaign.id;

    const result = await sendCampaign(
      campaign.id,
      provider,
      config,
      recipients,
      subject,
      html
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
      `Sent ${subject} via ${getProviderLabel(provider)} to ${result.sentCount} of ${recipients.length} subscribers`,
      updatedCampaign.id
    );

    return NextResponse.json({
      campaign: updatedCampaign,
      errors: result.errors,
      failedCount: result.failedCount,
      provider,
      success: result.sentCount > 0,
    });
  } catch (error) {
    console.error("Failed to send campaign", error);

    // If campaign was transitioned into SENDING, mark it as FAILED to prevent hanging state
    if (activeCampaignId) {
      try {
        await prisma.campaign.update({
          where: { id: activeCampaignId },
          data: {
            failedCount: 1,
            status: "FAILED",
          },
        });
      } catch (recoveryError) {
        console.error("Failed to update failed campaign state", recoveryError);
      }
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send campaign",
      },
      { status: 500 }
    );
  }
}
