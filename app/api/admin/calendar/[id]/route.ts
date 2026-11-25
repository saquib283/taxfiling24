import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

function parseCalendarDate(raw: unknown): Date | null {
  if (typeof raw !== "string" && !(raw instanceof Date)) return null;
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? new Date(`${trimmed}T12:00:00+05:30`)
    : new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: {
      title?: string;
      category?: string;
      date?: Date;
      desc?: string;
      isActive?: boolean;
    } = {};

    if (body.title !== undefined) {
      const title = String(body.title ?? "").trim();
      if (!title) return NextResponse.json({ error: "Title cannot be empty." }, { status: 400 });
      updateData.title = title;
    }

    if (body.category !== undefined) {
      const category = String(body.category ?? "").trim();
      if (!category) {
        return NextResponse.json({ error: "Category cannot be empty." }, { status: 400 });
      }
      updateData.category = category;
    }

    if (body.date !== undefined) {
      const parsedDate = parseCalendarDate(body.date);
      if (!parsedDate) {
        return NextResponse.json(
          { error: "Please provide a valid statutory due date." },
          { status: 400 }
        );
      }
      updateData.date = parsedDate;
    }

    if (body.desc !== undefined) {
      updateData.desc = typeof body.desc === "string" ? body.desc.trim() : "";
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    const deadline = await prisma.complianceDeadline.update({ where: { id }, data: updateData });

    revalidatePath("/");

    await logActivity(
      "UPDATED",
      "Deadline",
      `Updated deadline: ${deadline.title}`,
      deadline.id,
      auth.user.userId
    );
    return NextResponse.json(deadline);
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Compliance deadline not found." }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update deadline" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const deleted = await prisma.complianceDeadline.delete({ where: { id } });

    revalidatePath("/");

    await logActivity(
      "DELETED",
      "Deadline",
      `Deleted deadline: ${deleted.title}`,
      id,
      auth.user.userId
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Compliance deadline not found." }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete deadline" },
      { status: 500 }
    );
  }
}
