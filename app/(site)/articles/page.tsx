import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Calendar, User } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import JsonLd, { breadcrumbSchema, webPageSchema } from "@/components/seo/JsonLd";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles & Insights",
  description:
    "Stay updated with the latest tax guidelines, GST updates, corporate compliance tips, and financial news from TaxFiling24 experts.",
  alternates: {
    canonical: "https://taxfiling24.com/articles",
  },
  openGraph: {
    title: "Articles & Insights | TaxFiling24",
    description:
      "Stay updated with the latest tax guidelines, GST updates, corporate compliance tips, and financial news.",
    url: "https://taxfiling24.com/articles",
  },
};

export default async function ArticlesPage() {
  let articles: any[] = [];
  try {
    articles = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Database Error (Articles Index):", error);
  }

  return (
    <div className="bg-[var(--bg)] min-h-screen py-16 lg:py-24">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: "https://taxfiling24.com" },
            { name: "Articles", url: "https://taxfiling24.com/articles" },
          ]),
        ]}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-16">
          <h1 className="text-4xl font-bold text-[var(--fg)] sm:text-5xl mb-4">
            Insights & Updates
          </h1>
          <p className="mx-auto max-w-xl text-[var(--fg-muted)]">
            Stay ahead with the latest tax guidelines, corporate compliance tips, and financial news.
          </p>
        </AnimatedSection>

        {articles.length === 0 ? (
          <div className="text-center py-12 text-[var(--fg-muted)]">
            No articles published yet. Check back soon!
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article: any) => (
              <AnimatedSection key={article.id}>
                <Link href={`/articles/${article.slug}`} className="group block h-full">
                  <div className="group relative flex flex-col h-full bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 focus-within:ring-2 focus-within:ring-[var(--primary)]/20">
                    {/* Thumbnail/Placeholder with Overlay Line */}
                    <div className="aspect-[16/10] relative overflow-hidden bg-slate-50 border-b border-slate-50">
                      <div 
                        className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: article.thumbnailUrl ? `url(${article.thumbnailUrl})` : 'url(https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80)' }}
                      />
                      {/* Sub-accent line on hover */}
                      <div className="absolute bottom-0 left-0 h-1 w-0 bg-[var(--primary)] group-hover:w-full transition-all duration-500 ease-in-out" />
                    </div>

                    {/* Content Section */}
                    <div className="p-8 flex-1 flex flex-col">
                      <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 mb-4">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100 group-hover:border-[var(--primary)]/20 group-hover:text-[var(--primary)] transition-colors duration-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(article.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold text-slate-900 mb-3 group-hover:text-[var(--primary)] transition-colors duration-300 line-clamp-2 leading-tight tracking-tight">
                        {article.title}
                      </h3>

                      {article.excerpt && (
                        <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1 line-clamp-3">
                          {article.excerpt}
                        </p>
                      )}

                      <div className="pt-6 border-t border-slate-50 mt-auto flex items-center justify-between group/cta">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-[var(--primary)] transition-colors">
                          Read Full Article
                        </span>
                        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[var(--primary)] group-hover:text-white transition-all duration-300">
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
