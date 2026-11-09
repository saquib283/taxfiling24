import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logLeadActivity } from "@/lib/lead-crm";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { scheduledAt: "asc" },
        },
        activities: {
          orderBy: { createdAt: "desc" },
        },
        proposals: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(inquiry);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.inquiry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Clean payload
    const {
      status,
      priority,
      estimatedValue,
      assignedTo,
      company,
      city,
      tags,
      lostReason,
      name,
      email,
      phone,
      service,
      notes,
    } = body;

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (priority !== undefined) dataToUpdate.priority = priority;
    if (estimatedValue !== undefined)
      dataToUpdate.estimatedValue = estimatedValue !== null ? Number(estimatedValue) : null;
    if (assignedTo !== undefined) dataToUpdate.assignedTo = assignedTo;
    if (company !== undefined) dataToUpdate.company = company;
    if (city !== undefined) dataToUpdate.city = city;
    if (tags !== undefined) dataToUpdate.tags = tags;
    if (lostReason !== undefined) dataToUpdate.lostReason = lostReason;
    if (name !== undefined) dataToUpdate.name = name;
    if (email !== undefined) dataToUpdate.email = email;
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (service !== undefined) dataToUpdate.service = service;

    const updated = await prisma.inquiry.update({
      where: { id },
      data: dataToUpdate,
      include: {
        followUps: { orderBy: { scheduledAt: "asc" } },
        activities: { orderBy: { createdAt: "desc" } },
        proposals: { orderBy: { createdAt: "desc" } },
      },
    });

    // Automatically audit log changes
    if (status && status !== existing.status) {
      await logLeadActivity({
        inquiryId: id,
        type: "STATUS_CHANGE",
        title: `Stage Changed: ${existing.status} -> ${status}`,
        description: lostReason ? `Reason: ${lostReason}` : notes || undefined,
        metadata: { oldStatus: existing.status, newStatus: status, reason: lostReason },
        performedBy: (admin as any).name || admin.role || "Admin",
      });
    }

    if (
      estimatedValue !== undefined &&
      Number(estimatedValue) !== Number(existing.estimatedValue || 0)
    ) {
      await logLeadActivity({
        inquiryId: id,
        type: "VALUE_UPDATED",
        title: `Deal Value Updated to ₹${Number(estimatedValue).toLocaleString("en-IN")}`,
        description: `Previous value: ₹${Number(existing.estimatedValue || 0).toLocaleString("en-IN")}`,
        metadata: {
          previousValue: existing.estimatedValue,
          newValue: Number(estimatedValue),
        },
        performedBy: (admin as any).name || admin.role || "Admin",
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.inquiry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
