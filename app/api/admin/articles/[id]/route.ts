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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }

    const data = await request.json();

    const title = typeof data.title === "string" ? data.title.trim() : existing.title;
    const slug =
      typeof data.slug === "string" && data.slug.trim() ? slugify(data.slug) : existing.slug;
    const sanitizedContent =
      typeof data.content === "string" ? sanitizeHtml(data.content).trim() : existing.content;

    if (!title || !slug || !sanitizedContent) {
      return NextResponse.json(
        { error: "Title, valid slug, and body content are required." },
        { status: 400 }
      );
    }

    let category: ArticleCategory | null | undefined = undefined;
    if (data.category !== undefined) {
      if (data.category === null || data.category === "") {
        category = null;
      } else {
        const catStr = String(data.category).trim();
        if (!VALID_ARTICLE_CATEGORIES.has(catStr)) {
          return NextResponse.json({ error: "Invalid article category." }, { status: 400 });
        }
        category = catStr as ArticleCategory;
      }
    }

    let thumbnailUrl: string | null | undefined = undefined;
    if (data.thumbnailUrl !== undefined) {
      const candidate = typeof data.thumbnailUrl === "string" ? data.thumbnailUrl.trim() : "";
      if (!candidate) {
        thumbnailUrl = null;
      } else if (!isSafeMediaUrl(candidate)) {
        return NextResponse.json(
          { error: "Thumbnail URL must start with /, http://, or https://." },
          { status: 400 }
        );
      } else {
        thumbnailUrl = candidate;
      }
    }

    const tags =
      data.tags !== undefined
        ? Array.isArray(data.tags)
          ? data.tags.map((t: unknown) => String(t ?? "").trim()).filter(Boolean)
          : []
        : undefined;

    let readTime: number | null | undefined = undefined;
    if (data.readTime !== undefined) {
      if (data.readTime === null || data.readTime === "") {
        readTime = null;
      } else {
        const parsed = Number.parseInt(String(data.readTime), 10);
        readTime = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 180) : null;
      }
    }

    const published = data.published !== undefined ? Boolean(data.published) : existing.published;
    const publishedAt =
      published && !existing.publishedAt ? new Date() : existing.publishedAt;

    const article = await prisma.article.update({
      where: { id },
      data: {
        title,
        slug,
        content: sanitizedContent,
        excerpt:
          data.excerpt !== undefined
            ? typeof data.excerpt === "string" && data.excerpt.trim()
              ? data.excerpt.trim()
              : null
            : undefined,
        thumbnailUrl,
        category,
        tags,
        readTime,
        isFeatured: data.isFeatured !== undefined ? Boolean(data.isFeatured) : undefined,
        metaTitle:
          data.metaTitle !== undefined
            ? typeof data.metaTitle === "string" && data.metaTitle.trim()
              ? data.metaTitle.trim()
              : null
            : undefined,
        metaDescription:
          data.metaDescription !== undefined
            ? typeof data.metaDescription === "string" && data.metaDescription.trim()
              ? data.metaDescription.trim()
              : null
            : undefined,
        published,
        publishedAt,
      },
    });

    revalidatePath("/");
    revalidatePath("/articles");
    revalidatePath(`/articles/${existing.slug}`);
    if (article.slug !== existing.slug) {
      revalidatePath(`/articles/${article.slug}`);
    }
    revalidatePath("/sitemap.xml");

    await logActivity("UPDATED", "Article", `Updated article: ${article.title}`, article.id, auth.user.userId);
    return NextResponse.json(article);
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json({ error: "An article with this slug already exists." }, { status: 409 });
    }
    if (code === "P2025") {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }
    console.error("Failed to update article:", error);
    return NextResponse.json(
      { error: "Failed to update article" },
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
    const deleted = await prisma.article.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/articles");
    revalidatePath(`/articles/${deleted.slug}`);
    revalidatePath("/sitemap.xml");

    await logActivity("DELETED", "Article", `Deleted article: ${deleted.title}`, id, auth.user.userId);
    return NextResponse.json({ message: "Article deleted successfully" });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }
    console.error("Failed to delete article:", error);
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
