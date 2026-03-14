"use client";

import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { CheckCircle } from "lucide-react";
import { CONTACT } from "@/lib/constants";

export default function Footer() {
  return (
    <footer>
      {/* Top section - Head Office + Message */}
      <div className="bg-[var(--color-primary)]">
        <div className="container mx-auto grid gap-8 px-4 py-12 lg:grid-cols-2 lg:px-8">
          <div className="rounded-t-xl bg-[var(--color-primary-dark)] p-8 text-white">
            <div className="mb-4 flex items-center gap-3">
              <MapPin className="h-6 w-6 text-[var(--color-accent-teal)]" />
              <h3 className="text-xl font-bold">Head Office</h3>
            </div>
            <p className="mb-6 text-white/90">{CONTACT.address}</p>
            <a
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-[var(--color-primary)]"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Middle section - Logo, Quick Links, Contact */}
      <div className="bg-white py-12">
        <div className="container mx-auto grid gap-12 px-4 md:grid-cols-3 lg:px-8">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2">
              <CheckCircle
                className="h-8 w-8 text-[var(--color-accent-teal)]"
                strokeWidth={2}
              />
              <span className="text-xl font-bold">
                <span className="text-[var(--color-primary-light)]">TaxFiling</span>
                <span className="text-[var(--color-accent-teal)]">24</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Taxfiling24 makes tax and compliance simple. We handle filings,
              registrations, and GST work so you can focus on your business with
              quick support and clear guidance.
            </p>
          </div>
          <div>
            <h3 className="mb-4 font-bold text-[var(--color-primary-light)]">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#hero"
                  className="text-[var(--color-primary-light)] hover:text-[var(--color-accent-teal)]"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="#services"
                  className="text-[var(--color-primary-light)] hover:text-[var(--color-accent-teal)]"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="#contact"
                  className="text-[var(--color-primary-light)] hover:text-[var(--color-accent-teal)]"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-bold text-[var(--color-primary-light)]">
              Contact Informations
            </h3>
            <ul className="space-y-3 text-[var(--color-primary-light)]">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0" />
                {CONTACT.address}
              </li>
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-center gap-3 hover:text-[var(--color-accent-teal)]"
                >
                  <Mail className="h-5 w-5 shrink-0" />
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${CONTACT.phoneRaw}`}
                  className="flex items-center gap-3 hover:text-[var(--color-accent-teal)]"
                >
                  <Phone className="h-5 w-5 shrink-0" />
                  {CONTACT.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-[var(--color-primary)] py-4">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 sm:flex-row lg:px-8">
          <p className="text-center text-sm text-white sm:text-left">
            Copyright © 2025 All Rights Reserved | TaxFiling24
          </p>
          <p className="text-center text-sm text-white/80 sm:text-right">
            Powered By - Marketing Key
          </p>
        </div>
      </div>
    </footer>
  );
}
