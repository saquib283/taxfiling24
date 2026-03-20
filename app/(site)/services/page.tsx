"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Search, Percent, Building2, SearchCode, ShieldCheck, Briefcase, Loader2 } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fadeUp } from "@/lib/animations";

const categoryIcons: any = {
  tax: Percent,
  gst: Building2,
  audit: SearchCode,
  compliance: ShieldCheck,
  advisory: Briefcase
};

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetch("/api/services")
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Generate categories from data
  const uniqueCategories = Array.from(new Set(services.map(s => s.category).filter(Boolean)));
  const categories = [
    { id: "all", name: "All Services" },
    ...uniqueCategories.map(cat => ({ id: cat, name: cat }))
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg)]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Hero Section with Mesh Gradient layout */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/5 to-transparent pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <AnimatedSection className="text-center max-w-3xl mx-auto">
            <h1 className="mb-6 text-4xl font-extrabold text-[var(--fg)] sm:text-5xl lg:text-6xl tracking-tight">
              Our <span className="text-[var(--primary)]">Professional</span> Services
            </h1>
            <p className="mx-auto max-w-xl text-md text-[var(--fg-muted)]">
              Comprehensive financial solutions made accessible. We manage complex filings so you can scale your enterprise.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Filter Bar Layout */}
      <section className="sticky top-20 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/80 backdrop-blur-md border border-[var(--border)] rounded-2xl shadow-[var(--shadow-md)] p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--fg-soft)]" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent bg-white"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-1.5 rounded-xl font-semibold text-xs transition-all flex-shrink-0 cursor-pointer ${
                    selectedCategory === category.id
                      ? "bg-[var(--primary)] text-white shadow-sm"
                      : "bg-white text-[var(--fg-muted)] border border-[var(--border)] hover:bg-gray-50"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid of Results */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatePresence>
            {filteredServices.length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
              >
                {filteredServices.map((service) => {
                  const IconComponent = categoryIcons[service.category?.toLowerCase()] || Briefcase;
                  return (
                    <motion.div
                      key={service.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="group"
                    >
                      <Link 
                        href={service.href || `/services/${service.id}`}
                        className="block h-full relative rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm hover:shadow-[var(--shadow-md)] transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                      >
                        {/* Smooth accent node bubble */}
                        <div className="absolute -top-12 -right-12 w-24 h-24 bg-[var(--primary)] opacity-[0.03] rounded-full blur-xl group-hover:scale-150 transition-all duration-500" />
                        
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-white" style={{ backgroundImage: "var(--gradient-primary)" }}>
                          <IconComponent className="h-5 w-5" />
                        </div>

                        <div className="flex-1 flex flex-col">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--accent-soft)] text-[var(--primary)] mb-3 w-fit border border-[var(--accent-light)]/10 uppercase tracking-wider">
                            {service.category || "General"}
                          </span>

                          <h3 className="mb-2 text-lg font-bold text-[var(--fg)] group-hover:text-[var(--primary)] transition-colors leading-snug">
                            {service.title}
                          </h3>

                          <p className="mb-6 text-[var(--fg-soft)] text-sm leading-relaxed line-clamp-2">
                            {service.description}
                          </p>
                        </div>

                        <div className="flex items-center text-[var(--primary)] font-bold text-sm pt-4 border-t border-[var(--border)] mt-auto">
                          <span>Get Setup</span>
                          <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 text-[var(--fg-muted)]"
              >
                No services found matching your criteria.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

// Link helper if Next.js layout has it imported correctly
import Link from "next/link";
