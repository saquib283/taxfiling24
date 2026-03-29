"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Facebook,
  FileCheck,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";
import { getSiteContact } from "@/lib/site-contact";

type FooterLink = {
  id?: string;
  href?: string;
  label?: string;
  isVisible?: boolean;
};

const SOCIAL_ICONS = {
  twitter: Twitter,
  facebook: Facebook,
  linkedin: Linkedin,
  instagram: Instagram,
} as const;

export default function SiteFooter({
  settings = {},
  navbarContent,
  content,
}: {
  settings?: Record<string, string>;
  navbarContent?: {
    brandPrefix?: string;
    brandHighlight?: string;
  };
  content?: {
    tagline?: string;
    newsletterTitle?: string;
    newsletterDescription?: string;
    newsletterPlaceholder?: string;
    newsletterButtonText?: string;
    exploreHeading?: string;
    contactHeading?: string;
    quickLinks?: FooterLink[];
    legalLinks?: FooterLink[];
    socialLinks?: FooterLink[];
    copyright?: string;
    developerPrefix?: string;
    developerName?: string;
    developerUrl?: string;
  };
}) {
  const { phone, phoneRaw, email, address } = getSiteContact(settings);
  const brandPrefix = navbarContent?.brandPrefix || "TaxFiling";
  const brandHighlight = navbarContent?.brandHighlight || "24";
  const tagline =
    content?.tagline ||
    settings.footer_tagline ||
    "Taxfiling24 makes tax and compliance simple. We handle filings, registrations, and GST work so you can focus on your business.";
  const newsletterTitle = content?.newsletterTitle || "Stay Informed";
  const newsletterDescription =
    content?.newsletterDescription ||
    "Subscribe to our newsletter for the latest compliance alerts and tax updates.";
  const newsletterPlaceholder = content?.newsletterPlaceholder || "Enter your email";
  const newsletterButtonText = content?.newsletterButtonText || "Subscribe";
  const exploreHeading = content?.exploreHeading || "Explore";
  const contactHeading = content?.contactHeading || "Get in Touch";
  const copyright =
    content?.copyright ||
    settings.footer_copyright ||
    `Copyright ${new Date().getFullYear()} TaxFiling24. All rights reserved.`;
  const developerPrefix = content?.developerPrefix || "Developed by";
  const developerName = content?.developerName || "Md Rehan Saquib";
  const developerUrl = content?.developerUrl || "https://mdrehansaquib.in";
  const socialLinks =
    content?.socialLinks?.filter((link) => link.isVisible !== false && link.label && link.href) || [
      { href: "#", label: "Twitter" },
      { href: "#", label: "Facebook" },
      { href: "#", label: "LinkedIn" },
      { href: "#", label: "Instagram" },
    ];
  const quickLinks =
    content?.quickLinks?.filter((link) => link.isVisible !== false && link.label && link.href) || [
      { href: "/", label: "Home" },
      { href: "/about", label: "About Us" },
      { href: "/services", label: "Services" },
      { href: "/tools/gst-calculator", label: "GST & Tax Tools" },
      { href: "/contact", label: "Contact" },
    ];
  const legalLinks =
    content?.legalLinks?.filter((link) => link.isVisible !== false && link.label && link.href) || [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ];

  return (
    <footer className="relative mt-12 overflow-hidden border-t border-slate-200 bg-slate-50/50">
      <div className="absolute left-0 top-0 -z-10 h-64 w-64 rounded-full bg-blue-50/50 blur-3xl" />
      <div className="absolute bottom-0 right-0 -z-10 h-64 w-64 rounded-full bg-indigo-50/50 blur-3xl" />

      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-4 lg:gap-8">
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg"
                style={{ backgroundImage: "var(--gradient-primary)" }}
              >
                <FileCheck className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">
                {brandPrefix}
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
                  {brandHighlight}
                </span>
              </span>
            </Link>
            <p className="max-w-xs text-base leading-relaxed text-slate-500">{tagline}</p>
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const iconKey = (social.label || "").toLowerCase() as keyof typeof SOCIAL_ICONS;
                const Icon = SOCIAL_ICONS[iconKey] || Globe;

                return (
                  <a
                    key={social.id || social.label}
                    href={social.href || "#"}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-all hover:-translate-y-1 hover:border-blue-200 hover:text-blue-600 hover:shadow-md"
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-1">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-slate-900">{newsletterTitle}</h3>
            <p className="mb-4 text-sm leading-relaxed text-slate-500">{newsletterDescription}</p>
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
                placeholder={newsletterPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm shadow-sm transition-all focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="absolute bottom-2 right-2 top-2 flex items-center gap-2 rounded-xl bg-slate-900 px-6 text-xs font-bold text-white shadow-md transition-all hover:bg-blue-600 hover:shadow-lg active:scale-95"
              >
                {newsletterButtonText}
              </button>
            </form>
          </div>

          <div className="lg:ml-12">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-slate-900">{exploreHeading}</h3>
            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.id || link.href}>
                  <Link
                    href={link.href || "#"}
                    className="group flex items-center text-sm font-medium text-slate-500 transition-all hover:text-blue-600"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="ml-1 h-3 w-3 opacity-0 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-6 text-sm font-bold uppercase tracking-widest text-slate-900">{contactHeading}</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-sm italic leading-relaxed text-slate-500">{address}</span>
              </li>
              <li>
                <a href={`mailto:${email}`} className="group flex items-center gap-3 text-sm text-slate-500 transition-colors hover:text-blue-600">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{email}</span>
                </a>
              </li>
              <li>
                <a href={`tel:${phoneRaw}`} className="group flex items-center gap-3 text-sm text-slate-500 transition-colors hover:text-blue-600">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-all group-hover:bg-blue-600 group-hover:text-white">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{phone}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <p className="text-sm font-medium text-slate-400">{copyright}</p>
            <div className="flex items-center gap-8">
              {legalLinks.map((link) => (
                <Link
                  key={link.id || link.href}
                  href={link.href || "#"}
                  className="text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <p className="text-sm text-slate-400">
              {developerPrefix}{" "}
              <a href={developerUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline">
                {developerName}
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
