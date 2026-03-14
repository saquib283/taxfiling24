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
import { scaleHover } from "@/lib/animations";

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
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[var(--color-primary-light)] lg:text-4xl">
            Why most Business Choose us?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--color-text-secondary)]">
            Because we are committed to providing exceptional service and{" "}
            <strong>24/7 Quick support</strong>
          </p>
        </AnimatedSection>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = ICONS[index];
            return (
              <AnimatedSection key={feature.title}>
                <motion.div
                  className="rounded-2xl bg-white p-6 shadow-md"
                  variants={scaleHover}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-primary-light)]/10">
                    <Icon className="h-6 w-6 text-[var(--color-primary-light)]" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-[var(--color-primary-light)]">
                    {feature.title}
                  </h3>
                  <p className="text-[var(--color-text-secondary)]">
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
