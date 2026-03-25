"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import Image from "next/image";
import { Phone, Calendar } from "lucide-react";
import { CONTACT, ABOUT_FEATURES, SITE_CONTENT_DEFAULTS } from "@/lib/constants";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fadeUp } from "@/lib/animations";
import { CheckCircle, Award, IndianRupee, UserCheck } from "lucide-react";
import BookingModal from "@/components/ui/BookingModal";

type AboutPreviewContent = {
  title?: string;
  description?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
  features?: Array<{ title?: string; description?: string; isVisible?: boolean }>;
};

const ICONS = [CheckCircle, Award, IndianRupee, UserCheck];

export default function AboutSection({
  settings = {},
  content,
}: {
  settings?: Record<string, string>;
  content?: AboutPreviewContent;
}) {
  return <AboutSectionContent settings={settings} content={content} />;
}

export function AboutSectionContent({
  settings = {},
  content,
}: {
  settings?: Record<string, string>;
  content?: AboutPreviewContent;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const clientsCount = settings.stats_clients || SITE_CONTENT_DEFAULTS.stats_clients;
  const yearsExp = settings.stats_experience || SITE_CONTENT_DEFAULTS.stats_experience;
  const title = content?.title || settings.about_title || SITE_CONTENT_DEFAULTS.about_title;
  const desc = content?.description || settings.about_description || SITE_CONTENT_DEFAULTS.about_description;

  let parsedFeatures = ABOUT_FEATURES;
  if (content?.features?.length) {
    parsedFeatures = content.features.filter((feature) => feature.isVisible !== false && feature.title && feature.description) as typeof ABOUT_FEATURES;
  } else if (settings.about_features_json) {
    try {
      parsedFeatures = JSON.parse(settings.about_features_json);
    } catch {}
  }
  const primaryCtaLabel = content?.primaryCtaLabel || "Talk To Expert";
  const secondaryCtaLabel = content?.secondaryCtaLabel || "Schedule Appointment";
  
  return (
    <section id="about" className="border-t border-[var(--border)] bg-[var(--bg-card)] py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold text-[var(--fg)] sm:text-3xl lg:text-4xl">
            About Taxfiling24
          </h2>
          <p className="mx-auto max-w-xl text-[var(--fg-muted)]">
            Taxfiling24 makes tax and compliance simple. We handle filings, registrations, and GST work so you can focus on your business.
          </p>
        </AnimatedSection>

        <div className="mb-16 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="relative"
          >
            <div className="overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow)]">
              <div className="aspect-[4/3]">
                <Image
                  src="/images/team_consulting.png"
                  alt="Business professionals"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
            <div className="absolute bottom-5 left-5 rounded-xl bg-[var(--primary)] px-4 py-3 text-white shadow-[var(--shadow)]">
              <p className="text-2xl font-bold">{clientsCount}</p>
              <p className="text-sm text-white/90">Happy Clients</p>
            </div>
            <div className="absolute right-5 top-5 rounded-xl bg-[var(--accent)] px-4 py-3 text-white shadow-[var(--shadow)]">
              <p className="text-xl font-bold">{yearsExp}</p>
              <p className="text-xs text-white/90">Years of Experience</p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h3 className="mb-5 text-2xl font-bold text-[var(--fg)] sm:text-3xl">
              {title}
            </h3>
            <p className="mb-4 text-[var(--fg-muted)] leading-relaxed">
              {desc}
            </p>
            <div className="flex flex-wrap gap-4">
              <motion.a
                href={`tel:${CONTACT.phoneRaw}`}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-bold text-white shadow-[var(--shadow-md)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
                style={{ backgroundImage: "var(--gradient-primary)" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Phone className="h-4 w-4" />
                {primaryCtaLabel}
              </motion.a>
              <motion.button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--border)] px-6 py-3.5 font-bold text-[var(--fg)] transition-all hover:-translate-y-1 hover:border-[var(--primary)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)] cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Calendar className="h-4 w-4" />
                {secondaryCtaLabel}
              </motion.button>
            </div>
            <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
          </motion.div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {parsedFeatures.map((feature, index) => {
            const Icon = ICONS[index % ICONS.length];
            return (
              <AnimatedSection key={feature.title}>
                <motion.div
                  className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-light)] hover:shadow-[var(--shadow-md)] sm:p-8"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundImage: "var(--gradient-primary)" }}>
                    <Icon className="h-7 w-7" strokeWidth={2} />
                  </div>
                  <h4 className="mb-2 text-lg font-bold text-[var(--fg)]">{feature.title}</h4>
                  <p className="text-sm font-medium text-[var(--fg-muted)] leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
