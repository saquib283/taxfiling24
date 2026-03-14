"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerContainer } from "@/lib/animations";

const STATS = [
  { value: "2,000+", label: "Happy Clients" },
  { value: "100+", label: "Services Offered" },
  { value: "15+", label: "Years of Experience" },
  { value: "100%", label: "Secure & Trusted" },
];

export default function StatsSection() {
  return (
    <section className="bg-[var(--color-background-light)] py-16 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="rounded-xl bg-white p-6 text-center shadow-sm"
            >
              <p className="mb-1 text-3xl font-bold text-[var(--color-primary-light)] lg:text-4xl">
                {stat.value}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
