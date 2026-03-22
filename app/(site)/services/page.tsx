"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Search, Percent, Building2, SearchCode,
  ShieldCheck, Briefcase, Loader2, Sparkles, ChevronRight
} from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import Link from "next/link";

const categoryIcons: any = {
  tax: Percent,
  gst: Building2,
  audit: SearchCode,
  compliance: ShieldCheck,
  advisory: Briefcase,
};

const categoryColors: Record<string, string> = {
  tax: "from-emerald-500 to-teal-600",
  gst: "from-blue-500 to-indigo-600",
  audit: "from-violet-500 to-purple-600",
  compliance: "from-amber-500 to-orange-600",
  advisory: "from-rose-500 to-pink-600",
};

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        setServices(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const uniqueCategories = Array.from(
    new Set(services.map((s: any) => s.category).filter(Boolean))
  );
  const categories = [
    { id: "all", name: "All Services" },
    ...uniqueCategories.map((cat) => ({ id: cat, name: cat })),
  ];

  const filteredServices = services.filter((service: any) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg)]">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-[3px] border-[var(--primary)]/20 border-t-[var(--primary)] animate-spin" />
        </div>
        <p className="mt-4 text-sm text-[var(--fg-soft)] font-medium">Loading services…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* ─── Hero Section ─── */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-[var(--primary)]/[0.03] blur-3xl" />
          <div className="absolute top-20 right-0 w-64 h-64 rounded-full bg-[var(--accent)]/[0.04] blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[var(--primary)]/[0.02] blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <AnimatedSection className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-[var(--accent-soft)] text-[var(--primary)] px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-6 border border-[var(--accent-light)]/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Expert Financial Solutions
            </motion.div>

            <h1 className="mb-5 text-4xl font-extrabold text-[var(--fg)] sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.1]">
              Professional Services{" "}
              <span className="bg-gradient-to-r from-[var(--primary)] to-[#1a4f85] bg-clip-text text-transparent">
                Tailored For You
              </span>
            </h1>

            <p className="mx-auto max-w-xl text-base text-[var(--fg-muted)] leading-relaxed mb-8">
              From company registration to tax compliance — comprehensive
              financial solutions managed by certified chartered accountants.
            </p>

            {/* Stats bar */}
            <div className="flex items-center justify-center gap-8 text-center">
              {[
                { value: "500+", label: "Clients Served" },
                { value: "15+", label: "Expert CAs" },
                { value: "99%", label: "Compliance Rate" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-extrabold text-[var(--primary)]">{stat.value}</p>
                  <p className="text-xs text-[var(--fg-soft)] font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Filter & Search Bar ─── */}
      <section className="sticky top-[72px] z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-[var(--shadow)] p-3 flex flex-col md:flex-row gap-3 justify-between items-center"
          >
            {/* Search */}
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-soft)]" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)] bg-[var(--bg)] text-[var(--fg)] transition-all placeholder:text-[var(--fg-soft)]"
              />
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-xl font-semibold text-xs tracking-wide transition-all flex-shrink-0 cursor-pointer border ${
                    selectedCategory === category.id
                      ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-sm"
                      : "bg-transparent text-[var(--fg-muted)] border-[var(--border)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Services Grid ─── */}
      <section className="py-14 pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            {filteredServices.length > 0 ? (
              <motion.div
                key="grid"
                layout
                className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {filteredServices.map((service, i) => {
                  const IconComponent =
                    categoryIcons[service.category?.toLowerCase()] || Briefcase;
                  const gradient =
                    categoryColors[service.category?.toLowerCase()] ||
                    "from-gray-500 to-gray-600";

                  return (
                    <motion.div
                      key={service.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.35, delay: i * 0.04 }}
                    >
                      <Link
                        href={service.href || `/services/${service.id}`}
                        className="group flex flex-col h-full relative rounded-2xl bg-white border border-[var(--border)] overflow-hidden shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] transition-all duration-300 hover:-translate-y-1"
                      >
                        {/* Gradient accent bar */}
                        <div className={`h-1 bg-gradient-to-r ${gradient}`} />

                        <div className="p-6 flex flex-col flex-1">
                          {/* Icon + Category */}
                          <div className="flex items-start justify-between mb-5">
                            <div
                              className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-sm`}
                            >
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-[var(--bg-muted)] text-[var(--fg-soft)] border border-[var(--border)]">
                              {service.category || "General"}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-bold text-[var(--fg)] group-hover:text-[var(--primary)] transition-colors leading-snug mb-2">
                            {service.title}
                          </h3>

                          {/* Description */}
                          <p className="text-[var(--fg-soft)] text-sm leading-relaxed line-clamp-2 mb-6 flex-1">
                            {service.description}
                          </p>

                          {/* CTA */}
                          <div className="flex items-center gap-1.5 text-[var(--primary)] font-bold text-sm pt-4 border-t border-[var(--border)]">
                            <span>Learn More</span>
                            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-24"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--bg-muted)] mb-4">
                  <Search className="h-7 w-7 text-[var(--fg-soft)]" />
                </div>
                <h3 className="text-lg font-bold text-[var(--fg)] mb-1">
                  No services found
                </h3>
                <p className="text-[var(--fg-soft)] text-sm">
                  Try adjusting your search or category filters.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="py-16 bg-[var(--primary)] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[var(--accent)] blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white blur-3xl" />
        </div>
        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Need a Custom Solution?
          </h2>
          <p className="text-white/70 max-w-md mx-auto mb-8 text-sm leading-relaxed">
            Our chartered accountants can craft a personalized plan for your
            business. Get a free consultation today.
          </p>
          <div className="flex justify-center flex-col sm:flex-row gap-3">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] text-[var(--primary)] px-7 py-3 rounded-xl font-bold shadow-lg hover:brightness-110 transition-all text-sm"
            >
              Get Free Consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
