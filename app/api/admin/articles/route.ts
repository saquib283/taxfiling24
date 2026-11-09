import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();

    // Basic Validation
    if (!data.title || !data.slug || !data.content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const article = await prisma.article.create({
      data: {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt || null,
        thumbnailUrl: data.thumbnailUrl || null,
        category: data.category || null,
        tags: data.tags || [],
        readTime: data.readTime || null,
        isFeatured: data.isFeatured ?? false,
        metaTitle: data.metaTitle || null,
        metaDescription: data.metaDescription || null,
        published: data.published ?? false,
      },
    });

    await logActivity("CREATED", "Article", `Created article: ${article.title}`, article.id);
    return NextResponse.json(article);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Slug already exists. Try changing the title." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
