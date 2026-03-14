"use client";

import { useState } from "react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import FAQItem from "@/components/ui/FAQItem";
import { FAQ_ITEMS } from "@/lib/constants";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="border-t border-[var(--border)] bg-[var(--bg)] py-16 lg:py-24">
      <div className="border-y border-[var(--border)] bg-[var(--primary)] py-5">
        <p className="text-center text-sm font-medium text-white">
          Trusted by 2000+ businesses across India
        </p>
      </div>

      <div className="container mx-auto px-4 pt-14 sm:px-6 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold text-[var(--fg)] sm:text-3xl lg:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="text-[var(--fg-muted)]">
            Find quick answers to common questions about our services
          </p>
        </AnimatedSection>
        <div className="mx-auto max-w-2xl space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem
              key={i}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex((prev) => (prev === i ? null : i))}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
