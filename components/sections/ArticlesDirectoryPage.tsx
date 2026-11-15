"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  thumbnailUrl: string | null;
  category?: string | null;
  readTime?: number | null;
  isFeatured?: boolean;
  author?: string | null;
  createdAt: Date | string;
}

interface ArticlesDirectoryPageProps {
  articles: ArticleItem[];
  heroContent?: {
    title?: string;
    description?: string;
    emptyTitle?: string;
    emptyDescription?: string;
    readMoreText?: string;
  };
}

function formatCategoryLabel(category?: string | null): string {
  if (!category) return "Tax & Advisory";
  return category
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ArticlesDirectoryPage({
  articles,
  heroContent,
}: ArticlesDirectoryPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = useMemo(() => {
    const rawCategories = Array.from(
      new Set(articles.map((a) => a.category).filter(Boolean) as string[])
    );
    return [
      { id: "all", name: "All Topics" },
      ...rawCategories.map((cat) => ({
        id: cat,
        name: formatCategoryLabel(cat),
      })),
    ];
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        article.title.toLowerCase().includes(query) ||
        (article.excerpt && article.excerpt.toLowerCase().includes(query));
      const matchesCategory =
        selectedCategory === "all" || article.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [articles, searchTerm, selectedCategory]);

  const hasActiveFilters = searchTerm !== "" || selectedCategory !== "all";

  // When no filters are active and we have ≥ 2 articles, take the first featured (or first) as Spotlight
  const featuredArticle = useMemo(() => {
    if (hasActiveFilters || filteredArticles.length < 2) return null;
    return filteredArticles.find((a) => a.isFeatured) || filteredArticles[0];
  }, [hasActiveFilters, filteredArticles]);

  const regularArticles = useMemo(() => {
    if (!featuredArticle) return filteredArticles;
    return filteredArticles.filter((a) => a.id !== featuredArticle.id);
  }, [featuredArticle, filteredArticles]);

  const readMoreLabel = heroContent?.readMoreText || "Read Full Article";

  return (
    <div className="min-h-screen bg-[var(--bg)] selection:bg-[var(--primary)] selection:text-white">
      {/* ─── Sleek Compact Brand Hero ─── */}
      <section className="relative overflow-hidden bg-[var(--primary)] border-b border-white/10">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="absolute top-0 right-0 h-80 w-80 -translate-y-1/2 translate-x-1/4 rounded-full bg-[var(--accent)]/15 blur-[100px] pointer-events-none" />

        <div className="container relative mx-auto px-6 py-10 sm:py-12 lg:py-14">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight mb-2.5">
                {heroContent?.title || "Insights &"}{" "}
                <span className="text-[var(--accent)]">Regulatory Updates</span>
              </h1>
              <p className="text-sm sm:text-base text-white/70 leading-relaxed max-w-xl">
                {heroContent?.description ||
                  "Expert statutory analysis, Union Budget breakdowns, GST case studies, and corporate compliance guides from certified chartered accountants."}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-6 sm:gap-8 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5 backdrop-blur-xs shrink-0">
              <div>
                <div className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums">
                  {articles.length}
                </div>
                <div className="text-[10px] text-white/50 font-medium uppercase tracking-wider mt-0.5">
                  Published Guides
                </div>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div>
                <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  100%
                </div>
                <div className="text-[10px] text-white/50 font-medium uppercase tracking-wider mt-0.5">
                  CA Verified
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Sticky Filter & Search Bar ─── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/60">
        <div className="container mx-auto px-6">
          <div className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            {/* Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64 lg:w-72">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search articles & topics…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white pl-8.5 pr-8.5 py-1.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[var(--primary)]/30 focus:ring-2 focus:ring-[var(--primary)]/8"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Results Counter (Active Filters) ─── */}
      {hasActiveFilters && (
        <div className="container mx-auto px-6 pt-6">
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-slate-500">
              <span className="font-semibold text-slate-900 tabular-nums">
                {filteredArticles.length}
              </span>{" "}
              {filteredArticles.length === 1 ? "article" : "articles"} found
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="text-xs font-semibold text-[var(--primary)] hover:underline"
            >
              Reset all filters
            </button>
          </div>
        </div>
      )}

      {/* ─── Articles Content Area ─── */}
      <div className="container mx-auto px-6 py-8 sm:py-10 lg:py-12">
        <AnimatePresence mode="wait">
          {filteredArticles.length > 0 ? (
            <motion.div
              key="articles-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-10"
            >
              {/* ── Spotlight Featured Article (Lead Story) ── */}
              {featuredArticle && (
                <div className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white transition-all duration-300 hover:border-[var(--primary)]/20 hover:shadow-[0_12px_36px_-12px_rgba(10,37,64,0.12)]">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
                    {/* Thumbnail */}
                    <div className="lg:col-span-7 relative min-h-[260px] sm:min-h-[320px] lg:min-h-[360px] overflow-hidden bg-slate-100">
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{
                          backgroundImage: featuredArticle.thumbnailUrl
                            ? `url(${featuredArticle.thumbnailUrl})`
                            : "url(https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=900&q=80)",
                        }}
                      />
                      <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                        <Sparkles className="h-3 w-3 text-[var(--accent)]" />
                        Featured Analysis
                      </div>
                    </div>

                    {/* Content */}
                    <div className="lg:col-span-5 p-7 sm:p-9 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-medium mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
                            {formatCategoryLabel(featuredArticle.category)}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {featuredArticle.readTime || 5} min read
                          </span>
                        </div>

                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 group-hover:text-[var(--primary)] transition-colors leading-snug mb-3">
                          <Link href={`/articles/${featuredArticle.slug}`}>
                            {featuredArticle.title}
                          </Link>
                        </h2>

                        {featuredArticle.excerpt && (
                          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed line-clamp-3 mb-6">
                            {featuredArticle.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>
                            {new Date(featuredArticle.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        <Link
                          href={`/articles/${featuredArticle.slug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] group-hover:translate-x-0.5 transition-transform"
                        >
                          <span>{readMoreLabel}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Standard Articles Grid ── */}
              {regularArticles.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                  {regularArticles.map((article, idx) => (
                    <motion.div
                      key={article.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.3) }}
                    >
                      <Link
                        href={`/articles/${article.slug}`}
                        className="group flex flex-col h-full rounded-2xl border border-slate-200/60 bg-white overflow-hidden transition-all duration-300 hover:border-[var(--primary)]/20 hover:shadow-[0_8px_30px_-12px_rgba(10,37,64,0.12)]"
                      >
                        {/* Image Thumbnail */}
                        <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                          <div
                            className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                            style={{
                              backgroundImage: article.thumbnailUrl
                                ? `url(${article.thumbnailUrl})`
                                : "url(https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&q=80)",
                            }}
                          />
                        </div>

                        {/* Article Meta & Info */}
                        <div className="p-6 flex flex-col flex-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-3">
                            <span className="font-bold uppercase tracking-wider text-[var(--primary)]">
                              {formatCategoryLabel(article.category)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {article.readTime || 4} min
                            </span>
                          </div>

                          <h3 className="text-base font-semibold text-slate-900 group-hover:text-[var(--primary)] transition-colors line-clamp-2 leading-snug mb-2">
                            {article.title}
                          </h3>

                          {article.excerpt && (
                            <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed mb-6 flex-1">
                              {article.excerpt}
                            </p>
                          )}

                          <div className="pt-4 border-t border-slate-100 mt-auto flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-medium">
                              {new Date(article.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>

                            <div className="flex items-center gap-1 text-xs font-semibold text-slate-900 group-hover:text-[var(--primary)] transition-colors">
                              <span>Read</span>
                              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="no-articles"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 sm:py-32 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 mb-4">
                <BookOpen className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1.5">
                {heroContent?.emptyTitle || "No matching articles found"}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mb-6 leading-relaxed">
                {heroContent?.emptyDescription ||
                  "Try another search keyword or switch categories to view related guides."}
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                Clear all filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
