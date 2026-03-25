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
  ShieldCheck,
} from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import Link from "next/link";
import { CONTACT } from "@/lib/constants";

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

export default function ServicesDirectoryPage({
  services,
  heroContent,
  showHero,
  ctaContent,
  showCta,
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
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const uniqueCategories = useMemo(
    () => Array.from(new Set(services.map((service) => service.category).filter(Boolean))),
    [services]
  );

  const categories = [
    { id: "all", name: "All Services" },
    ...uniqueCategories.map((category) => ({ id: category as string, name: category as string })),
  ];

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
        <section className="relative overflow-hidden border-b border-slate-200/50 bg-slate-50/50 pt-16 pb-6 lg:pt-20 lg:pb-8">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute left-1/4 top-0 h-[200px] w-[200px] rounded-full bg-blue-400/10 blur-[60px]" />
            <div className="absolute right-1/4 top-1/2 h-[150px] w-[150px] rounded-full bg-indigo-400/10 blur-[60px]" />
          </div>

          <div className="container relative mx-auto px-6">
            <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
              <AnimatedSection className="max-w-xl text-center lg:text-left">
                <h1 className="mb-2 text-2xl font-bold leading-tight tracking-tight text-slate-900 md:text-3xl lg:text-4xl">
                  {heroContent?.titlePrefix || "Specialized"}{" "}
                  <span className="font-serif italic text-blue-600">{heroContent?.titleHighlight || "Financial"}</span>{" "}
                  Services
                </h1>
                <p className="mx-auto max-w-lg text-sm font-light leading-relaxed text-slate-500 lg:mx-0">
                  {heroContent?.description ||
                    "Precision-engineered solutions for scaling and compliance by elite professionals."}
                </p>
              </AnimatedSection>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 rounded-full border border-white/60 bg-white/40 p-1 px-4 shadow-lg shadow-slate-200/40 backdrop-blur-xl"
              >
                {heroStats.map((item) => (
                  <div key={item.id || item.label} className="flex flex-col items-center border-r border-slate-200/50 px-3 py-2 last:border-0">
                    <h4 className="mb-0.5 text-sm font-bold leading-none text-slate-900">{item.value}</h4>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-slate-400">{item.label}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="border-b border-slate-100 bg-white py-3 sm:py-4">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 sm:w-auto sm:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    selectedCategory === category.id
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-400 hover:border-slate-400 hover:text-slate-600"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="group relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-slate-900" />
              <input
                type="text"
                placeholder="Lookup services..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-900/5"
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
                {filteredServices.map((service, index) => {
                  const categoryKey = service.category?.toLowerCase() || "default";
                  const IconComponent = categoryIcons[categoryKey] || Briefcase;
                  const gradient = categoryColors[categoryKey] || "from-slate-400 to-slate-600";
                  const waMessage = encodeURIComponent(
                    `Hi TaxFiling24, I am interested in the "${service.title}" service. Please provide more details and the estimated cost.`
                  );
                  const waLink = `${CONTACT.whatsapp}?text=${waMessage}`;

                  return (
                    <motion.div
                      key={service.id || service.title}
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="group"
                    >
                      <div className="group/card relative flex h-full flex-col rounded-[2rem] border border-slate-200/60 bg-white p-6 transition-all duration-500 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/50 sm:rounded-[2.5rem] sm:p-8">
                        <div className="mb-10 flex items-center justify-between">
                          <div className={`rounded-2xl bg-gradient-to-br p-4 text-white shadow-lg ${gradient}`}>
                            <IconComponent size={24} strokeWidth={2.5} />
                          </div>
                          <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-tighter text-slate-400 transition-colors group-hover:text-slate-900">
                            {service.category || "Consultancy"}
                          </span>
                        </div>

                        <div className="flex-1">
                          <h3 className="mb-4 flex min-h-[3.5rem] items-center text-2xl font-bold text-slate-900 transition-colors duration-300 group-hover:text-blue-700">
                            {service.title}
                          </h3>
                          <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-slate-500">
                            {service.description}
                          </p>
                        </div>

                        <div className="space-y-4">
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/wa flex w-full items-center justify-between rounded-full border border-slate-200/50 bg-slate-50/80 p-1.5 pl-6 transition-all duration-500 hover:border-[#25D366]/30 hover:bg-white hover:shadow-xl hover:shadow-emerald-500/10"
                          >
                            <span className="text-[11px] font-medium text-slate-400 transition-colors group-hover/wa:text-slate-600">
                              Chat with Experts...
                            </span>
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/20 transition-transform duration-500 group-hover/wa:scale-110">
                              <ExternalLink size={18} />
                            </div>
                          </a>

                          <Link
                            href={service.href || `/services/${service.slug || service.id}`}
                            className="group/link flex w-full items-center justify-between rounded-2xl p-2 pl-4 text-slate-400 transition-colors hover:text-slate-900"
                          >
                            <span className="text-xs font-bold uppercase tracking-widest">Explore Details</span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 transition-all duration-300 group-hover/link:bg-slate-900 group-hover/link:text-white">
                              <ChevronRight size={18} />
                            </div>
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
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
                <h3 className="mb-2 text-2xl font-bold text-slate-900">Service Not Found</h3>
                <p className="mx-auto max-w-xs text-sm text-slate-500">
                  We&apos;re expanding our portfolio. Try another keyword or reach out for custom requirements.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                  className="mt-8 text-xs font-bold uppercase tracking-widest text-blue-600 underline"
                >
                  Clear all filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {showCta !== false ? (
        <section className="container mx-auto px-4 pb-24 md:px-6">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 shadow-2xl sm:rounded-[3rem] sm:p-12 lg:p-20">
            <div className="absolute right-0 top-0 h-[300px] w-[300px] rounded-full bg-blue-500/20 blur-[60px] md:h-[500px] md:w-[500px] md:blur-[100px]" />
            <div className="absolute bottom-0 left-0 h-[250px] w-[250px] rounded-full bg-indigo-500/10 blur-[60px] md:h-[400px] md:w-[400px] md:blur-[100px]" />

            <div className="relative z-10 flex flex-col items-center justify-between gap-12 lg:flex-row">
              <div className="max-w-2xl text-center lg:text-left">
                <h2 className="mb-6 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                  {ctaContent?.titlePrefix || "Don't See What You're"}{" "}
                  <span className="underline decoration-blue-500/30 underline-offset-8 text-blue-400">
                    {ctaContent?.titleHighlight || "Looking For?"}
                  </span>
                </h2>
                <p className="text-lg font-light leading-relaxed text-slate-400">
                  {ctaContent?.description ||
                    "Our consultancy services are highly customizable. Speak with a Senior Advisor to architect a compliance structure that perfectly fits your business scale."}
                </p>
              </div>

              <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
                <Link
                  href="/contact"
                  className="rounded-2xl bg-white px-10 py-5 text-center text-sm font-bold uppercase tracking-widest text-slate-900 transition-colors hover:bg-blue-50"
                >
                  {ctaContent?.primaryButtonText || "Schedule Consultation"}
                </Link>
                <a
                  href={CONTACT.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-10 py-5 text-center text-sm font-bold uppercase tracking-widest text-white backdrop-blur-md transition-colors hover:bg-white/10"
                >
                  {ctaContent?.secondaryButtonText || "Quick Connect"} <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
