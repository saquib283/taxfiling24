import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { completeFollowUp } from "@/lib/lead-crm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; followUpId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { followUpId } = await params;
    const body = await request.json();
    const {
      status,
      outcome,
      nextFollowUpAt,
      nextFollowUpType,
      nextFollowUpTitle,
      scheduledAt,
      title,
      notes,
    } = body;

    if (status === "COMPLETED") {
      const updated = await completeFollowUp({
        followUpId,
        outcome: outcome || "Task completed",
        nextFollowUpAt,
        nextFollowUpType,
        nextFollowUpTitle,
        performedBy: (admin as any).name || admin.role || "Admin",
      });
      return NextResponse.json(updated);
    }

    // Direct update (e.g. rescheduling)
    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (outcome !== undefined) dataToUpdate.outcome = outcome;
    if (scheduledAt) dataToUpdate.scheduledAt = new Date(scheduledAt);
    if (title) dataToUpdate.title = title;
    if (notes !== undefined) dataToUpdate.notes = notes;

    const updated = await prisma.leadFollowUp.update({
      where: { id: followUpId },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; followUpId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { followUpId } = await params;
    await prisma.leadFollowUp.delete({
      where: { id: followUpId },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

