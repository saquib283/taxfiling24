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
      className="flex flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-colors hover:shadow-[var(--shadow)] sm:p-7"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Quote className="mb-4 h-10 w-10 text-[var(--accent-soft)]" strokeWidth={1.5} />
      <p className="mb-5 flex-1 text-[var(--fg-muted)] leading-relaxed">{text}</p>
      <div className="mb-5 flex gap-0.5">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-[var(--star)] text-[var(--star)]" />
        ))}
      </div>
      <div className="flex flex-col items-center">
        <div className="mb-2 h-12 w-12 rounded-full bg-[var(--bg-muted)]" />
        <p className="font-semibold text-[var(--primary)]">{name}</p>
        <p className="text-sm text-[var(--fg-muted)]">({company})</p>
      </div>
    </motion.div>
  );
}
