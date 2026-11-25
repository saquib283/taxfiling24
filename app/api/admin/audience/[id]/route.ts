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
    const body = await request.json();

    const updateData: Record<string, any> = {};

    if (typeof body.isActive === "boolean") {
      updateData.isActive = body.isActive;
    }
    if (typeof body.name === "string") {
      updateData.name = body.name.trim() || null;
    }
    if (typeof body.phone === "string") {
      updateData.phone = body.phone.trim() || null;
    }
    if (typeof body.company === "string") {
      updateData.company = body.company.trim() || null;
    }
    if (typeof body.notes === "string") {
      updateData.notes = body.notes.trim() || null;
    }
    if (typeof body.source === "string") {
      updateData.source = body.source.trim();
    }
    if (Array.isArray(body.tags)) {
      updateData.tags = body.tags.filter(Boolean);
    }

    const subscriber = await prisma.subscriber.update({
      where: { id },
      data: updateData,
    });

    await logActivity(
      "UPDATED",
      "Subscriber",
      `Updated audience contact: ${subscriber.email}`,
      subscriber.id,
      auth.user.userId
    );

    return NextResponse.json({ subscriber });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    console.error("Failed to update audience contact:", error);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
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
      `Deleted audience contact: ${deleted.email}`,
      deleted.id,
      auth.user.userId
    );

    return NextResponse.json({ message: "Contact deleted successfully." });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
    console.error("Failed to delete audience contact:", error);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}
