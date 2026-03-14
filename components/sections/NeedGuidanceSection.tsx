"use client";

import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { CONTACT } from "@/lib/constants";

export default function NeedGuidanceSection() {
  return (
    <section className="bg-[var(--color-background-light)] py-12">
      <div className="container mx-auto px-4 text-center lg:px-8">
        <h2 className="mb-2 text-2xl font-bold text-[var(--color-primary-light)]">
          Need Guidance?
        </h2>
        <p className="mb-6 text-[var(--color-text-secondary)]">
          Need Help? or Looking for any specific service?
        </p>
        <motion.a
          href={`tel:${CONTACT.phoneRaw}`}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 font-medium text-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <Phone className="h-5 w-5" />
          Talk To Expert
        </motion.a>
      </div>
    </section>
  );
}
