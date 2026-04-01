import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";
import { logActivity } from "@/lib/activity-log";
import {
  chunkValues,
  EMAIL_SETTING_KEYS,
  getProviderLabel,
  getProviderStatuses,
  normalizeEmailProvider,
  resolveEmailProviderConfig,
  settingsToMap,
  withPreheader,
  type EmailProvider,
} from "@/lib/email-campaigns";

type SendPayload = {
  audience?: string;
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
};

type ProviderSendResult = {
  errors: string[];
  externalId: string | null;
  failedCount: number;
  sentCount: number;
};

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
  try {
    const payload = (await request.json()) as SendPayload;

    if (!payload.subject?.trim() || !payload.content?.trim()) {
      return NextResponse.json(
        { error: "Subject and content are required." },
        { status: 400 }
      );
    }

    const [settings, subscribers] = await Promise.all([
      prisma.setting.findMany({
        where: {
          key: { in: [...EMAIL_SETTING_KEYS] },
        },
        select: {
          key: true,
          value: true,
        },
      }),
      prisma.subscriber.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: "No active subscribers are available for this campaign." },
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

    const subject = payload.subject.trim();
    const content = payload.content.trim();
    const preheader = payload.preheader?.trim() || null;
    const recipients = subscribers.map((subscriber) => subscriber.email);
    const html = withPreheader(content, preheader);

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
        : "PARTIAL_FAILURE";

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
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send campaign",
      },
      { status: 500 }
    );
  }
}
