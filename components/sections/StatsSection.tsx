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
          {STATS.map((stat) => (
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
