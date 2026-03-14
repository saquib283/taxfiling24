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
      className="group flex flex-col rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-light)] hover:shadow-[var(--shadow-lg)] sm:p-8"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--primary)] transition-all duration-300 group-hover:scale-110 group-hover:text-white group-hover:shadow-[var(--shadow-md)] group-hover:ring-4 group-hover:ring-[var(--accent-soft)]" style={{ backgroundImage: "var(--gradient-primary)" }}>
        <Icon className="h-7 w-7" strokeWidth={2} />
      </div>
      <h3 className="mb-4 flex-1 text-base font-bold tracking-wide text-[var(--fg)] group-hover:text-[var(--primary)] transition-colors">
        {title}
      </h3>
      <Link
        href={href}
        className="inline-flex w-fit items-center gap-2 rounded-lg bg-[var(--bg-muted)] px-4 py-2 text-sm font-medium text-[var(--primary)] transition-all group-hover:bg-[var(--primary)] group-hover:text-white group-hover:shadow-[var(--shadow-sm)]"
      >
        Explore Service
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}
