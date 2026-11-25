import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logLeadActivity } from "@/lib/lead-crm";
import { logActivity } from "@/lib/activity-log";

const ALLOWED_STAGES = new Set([
  "NEW",
  "PENDING",
  "CONTACTED",
  "FOLLOW_UP_SCHEDULED",
  "CONSULTATION_BOOKED",
  "PROPOSAL_SENT",
  "WON",
  "RESOLVED",
  "LOST",
  "ARCHIVED",
]);

const ALLOWED_PRIORITIES = new Set(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

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
    console.error("Failed to load lead:", error);
    return NextResponse.json({ error: "Failed to load lead" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.inquiry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

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

    if (status !== undefined && !ALLOWED_STAGES.has(String(status))) {
      return NextResponse.json({ error: "Invalid lead stage" }, { status: 400 });
    }
    if (priority !== undefined && !ALLOWED_PRIORITIES.has(String(priority))) {
      return NextResponse.json({ error: "Invalid priority value" }, { status: 400 });
    }

    const dataToUpdate: Record<string, any> = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (priority !== undefined) dataToUpdate.priority = priority;
    if (estimatedValue !== undefined) {
      if (estimatedValue === null || estimatedValue === "") {
        dataToUpdate.estimatedValue = null;
      } else {
        const parsedVal = Number(estimatedValue);
        if (!Number.isFinite(parsedVal) || parsedVal < 0) {
          return NextResponse.json({ error: "Invalid estimated deal value" }, { status: 400 });
        }
        dataToUpdate.estimatedValue = parsedVal;
      }
    }
    if (assignedTo !== undefined) dataToUpdate.assignedTo = assignedTo;
    if (company !== undefined) dataToUpdate.company = company;
    if (city !== undefined) dataToUpdate.city = city;
    if (tags !== undefined) dataToUpdate.tags = tags;
    if (lostReason !== undefined) dataToUpdate.lostReason = lostReason;
    if (name !== undefined) dataToUpdate.name = String(name).trim();
    if (email !== undefined) dataToUpdate.email = String(email).trim();
    if (phone !== undefined) dataToUpdate.phone = phone;
    if (service !== undefined) dataToUpdate.service = service;

    await prisma.inquiry.update({
      where: { id },
      data: dataToUpdate,
    });

    const actor = auth.user.name || auth.user.username || auth.user.role;

    // Log lead activities BEFORE fetching final state so timeline updates immediately
    if (status && status !== existing.status) {
      await logLeadActivity({
        inquiryId: id,
        type: "STATUS_CHANGE",
        title: `Stage Changed: ${existing.status} -> ${status}`,
        description: lostReason ? `Reason: ${lostReason}` : notes || undefined,
        metadata: { oldStatus: existing.status, newStatus: status, reason: lostReason },
        performedBy: actor,
      });
    }

    if (
      estimatedValue !== undefined &&
      Number(estimatedValue || 0) !== Number(existing.estimatedValue || 0)
    ) {
      await logLeadActivity({
        inquiryId: id,
        type: "VALUE_UPDATED",
        title: `Deal Value Updated to ₹${Number(estimatedValue || 0).toLocaleString("en-IN")}`,
        description: `Previous value: ₹${Number(existing.estimatedValue || 0).toLocaleString("en-IN")}`,
        metadata: {
          previousValue: existing.estimatedValue,
          newValue: estimatedValue !== null && estimatedValue !== "" ? Number(estimatedValue) : null,
        },
        performedBy: actor,
      });
    }

    await logActivity(
      "UPDATED",
      "Inquiry",
      `Updated CRM lead ${existing.name}${status && status !== existing.status ? ` (${existing.status} -> ${status})` : ""}`,
      id,
      auth.user.userId
    );

    const updated = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        followUps: { orderBy: { scheduledAt: "asc" } },
        activities: { orderBy: { createdAt: "desc" } },
        proposals: { orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Failed to update lead:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const existing = await prisma.inquiry.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    await prisma.inquiry.delete({ where: { id } });

    await logActivity(
      "DELETED",
      "Inquiry",
      `Deleted CRM lead: ${existing.name}`,
      existing.id,
      auth.user.userId
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete lead:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
