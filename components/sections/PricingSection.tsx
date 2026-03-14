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
                className={`relative flex flex-col rounded-[var(--radius-xl)] border p-6 transition-all duration-300 sm:p-8 ${
                  plan.highlighted
                    ? "z-10 scale-105 border-[var(--accent-light)] bg-white shadow-[var(--shadow-lg)]"
                    : "border-[var(--border)] bg-[var(--bg-card)] hover:-translate-y-1 hover:border-[var(--accent-light)] hover:shadow-[var(--shadow-md)]"
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm" style={{ backgroundImage: "var(--gradient-primary)" }}>
                    Recommended
                  </span>
                )}
                <h3 className="mb-2 text-xl font-bold text-[var(--fg)]">{plan.name}</h3>
                <p className="mb-2 text-4xl font-extrabold tracking-tight text-[var(--primary)]">{plan.price}</p>
                <p className="mb-8 text-sm font-medium text-[var(--fg-muted)]">{plan.description}</p>
                <ul className="mb-8 space-y-4">
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
                  className={`mt-auto block w-full rounded-xl py-3.5 text-center font-bold transition-all hover:-translate-y-1 ${
                    plan.highlighted
                      ? "text-white shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)]"
                      : "border-2 border-[var(--border)] text-[var(--fg)] hover:border-[var(--primary)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]"
                  }`}
                  style={plan.highlighted ? { backgroundImage: "var(--gradient-primary)" } : undefined}
                  whileHover={{ scale: 1.02 }}
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
