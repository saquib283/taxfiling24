export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Calendar, User, Clock, ArrowLeft, ArrowRight, Calculator, CalendarClock, BookOpen } from "lucide-react";
import Link from "next/link";
import AnimatedSection from "@/components/ui/AnimatedSection";
import JsonLd, { articleSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import { findManagedSection, getManagedPageSections } from "@/lib/managed-pages";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, buildMetadata, buildNoIndexMetadata, resolveSeoImage } from "@/lib/seo";
import { sanitizeHtml } from "@/lib/sanitize-html";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  try {
    const settings = await getSettings();
    const article = await prisma.article.findUnique({
      where: { slug },
      select: {
        published: true,
        metaTitle: true,
        title: true,
        metaDescription: true,
        excerpt: true,
        thumbnailUrl: true,
        author: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        tags: true,
      },
    });

    if (!article || !article.published) {
      return buildNoIndexMetadata("Article Not Found", settings);
    }

    const description =
      article.metaDescription || article.excerpt || "Read our latest article insights.";

    return buildMetadata({
      authors: [article.author],
      description,
      image: article.thumbnailUrl || undefined,
      keywords: (article.tags as string[]) || [],
      modifiedTime: (article.updatedAt || article.createdAt).toISOString(),
      path: `/articles/${slug}`,
      publishedTime: (article.publishedAt || article.createdAt).toISOString(),
      settings,
      tags: (article.tags as string[]) || [],
      title: article.metaTitle || article.title,
      type: "article",
    });
  } catch (error) {
    console.error("SEO Metadata Error (Articles):", error);
    return buildNoIndexMetadata("Article");
  }
}

