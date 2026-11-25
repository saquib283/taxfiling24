import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { completeFollowUp } from "@/lib/lead-crm";

const ALLOWED_FOLLOWUP_STATUSES = new Set([
  "PENDING",
  "COMPLETED",
  "CANCELLED",
  "MISSED",
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; followUpId: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id, followUpId } = await params;
    const existing = await prisma.leadFollowUp.findFirst({
      where: { id: followUpId, inquiryId: id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Follow-up task not found" }, { status: 404 });
    }

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

    if (status !== undefined && !ALLOWED_FOLLOWUP_STATUSES.has(String(status))) {
      return NextResponse.json({ error: "Invalid follow-up status" }, { status: 400 });
    }

    if (status === "COMPLETED") {
      if (existing.status === "COMPLETED") {
        return NextResponse.json(
          { error: "Follow-up task is already completed" },
          { status: 400 }
        );
      }
      if (nextFollowUpAt && isNaN(new Date(nextFollowUpAt).getTime())) {
        return NextResponse.json({ error: "Invalid next follow-up date" }, { status: 400 });
      }
      const updated = await completeFollowUp({
        followUpId,
        expectedInquiryId: id,
        outcome: outcome || "Task completed",
        nextFollowUpAt,
        nextFollowUpType,
        nextFollowUpTitle,
        performedBy: auth.user.name || auth.user.username || auth.user.role,
      });
      return NextResponse.json(updated);
    }

    // Direct update (e.g. rescheduling)
    const dataToUpdate: Record<string, any> = {};
    if (status) dataToUpdate.status = status;
    if (outcome !== undefined) dataToUpdate.outcome = outcome;
    if (scheduledAt !== undefined) {
      const d = new Date(scheduledAt);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid scheduledAt date" }, { status: 400 });
      }
      dataToUpdate.scheduledAt = d;
    }
    if (title !== undefined) {
      const trimmed = String(title).trim();
      if (!trimmed) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      dataToUpdate.title = trimmed;
    }
    if (notes !== undefined) dataToUpdate.notes = notes;

    const updated = await prisma.leadFollowUp.update({
      where: { id: followUpId },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    const msg = error?.message || "Failed to update follow-up";
    const status = msg.includes("not found") ? 404 : msg.includes("already") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; followUpId: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id, followUpId } = await params;
    const existing = await prisma.leadFollowUp.findFirst({
      where: { id: followUpId, inquiryId: id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Follow-up task not found" }, { status: 404 });
    }

    await prisma.leadFollowUp.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete follow-up:", error);
    return NextResponse.json({ error: "Failed to delete follow-up" }, { status: 500 });
  }
}
