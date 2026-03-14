"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Phone, ArrowRight, Check } from "lucide-react";
import { CONTACT } from "@/lib/constants";
import { fadeUp } from "@/lib/animations";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative bg-white pt-32 pb-16 lg:pt-40 lg:pb-24"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Column - Text */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="flex flex-col"
          >
            <span className="mb-4 inline-block w-fit rounded-full bg-[var(--color-accent-teal)] px-4 py-1.5 text-sm font-medium text-white">
              Complete Business Solutions
            </span>
            <h1 className="mb-6 text-3xl font-bold leading-tight text-[var(--color-primary-light)] sm:text-4xl lg:text-5xl">
              Complete Business, Tax & Compliance Solutions – All in One Place
            </h1>
            <p className="mb-8 text-lg text-[var(--color-text-secondary)]">
              Your Trusted Partner for Business Registration, Taxation,
              Compliance & Financial Advisory. Serving Startups, MSMEs, NGOs, and
              Corporates across India with expert CA & CS consultancy services.
            </p>
            <div className="mb-8 flex flex-wrap gap-4">
              <motion.a
                href={`tel:${CONTACT.phoneRaw}`}
                className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 font-medium text-white shadow-md transition-shadow hover:shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Phone className="h-5 w-5" />
                Talk To Expert
              </motion.a>
              <motion.a
                href="#services"
                className="flex items-center gap-2 rounded-lg border-2 border-[var(--color-accent-teal)] px-6 py-3 font-medium text-[var(--color-accent-teal)] transition-colors hover:bg-[var(--color-accent-teal)]/10"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Explore Services
                <ArrowRight className="h-5 w-5" />
              </motion.a>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-secondary)]">
              <span className="flex items-center gap-2">
                <Check className="h-5 w-5 text-[var(--color-accent-teal)]" />
                No Hidden Charges
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <Check className="h-5 w-5 text-[var(--color-accent-teal)]" />
                Timely Compliance
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <Check className="h-5 w-5 text-[var(--color-accent-teal)]" />
                Expert Team
              </span>
            </div>
          </motion.div>

          {/* Right Column - Image with Overlays */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-xl">
              <div className="aspect-[4/3] w-full lg:aspect-[16/10]">
                <Image
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80"
                  alt="Business professionals at desk"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="absolute bottom-4 left-4 rounded-lg bg-[var(--color-primary)] px-4 py-3 text-white shadow-lg">
                <p className="text-2xl font-bold">2,000+</p>
                <p className="text-sm">Happy Clients</p>
              </div>
              <div className="absolute right-4 top-4 rounded-full bg-[var(--color-accent-teal)] px-4 py-3 text-center text-white shadow-lg">
                <p className="text-xl font-bold">15+</p>
                <p className="text-xs">Years of Experience</p>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-xl bg-white p-4 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-primary-light)]/10">
                  <Check className="h-6 w-6 text-[var(--color-primary-light)]" />
                </div>
                <div>
                  <p className="font-bold text-[var(--color-primary-light)]">
                    Certified Experts
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    CA, CS & Legal Professionals
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
