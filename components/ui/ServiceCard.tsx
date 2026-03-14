"use client";

import { motion } from "framer-motion";
import { ArrowRight, LucideIcon } from "lucide-react";
import Link from "next/link";

interface ServiceCardProps {
  title: string;
  href: string;
  icon: LucideIcon;
}

export default function ServiceCard({ title, href, icon: Icon }: ServiceCardProps) {
  return (
    <motion.div
      className="group flex flex-col rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-colors hover:border-[var(--accent-soft)] hover:shadow-[var(--shadow)] sm:p-7"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--primary)]">
        <Icon className="h-6 w-6" strokeWidth={2} />
      </div>
      <h3 className="mb-4 flex-1 text-sm font-semibold uppercase tracking-wide text-[var(--fg)]">
        {title}
      </h3>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] transition-colors hover:gap-2"
      >
        Explore All
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
