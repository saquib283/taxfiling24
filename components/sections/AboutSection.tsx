"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Phone, Calendar } from "lucide-react";
import { CONTACT } from "@/lib/constants";
import { ABOUT_FEATURES } from "@/lib/constants";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fadeUp } from "@/lib/animations";
import { CheckCircle, Award, IndianRupee, UserCheck } from "lucide-react";

const ICONS = [CheckCircle, Award, IndianRupee, UserCheck];

export default function AboutSection() {
  return (
    <section id="about" className="border-t border-[var(--border)] bg-[var(--bg-card)] py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-3 text-2xl font-bold text-[var(--fg)] sm:text-3xl lg:text-4xl">
            About Taxfiling24
          </h2>
          <p className="mx-auto max-w-xl text-[var(--fg-muted)]">
            Taxfiling24 makes tax and compliance simple. We handle filings, registrations, and GST work so you can focus on your business.
          </p>
        </AnimatedSection>

        <div className="mb-16 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="relative"
          >
            <div className="overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow)]">
              <div className="aspect-[4/3]">
                <Image
                  src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80"
                  alt="Business professionals"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
            <div className="absolute bottom-5 left-5 rounded-xl bg-[var(--primary)] px-4 py-3 text-white shadow-[var(--shadow)]">
              <p className="text-2xl font-bold">2,000+</p>
              <p className="text-sm text-white/90">Happy Clients</p>
            </div>
            <div className="absolute right-5 top-5 rounded-xl bg-[var(--accent)] px-4 py-3 text-white shadow-[var(--shadow)]">
              <p className="text-xl font-bold">15+</p>
              <p className="text-xs text-white/90">Years of Experience</p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h3 className="mb-5 text-2xl font-bold text-[var(--fg)] sm:text-3xl">
              Your Trusted Partner for Business Success
            </h3>
            <p className="mb-4 text-[var(--fg-muted)] leading-relaxed">
              With over <strong className="text-[var(--fg)]">15 years</strong> of excellence in business consultancy. We are a team of highly qualified <strong className="text-[var(--fg)]">Chartered Accountants (CA)</strong>, <strong className="text-[var(--fg)]">Company Secretaries (CS)</strong>, and <strong className="text-[var(--fg)]">Legal Experts</strong> dedicated to simplifying complex compliance requirements.
            </p>
            <p className="mb-8 text-[var(--fg-muted)] leading-relaxed">
              From startups and MSMEs to NGOs and large corporates, we&apos;ve served over <strong className="text-[var(--primary)]">2000+ clients</strong> across India, delivering timely, accurate, and cost-effective solutions.
            </p>
            <div className="flex flex-wrap gap-3">
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
                href="#contact"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-3 font-medium text-[var(--fg)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--accent-soft)]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Calendar className="h-4 w-4" />
                Schedule Appointment
              </motion.a>
            </div>
          </motion.div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ABOUT_FEATURES.map((feature, index) => {
            const Icon = ICONS[index];
            return (
              <AnimatedSection key={feature.title}>
                <motion.div
                  className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] p-6 transition-colors hover:border-[var(--accent-soft)] hover:shadow-[var(--shadow-sm)]"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--primary)]">
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <h4 className="mb-1.5 font-semibold text-[var(--fg)]">{feature.title}</h4>
                  <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
