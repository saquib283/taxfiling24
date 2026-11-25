import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = (await request.json()) as { isActive?: boolean; name?: string };

    const updateData: { isActive?: boolean; name?: string | null } = {};
    if (typeof body.isActive === "boolean") {
      updateData.isActive = body.isActive;
    }
    if (typeof body.name === "string") {
      updateData.name = body.name.trim() || null;
    }

    const subscriber = await prisma.subscriber.update({
      where: { id },
      data: updateData,
    });

    await logActivity(
      "UPDATED",
      "Subscriber",
      `Updated subscriber ${subscriber.email} (active=${subscriber.isActive})`,
      subscriber.id,
      auth.user.userId
    );

    return NextResponse.json({ subscriber });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }
    console.error("Failed to update subscriber", error);
    return NextResponse.json({ error: "Failed to update subscriber" }, { status: 500 });
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
    const deleted = await prisma.subscriber.delete({ where: { id } });

    await logActivity(
      "DELETED",
      "Subscriber",
      `Removed subscriber: ${deleted.email}`,
      deleted.id,
      auth.user.userId
    );

    return NextResponse.json({ message: "Subscriber removed" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }
    console.error("Failed to delete subscriber", error);
    return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 500 });
  }
}
