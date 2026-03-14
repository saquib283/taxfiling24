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
    <section className="bg-[var(--color-background-light)] py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[var(--color-primary-light)]">
            What Our Clients Say About Us
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--color-text-secondary)]">
            We don&apos;t just provide services, We build{" "}
            <strong>long-term</strong> partnerships that drive your business
            forward
          </p>
        </AnimatedSection>

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-6 md:grid-cols-2"
            >
              {TESTIMONIALS.slice(activeIndex, activeIndex + cardsPerView).map(
                (testimonial) => (
                  <TestimonialCard
                    key={testimonial.name}
                    {...testimonial}
                  />
                )
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {TESTIMONIALS.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(Math.min(index, maxIndex))}
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                activeIndex === index
                  ? "bg-[var(--color-primary-light)]"
                  : "bg-gray-300"
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
