"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { PRICING_PLANS } from "@/lib/constants";

export default function PricingSection() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold text-[var(--fg)] sm:text-3xl lg:text-4xl">
            Pricing Plans
          </h2>
          <p className="mx-auto max-w-xl text-[var(--fg-muted)]">
            Choose the right plan for your business
          </p>
        </AnimatedSection>
        <div className="grid gap-6 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <AnimatedSection key={plan.name}>
              <motion.div
                className={`relative flex flex-col rounded-[var(--radius-lg)] border p-6 sm:p-8 ${
                  plan.highlighted
                    ? "border-[var(--primary)] bg-[var(--bg-card)] shadow-[var(--shadow)]"
                    : "border-[var(--border)] bg-[var(--bg-card)]"
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--primary)] px-4 py-1 text-xs font-medium text-white">
                    Recommended
                  </span>
                )}
                <h3 className="mb-1 text-lg font-semibold text-[var(--fg)]">{plan.name}</h3>
                <p className="mb-1 text-3xl font-bold text-[var(--primary)]">{plan.price}</p>
                <p className="mb-6 text-sm text-[var(--fg-muted)]">{plan.description}</p>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 text-sm text-[var(--fg-muted)]"
                    >
                      <Check className="h-4 w-4 shrink-0 text-[var(--success)]" strokeWidth={2.5} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <motion.a
                  href="#contact"
                  className={`mt-auto block w-full rounded-xl py-3 text-center font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                      : "border border-[var(--border)] text-[var(--fg)] hover:border-[var(--primary)] hover:bg-[var(--accent-soft)]"
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  Get Started
                </motion.a>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
