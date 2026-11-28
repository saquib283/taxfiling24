"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  Building2,
  ChevronRight,
  ExternalLink,
  Percent,
  Search,
  SearchCode,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";

interface DirectoryService {
  id?: string;
  title: string;
  description: string;
  category?: string | null;
  slug?: string | null;
  href?: string | null;
}

const categoryIcons: Record<string, typeof Briefcase> = {
  tax: Percent,
  gst: Building2,
  audit: SearchCode,
  compliance: ShieldCheck,
  advisory: Briefcase,
};

/* ─── Service Card ─── */

function ServiceCard({
  service,
  defaultCategoryLabel,
  exploreButtonText,
}: {
  service: DirectoryService;
  defaultCategoryLabel: string;
  exploreButtonText: string;
}) {
  const categoryKey = service.category?.toLowerCase() || "default";
  const IconComponent = categoryIcons[categoryKey] || Briefcase;

  return (
    <Link
      href={service.href || `/services/${service.slug || service.id}`}
      className="group relative flex flex-col overflow-hidden bg-[var(--bg-card)] rounded-[var(--radius-lg)] border border-[var(--border)] transition-all duration-300 hover:border-[var(--primary-border)] hover:shadow-[var(--shadow-md)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/30 focus-visible:ring-offset-2"
    >
      {/* Top color bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-[var(--primary)] transition-transform duration-500 group-hover:scale-x-100" />

      <div className="flex flex-col flex-1 p-6 sm:p-7">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--primary)] transition-colors duration-300 group-hover:bg-[var(--primary)] group-hover:text-white group-hover:border-[var(--primary)]">
            <IconComponent className="h-5 w-5" strokeWidth={2} />
          </div>
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--fg-muted)]">
            {service.category || defaultCategoryLabel}
          </span>
        </div>

        {/* Content */}
        <h2 className="text-[1.05rem] font-semibold leading-snug text-[var(--fg)] mb-2.5 transition-colors duration-300 group-hover:text-[var(--primary)]">
          {service.title}
        </h2>
        <p className="text-[0.8rem] leading-relaxed text-[var(--fg-muted)] line-clamp-3 flex-1">
          {service.description}
        </p>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-[var(--border)] flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--fg)] group-hover:text-[var(--primary)] transition-colors">
            {exploreButtonText}
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-muted)] text-[var(--fg-muted)] transition-all duration-300 group-hover:bg-[var(--primary)] group-hover:text-white group-hover:translate-x-0.5">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Main Page ─── */

