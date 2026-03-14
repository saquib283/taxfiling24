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
                  className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-colors hover:border-[var(--accent-soft)] hover:shadow-[var(--shadow)] sm:p-7"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--primary)]">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-[var(--fg)]">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
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
