"use client";

import { motion } from "framer-motion";
import { Phone } from "lucide-react";
import { CONTACT } from "@/lib/constants";

export default function NeedGuidanceSection({
  settings = {},
  content,
}: {
  settings?: Record<string, string>;
  content?: {
    title?: string;
    description?: string;
    buttonLabel?: string;
  };
}) {
  const phone = settings.contact_phone || CONTACT.phone;
  const phoneRaw = phone.replace(/\D/g, "");
  
  const sectionTitle = content?.title || settings.guidance_title || "Need Guidance?";
  const sectionDescription = content?.description || "Need Help? or Looking for any specific service?";
  const buttonText = content?.buttonLabel || settings.guidance_button || "Talk To Expert";

  return (
    <section className="py-12 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="container mx-auto px-4 text-center sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-xl rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)] p-10 shadow-[var(--shadow-lg)] transition-all hover:border-[var(--accent-light)]">
          <h2 className="mb-2 text-2xl font-bold text-[var(--fg)]">{sectionTitle}</h2>
          <p className="mb-8 font-medium text-[var(--fg-muted)]">
            {sectionDescription}
          </p>
          <motion.a
            href={`tel:${phoneRaw}`}
            className="inline-flex items-center gap-2 rounded-xl px-8 py-4 font-bold tracking-wide text-white shadow-[var(--shadow-md)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Phone className="h-5 w-5" />
            {buttonText}
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}
