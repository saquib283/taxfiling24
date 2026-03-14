"use client";

import { motion } from "framer-motion";
import { Phone, Mail } from "lucide-react";
import { CONTACT } from "@/lib/constants";

export default function PreHeaderBar() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center gap-8 border-b border-[var(--border)] bg-[var(--bg-card)] py-2.5 text-sm text-[var(--fg-muted)]"
    >
      <a
        href={`tel:${CONTACT.phoneRaw}`}
        className="flex items-center gap-2 transition-colors hover:text-[var(--primary)]"
      >
        <Phone className="h-3.5 w-3.5" strokeWidth={2} />
        {CONTACT.phone}
      </a>
      <a
        href={`mailto:${CONTACT.email}`}
        className="flex items-center gap-2 transition-colors hover:text-[var(--primary)]"
      >
        <Mail className="h-3.5 w-3.5" strokeWidth={2} />
        {CONTACT.email}
      </a>
    </motion.div>
  );
}
