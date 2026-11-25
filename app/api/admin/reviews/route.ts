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
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reviews);
  } catch (error: unknown) {
    console.error("Failed to fetch reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
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
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!name || !content) {
      return NextResponse.json(
        { error: "Name and review content are required." },
        { status: 400 }
      );
    }

    const parsedRating =
      body.rating !== undefined && body.rating !== null && body.rating !== ""
        ? Number.parseInt(String(body.rating), 10)
        : 5;
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json(
        { error: "Rating must be a whole number between 1 and 5." },
        { status: 400 }
      );
    }

    let avatar: string | null = null;
    if (typeof body.avatar === "string" && body.avatar.trim()) {
      const candidate = body.avatar.trim();
      if (!isSafeMediaUrl(candidate)) {
        return NextResponse.json(
          { error: "Avatar URL must start with /, http://, or https://." },
          { status: 400 }
        );
      }
      avatar = candidate;
    }

    const review = await prisma.review.create({
      data: {
        name,
        role: typeof body.role === "string" && body.role.trim() ? body.role.trim() : null,
        content,
        rating: parsedRating,
        avatar,
        isApproved: body.isApproved !== undefined ? Boolean(body.isApproved) : true,
      },
    });

    revalidatePath("/");

    await logActivity("CREATED", "Review", `Created review by ${review.name}`, review.id, auth.user.userId);
    return NextResponse.json(review, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
