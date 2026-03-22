import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Calendar, User } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";

export default async function ArticlesPage() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="bg-[var(--bg)] min-h-screen py-16 lg:py-24">
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
                  <div className="flex flex-col h-full bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all duration-300">
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gray-100 relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: article.thumbnailUrl ? `url(${article.thumbnailUrl})` : 'url(https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80)' }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:opacity-40 transition-opacity" />
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-center gap-4 text-xs text-[var(--fg-soft)] mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(article.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-[var(--fg)] mb-2 group-hover:text-[var(--primary)] transition-colors line-clamp-2">
                        {article.title}
                      </h3>

                      {article.excerpt && (
                        <p className="text-sm text-[var(--fg-muted)] mb-4 flex-1 line-clamp-3">
                          {article.excerpt}
                        </p>
                      )}

                      <div className="pt-4 border-t border-[var(--border)] mt-auto flex items-center justify-between text-sm font-semibold text-[var(--primary)]">
                        <span>Read More</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
