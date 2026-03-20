"use client";

import ContactSection from "@/components/sections/ContactSection";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { CONTACT } from "@/lib/constants";

export default function ContactPage() {
  return (
    <div className="bg-[var(--bg)] min-h-screen py-16 lg:py-24 space-y-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <ContactSection />
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--bg-muted)] py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-[var(--radius-xl)] p-10 text-white shadow-[var(--shadow-lg)] sm:p-12 mx-auto max-w-4xl"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <div className="mb-5 flex items-center gap-3">
              <MapPin className="h-6 w-6 text-white/90" />
              <h3 className="text-xl font-bold tracking-wide">Head Office</h3>
            </div>
            <p className="mb-8 text-white/90 leading-relaxed font-medium">{CONTACT.address}</p>
            <a
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl bg-white px-8 py-3.5 font-bold text-[var(--primary)] shadow-sm transition-all hover:-translate-y-1 hover:bg-white/95 hover:shadow-md"
            >
              WhatsApp
            </a>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
