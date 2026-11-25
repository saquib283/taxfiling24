import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { scheduleFollowUp } from "@/lib/lead-crm";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const followUps = await prisma.leadFollowUp.findMany({
      where: { inquiryId: id },
      orderBy: { scheduledAt: "asc" },
    });
    return NextResponse.json(followUps);
  } catch (error: any) {
    console.error("Failed to fetch follow-ups:", error);
    return NextResponse.json({ error: "Failed to load follow-ups" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const inquiry = await prisma.inquiry.findUnique({ where: { id }, select: { id: true } });
    if (!inquiry) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const body = await request.json();
    const { scheduledAt, type = "CALL", title, notes, assignedTo } = body;

    if (!scheduledAt || isNaN(new Date(scheduledAt).getTime())) {
      return NextResponse.json({ error: "Valid follow-up date/time is required" }, { status: 400 });
    }

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: "Follow-up title is required" }, { status: 400 });
    }

    const followUp = await scheduleFollowUp({
      inquiryId: id,
      scheduledAt,
      type,
      title: String(title).trim(),
      notes: notes?.trim() || undefined,
      assignedTo: assignedTo?.trim() || undefined,
      performedBy: auth.user.name || auth.user.username || auth.user.role,
    });

    return NextResponse.json(followUp, { status: 201 });
  } catch (error: any) {
    console.error("Failed to schedule follow-up:", error);
    return NextResponse.json({ error: "Failed to schedule follow-up" }, { status: 500 });
  }
}