export default function ServicesDirectoryPage({
  services,
  heroContent,
  showHero,
  ctaContent,
  showCta,
  directoryContent,
  whatsappUrl,
  initialSearch = "",
}: {
  services: DirectoryService[];
  heroContent?: {
    titlePrefix?: string;
    titleHighlight?: string;
    description?: string;
    stats?: Array<{ id?: string; label?: string; value?: string; isVisible?: boolean }>;
  };
  showHero?: boolean;
  ctaContent?: {
    titlePrefix?: string;
    titleHighlight?: string;
    description?: string;
    primaryButtonText?: string;
    secondaryButtonText?: string;
  };
  showCta?: boolean;
  directoryContent?: {
    allServicesLabel?: string;
    searchPlaceholder?: string;
    messagePlaceholder?: string;
    exploreButtonText?: string;
    defaultCategoryLabel?: string;
    noResultsTitle?: string;
    noResultsDescription?: string;
    clearFiltersText?: string;
  };
  whatsappUrl?: string;
  initialSearch?: string;
}) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    setSearchTerm(initialSearch);
  }, [initialSearch]);

  const uniqueCategories = useMemo(
    () => Array.from(new Set(services.map((service) => service.category).filter(Boolean))),
    [services]
  );

  const categories = [
    { id: "all", name: directoryContent?.allServicesLabel || "All Services" },
    ...uniqueCategories.map((category) => ({ id: category as string, name: category as string })),
  ];

  const exploreButtonText = directoryContent?.exploreButtonText || "View details";
  const defaultCategoryLabel = directoryContent?.defaultCategoryLabel || "Consultancy";
  const noResultsTitle = directoryContent?.noResultsTitle || "No matching services";
  const noResultsDescription =
    directoryContent?.noResultsDescription ||
    "Try a different keyword or category, or reach out for custom requirements.";
  const clearFiltersText = directoryContent?.clearFiltersText || "Reset filters";
  const searchPlaceholder = directoryContent?.searchPlaceholder || "Search services…";

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const heroStats =
    heroContent?.stats?.filter((item) => item.isVisible !== false && item.label && item.value) || [
      { id: "trust", label: "Clients Served", value: "2,500+" },
      { id: "speed", label: "Avg. Turnaround", value: "24h" },
      { id: "accuracy", label: "Compliance Rate", value: "100%" },
    ];

  const hasActiveFilters = searchTerm !== "" || selectedCategory !== "all";

  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategory("all");
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {showHero === false ? <h1 className="sr-only">Services</h1> : null}

      {/* ─── Hero ─── */}
      {showHero !== false ? (
        <section className="relative bg-[var(--primary)] overflow-hidden border-b border-white/10">
          {/* Subtle texture */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--accent)]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />

          <div className="container relative mx-auto px-6 py-8 sm:py-10 lg:py-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-2xl">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight mb-2.5">
                  {heroContent?.titlePrefix || "Professional"}{" "}
                  <span className="text-[var(--accent)]">
                    {heroContent?.titleHighlight || "Tax & Compliance"}
                  </span>{" "}
                  Services
                </h1>
                <p className="text-sm sm:text-base text-white/80 max-w-xl leading-relaxed">
                  {heroContent?.description ||
                    "End-to-end solutions for business registration, taxation, audit, and regulatory compliance across India."}
                </p>
              </div>

              {/* Stats pill block */}
              <div className="flex items-center gap-6 sm:gap-8 rounded-[var(--radius-lg)] border border-white/15 bg-white/[0.06] p-4 sm:p-5 backdrop-blur-xs shrink-0">
                {heroStats.map((item) => (
                  <div key={item.id || item.label}>
                    <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {item.value}
                    </div>
                    <div className="text-[10px] text-white/75 font-medium uppercase tracking-wider mt-0.5">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* ─── Filter Bar ─── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/60">
        <div className="container mx-auto px-6">
          <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            {/* Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-medium transition-all duration-200 ${
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
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 py-2 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-[var(--primary)]/30 focus:ring-2 focus:ring-[var(--primary)]/8"
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

      {/* ─── Results Meta ─── */}
      {hasActiveFilters && (
        <div className="container mx-auto px-6 pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-900 tabular-nums">
                {filteredServices.length}
              </span>{" "}
              {filteredServices.length === 1 ? "service" : "services"} found
            </p>
            <button
              onClick={clearAllFilters}
              className="text-xs font-medium text-[var(--primary)] hover:underline transition-colors"
            >
              {clearFiltersText}
            </button>
          </div>
        </div>
      )}

      {/* ─── Grid ─── */}
      <section className="py-8 sm:py-10 lg:py-12">
        <div className="container mx-auto px-6">
          <AnimatePresence initial={false} mode="wait">
            {filteredServices.length > 0 ? (
              <motion.div
                key="results"
                initial={false}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredServices.map((service) => (
                  <div key={service.id || service.title}>
                    <ServiceCard
                      service={service}
                      defaultCategoryLabel={defaultCategoryLabel}
                      exploreButtonText={exploreButtonText}
                    />
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 sm:py-32"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-300 mb-5">
                  <Search className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{noResultsTitle}</h3>
                <p className="max-w-sm text-center text-sm text-slate-500 leading-relaxed mb-6">
                  {noResultsDescription}
                </p>
                <button
                  onClick={clearAllFilters}
                  className="text-sm font-semibold text-[var(--primary)] hover:underline"
                >
                  {clearFiltersText}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ─── CTA ─── */}
      {showCta !== false ? (
        <section className="container mx-auto px-6 pb-16 sm:pb-20">
          <div className="relative overflow-hidden rounded-2xl bg-[var(--primary)]">
            {/* Texture */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-[var(--accent)]/10 rounded-full blur-[80px]" />

            <div className="relative z-10 flex flex-col items-start gap-8 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
                  {ctaContent?.titlePrefix || "Can't find what you need?"}
                </h2>
                <p className="text-sm sm:text-base text-white/50 leading-relaxed">
                  {ctaContent?.description ||
                    "Our advisory services are fully customizable. Speak with a Senior Chartered Accountant for a solution tailored to your business."}
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row shrink-0">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[var(--primary)] transition-all hover:bg-white/90 active:scale-[0.97]"
                >
                  {ctaContent?.primaryButtonText || "Get in touch"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.97]"
                  >
                    {ctaContent?.secondaryButtonText || "WhatsApp us"}{" "}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
