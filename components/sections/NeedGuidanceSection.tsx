"use client";

import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { CONTACT } from "@/lib/constants";

export default function NeedGuidanceSection() {
  return (
    <section className="py-12 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="container mx-auto px-4 text-center sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-8 shadow-[var(--shadow-sm)]">
          <h2 className="mb-2 text-xl font-bold text-[var(--fg)]">Need Guidance?</h2>
          <p className="mb-6 text-[var(--fg-muted)]">
            Need Help? or Looking for any specific service?
          </p>
          <motion.a
            href={`tel:${CONTACT.phoneRaw}`}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Phone className="h-4 w-4" />
            Talk To Expert
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}
