"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin } from "lucide-react";
import { FileCheck } from "lucide-react";
import { CONTACT } from "@/lib/constants";

export default function Footer({ settings = {} }: { settings?: Record<string, string> }) {
  const phone = settings.contact_phone || CONTACT.phone;
  const phoneRaw = phone.replace(/\D/g, "");
  const email = settings.contact_email || CONTACT.email;
  const address = settings.contact_address || CONTACT.address;
  const tagline = settings.footer_tagline || "Taxfiling24 makes tax and compliance simple. We handle filings, registrations, and GST work so you can focus on your business.";
  const copyright = settings.footer_copyright || "© 2025 TaxFiling24. All rights reserved.";

  return (
    <footer>


      <div className="border-t border-[var(--border)] bg-[var(--bg-card)] py-12">
        <div className="container mx-auto grid gap-10 px-4 md:grid-cols-4 sm:px-6 lg:px-8">
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
              {tagline}
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-[var(--fg)]">Newsletter</h3>
            <p className="text-xs text-[var(--fg-muted)] mb-3">Subscribe to receive compliance alerts & tax updates.</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const email = (form.elements.namedItem("email") as HTMLInputElement).value;
              const res = await fetch("/api/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              });
              const data = await res.json();
              alert(data.message || data.error);
              if (res.ok) form.reset();
            }} className="flex flex-col gap-2">
              <input type="email" name="email" required placeholder="Your Email address" className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
              <button type="submit" className="px-3 py-2 bg-[var(--fg)] text-[var(--bg-card)] rounded-lg text-xs font-semibold hover:bg-[var(--primary)] hover:text-white transition-all">Subscribe</button>
            </form>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-[var(--fg)]">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/about", label: "About Us" },
                { href: "/services", label: "Services" },
                { href: "/tools/gst-calculator", label: "GST & Tax Tools" },
                { href: "/contact", label: "Contact" },
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
                {address}
              </li>
              <li>
                <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-[var(--primary)]">
                  <Mail className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                  {email}
                </a>
              </li>
              <li>
                <a href={`tel:${phoneRaw}`} className="flex items-center gap-2 hover:text-[var(--primary)]">
                  <Phone className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                  {phone}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--bg)] py-4">
        <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-center text-xs text-[var(--fg-muted)] sm:text-left">
            {copyright}
          </p>
          <p className="text-center text-xs text-[var(--fg-soft)] sm:text-right">
            Developed by <a href="https://mdrehansaquib.in" target="_blank" rel="noopener noreferrer" className="text-[var(--primary)]">Md Rehan Saquib</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
