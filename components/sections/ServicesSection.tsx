"use client";

import {
  Building2,
  FileCheck,
  Receipt,
  Briefcase,
  Calculator,
  Shield,
  ShoppingCart,
} from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import ServiceCard from "@/components/ui/ServiceCard";
import { SERVICES } from "@/lib/constants";
import { fadeUp } from "@/lib/animations";

const ICONS = [
  Building2,
  FileCheck,
  Receipt,
  Briefcase,
  Calculator,
  Shield,
  ShoppingCart,
];

export default function ServicesSection() {
  return (
    <section id="services" className="py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold text-[var(--fg)] sm:text-3xl lg:text-4xl">
            Services We Offer
          </h2>
          <p className="mx-auto max-w-xl text-[var(--fg-muted)]">
            Comprehensive solutions for all your business, tax, and compliance needs
          </p>
        </AnimatedSection>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.slice(0, 8).map((service, index) => (
            <AnimatedSection key={service.title} variants={fadeUp}>
              <ServiceCard
                title={service.title}
                href={service.href}
                icon={ICONS[index % ICONS.length]}
              />
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
