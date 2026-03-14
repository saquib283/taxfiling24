"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import TestimonialCard from "@/components/ui/TestimonialCard";
import { TESTIMONIALS } from "@/lib/constants";

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const cardsPerView = 2;
  const maxIndex = Math.max(0, TESTIMONIALS.length - cardsPerView);

  return (
    <section className="border-t border-[var(--border)] bg-[var(--bg-muted)] py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold text-[var(--fg)] sm:text-3xl lg:text-4xl">
            What Our Clients Say About Us
          </h2>
          <p className="mx-auto max-w-xl text-[var(--fg-muted)]">
            We build <strong className="text-[var(--fg)]">long-term</strong> partnerships that drive your business forward
          </p>
        </AnimatedSection>
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="grid gap-6 md:grid-cols-2"
            >
              {TESTIMONIALS.slice(activeIndex, activeIndex + cardsPerView).map(
                (t) => <TestimonialCard key={t.name} {...t} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="mt-8 flex justify-center gap-2">
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(Math.min(i, maxIndex))}
              className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                activeIndex === i ? "w-6 bg-[var(--primary)]" : "bg-[var(--border)] hover:bg-[var(--fg-soft)]"
              }`}
              aria-label={`Testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
