import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "30", 10)));
    const direction = searchParams.get("direction") || "ALL";
    const search = searchParams.get("search")?.trim() || "";

    const where: any = {};

    if (direction === "INBOUND") {
      where.direction = "INBOUND";
    } else if (direction === "OUTBOUND") {
      where.direction = "OUTBOUND";
    } else if (direction === "STATUS_UPDATE") {
      where.direction = "STATUS_UPDATE";
    } else if (direction === "FAILED") {
      where.status = "failed";
    } else if (direction === "DELIVERED") {
      where.status = { in: ["delivered", "read"] };
    } else if (direction === "READ") {
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

    // 1. Fetch Paginated Records
    const [logs, totalFiltered] = await Promise.all([
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
    ]);

    // 2. Fetch Aggregate Metrics
    const [
      totalCount,
      inboundCount,
      outboundCount,
      deliveredCount,
      readCount,
      failedCount,
    ] = await Promise.all([
      prisma.whatsAppLog.count(),
      prisma.whatsAppLog.count({ where: { direction: "INBOUND" } }),
      prisma.whatsAppLog.count({ where: { direction: "OUTBOUND" } }),
      prisma.whatsAppLog.count({ where: { status: { in: ["delivered", "read"] } } }),
      prisma.whatsAppLog.count({ where: { status: "read" } }),
      prisma.whatsAppLog.count({ where: { status: "failed" } }),
    ]);

    const deliveryRate = outboundCount > 0 ? Math.round((deliveredCount / outboundCount) * 100) : 100;
    const readRate = deliveredCount > 0 ? Math.round((readCount / deliveredCount) * 100) : 0;

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit),
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
    });
  } catch (error: any) {
    console.error("[WhatsApp Logs API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load WhatsApp logs" },
      { status: 500 }
    );
  }
}

