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
      className="flex flex-col rounded-xl bg-white p-6 shadow-md"
      whileHover={{ scale: 1.02, boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
    >
      <Quote className="mb-4 h-12 w-12 text-gray-300" strokeWidth={1} />
      <p className="mb-4 text-gray-600">{text}</p>
      <div className="mb-4 flex gap-0.5">
        {Array.from({ length: rating }).map((_, i) => (
          <Star
            key={i}
            className="h-5 w-5 fill-[var(--color-star)] text-[var(--color-star)]"
          />
        ))}
      </div>
      <div className="mt-auto flex flex-col items-center">
        <div className="mb-2 h-14 w-14 rounded-full bg-gray-200" />
        <p className="font-bold uppercase tracking-wide text-[var(--color-accent-teal)]">
          {name}
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          ({company})
        </p>
      </div>
    </motion.div>
  );
}
