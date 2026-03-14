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
    <section className="border-y border-[var(--border)] bg-[var(--bg-card)] py-14 lg:py-18">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-6 md:grid-cols-4"
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="text-center"
            >
              <p className="text-3xl font-bold text-[var(--primary)] sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-[var(--fg-muted)]">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
