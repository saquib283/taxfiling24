"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";

interface TestimonialCardProps {
  name: string;
  company: string;
  text: string;
  rating: number;
}

export default function TestimonialCard({
  name,
  company,
  text,
  rating,
}: TestimonialCardProps) {
  return (
    <motion.div
      className="flex flex-col rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-light)] hover:shadow-[var(--shadow-md)] sm:p-8"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Quote className="mb-5 h-10 w-10 text-[var(--accent-light)] opacity-60" strokeWidth={1.5} />
      <p className="mb-6 flex-1 text-[var(--fg-muted)] leading-relaxed">{text}</p>
      <div className="mb-6 flex gap-1">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-[var(--star)] text-[var(--star)] drop-shadow-sm" />
        ))}
      </div>
      <div className="flex items-center gap-3 border-t border-[var(--border)] pt-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-[var(--shadow-sm)]" style={{ backgroundImage: "var(--gradient-primary)" }}>
          {name.charAt(0)}
        </div>
        <div className="flex flex-col">
          <p className="font-semibold text-[var(--fg)]">{name}</p>
          <p className="text-sm text-[var(--fg-soft)]">{company}</p>
        </div>
      </div>
    </motion.div>
  );
}
