"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Phone, ArrowRight, Check } from "lucide-react";
import { SITE_CONTENT_DEFAULTS } from "@/lib/constants";
import { getSiteContact } from "@/lib/site-contact";

interface HeroProps {
  settings?: Record<string, string>;
  content?: {
    badge?: string;
    headline?: string;
    subheading?: string;
    primaryCtaLabel?: string;
    secondaryCtaLabel?: string;
    image?: string;
    clientsLabel?: string;
    experienceLabel?: string;
    expertsTitle?: string;
    expertsDescription?: string;
    highlights?: Array<{ text?: string; isVisible?: boolean }>;
  };
}

export default function HeroSection({ settings = {}, content }: HeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const badge = content?.badge || settings.hero_badge || "Premium Corporate Advisory";
  const headline = content?.headline || settings.hero_headline || SITE_CONTENT_DEFAULTS.hero_headline;
  const subheading = content?.subheading || settings.hero_subheading || SITE_CONTENT_DEFAULTS.hero_subheading;
  const ctaPrimary = content?.primaryCtaLabel || settings.hero_cta_primary || "Talk To Expert";
  const ctaSecondary = content?.secondaryCtaLabel || settings.hero_cta_secondary || "Explore Services";
  const { phoneRaw } = getSiteContact(settings);
  const clientsLabel = content?.clientsLabel || "Happy Clients";
  const experienceLabel = content?.experienceLabel || "Years of Experience";
  const expertsTitle = content?.expertsTitle || "Certified Experts";
  const expertsDescription = content?.expertsDescription || "CA, CS & Legal Pros";
  const highlights =
    content?.highlights?.filter((item) => item.isVisible !== false && item.text) ||
    [{ text: "No Hidden Charges" }, { text: "Timely Compliance" }, { text: "Expert Team" }];

  const taxIndex = headline.search(/tax/i);
  const beforeTax = taxIndex >= 0 ? headline.slice(0, taxIndex) : headline;
  const fromTax = taxIndex >= 0 ? headline.slice(taxIndex) : "";

  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-[var(--bg)] pt-6 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24"
    >
      {/* Hero Background Gradients */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,var(--primary-soft),transparent_55%),radial-gradient(circle_at_bottom_left,var(--accent-soft),transparent_55%)]" />
      <div className="absolute top-20 right-[10%] -z-10 h-72 w-72 rounded-full bg-[var(--accent)]/5 opacity-40 blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col">
            <span className="mb-6 inline-flex w-fit rounded-full border border-[var(--accent-light)]/30 bg-[var(--accent-soft)]/50 px-5 py-2 text-sm font-semibold tracking-wide text-[var(--primary)] shadow-sm backdrop-blur-md">
              {badge}
            </span>
            <h1 className="mb-5 text-3xl font-extrabold tracking-tight leading-tight text-[var(--fg)] sm:text-4xl lg:text-5xl lg:leading-[1.1]">
              {taxIndex >= 0 ? (
                <>
                  {beforeTax}<br className="hidden lg:block" />
                  <span className="text-[var(--primary)]">{fromTax}</span>
                </>
              ) : (
                <span className="text-[var(--primary)]">{headline}</span>
              )}
            </h1>
            <p className="mb-8 max-w-lg text-[var(--fg-muted)] leading-relaxed sm:text-lg">
              {subheading}
            </p>
            <div className="mb-8 flex flex-wrap gap-4">
              <motion.a
                href={`tel:${phoneRaw}`}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-bold text-white shadow-[var(--shadow-md)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
                style={{ backgroundImage: "var(--gradient-primary)" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Phone className="h-4 w-4" />
                {ctaPrimary}
              </motion.a>
              <motion.a
                href="#services"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-card)] px-6 py-3.5 font-bold text-[var(--fg)] shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--accent-light)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {ctaSecondary}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </motion.a>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--fg-muted)]">
              {highlights.map((item) => (
                <span key={item.text} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[var(--success)]" strokeWidth={2.5} />
                  {item.text}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-muted)] shadow-[var(--shadow-lg)] border border-[var(--border)]">
              <div className="aspect-[4/3] w-full lg:aspect-[16/10]">
                <Image
                  src={content?.image || settings.hero_image || "/images/hero_bg.png"}
                  alt="Tax and Compliance consulting session with expert advisory"
                  fill
                  className="object-cover"
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <motion.div
                animate={shouldReduceMotion ? { y: 0 } : { y: [0, -8, 0] }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 rounded-2xl border border-white/20 px-4 py-3 sm:px-6 sm:py-4 text-white shadow-[var(--shadow-lg)] backdrop-blur-md"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">{settings.stats_clients || SITE_CONTENT_DEFAULTS.stats_clients}</p>
                <p className="text-xs sm:text-sm font-medium text-white/90">{clientsLabel}</p>
              </motion.div>
              <motion.div
                animate={shouldReduceMotion ? { y: 0 } : { y: [0, 8, 0] }}
                transition={shouldReduceMotion ? { duration: 0 } : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute right-4 top-4 sm:right-5 sm:top-5 rounded-2xl border border-[var(--accent)]/40 bg-[var(--primary)] px-4 py-3 sm:px-6 sm:py-4 text-white shadow-[var(--shadow-lg)] backdrop-blur-md"
              >
                <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--accent)]">{settings.stats_experience || SITE_CONTENT_DEFAULTS.stats_experience}</p>
                <p className="text-[10px] sm:text-xs font-medium text-white/90">{experienceLabel}</p>
              </motion.div>
            </div>
            <motion.div
              animate={shouldReduceMotion ? { y: 0 } : { y: [0, -6, 0] }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="mt-6 sm:mt-0 sm:absolute sm:-bottom-6 sm:right-6 sm:w-72 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/90 p-5 shadow-[var(--shadow-xl)] backdrop-blur-xl transition-transform hover:-translate-y-1 mx-4 sm:mx-0"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundImage: "var(--gradient-primary)" }}>
                  <Check className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-bold text-[var(--fg)]">{expertsTitle}</p>
                  <p className="text-sm font-medium text-[var(--fg-soft)]">{expertsDescription}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
