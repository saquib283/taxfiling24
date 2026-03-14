"use client";

import { motion } from "framer-motion";
import { ArrowRight, LucideIcon } from "lucide-react";
import Link from "next/link";
import { scaleHover } from "@/lib/animations";

interface ServiceCardProps {
  title: string;
  href: string;
  icon: LucideIcon;
}

export default function ServiceCard({ title, href, icon: Icon }: ServiceCardProps) {
  return (
    <motion.div
      className="group flex flex-col items-center rounded-xl bg-white p-6 shadow-md transition-shadow hover:shadow-lg"
      variants={scaleHover}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-light)]/10 text-[var(--color-primary-light)]">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mb-4 text-center text-sm font-bold uppercase leading-tight text-[var(--color-primary-light)] md:text-base">
        {title}
      </h3>
      <Link
        href={href}
        className="mt-auto flex items-center gap-1 text-sm font-medium text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-accent-teal)]"
      >
        Explore All
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
