"use client";

import { motion } from "framer-motion";
import { Phone, Mail } from "lucide-react";
import { getSiteContact } from "@/lib/site-contact";

export default function PreHeaderBar({ settings = {} }: { settings?: Record<string, string> }) {
  const { phone, phoneRaw, email } = getSiteContact(settings);
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center gap-8 border-b border-[var(--border)] bg-gradient-to-r from-[var(--bg-muted)] via-[var(--accent-soft)] to-[var(--bg-muted)] py-2.5 text-sm font-medium text-[var(--primary)]"
    >
      <a
        href={`tel:${phoneRaw}`}
        className="flex items-center gap-2 transition-colors hover:text-[var(--primary)]"
      >
        <Phone className="h-3.5 w-3.5" strokeWidth={2} />
        {phone}
      </a>
      <a
        href={`mailto:${email}`}
        className="flex items-center gap-2 transition-colors hover:text-[var(--primary)]"
      >
        <Mail className="h-3.5 w-3.5" strokeWidth={2} />
        {email}
      </a>
    </motion.div>
  );
}
