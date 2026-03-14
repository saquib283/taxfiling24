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
            <span className="mb-6 inline-flex w-fit rounded-full border border-[var(--accent-light)]/30 bg-[var(--accent-soft)]/50 px-5 py-2 text-sm font-semibold tracking-wide text-[var(--primary)] shadow-sm backdrop-blur-md uppercase">
              Complete Business Solutions
            </span>
            <h1 className="mb-5 text-3xl font-bold leading-tight text-[var(--fg)] sm:text-4xl lg:text-5xl">
              Complete Business, Tax & Compliance Solutions – All in One Place
            </h1>
            <p className="mb-8 max-w-lg text-[var(--fg-muted)] leading-relaxed sm:text-lg">
              Your Trusted Partner for Business Registration, Taxation, Compliance & Financial Advisory. Serving Startups, MSMEs, NGOs, and Corporates across India.
            </p>
            <div className="mb-8 flex flex-wrap gap-4">
              <motion.a
                href={`tel:${CONTACT.phoneRaw}`}
                className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 font-bold text-white shadow-[var(--shadow-md)] transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
                style={{ backgroundImage: "var(--gradient-primary)" }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Phone className="h-4 w-4" />
                Talk To Expert
              </motion.a>
              <motion.a
                href="#services"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-card)] px-6 py-3.5 font-bold text-[var(--fg)] shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--accent-light)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Explore Services
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
              <div className="absolute bottom-5 left-5 rounded-2xl border border-white/20 px-6 py-4 text-white shadow-[var(--shadow-lg)] backdrop-blur-md" style={{ backgroundImage: "var(--gradient-primary)" }}>
                <p className="text-3xl font-extrabold tracking-tight">2,000+</p>
                <p className="text-sm font-medium text-white/90">Happy Clients</p>
              </div>
              <div className="absolute right-5 top-5 rounded-2xl border border-white/20 px-6 py-4 text-white shadow-[var(--shadow-lg)] backdrop-blur-md" style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)" }}>
                <p className="text-2xl font-extrabold tracking-tight">15+</p>
                <p className="text-xs font-medium text-white/90">Years of Experience</p>
              </div>
            </div>
            <div className="absolute -bottom-6 left-4 right-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/90 p-5 shadow-[var(--shadow-xl)] backdrop-blur-xl transition-transform hover:-translate-y-1 sm:left-auto sm:right-6 sm:w-72">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm" style={{ backgroundImage: "var(--gradient-primary)" }}>
                  <Check className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-bold text-[var(--fg)]">Certified Experts</p>
                  <p className="text-sm font-medium text-[var(--fg-soft)]">CA, CS & Legal Pros</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
