"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import TestimonialCard from "@/components/ui/TestimonialCard";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReviews(data.filter((r: any) => r.isApproved));
        }
      })
      .catch(() => {});
  }, []);

  const nextSlide = () => {
    if (reviews.length === 0) return;
    setActiveIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevSlide = () => {
    if (reviews.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  if (reviews.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-t border-[var(--border)] bg-[var(--bg-muted)]/30 py-16 lg:py-24">
      {/* Ambient background glows */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,var(--accent-soft),transparent_50%)] opacity-70" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,var(--accent-soft),transparent_50%)] opacity-70" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-1.5 text-xs font-bold tracking-wider text-[var(--primary)] uppercase">
            <Star className="h-3.5 w-3.5 fill-current" />
            Client Success
          </span>
          <h2 className="mb-4 text-3xl font-bold text-[var(--fg)] sm:text-4xl">
            What Our Clients Say About Us
          </h2>
          <p className="mx-auto max-w-2xl text-[var(--fg-muted)]">
            We build <strong className="text-[var(--primary)]">long-term</strong> partnerships that drive your business forward with verified transparency.
          </p>
        </AnimatedSection>

        <div className="relative mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] p-8 shadow-[var(--shadow-lg)] backdrop-blur-md md:p-12">
            <div className="absolute -right-8 -top-8 h-32 w-32 text-[var(--accent-soft)]/20">
              <Quote className="h-full w-full" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col gap-6"
              >
                <div className="flex gap-1 text-amber-500">
                  {Array.from({ length: reviews[activeIndex].rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-current" />
                  ))}
                </div>

                <p className="text-lg italic leading-relaxed text-[var(--fg)] md:text-xl">
                  "{reviews[activeIndex].content}"
                </p>

                <div className="mt-4 flex items-center gap-4 border-t border-[var(--border)] pt-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-soft)] font-bold text-[var(--primary)] shadow-sm">
                    {reviews[activeIndex].name.split(" ").map((n: string) => n[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--fg)]">{reviews[activeIndex].name}</h4>
                    {reviews[activeIndex].role && (
                      <p className="text-sm text-[var(--fg-soft)]">{reviews[activeIndex].role}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation Controls */}
          <div className="absolute left-0 right-0 top-1/2 flex -translate-y-1/2 justify-between px-4 md:-mx-16 md:px-0">
            <button
              onClick={prevSlide}
              className="group rounded-full border border-[var(--border)] bg-[var(--bg-card)] p-3 text-[var(--fg-muted)] shadow-md transition-all hover:border-[var(--accent-light)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]"
            >
              <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
            </button>
            <button
              onClick={nextSlide}
              className="group rounded-full border border-[var(--border)] bg-[var(--bg-card)] p-3 text-[var(--fg-muted)] shadow-md transition-all hover:border-[var(--accent-light)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]"
            >
              <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>

        {/* Indicators */}
        <div className="mt-8 flex justify-center gap-2">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                activeIndex === i ? "w-6 bg-[var(--primary)]" : "w-2.5 bg-[var(--border)] hover:bg-[var(--fg-soft)]"
              }`}
              aria-label={`Testimonial slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
