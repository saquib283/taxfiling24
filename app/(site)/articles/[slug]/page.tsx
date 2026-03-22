import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Calendar, User, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AnimatedSection from "@/components/ui/AnimatedSection";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
    select: { title: true, metaDescription: true },
  });

  if (!article) return { title: "Article Not Found" };

  return {
    title: `${article.title} | TaxFiling24`,
    description: article.metaDescription || "Read our latest article insights.",
  };
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
  const article = await prisma.article.findUnique({
    where: { slug },
  });

  if (!article || !article.published) {
    notFound();
  }

  return (
    <article className="min-h-screen bg-[var(--bg)] py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <AnimatedSection className="mb-8">
          <Link
            href="/articles"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Articles
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
                <span>{article.readTime} min read</span>
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
