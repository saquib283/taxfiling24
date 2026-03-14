"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Phone } from "lucide-react";
import { CONTACT } from "@/lib/constants";
import { ABOUT_FEATURES } from "@/lib/constants";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fadeUp } from "@/lib/animations";

import { CheckCircle, Award, IndianRupee, UserCheck } from "lucide-react";

const ICONS = [CheckCircle, Award, IndianRupee, UserCheck];

export default function AboutSection() {
  return (
    <section id="about" className="bg-white py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[var(--color-primary-light)]">
            About Taxfiling24
          </h2>
          <p className="mx-auto max-w-2xl text-[var(--color-text-secondary)]">
            Taxfiling24 makes tax and compliance simple. We handle filings,
            registrations, and GST work so you can focus on your business with
            quick support and clear guidance.
          </p>
        </AnimatedSection>

        <div className="mb-16 grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="relative"
          >
            <div className="overflow-hidden rounded-2xl shadow-xl">
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
            <div className="absolute bottom-4 left-4 rounded-lg bg-[var(--color-primary)] px-4 py-3 text-white shadow-lg">
              <p className="text-2xl font-bold">2,000+</p>
              <p className="text-sm">Happy Clients</p>
            </div>
            <div className="absolute right-4 top-4 rounded-full bg-[var(--color-accent-teal)] px-4 py-3 text-center text-white shadow-lg">
              <p className="text-xl font-bold">15+</p>
              <p className="text-xs">Years of Experience</p>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h3 className="mb-6 text-3xl font-bold text-[var(--color-primary-light)] lg:text-4xl">
              Your Trusted Partner for Business Success
            </h3>
            <p className="mb-4 text-[var(--color-text-secondary)]">
              With over <strong>15 years</strong> of excellence in business
              consultancy. We are a team of highly qualified{" "}
              <strong>Chartered Accountants (CA)</strong>,{" "}
              <strong>Company Secretaries (CS)</strong>, and{" "}
              <strong>Legal Experts</strong> dedicated to simplifying complex
              compliance requirements and helping businesses focus on what
              matters most - growth.
            </p>
            <p className="mb-8 text-[var(--color-text-secondary)]">
              From startups and MSMEs to NGOs and large corporates, we've
              successfully served over <strong>2000+ clients</strong> across
              India, delivering timely, accurate, and cost-effective solutions.
            </p>
            <motion.a
              href={`tel:${CONTACT.phoneRaw}`}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 font-medium text-white"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Phone className="h-5 w-5" />
              Talk To Expert
            </motion.a>
            <span className="ml-4 inline-block text-sm text-[var(--color-text-secondary)]">
              or
            </span>
            <motion.a
              href="#contact"
              className="ml-2 inline-block rounded-lg border-2 border-[var(--color-accent-teal)] px-6 py-3 font-medium text-[var(--color-accent-teal)]"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Schedule Appointment
            </motion.a>
          </motion.div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {ABOUT_FEATURES.map((feature, index) => {
            const Icon = ICONS[index];
            return (
              <AnimatedSection key={feature.title}>
                <motion.div
                  className="rounded-xl bg-white p-6 shadow-md"
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--color-primary-light)]/10">
                    <Icon className="h-6 w-6 text-[var(--color-primary-light)]" />
                  </div>
                  <h4 className="mb-2 font-bold text-[var(--color-primary-light)]">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-[var(--color-text-secondary)]">
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
