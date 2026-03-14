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
      <div className="container mx-auto px-4 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[var(--color-primary-light)] lg:text-4xl">
            Services We Offer
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--color-text-secondary)]">
            Comprehensive solutions for all your business, tax, and compliance
            needs
          </p>
        </AnimatedSection>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.slice(0, 8).map((service, index) => (
            <AnimatedSection key={service.title}>
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
