import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isApproved } = await request.json();

    const review = await prisma.review.update({
      where: { id },
      data: { isApproved: isApproved ?? false },
    });

    await logActivity(isApproved ? "APPROVED" : "REJECTED", "Review", `Review ${isApproved ? "approved" : "rejected"}`, id);
    return NextResponse.json(review);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.review.delete({
      where: { id },
    });

    await logActivity("DELETED", "Review", `Deleted review`, id);
    return NextResponse.json({ message: "Review deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
