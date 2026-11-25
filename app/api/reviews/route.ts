import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
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
      select: {
        id: true,
        name: true,
        role: true,
        content: true,
        rating: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (dbReviews.length > 0) {
      return NextResponse.json(dbReviews);
    }

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
    const ip = getClientIp(request);
    const rate = checkRateLimit("public-review-post", ip, {
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many review submissions. Please wait before submitting again." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const { name, role, content, rating } = body as Record<string, unknown>;
    const cleanName = typeof name === "string" ? name.trim().slice(0, 100) : "";
    const cleanRole = typeof role === "string" && role.trim() ? role.trim().slice(0, 100) : null;
    const cleanContent = typeof content === "string" ? content.trim().slice(0, 2000) : "";

    if (!cleanName || !cleanContent) {
      return NextResponse.json(
        { error: "Name and review content are required." },
        { status: 400 }
      );
    }

    const parsedRating = Number.parseInt(String(rating ?? 5), 10);
    const safeRating = Number.isFinite(parsedRating)
      ? Math.min(5, Math.max(1, parsedRating))
      : 5;

    const review = await prisma.review.create({
      data: {
        name: cleanName,
        role: cleanRole,
        content: cleanContent,
        rating: safeRating,
        isApproved: false, // Subject to admin moderation in dashboard
      },
    });

    await logActivity("CREATED", "Review", `New review submitted by ${review.name}`, review.id);

    return NextResponse.json(
      {
        success: true,
        message: "Thank you for your review! It will appear on the website once approved.",
        id: review.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save review:", error);
    return NextResponse.json({ error: "Failed to submit review." }, { status: 500 });
  }
}
