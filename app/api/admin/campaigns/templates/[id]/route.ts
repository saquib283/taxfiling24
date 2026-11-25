import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireRole } from "@/lib/auth";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const template = await prisma.campaignTemplate.delete({
      where: { id },
    });

    await logActivity(
      "DELETED",
      "Campaign",
      `Deleted campaign template: ${template.name}`,
      template.id,
      auth.user.userId
    );

    return NextResponse.json({ message: "Template deleted successfully." });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    console.error("Failed to delete campaign template", error);
    return NextResponse.json(
      { error: "Failed to delete campaign template" },
      { status: 500 }
    );
  }
}
