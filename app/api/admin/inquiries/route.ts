import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { getLeadCrmMetrics, logLeadActivity } from "@/lib/lead-crm";
import { logActivity } from "@/lib/activity-log";

const ALLOWED_STAGES = new Set([
  "NEW",
  "CONTACTED",
  "FOLLOW_UP_SCHEDULED",
  "CONSULTATION_BOOKED",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
  "ARCHIVED",
]);

const ALLOWED_PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export async function GET(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const service = searchParams.get("service");
    const search = searchParams.get("search");
    const format = searchParams.get("format"); // "raw" | "full"

    const where: Record<string, any> = {};

    if (status && status !== "ALL") {
      if (status === "ACTIVE") {
        where.status = { notIn: ["WON", "LOST", "ARCHIVED", "RESOLVED"] };
      } else {
        where.status = status;
      }
    }

    if (priority && priority !== "ALL") {
      where.priority = priority;
    }

    if (service && service !== "ALL") {
      where.service = service;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { company: { contains: q } },
        { message: { contains: q } },
      ];
    }

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        followUps: {
          where: { status: "PENDING" },
          orderBy: { scheduledAt: "asc" },
          take: 3,
        },
        _count: {
          select: {
            followUps: true,
            activities: true,
            proposals: true,
          },
        },
      },
    });

    if (format === "raw") {
      return NextResponse.json(inquiries);
    }

    const metrics = await getLeadCrmMetrics();

    return NextResponse.json({
      leads: inquiries,
      metrics,
    });
  } catch (error: any) {
    console.error("Failed to load inquiries:", error);
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      service,
      message,
      status = "NEW",
      priority = "MEDIUM",
      estimatedValue,
      company,
      city,
      source = "MANUAL",
      tags,
      assignedTo,
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    const cleanStatus = ALLOWED_STAGES.has(String(status)) ? String(status) : "NEW";
    const cleanPriority = ALLOWED_PRIORITIES.has(String(priority)) ? String(priority) : "MEDIUM";
    const parsedVal =
      estimatedValue !== undefined && estimatedValue !== null && estimatedValue !== ""
        ? Number(estimatedValue)
        : null;
    if (parsedVal !== null && (!Number.isFinite(parsedVal) || parsedVal < 0)) {
      return NextResponse.json({ error: "Invalid estimated deal value" }, { status: 400 });
    }

    const actor = auth.user.name || auth.user.username || auth.user.role;

    const inquiry = await prisma.inquiry.create({
      data: {
        name: String(name).trim(),
        email: email ? String(email).trim() : "",
        phone: phone ? String(phone).trim() || null : null,
        service: service ? String(service).trim() || null : null,
        message: message ? String(message).trim() || "Lead created directly in CRM." : "Lead created directly in CRM.",
        status: cleanStatus,
        priority: cleanPriority,
        estimatedValue: parsedVal,
        company: company ? String(company).trim() || null : null,
        city: city ? String(city).trim() || null : null,
        source: String(source || "MANUAL").trim(),
        tags: tags || undefined,
        assignedTo: assignedTo ? String(assignedTo).trim() || null : null,
      },
      include: {
        followUps: true,
        activities: true,
        proposals: true,
      },
    });

    await logLeadActivity({
      inquiryId: inquiry.id,
      type: "NOTE",
      title: "Lead Created in CRM",
      description: `Source: ${inquiry.source} | Priority: ${cleanPriority}${
        parsedVal !== null ? ` | Deal Value: ₹${parsedVal.toLocaleString("en-IN")}` : ""
      }`,
      performedBy: actor,
    });

    await logActivity(
      "CREATED",
      "Inquiry",
      `Created CRM lead: ${inquiry.name}`,
      inquiry.id,
      auth.user.userId
    );

    return NextResponse.json(inquiry, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create lead:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
