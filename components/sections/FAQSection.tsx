"use client";

import { useState } from "react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import FAQItem from "@/components/ui/FAQItem";
import { FAQ_ITEMS } from "@/lib/constants";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="bg-white py-16 lg:py-24">
      {/* Trust Banner */}
      <div className="relative overflow-hidden bg-[var(--color-primary)] py-6">
        <p className="text-center text-lg font-medium text-white">
          Trusted by 2000+ businesses across India
        </p>
        <div className="absolute bottom-0 left-0 right-0">
          <svg
            viewBox="0 0 1440 60"
            className="w-full"
            preserveAspectRatio="none"
          >
            <path
              fill="white"
              d="M0,60 L0,20 C240,60 480,0 720,20 C960,40 1200,0 1440,20 L1440,60 Z"
            />
          </svg>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-12 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[var(--color-primary-light)]">
            Frequently Asked Questions
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            Find quick answers to common questions about our services
          </p>
        </AnimatedSection>

        <div className="mx-auto max-w-3xl space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <FAQItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === index}
              onToggle={() => toggleFAQ(index)}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
