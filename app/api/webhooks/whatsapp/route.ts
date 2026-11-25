import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getWhatsAppConfig } from "@/lib/whatsapp";
import { processWhatsAppWebhookPayload } from "@/lib/whatsapp-webhook";
import { safeSecretCompare } from "@/lib/rate-limit";

const MAX_WEBHOOK_BODY_BYTES = 512 * 1024; // 512 KB

/**
 * GET: Meta Webhook Verification Handshake
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token") || "";
    const challenge = searchParams.get("hub.challenge") || "";

    const config = await getWhatsAppConfig();
    const expectedToken = config.webhookVerifyToken?.trim();

    if (!expectedToken) {
      console.error("[WhatsApp Webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN is not configured.");
      return new Response("Webhook verify token not configured", { status: 503 });
    }

    if (mode === "subscribe" && token && safeSecretCompare(token, expectedToken)) {
      return new Response(challenge, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    console.warn("[WhatsApp Webhook] Verification handshake failed.");
    return new Response("Forbidden: Invalid verification token", { status: 403 });
  } catch (error) {
    console.error("[WhatsApp Webhook] Verification error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

/**
 * POST: Meta Webhook Ingestion Engine (fail-closed HMAC-SHA256 verification)
 */
export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(request.headers.get("content-length") || "0");
    if (Number.isFinite(contentLength) && contentLength > MAX_WEBHOOK_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const rawBodyText = await request.text();
    if (Buffer.byteLength(rawBodyText, "utf8") > MAX_WEBHOOK_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const config = await getWhatsAppConfig();

    // Fail CLOSED whenever WHATSAPP_APP_SECRET is not configured
    if (!config.appSecret?.trim()) {
      console.error("[WhatsApp Webhook] WHATSAPP_APP_SECRET is not configured. Rejecting unsigned webhook.");
      return NextResponse.json(
        { error: "Webhook signing secret is not configured" },
        { status: 503 }
      );
    }

    const signature = request.headers.get("x-hub-signature-256") || "";
    if (!signature) {
      console.warn("[WhatsApp Webhook] Missing X-Hub-Signature-256 header.");
      return NextResponse.json({ error: "Missing webhook signature" }, { status: 401 });
    }

    const expectedSignature = `sha256=${crypto
      .createHmac("sha256", config.appSecret.trim())
      .update(rawBodyText)
      .digest("hex")}`;

    if (!safeSecretCompare(signature, expectedSignature)) {
      console.warn("[WhatsApp Webhook] Signature verification failed.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBodyText);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (payload?.object !== "whatsapp_business_account" || !Array.isArray(payload?.entry)) {
      return NextResponse.json({ error: "Unrecognized webhook object" }, { status: 400 });
    }

    await processWhatsAppWebhookPayload(payload, config.phoneNumber);

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("[WhatsApp Webhook] Processing error:", error);
    return NextResponse.json(
      { status: "error", error: "Webhook processing error" },
      { status: 200 }
    );
  }
}
