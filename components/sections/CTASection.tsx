"use client";

import { motion } from "framer-motion";
import { Send, Phone, ShieldCheck } from "lucide-react";
import { CONTACT } from "@/lib/constants";

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-[var(--color-primary)] py-20 lg:py-28">
      {/* Wave top */}
      <div className="absolute left-0 right-0 top-0 overflow-hidden">
        <svg
          viewBox="0 0 1440 120"
          className="absolute -top-1 w-full"
          preserveAspectRatio="none"
        >
          <path
            fill="white"
            d="M0,64 C360,120 720,0 1080,64 C1260,96 1380,96 1440,64 L1440,0 L0,0 Z"
          />
        </svg>
      </div>

      <div className="container relative mx-auto px-4 pt-12 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--color-accent-teal)]">
            <Send className="h-8 w-8 text-white" />
          </div>
          <h2 className="mb-6 text-3xl font-bold text-white lg:text-4xl">
            Ready to Get Started with Your Business?
          </h2>
          <p className="mb-10 text-lg text-white/90">
            Let our experts handle your registration, compliance, and taxation
            while you focus on growing your business. Get your free consultation
            today!
          </p>
          <div className="mb-8 flex flex-wrap justify-center gap-4">
            <motion.a
              href="#contact"
              className="flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-medium text-[var(--color-accent-teal)] shadow-lg transition-shadow hover:shadow-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Send className="h-5 w-5" />
              Submit Your Requirement
            </motion.a>
            <motion.a
              href={`tel:${CONTACT.phoneRaw}`}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-primary-dark)] border border-white/30 px-6 py-3 font-medium text-white transition-colors hover:bg-white/10"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Phone className="h-5 w-5" />
              Talk To Expert
            </motion.a>
          </div>
          <p className="flex items-center justify-center gap-2 text-sm text-white/90">
            <ShieldCheck className="h-5 w-5" />
            Trusted by 2000+ businesses across India
          </p>
        </motion.div>
      </div>
    </section>
  );
}
