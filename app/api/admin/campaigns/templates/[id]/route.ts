import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await prisma.campaignTemplate.delete({
      where: { id },
    });

    await logActivity(
      "DELETED",
      "Campaign",
      `Deleted campaign template: ${template.name}`,
      template.id
    );

    return NextResponse.json({ message: "Template deleted successfully." });
  } catch (error) {
    console.error("Failed to delete campaign template", error);
    return NextResponse.json(
      { error: "Failed to delete campaign template" },
      { status: 500 }
    );
  }
}
