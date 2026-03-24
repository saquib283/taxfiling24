"use client";

import { motion } from "framer-motion";
import { Send, Phone, ShieldCheck } from "lucide-react";
import { CONTACT } from "@/lib/constants";

interface CTASectionProps {
  settings?: Record<string, string>;
}

export default function CTASection({ settings = {} }: CTASectionProps) {
  const headline = settings.cta_headline || "Ready to Get Started with Your Business?";
  const subtext = settings.cta_subtext || "Let our experts handle your registration, compliance, and taxation. Get your free consultation today!";
  const buttonText = settings.cta_button_text || "Submit Your Requirement";

  return (
    <section className="relative overflow-hidden py-24 lg:py-32" style={{ backgroundImage: "var(--gradient-primary)" }}>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23ffffff%22 fill-opacity=%220.06%22%3E%3Cpath d=%22M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />
      <div className="absolute left-0 right-0 top-0">
        <svg viewBox="0 0 1440 80" className="w-full" preserveAspectRatio="none">
          <path fill="var(--bg)" d="M0,80 L0,40 C360,80 720,20 1080,40 C1260,60 1380,40 1440,50 L1440,80 Z" />
        </svg>
      </div>

      <div className="container relative mx-auto px-4 pt-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-2xl text-center"
        >
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 text-white">
            <Send className="h-7 w-7" strokeWidth={2} />
          </div>
          <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            {headline}
          </h2>
          <p className="mb-10 text-white/90">
            {subtext}
          </p>
            <div className="mb-10 flex flex-wrap justify-center gap-4">
            <motion.a
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--bg-card)] px-7 py-4 font-bold tracking-wide text-[var(--primary)] shadow-[var(--shadow-lg)] transition-all hover:-translate-y-1 hover:scale-105 hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Send className="h-4 w-4" />
              {buttonText}
            </motion.a>
            <motion.a
              href={`tel:${CONTACT.phoneRaw}`}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 px-7 py-4 font-bold tracking-wide text-white backdrop-blur-md transition-all hover:-translate-y-1 hover:scale-105 hover:border-white/50 hover:bg-white/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Phone className="h-4 w-4" />
              Talk To Expert
            </motion.a>
          </div>
          <p className="flex items-center justify-center gap-2 text-sm text-white/80">
            <ShieldCheck className="h-4 w-4" />
            Trusted by 2000+ businesses across India
          </p>
        </motion.div>
      </div>
    </section>
  );
}
