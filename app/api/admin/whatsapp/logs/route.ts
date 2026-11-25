import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getWhatsAppConfig } from "@/lib/whatsapp";

export async function GET(request: NextRequest) {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const searchParams = request.nextUrl.searchParams;
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = parseInt(searchParams.get("limit") || "30", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 30;
    const direction = searchParams.get("direction") || "ALL";
    const search = searchParams.get("search")?.trim() || "";

    const where: Record<string, any> = {};

    if (direction === "INBOUND") {
      where.direction = "INBOUND";
    } else if (direction === "OUTBOUND") {
      where.direction = "OUTBOUND";
    } else if (direction === "STATUS_UPDATE") {
      where.direction = "STATUS_UPDATE";
    } else if (direction === "FAILED") {
      where.status = "failed";
    } else if (direction === "DELIVERED") {
      where.direction = "OUTBOUND";
      where.status = { in: ["delivered", "read"] };
    } else if (direction === "READ") {
      where.direction = "OUTBOUND";
      where.status = "read";
    }

    if (search) {
      where.OR = [
        { fromNumber: { contains: search } },
        { toNumber: { contains: search } },
        { senderName: { contains: search } },
        { content: { contains: search } },
        { messageId: { contains: search } },
      ];
    }

    const [
      logs,
      totalFiltered,
      totalCount,
      inboundCount,
      outboundCount,
      deliveredCount,
      readCount,
      failedCount,
      config,
    ] = await Promise.all([
      prisma.whatsAppLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          inquiry: {
            select: {
              id: true,
              name: true,
              service: true,
              status: true,
            },
          },
          campaign: {
            select: {
              id: true,
              subject: true,
            },
          },
        },
      }),
      prisma.whatsAppLog.count({ where }),
      prisma.whatsAppLog.count(),
      prisma.whatsAppLog.count({ where: { direction: "INBOUND" } }),
      prisma.whatsAppLog.count({ where: { direction: "OUTBOUND" } }),
      prisma.whatsAppLog.count({
        where: { direction: "OUTBOUND", status: { in: ["delivered", "read"] } },
      }),
      prisma.whatsAppLog.count({
        where: { direction: "OUTBOUND", status: "read" },
      }),
      prisma.whatsAppLog.count({
        where: { direction: "OUTBOUND", status: "failed" },
      }),
      getWhatsAppConfig(),
    ]);

    const deliveryRate =
      outboundCount > 0 ? Math.min(100, Math.round((deliveredCount / outboundCount) * 100)) : 0;
    const readRate =
      deliveredCount > 0 ? Math.min(100, Math.round((readCount / deliveredCount) * 100)) : 0;

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        totalFiltered,
        totalPages: Math.max(1, Math.ceil(totalFiltered / limit)),
      },
      stats: {
        totalCount,
        inboundCount,
        outboundCount,
        deliveredCount,
        readCount,
        failedCount,
        deliveryRate,
        readRate,
      },
      webhookMeta: {
        isConfigured: config.isConfigured,
        hasVerifyToken: Boolean(config.webhookVerifyToken),
        hasAppSecret: Boolean(config.appSecret),
        canSimulate: auth.user.role === "ADMIN",
      },
    });
  } catch (error: any) {
    console.error("[WhatsApp Logs API] Error:", error);
    return NextResponse.json(
      { error: "Failed to load WhatsApp logs" },
      { status: 500 }
    );
  }
}
