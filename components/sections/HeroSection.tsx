"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Phone, ArrowRight, Check } from "lucide-react";
import { CONTACT } from "@/lib/constants";
import { fadeUp, slideInRight } from "@/lib/animations";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative bg-[var(--bg)] pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-36 lg:pb-24"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex flex-col"
          >
            <span className="mb-5 inline-flex w-fit rounded-full border border-[var(--accent-soft)] bg-[var(--accent-soft)] px-4 py-1.5 text-sm font-medium text-[var(--primary)]">
              Complete Business Solutions
            </span>
            <h1 className="mb-5 text-3xl font-bold leading-tight text-[var(--fg)] sm:text-4xl lg:text-5xl">
              Complete Business, Tax & Compliance Solutions – All in One Place
            </h1>
            <p className="mb-8 max-w-lg text-[var(--fg-muted)] leading-relaxed sm:text-lg">
              Your Trusted Partner for Business Registration, Taxation, Compliance & Financial Advisory. Serving Startups, MSMEs, NGOs, and Corporates across India.
            </p>
            <div className="mb-8 flex flex-wrap gap-3">
              <motion.a
                href={`tel:${CONTACT.phoneRaw}`}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Phone className="h-4 w-4" />
                Talk To Expert
              </motion.a>
              <motion.a
                href="#services"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-3 font-medium text-[var(--fg)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Explore Services
                <ArrowRight className="h-4 w-4" />
              </motion.a>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--fg-muted)]">
              {["No Hidden Charges", "Timely Compliance", "Expert Team"].map((item, i) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[var(--success)]" strokeWidth={2.5} />
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={slideInRight}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--bg-muted)] shadow-[var(--shadow-lg)]">
              <div className="aspect-[4/3] w-full lg:aspect-[16/10]">
                <Image
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                  alt="Business professionals"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="absolute bottom-5 left-5 rounded-xl bg-[var(--primary)] px-4 py-3 text-white shadow-[var(--shadow)]">
                <p className="text-2xl font-bold">2,000+</p>
                <p className="text-sm text-white/90">Happy Clients</p>
              </div>
              <div className="absolute right-5 top-5 rounded-xl bg-[var(--accent)] px-4 py-3 text-white shadow-[var(--shadow)]">
                <p className="text-xl font-bold">15+</p>
                <p className="text-xs text-white/90">Years of Experience</p>
              </div>
            </div>
            <div className="absolute -bottom-4 left-4 right-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow)] sm:right-auto sm:w-64">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)]">
                  <Check className="h-5 w-5 text-[var(--primary)]" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-semibold text-[var(--fg)]">Certified Experts</p>
                  <p className="text-sm text-[var(--fg-muted)]">CA, CS & Legal Professionals</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
