"use client";

import {
  ShieldCheck,
  Award,
  Zap,
  IndianRupee,
  RefreshCw,
  Headset,
} from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { FEATURES } from "@/lib/constants";

const ICONS = [
  ShieldCheck,
  Award,
  Zap,
  IndianRupee,
  RefreshCw,
  Headset,
];

export default function FeaturesSection() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--bg-muted)] py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold text-[var(--fg)] sm:text-3xl lg:text-4xl">
            Why most Business Choose us?
          </h2>
          <p className="mx-auto max-w-xl text-[var(--fg-muted)]">
            Because we are committed to exceptional service and{" "}
            <strong className="text-[var(--fg)]">24/7 Quick support</strong>
          </p>
        </AnimatedSection>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = ICONS[index];
            return (
              <AnimatedSection key={feature.title}>
                <motion.div
                  className="group relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:-translate-y-2 hover:border-[var(--accent-light)] hover:shadow-[var(--shadow-lg)] sm:p-8"
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-10" style={{ backgroundImage: "var(--gradient-primary)" }} />
                  <div className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-white transition-all duration-300 group-hover:scale-110 group-hover:shadow-[var(--shadow-md)]" style={{ backgroundImage: "var(--gradient-primary)" }}>
                    <Icon className="h-6 w-6 text-white" strokeWidth={2} />
                  </div>
                  <h3 className="relative mb-3 text-xl font-bold tracking-tight text-[var(--fg)] transition-colors group-hover:text-[var(--primary)]">
                    {feature.title}
                  </h3>
                  <p className="relative text-[var(--fg-muted)] leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
