"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Search, Percent, Building2, SearchCode,
  ShieldCheck, Briefcase, Loader2, Sparkles, ChevronRight,
  MessageCircle, ExternalLink, Filter, HelpCircle
} from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import Link from "next/link";
import { CONTACT } from "@/lib/constants";

const categoryIcons: any = {
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

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetch("/api/services")
      .then((res) => res.json())
      .then((data) => {
        setServices(Object.values(data).flat()); // Ensure it gets all services if data is an object
        setLoading(false);
      })
      .catch(() => {
        // Fallback to constants if API fails for some reason (rare, but good for stability)
        import("@/lib/constants").then(mod => {
          setServices(mod.SERVICES);
          setLoading(false);
        });
      });
  }, []);

  const uniqueCategories = Array.from(
    new Set(services.map((s: any) => s.category).filter(Boolean))
  );
  const categories = [
    { id: "all", name: "All Services" },
    ...uniqueCategories.map((cat: any) => ({ id: cat, name: cat })),
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-[var(--bg)]">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-[3px] border-[var(--primary)]/10 border-t-[var(--primary)] animate-spin" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="h-4 w-4 rounded-full bg-[var(--primary)]" />
          </motion.div>
        </div>
        <p className="mt-6 text-sm text-[var(--fg-soft)] font-medium tracking-wide">Orchestrating services...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] selection:bg-[var(--primary)]/10">
      {/* ─── Ultra-Minimal Services Header ─── */}
      <section className="relative pt-16 pb-6 lg:pt-20 lg:pb-8 overflow-hidden border-b border-slate-200/50 bg-slate-50/50">
        {/* Advanced Mesh Gradient Background */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-0 left-1/4 w-[200px] h-[200px] bg-blue-400/10 blur-[60px] rounded-full" />
          <div className="absolute top-1/2 right-1/4 w-[150px] h-[150px] bg-indigo-400/10 blur-[60px] rounded-full" />
        </div>

        <div className="container mx-auto px-6 relative">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <AnimatedSection className="max-w-xl text-center lg:text-left">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 mb-2 leading-tight">
                Specialized <span className="text-blue-600 italic font-serif">Financial</span> Services
              </h1>
              <p className="text-sm text-slate-500 max-w-lg mx-auto lg:mx-0 leading-relaxed font-light">
                Precision-engineered solutions for scaling and compliance by elite professionals.
              </p>
            </AnimatedSection>

            {/* Ultra-Compact Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 p-1 px-4 bg-white/40 backdrop-blur-xl border border-white/60 rounded-full shadow-lg shadow-slate-200/40"
            >
              {[
                { label: "Trust", val: "2.5K+", color: "bg-blue-600" },
                { label: "Speed", val: "24h", color: "bg-emerald-500" },
                { label: "Accuracy", val: "100%", color: "bg-orange-500" }
              ].map((item, idx) => (
                <div key={idx} className="px-3 py-2 flex flex-col items-center border-r last:border-0 border-slate-200/50">
                  <h4 className="text-sm font-bold text-slate-900 leading-none mb-0.5">{item.val}</h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Compact Controls ─── */}
      <div className="bg-white border-b border-slate-100 py-3 sm:py-4">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Minimal Nav Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                    selectedCategory === category.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-white text-slate-400 border-slate-200 hover:border-slate-400 hover:text-slate-600"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Slim Search Input */}
            <div className="relative w-full sm:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 group-focus-within:text-slate-900 transition-colors" />
              <input
                type="text"
                placeholder="Lookup services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-900/5 transition-all outline-none text-slate-900 placeholder:text-slate-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Services Showcase ─── */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <AnimatePresence mode="wait">
            {filteredServices.length > 0 ? (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {filteredServices.map((service, i) => {
                  const IconComponent =
                    categoryIcons[service.category?.toLowerCase()] || Briefcase;
                  const gradient =
                    categoryColors[service.category?.toLowerCase()] ||
                    "from-slate-400 to-slate-600";
                  
                  const waMessage = encodeURIComponent(`Hi TaxFiling24, I am interested in the "${service.title}" service. Please provide more details and the estimated cost.`);
                  const waLink = `${CONTACT.whatsapp}?text=${waMessage}`;

                  return (
                    <motion.div
                      key={service.id || service.title}
                      layout
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      className="group"
                    >
                      <div className="relative h-full bg-white border border-slate-200/60 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 transition-all duration-500 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/50 flex flex-col group/card">
                        {/* Status/Category Tag */}
                        <div className="flex justify-between items-center mb-10">
                          <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg shadow-opacity-20 group-hover:scale-110 transition-transform duration-500`}>
                            <IconComponent size={24} strokeWidth={2.5} />
                          </div>
                          <span className="text-[10px] font-black tracking-tighter uppercase px-3 py-1 bg-slate-50 text-slate-400 border border-slate-100 rounded-lg group-hover:text-slate-900 transition-colors">
                            {service.category || "Consultancy"}
                          </span>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-blue-700 transition-colors duration-300 min-h-[3.5rem] flex items-center">
                            {service.title}
                          </h3>
                          <p className="text-slate-500 text-sm leading-relaxed mb-8 line-clamp-3">
                            {service.description}
                          </p>
                        </div>

                        <div className="space-y-4">
                          {/* WhatsApp CTA */}
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/wa flex items-center justify-between w-full p-1.5 pl-6 bg-slate-50/80 border border-slate-200/50 rounded-full transition-all duration-500 hover:bg-white hover:border-[#25D366]/30 hover:shadow-xl hover:shadow-emerald-500/10"
                          >
                            <span className="text-[11px] font-medium text-slate-400 group-hover/wa:text-slate-600 transition-colors">
                              Chat with Experts...
                            </span>
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/20 group-hover/wa:scale-110 transition-transform duration-500">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="opacity-95"
                              >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                              </svg>
                            </div>
                          </a>

                          {/* Link CTA */}
                          <Link
                            href={service.href || `/services/${service.id}`}
                            className="flex items-center justify-between w-full p-2 pl-4 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors group/link"
                          >
                            <span className="text-xs font-bold uppercase tracking-widest">Explore Details</span>
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover/link:bg-slate-900 group-hover/link:text-white transition-all duration-300">
                              <ChevronRight size={18} />
                            </div>
                          </Link>
                        </div>

                        {/* Decorative background element inside card */}
                        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700">
                          <IconComponent size={120} />
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
                className="text-center py-40 border-2 border-dashed border-slate-100 rounded-[3rem]"
              >
                <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-200">
                  <HelpCircle size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Service Not Found</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm">We're expanding our portfolio. Try another keyword or reach out for custom requirements.</p>
                <button 
                  onClick={() => {setSearchTerm(""); setSelectedCategory("all");}}
                  className="mt-8 text-xs font-bold uppercase tracking-widest text-blue-600 underline"
                >
                  Clear all filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ─── Premium Footer CTA ─── */}
      <section className="container mx-auto px-4 md:px-6 pb-24">
        <div className="bg-slate-900 rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-12 lg:p-20 relative overflow-hidden shadow-2xl">
          {/* Effects */}
          <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-500/20 blur-[60px] md:blur-[100px] rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-indigo-500/10 blur-[60px] md:blur-[100px] rounded-full -ml-32 -mb-32" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12 justify-between">
            <div className="max-w-2xl text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Don't See What You're <br className="hidden sm:block" /> <span className="text-blue-400 underline decoration-blue-500/30 underline-offset-8">Looking For?</span>
              </h2>
              <p className="text-slate-400 text-lg font-light leading-relaxed mb-0">
                Our consultancy services are highly customizable. Speak with a Senior Advisor to architect a compliance structure that perfectly fits your business scale.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link
                href="/contact"
                className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-bold text-sm tracking-widest uppercase hover:bg-blue-50 transition-colors text-center"
              >
                Schedule Consultation
              </Link>
              <a
                href={CONTACT.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-5 bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-2xl font-bold text-sm tracking-widest uppercase hover:bg-white/10 transition-colors text-center flex items-center justify-center gap-2"
              >
                Quick Connect <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
