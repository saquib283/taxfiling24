import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import {
  getAudienceMetrics,
  ingestContact,
  isValidEmail,
  normalizeEmail,
} from "@/lib/audience-service";

export async function GET(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = Number.parseInt(searchParams.get("limit") || "50", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(10, rawLimit)) : 50;
    const search = searchParams.get("search")?.trim() || "";
    const source = searchParams.get("source")?.trim();
    const tag = searchParams.get("tag")?.trim();
    const status = searchParams.get("status")?.toUpperCase(); // ALL, ACTIVE, SUPPRESSED

    const where: Record<string, any> = {};

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

    // Filter by tag BEFORE pagination so page counts and slices are always exact
    if (tag) {
      const [allMatching, metrics] = await Promise.all([
        prisma.subscriber.findMany({
          where,
          orderBy: { createdAt: "desc" },
        }),
        getAudienceMetrics(),
      ]);

      const tagFiltered = allMatching.filter((s) => {
        if (!s.tags || !Array.isArray(s.tags)) return false;
        return (s.tags as string[]).includes(tag);
      });

      const totalCount = tagFiltered.length;
      const start = (page - 1) * limit;
      const paged = tagFiltered.slice(start, start + limit);

      return NextResponse.json({
        subscribers: paged,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.max(1, Math.ceil(totalCount / limit)),
        },
        metrics,
      });
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

    return NextResponse.json({
      subscribers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      },
      metrics,
    });
  } catch (error) {
    console.error("Failed to fetch audience list:", error);
    return NextResponse.json({ error: "Failed to fetch audience" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

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

    await logActivity(
      result.status === "CREATED" ? "CREATED" : "UPDATED",
      "Subscriber",
      `${result.status === "CREATED" ? "Added" : "Updated"} audience contact: ${email}`,
      result.subscriber.id,
      auth.user.userId
    );

    return NextResponse.json({
      contact: result.subscriber,
      status: result.status,
      message:
        result.status === "CREATED"
          ? "Contact added successfully."
          : "Existing contact updated with new information.",
    });
  } catch (error: unknown) {
    console.error("Failed to add audience contact:", error);
    return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
  }
}
