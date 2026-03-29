import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Calendar, User, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AnimatedSection from "@/components/ui/AnimatedSection";
import JsonLd, { articleSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import { findManagedSection, getManagedPageSections } from "@/lib/managed-pages";
import { getSettings } from "@/lib/settings";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      select: {
        title: true,
        metaDescription: true,
        excerpt: true,
        thumbnailUrl: true,
        author: true,
        createdAt: true,
        tags: true,
      },
    });

    if (!article) return { title: "Article Not Found" };


  const description =
    article.metaDescription || article.excerpt || "Read our latest article insights.";

  return {
    title: article.title,
    description,
    alternates: {
      canonical: `https://taxfiling24.com/articles/${slug}`,
    },
    openGraph: {
      type: "article" as const,
      title: `${article.title} | TaxFiling24`,
      description,
      url: `https://taxfiling24.com/articles/${slug}`,
      ...(article.thumbnailUrl
        ? {
            images: [
              {
                url: article.thumbnailUrl,
                width: 1200,
                height: 630,
                alt: article.title,
              },
            ],
          }
        : {}),
      publishedTime: article.createdAt.toISOString(),
      authors: [article.author],
      tags: article.tags || [],
    },
    twitter: {
      card: "summary_large_image" as const,
      title: article.title,
      description,
      ...(article.thumbnailUrl ? { images: [article.thumbnailUrl] } : {}),
    },
  };
  } catch (error) {
    console.error("SEO Metadata Error (Articles):", error);
    return { title: "Article | TaxFiling24" };
  }
}

export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    select: { slug: true },
    where: { published: true }
  });
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const settings = await getSettings();
  const template =
    findManagedSection<Record<string, unknown>>(
      getManagedPageSections("articleDetail", settings),
      "article-detail.template"
    )?.data || {};
  let article = null;

  try {
    article = await prisma.article.findUnique({
      where: { slug },
    });
  } catch (error) {
    console.error("Database Error (Article Detail):", error);
  }

  if (!article || !article.published) {
    notFound();
  }

  return (
    <article className="min-h-screen bg-[var(--bg)] py-16 lg:py-24">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: "https://taxfiling24.com" },
            { name: "Articles", url: "https://taxfiling24.com/articles" },
            { name: article.title, url: `https://taxfiling24.com/articles/${slug}` },
          ]),
          articleSchema({
            title: article.title,
            description: article.metaDescription || article.excerpt || "",
            url: `https://taxfiling24.com/articles/${slug}`,
            image: article.thumbnailUrl || undefined,
            datePublished: article.createdAt.toISOString(),
            dateModified: (article.updatedAt || article.createdAt).toISOString(),
            author: article.author,
            tags: article.tags || [],
          }),
        ]}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <AnimatedSection className="mb-8">
          <Link
            href="/articles"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {String(template.backLabel || "Back to Articles")}
          </Link>
        </AnimatedSection>

        <AnimatedSection className="mb-12">
          {article.category && (
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--primary-soft)] bg-blue-50 text-[var(--primary)] text-xs font-bold mb-4">
              {article.category.replace(/_/g, " ")}
            </span>
          )}
          <h1 className="text-3xl font-black sm:text-4xl lg:text-5xl tracking-tight text-[var(--fg)] mb-6 leading-[1.2]">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--fg-muted)] border-b border-[var(--border)] pb-8">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(article.createdAt).toLocaleDateString()}</span>
            </div>
            {article.readTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {article.readTime} {String(template.readTimeSuffix || "min read")}
                </span>
              </div>
            )}
          </div>
        </AnimatedSection>

        {article.thumbnailUrl && (
          <AnimatedSection className="mb-12">
            <img
              src={article.thumbnailUrl}
              alt={article.title}
              className="rounded-2xl w-full aspect-video object-cover shadow-[var(--shadow-md)]"
            />
          </AnimatedSection>
        )}

        <AnimatedSection className="max-w-none text-[var(--fg-soft)]">
          <div className="tiptap" dangerouslySetInnerHTML={{ __html: article.content }} />
        </AnimatedSection>

        {article.tags && article.tags.length > 0 && (
          <AnimatedSection className="mt-16 pt-8 border-t border-[var(--border)] flex flex-wrap gap-2">
            {article.tags.map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-md text-sm text-[var(--fg-muted)]">
                #{tag}
              </span>
            ))}
          </AnimatedSection>
        )}
      </div>
    </article>
  );
}
