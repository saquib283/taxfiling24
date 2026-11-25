import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireRole } from "@/lib/auth";
import { isSafeMediaUrl } from "@/lib/url-safety";

export async function GET() {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const members = await prisma.teamMember.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(members);
  } catch (error: unknown) {
    console.error("Failed to fetch team members:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const designation = typeof body.designation === "string" ? body.designation.trim() : "";

    if (!name || !designation) {
      return NextResponse.json(
        { error: "Name and designation are required." },
        { status: 400 }
      );
    }

    let image: string | null = null;
    if (typeof body.image === "string" && body.image.trim()) {
      const candidate = body.image.trim();
      if (!isSafeMediaUrl(candidate)) {
        return NextResponse.json(
          { error: "Profile image URL must start with /, http://, or https://." },
          { status: 400 }
        );
      }
      image = candidate;
    }

    const parsedOrder = Number.parseInt(String(body.sortOrder ?? 0), 10);
    const sortOrder = Number.isFinite(parsedOrder) ? parsedOrder : 0;

    const member = await prisma.teamMember.create({
      data: {
        name,
        designation,
        image,
        sortOrder,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });

    revalidatePath("/about");
    revalidatePath("/");

    await logActivity(
      "CREATED",
      "TeamMember",
      `Added team member: ${member.name}`,
      member.id,
      auth.user.userId
    );
    return NextResponse.json(member, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to add team member:", error);
    return NextResponse.json(
      { error: "Failed to add team member" },
      { status: 500 }
    );
  }
}
