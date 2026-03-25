"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, FileCheck, Twitter, Facebook, Linkedin, Instagram, ArrowUpRight } from "lucide-react";
import { CONTACT } from "@/lib/constants";

export default function Footer({ settings = {} }: { settings?: Record<string, string> }) {
  const phone = settings.contact_phone || CONTACT.phone;
  const phoneRaw = phone.replace(/\D/g, "");
  const email = settings.contact_email || CONTACT.email;
  const address = settings.contact_address || CONTACT.address;
  const tagline = settings.footer_tagline || "Taxfiling24 makes tax and compliance simple. We handle filings, registrations, and GST work so you can focus on your business.";
  const copyright = settings.footer_copyright || `© ${new Date().getFullYear()} TaxFiling24. All rights reserved.`;

  const socialLinks = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Instagram, href: "#", label: "Instagram" },
  ];

  const quickLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About Us" },
    { href: "/services", label: "Services" },
    { href: "/tools/gst-calculator", label: "GST & Tax Tools" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <footer className="relative mt-12 overflow-hidden border-t border-slate-200 bg-slate-50/50">
      {/* Subtle background decoration */}
      <div className="absolute left-0 top-0 -z-10 h-64 w-64 rounded-full bg-blue-50/50 blur-3xl" />
      <div className="absolute bottom-0 right-0 -z-10 h-64 w-64 rounded-full bg-indigo-50/50 blur-3xl" />

      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
          {/* Logo & About */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg" style={{ backgroundImage: "var(--gradient-primary)" }}>
                <FileCheck className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                TaxFiling<span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>24</span>
              </span>
            </Link>
            <p className="text-base text-slate-500 leading-relaxed max-w-xs">
              {tagline}
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-all hover:-translate-y-1 hover:border-blue-200 hover:text-blue-600 hover:shadow-md"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Newsletter Section */}
          <div className="lg:col-span-1">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-slate-900">Stay Informed</h3>
            <p className="mb-4 text-sm text-slate-500 leading-relaxed">
              Subscribe to our newsletter for the latest compliance alerts and tax updates.
            </p>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const emailInput = form.elements.namedItem("email") as HTMLInputElement;
                const res = await fetch("/api/subscribe", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: emailInput.value }),
                });
                const data = await res.json();
                alert(data.message || data.error);
                if (res.ok) form.reset();
              }}
              className="relative flex items-center"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="Enter your email"
                className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm shadow-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 rounded-xl bg-slate-900 px-6 text-xs font-bold text-white transition-all hover:bg-blue-600 hover:shadow-lg active:scale-95 shadow-md flex items-center gap-2"
              >
                Susbcribe
              </button>
            </form>
          </div>

          {/* Quick Links */}
          <div className="lg:ml-12">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-slate-900">Explore</h3>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center text-sm font-medium text-slate-500 transition-all hover:text-blue-600"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-slate-900">Get in Touch</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                   <MapPin className="h-4 w-4" />
                </div>
                <span className="text-sm text-slate-500 leading-relaxed italic">{address}</span>
              </li>
              <li>
                <a href={`mailto:${email}`} className="group flex items-center gap-3 text-sm text-slate-500 hover:text-blue-600 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{email}</span>
                </a>
              </li>
              <li>
                <a href={`tel:${phoneRaw}`} className="group flex items-center gap-3 text-sm text-slate-500 hover:text-blue-600 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{phone}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <p className="text-sm text-slate-400 font-medium">
              {copyright}
            </p>
            <div className="flex gap-8 items-center">
               <Link href="/privacy" className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">Privacy Policy</Link>
               <Link href="/terms" className="text-sm text-slate-400 hover:text-slate-600 transition-colors font-medium">Terms of Service</Link>
            </div>
            <p className="text-sm text-slate-400">
              Developed by <a href="https://mdrehansaquib.in" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">Md Rehan Saquib</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
