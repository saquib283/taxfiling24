import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import {
  getAudienceMetrics,
  ingestContact,
  isValidEmail,
  normalizeEmail,
} from "@/lib/audience-service";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(10, Number.parseInt(searchParams.get("limit") || "50", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const source = searchParams.get("source")?.trim();
    const tag = searchParams.get("tag")?.trim();
    const status = searchParams.get("status")?.toUpperCase(); // ALL, ACTIVE, SUPPRESSED

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
        { phone: { contains: search } },
        { company: { contains: search } },
      ];
    }

    if (source && source !== "ALL") {
      where.source = source;
    }

    if (status === "ACTIVE") {
      where.isActive = true;
    } else if (status === "SUPPRESSED") {
      where.isActive = false;
    }

    const [subscribers, totalCount, metrics] = await Promise.all([
      prisma.subscriber.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.subscriber.count({ where }),
      getAudienceMetrics(),
    ]);

    // In-memory tag filtering if requested (since tags are stored as Json in MySQL)
    let filteredSubscribers = subscribers;
    if (tag) {
      filteredSubscribers = subscribers.filter((s) => {
        if (!s.tags || !Array.isArray(s.tags)) return false;
        return (s.tags as string[]).includes(tag);
      });
    }

    return NextResponse.json({
      subscribers: filteredSubscribers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      metrics,
    });
  } catch (error) {
    console.error("Failed to fetch audience list:", error);
    return NextResponse.json({ error: "Failed to fetch audience" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const email = normalizeEmail(body.email || "");

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const tags = Array.isArray(body.tags)
      ? body.tags.filter(Boolean)
      : typeof body.tag === "string" && body.tag.trim()
      ? [body.tag.trim()]
      : [];

    const result = await ingestContact({
      email,
      name: body.name || null,
      phone: body.phone || null,
      company: body.company || null,
      notes: body.notes || null,
      source: body.source || "MANUAL",
      tags,
      updateIfExists: true,
    });

    return NextResponse.json({
      contact: result.subscriber,
      status: result.status,
      message:
        result.status === "CREATED"
          ? "Contact added successfully."
          : "Existing contact updated with new information.",
    });
  } catch (error: any) {
    console.error("Failed to add audience contact:", error);
    return NextResponse.json({ error: error.message || "Failed to save contact" }, { status: 500 });
  }
}

