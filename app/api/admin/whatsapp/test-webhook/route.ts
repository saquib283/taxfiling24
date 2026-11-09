import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getWhatsAppConfig } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action = "INBOUND_MESSAGE", phoneNumber = "919162712267", customText } = await request.json();
    const config = await getWhatsAppConfig();
    const displayPhone = config.phoneNumber.replace(/\D/g, "");

    const simulatedWamid = `wamid.SIMULATED_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (action === "INBOUND_MESSAGE") {
      const simulatedPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: config.wabaId || "1147841937696902",
            changes: [
              {
                field: "messages",
                value: {
                  messaging_product: "whatsapp",
                  metadata: {
                    display_phone_number: displayPhone,
                    phone_number_id: config.phoneNumberId || "1395527613649643",
                  },
                  contacts: [
                    {
                      profile: {
                        name: "Md Rehan Saquib",
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
                        body: customText || "Hello TaxFiling24 Advisory! I would like to consult on my corporate filing.",
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      // Dispatch to internal webhook route
      const origin = request.nextUrl.origin;
      const res = await fetch(`${origin}/api/webhooks/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(simulatedPayload),
      });

      const resData = await res.json();
      return NextResponse.json({
        success: true,
        action: "INBOUND_MESSAGE",
        simulatedWamid,
        webhookResponse: resData,
      });
    }

    if (action === "DELIVERY_STATUS" || action === "FAILED_STATUS") {
      // Find the most recent outbound log to update
      const latestOutbound = await prisma.whatsAppLog.findFirst({
        where: { direction: "OUTBOUND" },
        orderBy: { createdAt: "desc" },
      });

      const targetWamid = latestOutbound?.messageId || simulatedWamid;
      const isFailed = action === "FAILED_STATUS";

      const simulatedPayload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: config.wabaId || "1147841937696902",
            changes: [
              {
                field: "messages",
                value: {
                  messaging_product: "whatsapp",
                  metadata: {
                    display_phone_number: displayPhone,
                    phone_number_id: config.phoneNumberId || "1395527613649643",
                  },
                  statuses: [
                    {
                      id: targetWamid,
                      status: isFailed ? "failed" : "delivered",
                      timestamp: String(Math.floor(Date.now() / 1000)),
                      recipient_id: phoneNumber,
                      conversation: {
                        id: "CONV_SIMULATED_123",
                        origin: { type: "service" },
                      },
                      pricing: {
                        billable: true,
                        pricing_model: "CBP",
                        category: "service",
                      },
                      ...(isFailed
                        ? {
                            errors: [
                              {
                                code: 131030,
                                title: "Recipient phone number not in allowed list for test account",
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

      const origin = request.nextUrl.origin;
      const res = await fetch(`${origin}/api/webhooks/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(simulatedPayload),
      });

      const resData = await res.json();
      return NextResponse.json({
        success: true,
        action,
        targetWamid,
        webhookResponse: resData,
      });
    }

    return NextResponse.json({ error: "Unknown simulation action" }, { status: 400 });
  } catch (error: any) {
    console.error("[Test Webhook Simulation Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to simulate webhook" },
      { status: 500 }
    );
  }
}

