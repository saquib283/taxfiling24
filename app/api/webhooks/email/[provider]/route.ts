import crypto from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { safeSecretCompare } from "@/lib/rate-limit";
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

const MAX_WEBHOOK_BODY_BYTES = 512 * 1024; // 512 KB
const MAILGUN_REPLAY_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REPLAY_KEYS = 5000;
const seenMailgunTokens = new Map<string, number>();

function isMailgunTokenReplayed(timestampStr: string, tokenStr: string): boolean {
  const now = Date.now();
  if (seenMailgunTokens.size >= MAX_REPLAY_KEYS) {
    for (const [key, exp] of seenMailgunTokens.entries()) {
      if (now >= exp) seenMailgunTokens.delete(key);
    }
    while (seenMailgunTokens.size >= MAX_REPLAY_KEYS) {
      const oldest = seenMailgunTokens.keys().next().value;
      if (oldest === undefined) break;
      seenMailgunTokens.delete(oldest);
    }
  }
  const replayKey = `${timestampStr}:${tokenStr}`;
  const existingExp = seenMailgunTokens.get(replayKey);
  if (existingExp && now < existingExp) {
    return true;
  }
  seenMailgunTokens.set(replayKey, now + MAILGUN_REPLAY_TTL_MS);
  return false;
}

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

  if (
    !timestamp ||
    !token ||
    typeof actualSignature !== "string" ||
    !actualSignature
  ) {
    return false;
  }

  const timestampStr = String(timestamp).trim();
  const tokenStr = String(token).trim();

  // Enforce strict numeric timestamp and 5-minute replay tolerance window
  if (!/^\d{9,12}$/.test(timestampStr) || !tokenStr || tokenStr.length > 256) {
    return false;
  }
  const nowSec = Math.floor(Date.now() / 1000);
  const ts = Number.parseInt(timestampStr, 10);
  if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > 300) {
    return false;
  }

  const digest = crypto
    .createHmac("sha256", signingKey)
    .update(`${timestampStr}${tokenStr}`)
    .digest("hex");

  if (!safeSecretCompare(actualSignature.trim(), digest)) {
    return false;
  }

  // Prevent replay of captured (timestamp, token) signature triples with altered event-data
  if (isMailgunTokenReplayed(timestampStr, tokenStr)) {
    return false;
  }

  return true;
}

function verifySvixSignature({
  secret,
  svixId,
  svixTimestamp,
  svixSignature,
  rawBody,
}: {
  secret?: string;
  svixId?: string | null;
  svixTimestamp?: string | null;
  svixSignature?: string | null;
  rawBody: string;
}): boolean {
  if (!secret || !svixId || !svixTimestamp || !svixSignature) return false;
  if (!/^\d{9,12}$/.test(svixTimestamp.trim())) return false;

  const now = Math.floor(Date.now() / 1000);
  const ts = Number.parseInt(svixTimestamp.trim(), 10);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > 300) return false;

  const cleanSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  const secretBytes = Buffer.from(cleanSecret, "base64");
  const signedPayload = `${svixId}.${svixTimestamp.trim()}.${rawBody}`;
  const expectedSig = crypto
    .createHmac("sha256", secretBytes)
    .update(signedPayload)
    .digest("base64");

  const signatures = svixSignature.split(" ");
  for (const sig of signatures) {
    const parts = sig.split(",");
    if (parts[0] === "v1" && parts[1] && safeSecretCompare(parts[1], expectedSig)) {
      return true;
    }
  }
  return false;
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
}): Promise<{ ignored: boolean }> {
  // Verify campaign exists before writing FK-constrained event (ignores test-campaign & deleted campaigns cleanly)
  const exists = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
    select: { id: true },
  });

  if (!exists) {
    return { ignored: true };
  }

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
        where: { email: params.recipientEmail.trim().toLowerCase() },
        data: { isActive: false },
      });
    }
  });

  return { ignored: false };
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
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_WEBHOOK_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    let payload: JsonRecord;
    try {
      payload = JSON.parse(rawBody) as JsonRecord;
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const secrets = await getProviderSecrets();

    if (provider === "MAILGUN") {
      if (
        !secrets.mailgunWebhookSigningKey ||
        !verifyMailgunSignature(secrets.mailgunWebhookSigningKey, payload)
      ) {
        return NextResponse.json(
          { error: "Invalid or missing Mailgun signature." },
          { status: 401 }
        );
      }
    }

    if (provider === "RESEND") {
      const resendSecret = secrets.resendWebhookSecret || process.env.RESEND_WEBHOOK_SECRET;
      const svixId = request.headers.get("svix-id");
      const svixTimestamp = request.headers.get("svix-timestamp");
      const svixSignature = request.headers.get("svix-signature");

      if (
        !resendSecret ||
        !verifySvixSignature({
          secret: resendSecret,
          svixId,
          svixTimestamp,
          svixSignature,
          rawBody,
        })
      ) {
        return NextResponse.json(
          { error: "Invalid or missing Resend webhook signature." },
          { status: 401 }
        );
      }

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

      const result = await recordCampaignEvent({
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

      return NextResponse.json({ received: true, ignored: result.ignored });
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

    const result = await recordCampaignEvent({
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

    return NextResponse.json({ received: true, ignored: result.ignored });
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
      { error: "Failed to process campaign webhook" },
      { status: 500 }
    );
  }
}
