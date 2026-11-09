import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import fs from "fs";
import path from "path";

const dataFilePath = path.join(process.cwd(), "data", "testimonials.json");

function getFallbackReviews() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const fileData = fs.readFileSync(dataFilePath, "utf8");
      return JSON.parse(fileData);
    }
  } catch (e) {
    console.error("Failed to read fallback testimonials:", e);
  }
  return [];
}

export async function GET() {
  try {
    const dbReviews = await prisma.review.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: "desc" },
    });

    if (dbReviews.length > 0) {
      return NextResponse.json(dbReviews);
    }

    // Fallback if no database reviews exist yet
    const fallback = getFallbackReviews();
    return NextResponse.json(fallback);
  } catch (error) {
    console.error("Failed to load reviews from DB:", error);
    const fallback = getFallbackReviews();
    return NextResponse.json(fallback);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, role, content, rating } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: "Name and content are required." },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        name: String(name).trim(),
        role: role ? String(role).trim() : null,
        content: String(content).trim(),
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        isApproved: false, // Subject to admin moderation in dashboard
      },
    });

    await logActivity("CREATED", "Review", `New review submitted by ${review.name}`, review.id);

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for your review! It will appear on the website once approved.",
        review,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Failed to save review:", error);
    return NextResponse.json({ error: "Failed to submit review." }, { status: 500 });
  }
}
