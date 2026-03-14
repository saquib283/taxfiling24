"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { CONTACT } from "@/lib/constants";

export default function WhatsAppCTA() {
  return (
    <motion.div
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 sm:bottom-6 sm:right-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, duration: 0.3 }}
    >
      <span className="rounded-full bg-[var(--bg-card)] px-3.5 py-2 text-xs font-medium text-[var(--fg-muted)] shadow-[var(--shadow)]">
        Need help?
      </span>
      <motion.a
        href={CONTACT.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow)]"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="h-6 w-6" strokeWidth={2} />
      </motion.a>
    </motion.div>
  );
}
