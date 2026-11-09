import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { getLeadCrmMetrics, logLeadActivity } from "@/lib/lead-crm";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const service = searchParams.get("service");
    const search = searchParams.get("search");
    const format = searchParams.get("format"); // "raw" | "full"

    const where: any = {};

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        name: name.trim(),
        email: email?.trim() || "",
        phone: phone?.trim() || null,
        service: service?.trim() || null,
        message: message?.trim() || "Lead created directly in CRM.",
        status,
        priority,
        estimatedValue: estimatedValue ? Number(estimatedValue) : null,
        company: company?.trim() || null,
        city: city?.trim() || null,
        source,
        tags: tags || undefined,
        assignedTo: assignedTo || null,
      },
      include: {
        followUps: true,
        activities: true,
        proposals: true,
      },
    });

    // Automatically audit log creation
    await logLeadActivity({
      inquiryId: inquiry.id,
      type: "NOTE",
      title: "Lead Created in CRM",
      description: `Source: ${source} | Priority: ${priority}${
        estimatedValue ? ` | Deal Value: ₹${Number(estimatedValue).toLocaleString("en-IN")}` : ""
      }`,
      performedBy: (admin as any).name || admin.role || "Admin",
    });

    return NextResponse.json(inquiry, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
