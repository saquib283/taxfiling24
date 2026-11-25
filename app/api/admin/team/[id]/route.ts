import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { isSafeMediaUrl } from "@/lib/url-safety";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: {
      name?: string;
      designation?: string;
      image?: string | null;
      sortOrder?: number;
      isActive?: boolean;
    } = {};

    if (body.name !== undefined) {
      const name = String(body.name ?? "").trim();
      if (!name) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
      updateData.name = name;
    }

    if (body.designation !== undefined) {
      const designation = String(body.designation ?? "").trim();
      if (!designation) {
        return NextResponse.json({ error: "Designation cannot be empty." }, { status: 400 });
      }
      updateData.designation = designation;
    }

    if (body.image !== undefined) {
      const candidate = typeof body.image === "string" ? body.image.trim() : "";
      if (!candidate) {
        updateData.image = null;
      } else if (!isSafeMediaUrl(candidate)) {
        return NextResponse.json(
          { error: "Profile image URL must start with /, http://, or https://." },
          { status: 400 }
        );
      } else {
        updateData.image = candidate;
      }
    }

    if (body.sortOrder !== undefined) {
      const parsedOrder = Number.parseInt(String(body.sortOrder), 10);
      if (Number.isFinite(parsedOrder)) {
        updateData.sortOrder = parsedOrder;
      }
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    const member = await prisma.teamMember.update({ where: { id }, data: updateData });

    revalidatePath("/about");
    revalidatePath("/");

    await logActivity(
      "UPDATED",
      "TeamMember",
      `Updated team member: ${member.name}`,
      member.id,
      auth.user.userId
    );
    return NextResponse.json(member);
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Team member not found." }, { status: 404 });
    }
    console.error("Failed to update team member:", error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const deleted = await prisma.teamMember.delete({ where: { id } });

    revalidatePath("/about");
    revalidatePath("/");

    await logActivity(
      "DELETED",
      "TeamMember",
      `Deleted team member: ${deleted.name}`,
      id,
      auth.user.userId
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Team member not found." }, { status: 404 });
    }
    console.error("Failed to delete team member:", error);
    return NextResponse.json(
      { error: "Failed to delete team member" },
      { status: 500 }
    );
  }
}
