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

    return NextResponse.json({ subscriber });
  } catch (error) {
    console.error("Failed to update subscriber", error);
    return NextResponse.json({ error: "Failed to update subscriber" }, { status: 500 });
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
    return NextResponse.json({ message: "Subscriber removed" });
  } catch (error) {
    console.error("Failed to delete subscriber", error);
    return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 500 });
  }
}
