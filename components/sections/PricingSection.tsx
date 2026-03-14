"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { PRICING_PLANS } from "@/lib/constants";

export default function PricingSection() {
  return (
    <section className="bg-[var(--color-background-light)] py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[var(--color-primary-light)]">
            Pricing Plans
          </h2>
          <p className="mx-auto max-w-2xl text-[var(--color-text-secondary)]">
            Choose the right plan for your business needs
          </p>
        </AnimatedSection>

        <div className="grid gap-8 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <AnimatedSection key={plan.name}>
              <motion.div
                className={`relative rounded-2xl p-8 ${
                  plan.highlighted
                    ? "border-2 border-[var(--color-accent-teal)] bg-white shadow-xl"
                    : "bg-white shadow-md"
                }`}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-accent-teal)] px-4 py-1 text-sm font-medium text-white">
                    Recommended
                  </span>
                )}
                <h3 className="mb-2 text-xl font-bold text-[var(--color-primary-light)]">
                  {plan.name}
                </h3>
                <p className="mb-4 text-3xl font-bold text-[var(--color-accent-teal)]">
                  {plan.price}
                </p>
                <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
                  {plan.description}
                </p>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-[var(--color-text-secondary)]"
                    >
                      <Check className="h-5 w-5 shrink-0 text-[var(--color-accent-teal)]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <motion.a
                  href="#contact"
                  className={`block w-full rounded-lg py-3 text-center font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-[var(--color-accent-teal)] text-white hover:opacity-90"
                      : "border-2 border-[var(--color-primary-light)] text-[var(--color-primary-light)] hover:bg-[var(--color-primary-light)] hover:text-white"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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
