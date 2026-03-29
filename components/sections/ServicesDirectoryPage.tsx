"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Briefcase,
  Building2,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  Percent,
  Search,
  SearchCode,
  SendHorizontal,
  ShieldCheck,
} from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
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

const categoryColors: Record<string, string> = {
  tax: "from-emerald-400 to-teal-500",
  gst: "from-blue-400 to-indigo-500",
  audit: "from-violet-400 to-purple-500",
  compliance: "from-amber-400 to-orange-500",
  advisory: "from-rose-400 to-pink-500",
};

function ServiceCard({
  service,
  index,
  defaultCategoryLabel,
  messagePlaceholder,
  exploreButtonText,
  whatsappUrl,
}: {
  service: DirectoryService;
  index: number;
  defaultCategoryLabel: string;
  messagePlaceholder: string;
  exploreButtonText: string;
  whatsappUrl?: string;
}) {
  const defaultMessage = `Hi TaxFiling24, I am interested in the "${service.title}" service. Please provide more details.`;
  const [message, setMessage] = useState(defaultMessage);

  const categoryKey = service.category?.toLowerCase() || "default";
  const IconComponent = categoryIcons[categoryKey] || Briefcase;
  const gradient = categoryColors[categoryKey] || "from-slate-400 to-slate-600";

  const handleWhatsApp = () => {
    if (!whatsappUrl) {
      return;
    }
    const waLink = `${whatsappUrl}?text=${encodeURIComponent(message)}`;
    window.open(waLink, "_blank");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group"
    >
      <div className="flex h-full flex-col rounded-3xl border border-slate-100 bg-white p-6 transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5">
        <div className="mb-6 flex items-center justify-between">
          <div className={`rounded-2xl bg-gradient-to-br p-4 text-white shadow-sm ${gradient}`}>
            <IconComponent size={22} strokeWidth={2.5} />
          </div>
          <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {service.category || defaultCategoryLabel}
          </span>
        </div>

        <div className="flex-1">
          <h3 className="mb-3 text-xl font-bold text-slate-900 transition-colors group-hover:text-blue-600">
            {service.title}
          </h3>
          <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-slate-500">
            {service.description}
          </p>
        </div>

        <div className="mt-auto space-y-3">
          <div className="group/wa relative">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={messagePlaceholder}
              className="w-full rounded-xl border border-slate-100 bg-slate-50 py-4 pl-5 pr-14 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-emerald-200 focus:bg-white focus:ring-4 focus:ring-emerald-500/5"
            />
            <button
              onClick={handleWhatsApp}
              disabled={!whatsappUrl}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 active:scale-90"
              title="Send on WhatsApp"
            >
              <SendHorizontal className="h-4 w-4" />
            </button>
          </div>

          <Link
            href={service.href || `/services/${service.slug || service.id}`}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-100 bg-white py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-900 group/btn"
          >
            {exploreButtonText}
            <ChevronRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export default function ServicesDirectoryPage({
  services,
  heroContent,
  showHero,
  ctaContent,
  showCta,
  directoryContent,
  whatsappUrl,
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
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const uniqueCategories = useMemo(
    () => Array.from(new Set(services.map((service) => service.category).filter(Boolean))),
    [services]
  );

  const categories = [
    { id: "all", name: directoryContent?.allServicesLabel || "All Services" },
    ...uniqueCategories.map((category) => ({ id: category as string, name: category as string })),
  ];
  const messagePlaceholder = directoryContent?.messagePlaceholder || "Your message...";
  const exploreButtonText = directoryContent?.exploreButtonText || "Explore Full Service";
  const defaultCategoryLabel = directoryContent?.defaultCategoryLabel || "Consultancy";
  const noResultsTitle = directoryContent?.noResultsTitle || "Service Not Found";
  const noResultsDescription =
    directoryContent?.noResultsDescription ||
    "We're expanding our portfolio. Try another keyword or reach out for custom requirements.";
  const clearFiltersText = directoryContent?.clearFiltersText || "Clear all filters";
  const searchPlaceholder = directoryContent?.searchPlaceholder || "Search services...";

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const heroStats =
    heroContent?.stats?.filter((item) => item.isVisible !== false && item.label && item.value) || [
      { id: "trust", label: "Trust", value: "2.5K+" },
      { id: "speed", label: "Speed", value: "24h" },
      { id: "accuracy", label: "Accuracy", value: "100%" },
    ];

  return (
    <div className="min-h-screen bg-[var(--bg)] selection:bg-[var(--primary)]/10">
      {showHero !== false ? (
        <section className="relative overflow-hidden border-b border-slate-100 bg-slate-50/30 pt-12 pb-6 lg:pt-16 lg:pb-8">
          <div className="container relative mx-auto px-6">
            <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
              <AnimatedSection className="max-w-xl text-center lg:text-left">
                <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                  {heroContent?.titlePrefix || "Specialized"}{" "}
                  <span className="text-blue-600">{heroContent?.titleHighlight || "Financial"}</span>{" "}
                  Services
                </h1>
                <p className="mx-auto max-w-lg text-sm text-slate-500 lg:mx-0">
                  {heroContent?.description ||
                    "Professional solutions for business scaling and regulatory compliance."}
                </p>
              </AnimatedSection>
 
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1 px-3 shadow-sm"
              >
                {heroStats.map((item) => (
                  <div key={item.id || item.label} className="flex flex-col items-center border-r border-slate-100 px-4 py-2 last:border-0">
                    <h4 className="text-sm font-bold text-slate-900">{item.value}</h4>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="border-b border-slate-100 bg-white py-4 sm:py-5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`whitespace-nowrap rounded-xl border px-5 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    selectedCategory === category.id
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200 hover:text-slate-600"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
 
            <div className="group relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-slate-900" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-slate-100 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200"
              />
            </div>
          </div>
        </div>
      </div>

      <section className="py-12">
        <div className="container mx-auto px-6">
          <AnimatePresence mode="wait">
            {filteredServices.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
              >
                {filteredServices.map((service, index) => (
                  <ServiceCard
                    key={service.id || service.title}
                    service={service}
                    index={index}
                    defaultCategoryLabel={defaultCategoryLabel}
                    messagePlaceholder={messagePlaceholder}
                    exploreButtonText={exploreButtonText}
                    whatsappUrl={whatsappUrl}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="no-results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-[3rem] border-2 border-dashed border-slate-100 py-40 text-center"
              >
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-50 text-slate-200">
                  <HelpCircle size={40} />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-slate-900">{noResultsTitle}</h3>
                <p className="mx-auto max-w-xs text-sm text-slate-500">
                  {noResultsDescription}
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                  className="mt-8 text-xs font-bold uppercase tracking-widest text-blue-600 underline"
                >
                  {clearFiltersText}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {showCta !== false ? (
        <section className="container mx-auto px-4 pb-20 md:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-10 shadow-xl sm:p-16">
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
            
            <div className="relative z-10 flex flex-col items-center justify-between gap-10 lg:flex-row">
              <div className="max-w-2xl text-center lg:text-left">
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {ctaContent?.titlePrefix || "Don't See What You're"}{" "}
                  <span className="text-blue-400">
                    {ctaContent?.titleHighlight || "Looking For?"}
                  </span>
                </h2>
                <p className="text-base font-light text-slate-400">
                  {ctaContent?.description ||
                    "Our consultancy services are highly customizable. Speak with a Senior Advisor for a structure that perfectly fits your business scale."}
                </p>
              </div>
 
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Link
                  href="/contact"
                  className="rounded-xl bg-white px-8 py-4 text-center text-xs font-bold uppercase tracking-widest text-slate-900 transition-all hover:bg-blue-50 active:scale-95"
                >
                  {ctaContent?.primaryButtonText || "Schedule Consultation"}
                </Link>
                <a
                  href={whatsappUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-center text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm transition-all hover:bg-white/10 active:scale-95"
                >
                  {ctaContent?.secondaryButtonText || "Quick Connect"} <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
