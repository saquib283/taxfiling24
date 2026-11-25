import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireRole } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getWhatsAppConfig } from "@/lib/whatsapp";
import { normalizePhoneNumber } from "@/lib/whatsapp-shared";
import { processWhatsAppWebhookPayload } from "@/lib/whatsapp-webhook";

export async function POST(request: NextRequest) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const action = body?.action || "INBOUND_MESSAGE";
    const rawPhone = String(body?.phoneNumber || "919999900001").trim();
    const phoneNumber = normalizePhoneNumber(rawPhone);
    const customText = typeof body?.customText === "string" ? body.customText.trim().slice(0, 1000) : "";

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Please provide a valid 10-15 digit phone number (e.g., 919999900001)." },
        { status: 400 }
      );
    }

    const config = await getWhatsAppConfig();
    const displayPhone = normalizePhoneNumber(config.phoneNumber) || "919999900000";
    const simulatedWamid = `wamid.SIMULATED_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    if (action === "INBOUND_MESSAGE") {
      const simulatedPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "SIMULATED_WABA",
            changes: [
              {
                field: "messages",
                value: {
                  messaging_product: "whatsapp",
                  metadata: {
                    display_phone_number: displayPhone,
                    phone_number_id: "SIMULATED_PHONE_ID",
                  },
                  contacts: [
                    {
                      profile: {
                        name: "Test Client (Simulator)",
                      },
                      wa_id: phoneNumber,
                    },
                  ],
                  messages: [
                    {
                      from: phoneNumber,
                      id: simulatedWamid,
                      timestamp: String(Math.floor(Date.now() / 1000)),
                      type: "text",
                      text: {
                        body:
                          customText ||
                          "Hello TaxFiling24 Advisory! I would like to consult on my corporate filing.",
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      // Invoke webhook ingestion directly in-process (zero outbound HTTP / SSRF risk)
      await processWhatsAppWebhookPayload(simulatedPayload, displayPhone);

      return NextResponse.json({
        success: true,
        action: "INBOUND_MESSAGE",
        simulatedWamid,
        webhookResponse: { status: "success" },
      });
    }

    if (action === "DELIVERY_STATUS" || action === "FAILED_STATUS") {
      const existingSimLog = await prisma.whatsAppLog.findFirst({
        where: {
          direction: "OUTBOUND",
          messageId: { startsWith: "wamid.SIMULATED_" },
        },
        orderBy: { createdAt: "desc" },
      });

      let targetWamid = existingSimLog?.messageId;
      if (!targetWamid) {
        targetWamid = simulatedWamid;
        await prisma.whatsAppLog.create({
          data: {
            messageId: targetWamid,
            direction: "OUTBOUND",
            fromNumber: displayPhone,
            toNumber: phoneNumber,
            messageType: "text",
            content: "[Simulated Outbound Message for Webhook Status Test]",
            status: "sent",
          },
        });
      }

      const isFailed = action === "FAILED_STATUS";

      const simulatedPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "SIMULATED_WABA",
            changes: [
              {
                field: "messages",
                value: {
                  messaging_product: "whatsapp",
                  metadata: {
                    display_phone_number: displayPhone,
                    phone_number_id: "SIMULATED_PHONE_ID",
                  },
                  statuses: [
                    {
                      id: targetWamid,
                      status: isFailed ? "failed" : "delivered",
                      timestamp: String(Math.floor(Date.now() / 1000)),
                      recipient_id: phoneNumber,
                      conversation: {
                        id: "CONV_SIMULATED",
                        origin: { type: "service" },
                      },
                      pricing: {
                        billable: false,
                        pricing_model: "CBP",
                        category: "service",
                      },
                      ...(isFailed
                        ? {
                            errors: [
                              {
                                code: 131030,
                                title:
                                  "Recipient phone number not in allowed list for test account",
                              },
                            ],
                          }
                        : {}),
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      await processWhatsAppWebhookPayload(simulatedPayload, displayPhone);

      return NextResponse.json({
        success: true,
        action,
        targetWamid,
        webhookResponse: { status: "success" },
      });
    }

    return NextResponse.json({ error: "Unknown simulation action" }, { status: 400 });
  } catch (error) {
    console.error("[Test Webhook Simulation Error]:", error);
    return NextResponse.json(
      { error: "Failed to simulate webhook" },
      { status: 500 }
    );
  }
}
