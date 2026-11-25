import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { ArticleCategory } from "@prisma/client";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireRole } from "@/lib/auth";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { isSafeMediaUrl } from "@/lib/url-safety";

const VALID_ARTICLE_CATEGORIES = new Set<string>(Object.values(ArticleCategory));

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function GET() {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(articles);
  } catch (error: unknown) {
    console.error("Failed to fetch articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const data = await request.json();

    const title = typeof data.title === "string" ? data.title.trim() : "";
    const rawSlug = typeof data.slug === "string" && data.slug.trim() ? data.slug : title;
    const slug = slugify(rawSlug);
    const rawContent = typeof data.content === "string" ? data.content : "";
    const sanitizedContent = sanitizeHtml(rawContent).trim();

    if (!title || !slug || !sanitizedContent) {
      return NextResponse.json(
        { error: "Title, valid slug, and body content are required." },
        { status: 400 }
      );
    }

    let category: ArticleCategory | null = null;
    if (data.category !== undefined && data.category !== null && data.category !== "") {
      const catStr = String(data.category).trim();
      if (!VALID_ARTICLE_CATEGORIES.has(catStr)) {
        return NextResponse.json({ error: "Invalid article category." }, { status: 400 });
      }
      category = catStr as ArticleCategory;
    }

    let thumbnailUrl: string | null = null;
    if (typeof data.thumbnailUrl === "string" && data.thumbnailUrl.trim()) {
      const candidate = data.thumbnailUrl.trim();
      if (!isSafeMediaUrl(candidate)) {
        return NextResponse.json(
          { error: "Thumbnail URL must start with /, http://, or https://." },
          { status: 400 }
        );
      }
      thumbnailUrl = candidate;
    }

    const tags = Array.isArray(data.tags)
      ? data.tags.map((t: unknown) => String(t ?? "").trim()).filter(Boolean)
      : [];

    const parsedReadTime =
      data.readTime !== undefined && data.readTime !== null && data.readTime !== ""
        ? Number.parseInt(String(data.readTime), 10)
        : null;
    const readTime =
      parsedReadTime !== null && Number.isFinite(parsedReadTime) && parsedReadTime > 0
        ? Math.min(parsedReadTime, 180)
        : null;

    const published = Boolean(data.published);

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        content: sanitizedContent,
        excerpt: typeof data.excerpt === "string" && data.excerpt.trim() ? data.excerpt.trim() : null,
        thumbnailUrl,
        category,
        tags,
        readTime,
        isFeatured: Boolean(data.isFeatured),
        metaTitle:
          typeof data.metaTitle === "string" && data.metaTitle.trim() ? data.metaTitle.trim() : null,
        metaDescription:
          typeof data.metaDescription === "string" && data.metaDescription.trim()
            ? data.metaDescription.trim()
            : null,
        published,
        publishedAt: published ? new Date() : null,
        author: auth.user.name || "TaxFiling24 Editorial Team",
      },
    });

    revalidatePath("/");
    revalidatePath("/articles");
    revalidatePath(`/articles/${article.slug}`);
    revalidatePath("/sitemap.xml");

    await logActivity("CREATED", "Article", `Created article: ${article.title}`, article.id, auth.user.userId);
    return NextResponse.json(article, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json(
        { error: "An article with this slug already exists. Try changing the slug or title." },
        { status: 409 }
      );
    }
    console.error("Failed to create article:", error);
    return NextResponse.json(
      { error: "Failed to create article" },
      { status: 500 }
    );
  }
}
