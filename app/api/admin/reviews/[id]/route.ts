import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireRole } from "@/lib/auth";
import { isSafeMediaUrl } from "@/lib/url-safety";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: {
      isApproved?: boolean;
      name?: string;
      role?: string | null;
      content?: string;
      rating?: number;
      avatar?: string | null;
    } = {};

    if (body.isApproved !== undefined) {
      updateData.isApproved = Boolean(body.isApproved);
    }

    if (body.name !== undefined) {
      const name = String(body.name ?? "").trim();
      if (!name) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
      updateData.name = name;
    }

    if (body.role !== undefined) {
      const role = typeof body.role === "string" ? body.role.trim() : "";
      updateData.role = role || null;
    }

    if (body.content !== undefined) {
      const content = String(body.content ?? "").trim();
      if (!content) return NextResponse.json({ error: "Content cannot be empty." }, { status: 400 });
      updateData.content = content;
    }

    if (body.rating !== undefined) {
      const parsedRating = Number.parseInt(String(body.rating), 10);
      if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return NextResponse.json(
          { error: "Rating must be a whole number between 1 and 5." },
          { status: 400 }
        );
      }
      updateData.rating = parsedRating;
    }

    if (body.avatar !== undefined) {
      const candidate = typeof body.avatar === "string" ? body.avatar.trim() : "";
      if (!candidate) {
        updateData.avatar = null;
      } else if (!isSafeMediaUrl(candidate)) {
        return NextResponse.json(
          { error: "Avatar URL must start with /, http://, or https://." },
          { status: 400 }
        );
      } else {
        updateData.avatar = candidate;
      }
    }

    const review = await prisma.review.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/");

    const action =
      body.isApproved !== undefined ? (review.isApproved ? "APPROVED" : "REJECTED") : "UPDATED";
    await logActivity(
      action,
      "Review",
      `Review by ${review.name} ${action.toLowerCase()}`,
      id,
      auth.user.userId
    );
    return NextResponse.json(review);
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }
    console.error("Failed to update review:", error);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const deleted = await prisma.review.delete({
      where: { id },
    });

    revalidatePath("/");

    await logActivity("DELETED", "Review", `Deleted review by ${deleted.name}`, id, auth.user.userId);
    return NextResponse.json({ message: "Review deleted successfully" });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Review not found." }, { status: 404 });
    }
    console.error("Failed to delete review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
