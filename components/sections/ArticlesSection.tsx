"use client";

import NextLink from "next/link";
import { ArrowRight, Calendar, Bookmark, TrendingUp } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import Image from "next/image";

interface ArticlesSectionProps {
  articles: any[];
  settings?: Record<string, string>;
}

export default function ArticlesSection({ articles, settings = {} }: ArticlesSectionProps) {
  if (!articles || articles.length === 0) return null;

  const sectionTitle = settings.articles_title || "Strategic Knowledge & Regulatory Updates";
  const sectionSubtext = settings.articles_subtext || "Stay ahead of the curve with our professional analysis of India's evolving financial landscape, tax regulations, and corporate compliance standards.";

  return (
    <section id="articles" className="py-24 lg:py-32 bg-[var(--bg)] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 h-96 w-96 bg-[var(--primary)]/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 h-80 w-80 bg-[var(--accent)]/5 blur-[100px] rounded-full -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Header */}
        <AnimatedSection className="max-w-3xl mx-auto text-center mb-20">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--primary)]">
            <TrendingUp size={14} />
            Market Insights & Compliance Hub
          </div>
          <h2 className="mb-6 text-3xl font-extrabold tracking-tight text-[var(--fg)] sm:text-4xl lg:text-5xl">
            {sectionTitle === "Strategic Knowledge & Regulatory Updates" ? (
              <>Strategic Knowledge & <span className="text-[var(--primary)]">Regulatory Updates</span></>
            ) : sectionTitle}
          </h2>
          <p className="text-lg text-[var(--fg-muted)] leading-relaxed">
            {sectionSubtext}
          </p>
        </AnimatedSection>

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <AnimatedSection key={article.id}>
              <NextLink href={`/articles/${article.slug}`} className="group block h-full">
                <div className="relative flex flex-col h-full bg-white/40 backdrop-blur-xl border border-white rounded-[2.5rem] overflow-hidden shadow-2xl transition-all duration-700 hover:-translate-y-3 group-hover:shadow-[0_20px_50px_rgba(var(--primary-rgb),0.1)]">
                  {/* Glass Card Inner Border Glow */}
                  <div className="absolute inset-0 rounded-[2.5rem] border border-white/20 pointer-events-none" />
                  
                  {/* Thumbnail with Soft Overlay */}
                  <div className="aspect-[16/11] relative overflow-hidden bg-slate-50">
                    <Image
                      src={article.thumbnailUrl || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80"}
                      alt={article.title}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    
                    {/* Category/Tag Floating */}
                    <div className="absolute top-4 left-4">
                       <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-[var(--primary)] shadow-sm flex items-center gap-1.5">
                          <Bookmark size={10} />
                          Professional Update
                       </div>
                    </div>
                  </div>

                  {/* Content with Enhanced Padding & Hierarchy */}
                  <div className="p-10 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">
                      <Calendar className="h-3.5 w-3.5 text-[var(--primary)]" />
                      {new Date(article.createdAt).toLocaleDateString("en-US", {
                        month: "long", day: "numeric", year: "numeric"
                      })}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-5 group-hover:text-[var(--primary)] transition-colors duration-300 line-clamp-2 leading-tight tracking-tight">
                      {article.title}
                    </h3>

                    {article.excerpt && (
                      <p className="text-slate-500 text-sm leading-relaxed mb-10 flex-1 line-clamp-3">
                        {article.excerpt}
                      </p>
                    )}

                    {/* Bottom Link Style */}
                    <div className="pt-6 border-t border-slate-100 flex items-center justify-between group/link">
                      <span className="text-sm font-extrabold text-slate-900 group-hover/link:text-[var(--primary)] transition-colors tracking-tight">
                        Explore Full Insight
                      </span>
                      <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover/link:bg-[var(--primary)] group-hover/link:text-white group-hover/link:scale-110 transition-all duration-500">
                        <ArrowRight className="h-5 w-5 transition-transform group-hover/link:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </NextLink>
            </AnimatedSection>
          ))}
        </div>

        {/* Centered Explore All Link */}
        <AnimatedSection className="mt-20 text-center">
          <NextLink 
            href="/articles" 
            className="inline-flex items-center gap-3 rounded-full bg-white border border-slate-200 px-8 py-4 text-sm font-bold text-slate-900 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:border-[var(--primary)]/30 hover:-translate-y-1"
          >
            <span>Access Complete Knowledge Base</span>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-400 group-hover:bg-[var(--primary)] group-hover:text-white transition-all duration-500">
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </NextLink>
        </AnimatedSection>
      </div>
    </section>
  );
}
