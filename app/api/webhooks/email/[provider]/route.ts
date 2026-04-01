import crypto from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  mapMailgunEventToMetrics,
  mapResendEventToMetrics,
  normalizeEmailProvider,
  resolveEmailProviderConfig,
  settingsToMap,
  shouldSuppressSubscriber,
  type CampaignMetricUpdate,
  type EmailProvider,
} from "@/lib/email-campaigns";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" ? (value as JsonRecord) : undefined;
}

function buildIncrementData(metrics: CampaignMetricUpdate) {
  return Object.entries(metrics).reduce<
    Record<string, { increment: number }>
  >((acc, [key, value]) => {
    if (typeof value === "number" && value > 0) {
      acc[key] = { increment: value };
    }
    return acc;
  }, {});
}

function safeDate(value: string | number | null | undefined): Date {
  if (typeof value === "number") {
    return new Date(value * 1000);
  }

  if (typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date;
    }
  }

  return new Date();
}

function getResendCampaignId(payload: JsonRecord): string | undefined {
  const data = asRecord(payload.data);
  const tags = data?.tags;

  if (Array.isArray(tags)) {
    const match = tags.find((tag) => {
      const record = asRecord(tag);
      return record?.name === "campaign_id";
    });
    const record = asRecord(match);
    return typeof record?.value === "string" ? record.value : undefined;
  }

  if (tags && typeof tags === "object") {
    const value = (tags as JsonRecord).campaign_id;
    return typeof value === "string" ? value : undefined;
  }

  return undefined;
}

function getResendRecipient(payload: JsonRecord): string | undefined {
  const data = asRecord(payload.data);
  const to = data?.to;

  if (Array.isArray(to)) {
    return typeof to[0] === "string" ? to[0] : undefined;
  }

  return typeof to === "string" ? to : undefined;
}

function verifyMailgunSignature(
  signingKey: string,
  payload: JsonRecord
): boolean {
  const signature = asRecord(payload.signature);
  const timestamp = signature?.timestamp;
  const token = signature?.token;
  const actualSignature = signature?.signature;

  if (!timestamp || !token || !actualSignature) {
    return false;
  }

  const digest = crypto
    .createHmac("sha256", signingKey)
    .update(`${timestamp}${token}`)
    .digest("hex");

  return digest === actualSignature;
}

async function recordCampaignEvent(params: {
  campaignId: string;
  createdAt: Date;
  eventType: string;
  metrics: CampaignMetricUpdate;
  payload: unknown;
  provider: EmailProvider;
  providerEventId: string;
  recipientEmail?: string;
}) {
  const incrementData = buildIncrementData(params.metrics);

  await prisma.$transaction(async (tx) => {
    await tx.campaignEvent.create({
      data: {
        campaignId: params.campaignId,
        createdAt: params.createdAt,
        eventType: params.eventType,
        payload:
          typeof params.payload === "object" && params.payload !== null
            ? (params.payload as object)
            : undefined,
        provider: params.provider,
        providerEventId: params.providerEventId,
        recipientEmail: params.recipientEmail,
      },
    });

    await tx.campaign.update({
      where: { id: params.campaignId },
      data: {
        ...incrementData,
        lastEventAt: params.createdAt,
      },
    });

    if (
      params.recipientEmail &&
      shouldSuppressSubscriber(params.provider, params.eventType)
    ) {
      await tx.subscriber.updateMany({
        where: { email: params.recipientEmail },
        data: { isActive: false },
      });
    }
  });
}

async function getProviderSecrets() {
  const settings = await prisma.setting.findMany({
    where: {
      key: { in: ["RESEND_WEBHOOK_SECRET", "MAILGUN_WEBHOOK_SIGNING_KEY"] },
    },
    select: {
      key: true,
      value: true,
    },
  });

  return resolveEmailProviderConfig(settingsToMap(settings));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider: providerParam } = await params;
  const provider = normalizeEmailProvider(providerParam);

  if (provider === "SMTP") {
    return NextResponse.json(
      { error: "SMTP does not publish campaign analytics webhooks." },
      { status: 400 }
    );
  }

  try {
    const payload = (await request.json()) as JsonRecord;
    const secrets = await getProviderSecrets();

    if (
      provider === "MAILGUN" &&
      secrets.mailgunWebhookSigningKey &&
      !verifyMailgunSignature(secrets.mailgunWebhookSigningKey, payload)
    ) {
      return NextResponse.json({ error: "Invalid Mailgun signature." }, { status: 401 });
    }

    if (provider === "RESEND") {
      const data = asRecord(payload.data);
      const eventType = String(payload.type || "");
      const campaignId = getResendCampaignId(payload);

      if (!campaignId) {
        return NextResponse.json({ received: true, skipped: true });
      }

      const providerEventId = [
        data?.email_id || "email",
        eventType || "event",
        getResendRecipient(payload) || "recipient",
        payload.created_at || "timestamp",
      ].join(":");

      await recordCampaignEvent({
        campaignId,
        createdAt: safeDate(
          typeof payload.created_at === "string" || typeof payload.created_at === "number"
            ? payload.created_at
            : undefined
        ),
        eventType,
        metrics: mapResendEventToMetrics(eventType),
        payload,
        provider,
        providerEventId,
        recipientEmail: getResendRecipient(payload),
      });

      return NextResponse.json({ received: true });
    }

    const eventData = asRecord(payload["event-data"]) || payload;
    const eventType = String(eventData.event || "");
    const userVariables = asRecord(eventData["user-variables"]);
    const campaignId = userVariables?.campaign_id;

    if (!campaignId || typeof campaignId !== "string") {
      return NextResponse.json({ received: true, skipped: true });
    }

    const providerEventId = String(
      eventData.id ||
        `${eventType}:${eventData.recipient || "recipient"}:${eventData.timestamp || Date.now()}`
    );

    await recordCampaignEvent({
      campaignId,
      createdAt: safeDate(
        typeof eventData.timestamp === "string" || typeof eventData.timestamp === "number"
          ? eventData.timestamp
          : undefined
      ),
      eventType,
      metrics: mapMailgunEventToMetrics(eventType),
      payload,
      provider,
      providerEventId,
      recipientEmail:
        typeof eventData.recipient === "string" ? eventData.recipient : undefined,
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    console.error("Failed to process campaign webhook", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process campaign webhook",
      },
      { status: 500 }
    );
  }
}