export async function generateStaticParams() {
  try {
    const articles = await prisma.article.findMany({
      select: { slug: true },
      where: { published: true }
    });
    return articles.map((article: { slug: string }) => ({
      slug: article.slug,
    }));
  } catch (error) {
    console.warn("generateStaticParams (Articles) failed (DB likely offline during build):", error);
    return [];
  }
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
  let relatedArticles: any[] = [];

  try {
    article = await prisma.article.findUnique({
      where: { slug },
    });

    relatedArticles = await prisma.article.findMany({
      where: {
        published: true,
        slug: { not: slug },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        thumbnailUrl: true,
        category: true,
        createdAt: true,
        readTime: true,
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Database Error (Article Detail):", error);
  }

  if (!article || !article.published) {
    notFound();
  }

  // Increment article views asynchronously without blocking SSR
  prisma.article
    .update({
      where: { id: article.id },
      data: { views: { increment: 1 } },
    })
    .catch(() => {});

  const articleTags = (article.tags as string[]) || [];
  const publishedDate = article.publishedAt || article.createdAt;
  const publishedIso = publishedDate.toISOString();
  const modifiedIso = (article.updatedAt || article.createdAt).toISOString();
  const schemaImage = resolveSeoImage(article.thumbnailUrl, settings, {
    title: article.title,
    description: article.metaDescription || article.excerpt || undefined,
    category: "Article",
  });

  return (
    <article className="min-h-screen bg-[var(--bg)] py-16 lg:py-24">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Articles", url: absoluteUrl("/articles") },
            { name: article.title, url: absoluteUrl(`/articles/${slug}`) },
          ]),
          articleSchema({
            title: article.title,
            description: article.metaDescription || article.excerpt || "",
            url: absoluteUrl(`/articles/${slug}`),
            image: schemaImage,
            datePublished: publishedIso,
            dateModified: modifiedIso,
            author: article.author,
            tags: articleTags,
          }),
        ]}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* ─── Back Link ─── */}
        <div className="mb-6">
          <Link
            href="/articles"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {String(template.backLabel || "Back to Articles")}
          </Link>
        </div>

        {/* ─── Article Header & Meta ─── */}
        <header className="mb-10 max-w-5xl">
          {article.category && (
            <span className="inline-block px-3 py-1 rounded-full bg-[var(--primary-soft)] bg-blue-50 text-[var(--primary)] text-xs font-bold mb-4 tracking-wide">
              {article.category.replace(/_/g, " ")}
            </span>
          )}
          <h1 className="text-3xl font-black sm:text-4xl lg:text-5xl tracking-tight text-[var(--fg)] mb-6 leading-[1.2]">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--fg-muted)] border-b border-[var(--border)] pb-8">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{article.author?.toLowerCase() === "admin" ? "TaxFiling24 Editorial Team" : article.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <time dateTime={publishedIso}>
                {new Date(publishedDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
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
        </header>

        {/* ─── Main Content & Sidebar Grid ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Reading Column */}
          <div className="lg:col-span-8">
            {article.thumbnailUrl && (
              <div className="mb-10">
                {/* Thumbnail sources can be arbitrary CMS URLs, so keep a standard img here until remote patterns are curated. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.thumbnailUrl}
                  alt={article.title}
                  decoding="async"
                  loading="eager"
                  fetchPriority="high"
                  className="rounded-2xl w-full aspect-video object-cover shadow-[var(--shadow-md)] border border-slate-100"
                />
              </div>
            )}

            <div className="max-w-none text-[var(--fg-soft)]">
              <div className="tiptap prose prose-slate max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }} />
            </div>

            {articleTags.length > 0 && (
              <div className="mt-12 pt-6 border-t border-[var(--border)] flex flex-wrap gap-2">
                {articleTags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-md text-xs font-medium text-[var(--fg-muted)]">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sticky Resource & Advisory Sidebar */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            {/* CA Consultation Booking Card */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 p-6 shadow-sm">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-3">
                <CalendarClock className="h-3.5 w-3.5" />
                Chartered Advisory Desk
              </span>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight mb-2">
                Need Expert Statutory Assistance?
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-5">
                Connect directly with certified Chartered Accountants and Company Secretaries at TaxFiling24 for specialized guidance on your returns, filings, or incorporation.
              </p>
              <Link
                href="/book"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
              >
                <span>Book CA Consultation</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Financial Tools Card */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Calculator className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Tax & Financial Tools</h2>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Calculate your tax liabilities under Old vs New Tax Regime with our free statutory calculator.
              </p>
              <Link
                href="/tools/tax-calculator"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                <span>Open Tax Calculator</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Recommended Statutory Services */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <BookOpen className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">Key Statutory Services</h2>
              </div>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link href="/services/business-setup-registration-services" className="font-semibold text-slate-700 hover:text-indigo-600 flex items-center justify-between group transition">
                    <span>Pvt Ltd & Startup Incorporation</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 group-hover:text-indigo-600 transition" />
                  </Link>
                </li>
                <li>
                  <Link href="/services/taxation-gst-compliance-management" className="font-semibold text-slate-700 hover:text-indigo-600 flex items-center justify-between group transition">
                    <span>Taxation & GST Compliance</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 group-hover:text-indigo-600 transition" />
                  </Link>
                </li>
                <li>
                  <Link href="/services/corporate-roc-secretarial-filings" className="font-semibold text-slate-700 hover:text-indigo-600 flex items-center justify-between group transition">
                    <span>Corporate ROC & Secretarial</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 group-hover:text-indigo-600 transition" />
                  </Link>
                </li>
                <li>
                  <Link href="/services/virtual-cfo-advisory-services" className="font-semibold text-slate-700 hover:text-indigo-600 flex items-center justify-between group transition">
                    <span>Virtual CFO Advisory</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 group-hover:text-indigo-600 transition" />
                  </Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>

        {/* ─── Contextual Advisory & Deep Linking Box ─── */}
        <AnimatedSection className="mt-16 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 p-8 sm:p-10 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                <CalendarClock className="h-3.5 w-3.5" />
                Chartered Accountancy Advisory
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Need Guidance on Statutory Filings or Compliance?
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Connect directly with certified Chartered Accountants and Company Secretaries at TaxFiling24 to review your returns, capital gains, or business structure.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 active:scale-95"
              >
                <span>Book CA Consultation</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/tools/tax-calculator"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95"
              >
                <Calculator className="h-4 w-4 text-indigo-600" />
                <span>Tax Calculator</span>
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* ─── Related Articles Interlinking ─── */}
        {relatedArticles.length > 0 && (
          <AnimatedSection className="mt-16 pt-12 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Recommended Articles & Guides
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Explore related regulatory updates, tax planning tips, and compliance procedures.
                </p>
              </div>
              <Link
                href="/articles"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
              >
                <span>View all articles</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/articles/${rel.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm hover:shadow-md transition duration-200"
                >
                  <div>
                    {rel.category && (
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-3">
                        {rel.category.replace(/_/g, " ")}
                      </span>
                    )}
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition line-clamp-2 leading-snug">
                      {rel.title}
                    </h3>
                    {rel.excerpt && (
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                        {rel.excerpt}
                      </p>
                    )}
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                    <span>{rel.readTime || 4} min read</span>
                    <span className="inline-flex items-center gap-1 font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                      Read <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </AnimatedSection>
        )}
      </div>
    </article>
  );
}
