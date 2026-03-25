"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations";
import { SITE_CONTENT_DEFAULTS } from "@/lib/constants";

interface StatsSectionProps {
  settings?: Record<string, string>;
  content?: {
    items?: Array<{ value?: string; label?: string; isVisible?: boolean }>;
  };
}

export default function StatsSection({ settings = {}, content }: StatsSectionProps) {
  const fallbackStats = [
    { value: settings.stats_clients || SITE_CONTENT_DEFAULTS.stats_clients, label: "Happy Clients" },
    { value: settings.stats_services || "50+", label: "Services Offered" },
    { value: settings.stats_experience || SITE_CONTENT_DEFAULTS.stats_experience, label: "Years of Experience" },
    { value: settings.stats_satisfaction || "99%", label: "Secure & Trusted" },
  ];
  const stats = content?.items?.filter((item) => item.isVisible !== false && item.value && item.label) || fallbackStats;
  return (
    <section className="bg-[var(--primary)] text-white py-14 lg:py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
           variants={staggerContainer}
           initial="hidden"
           whileInView="show"
           viewport={{ once: true }}
           className="grid grid-cols-2 gap-8 md:grid-cols-4"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="text-center"
            >
              <p className="text-4xl font-extrabold tracking-tight sm:text-6xl text-[var(--accent-light)] drop-shadow-md">
                {stat.value}
              </p>
              <p className="mt-3 text-sm font-bold uppercase tracking-widest text-white/80">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
