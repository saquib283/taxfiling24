"use client";

import { useState } from "react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import FAQItem from "@/components/ui/FAQItem";
import { FAQ_ITEMS } from "@/lib/constants";

interface FAQEntry {
  id?: string;
  question: string;
  answer: string;
}

interface FAQProps {
  faqs?: FAQEntry[];
  settings?: Record<string, string>;
  content?: {
    trustBarText?: string;
    title?: string;
    subtext?: string;
  };
}

export default function FAQSection({ faqs = [], settings = {}, content }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const displayFaqs = faqs.length > 0 ? faqs : FAQ_ITEMS;

  const trustBarText = content?.trustBarText || "Trusted by 2000+ businesses across India";
  const sectionTitle = content?.title || settings.faq_title || "Frequently Asked Questions";
  const sectionSubtext = content?.subtext || settings.faq_subtext || "Find quick answers to common questions about our services";

  return (
    <section className="border-t border-[var(--border)] bg-[var(--bg)] py-16 lg:py-24">
      <div className="border-y border-[var(--border)] bg-[var(--primary)] py-5">
        <p className="text-center text-sm font-medium text-white">
          {trustBarText}
        </p>
      </div>

      <div className="container mx-auto px-4 pt-14 sm:px-6 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold text-[var(--fg)] sm:text-3xl lg:text-4xl">
            {sectionTitle}
          </h2>
          <p className="text-[var(--fg-muted)]">
            {sectionSubtext}
          </p>
        </AnimatedSection>
        <div className="mx-auto max-w-2xl space-y-3">
          {displayFaqs.map((item, i) => (
            <FAQItem
              key={(item as any).id || i}
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
