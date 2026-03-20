"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin } from "lucide-react";
import { FileCheck } from "lucide-react";
import { CONTACT } from "@/lib/constants";

export default function Footer() {
  return (
    <footer>


      <div className="border-t border-[var(--border)] bg-[var(--bg-card)] py-12">
        <div className="container mx-auto grid gap-10 px-4 md:grid-cols-3 sm:px-6 lg:px-8">
          <div>
            <Link href="/" className="mb-6 flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-[var(--shadow-sm)]" style={{ backgroundImage: "var(--gradient-primary)" }}>
                <FileCheck className="h-5 w-5" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold tracking-tight text-[var(--fg)]">
                TaxFiling<span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>24</span>
              </span>
            </Link>
            <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
              Taxfiling24 makes tax and compliance simple. We handle filings, registrations, and GST work so you can focus on your business.
            </p>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-[var(--fg)]">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { href: "#hero", label: "Home" },
                { href: "#services", label: "Services" },
                { href: "#contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--fg-muted)] transition-colors hover:text-[var(--primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-[var(--fg)]">Contact</h3>
            <ul className="space-y-3 text-sm text-[var(--fg-muted)]">
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                {CONTACT.address}
              </li>
              <li>
                <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 hover:text-[var(--primary)]">
                  <Mail className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACT.phoneRaw}`} className="flex items-center gap-2 hover:text-[var(--primary)]">
                  <Phone className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                  {CONTACT.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--bg)] py-4">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-center text-xs text-[var(--fg-muted)] sm:text-left">
            © 2025 TaxFiling24. All rights reserved.
          </p>
          <p className="text-center text-xs text-[var(--fg-soft)] sm:text-right">
            Developed by <a href="https://mdrehansaquib.in" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)]">Md Rehan Saquib</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
