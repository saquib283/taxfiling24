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

interface ServicesProps {
  services?: any[];
  settings?: Record<string, string>;
}

export default function ServicesSection({ services = [], settings = {} }: ServicesProps) {
  const displayServices = services.length > 0 ? services : SERVICES.slice(0, 8);
  
  const sectionTitle = settings.services_title || "Services We Offer";
  const sectionSubtext = settings.services_subtext || "Comprehensive solutions for all your business, tax, and compliance needs";

  return (
    <section id="services" className="py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold text-[var(--fg)] sm:text-3xl lg:text-4xl">
            {sectionTitle}
          </h2>
          <p className="mx-auto max-w-xl text-[var(--fg-muted)]">
            {sectionSubtext}
          </p>
        </AnimatedSection>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {displayServices.map((service, index) => {
            const href = service.href || (service.slug ? `/services/${service.slug}` : `/services/${service.id}`);
            return (
              <AnimatedSection key={service.id || service.title} variants={fadeUp}>
                <ServiceCard
                  title={service.title}
                  href={href}
                  icon={ICONS[index % ICONS.length]}
                />
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
