import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = {};

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

    return NextResponse.json({ subscriber });
  } catch (error) {
    console.error("Failed to update audience contact:", error);
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.subscriber.delete({ where: { id } });
    return NextResponse.json({ message: "Contact deleted successfully." });
  } catch (error) {
    console.error("Failed to delete audience contact:", error);
    return NextResponse.json({ error: "Failed to delete contact" }, { status: 500 });
  }
}

