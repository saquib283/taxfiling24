import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { scheduleFollowUp } from "@/lib/lead-crm";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const followUps = await prisma.leadFollowUp.findMany({
      where: { inquiryId: id },
      orderBy: { scheduledAt: "asc" },
    });
    return NextResponse.json(followUps);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const { scheduledAt, type = "CALL", title, notes, assignedTo } = body;

    if (!scheduledAt) {
      return NextResponse.json({ error: "Follow-up date/time is required" }, { status: 400 });
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Follow-up title is required" }, { status: 400 });
    }

    const followUp = await scheduleFollowUp({
      inquiryId: id,
      scheduledAt,
      type,
      title: title.trim(),
      notes: notes?.trim() || undefined,
      assignedTo: assignedTo?.trim() || undefined,
      performedBy: (admin as any).name || admin.role || "Admin",
    });

    return NextResponse.json(followUp, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

