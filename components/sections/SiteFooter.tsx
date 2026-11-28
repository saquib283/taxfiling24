"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Facebook,
  FileCheck,
  Globe,
  Instagram,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Phone,
  MessageSquare,
  Twitter,
} from "lucide-react";
import { getSiteContact } from "@/lib/site-contact";
import { sanitizeHref } from "@/lib/url-safety";

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
    logo?: string;
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
  const { phone, phoneRaw, email, address, whatsapp } = getSiteContact(settings);
  const brandPrefix = navbarContent?.brandPrefix || "TaxFiling";
  const brandHighlight = navbarContent?.brandHighlight || "24";
  const tagline =
    content?.tagline ||
    settings.footer_tagline ||
    "TaxFiling24 makes tax and compliance simple. We handle filings, registrations, and GST work so you can focus on your business.";
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
  const developerUrl = sanitizeHref(content?.developerUrl, "https://mdrehansaquib.in");
  const socialLinks = (content?.socialLinks || []).filter(
    (link) =>
      link.isVisible !== false &&
      link.label &&
      link.href &&
      link.href.trim() !== "#" &&
      /^https?:\/\//i.test(link.href.trim())
  );
  const quickLinks =
    content?.quickLinks?.filter((link) => link.isVisible !== false && link.label && link.href) || [
      { href: "/", label: "Home" },
      { href: "/about", label: "About Us" },
      { href: "/services", label: "Services" },
      { href: "/articles", label: "Knowledge Base" },
      { href: "/book", label: "Book CA Consultation" },
      { href: "/tools", label: "All Tax & GST Tools" },
      { href: "/tools/tax-calculator", label: "Income Tax Calculator" },
      { href: "/tools/gst-calculator", label: "GST Invoice Calculator" },
      { href: "/contact", label: "Contact" },
    ];
  const legalLinks =
    content?.legalLinks?.filter((link) => link.isVisible !== false && link.label && link.href) || [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/refund", label: "Refund Policy" },
    ];

  const [subStatus, setSubStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [subMessage, setSubMessage] = useState<string>("");

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubStatus("loading");
    setSubMessage("");
    const form = e.currentTarget;
    const emailInput = form.elements.namedItem("email") as HTMLInputElement;

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.value }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubStatus("success");
        setSubMessage(data.message || "Thank you for subscribing!");
        form.reset();
      } else {
        setSubStatus("error");
        setSubMessage(data.error || "Failed to subscribe. Please try again.");
      }
    } catch {
      setSubStatus("error");
      setSubMessage("Network error. Please try again later.");
    }
  };

  return (
    <footer className="relative mt-16 overflow-hidden border-t border-slate-200/80 bg-slate-50/50">
      {/* Decorative blurred background shapes */}
      <div className="absolute left-1/4 top-0 -z-10 h-72 w-72 rounded-full bg-[var(--primary)]/[0.03] blur-[80px]" />
      <div className="absolute right-1/4 bottom-0 -z-10 h-72 w-72 rounded-full bg-[var(--accent)]/[0.05] blur-[80px]" />

      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand Identity */}
          <div className="space-y-6 lg:col-span-4">
            <Link href="/" className="inline-block transition-opacity hover:opacity-90">
              <Image
                src={content?.logo || settings.site_logo || "/brand-logo.png"}
                alt="TaxFiling24"
                width={170}
                height={60}
                className="h-11 sm:h-12 w-auto object-contain"
              />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-500">{tagline}</p>
            {socialLinks.length > 0 && (
              <div className="flex gap-3">
                {socialLinks.map((social) => {
                  const iconKey = (social.label || "").toLowerCase() as keyof typeof SOCIAL_ICONS;
                  const Icon = SOCIAL_ICONS[iconKey] || Globe;

                  return (
                    <a
                      key={social.id || social.label}
                      href={sanitizeHref(social.href)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-card)] text-[var(--fg-muted)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--primary-border)] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] hover:shadow-md"
                      aria-label={social.label}
                    >
                      <Icon className="h-5 w-5" />
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Explore Links */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-slate-900">{exploreHeading}</h3>
            <ul className="space-y-3.5">
              {quickLinks.map((link) => (
                <li key={link.id || link.href}>
                  <Link
                    href={sanitizeHref(link.href)}
                    className="group flex items-center text-sm font-medium text-slate-500 transition-colors hover:text-[var(--primary)]"
                  >
                    <span>{link.label}</span>
                    <ArrowUpRight className="ml-1 h-3.5 w-3.5 opacity-0 -translate-y-0.5 translate-x-0.5 transition-all duration-200 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Get in Touch */}
          <div className="lg:col-span-3">
            <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-slate-900">{contactHeading}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                  <MapPin className="h-4 w-4" />
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm leading-relaxed text-slate-500 hover:text-[var(--primary)] transition-colors hover:underline"
                >
                  {address}
                </a>
              </li>
              <li>
                <a href={`mailto:${email}`} className="group flex items-center gap-3 text-sm text-slate-500 hover:text-[var(--primary)] transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all duration-200 group-hover:bg-[var(--primary)] group-hover:text-white">
                    <Mail className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{email}</span>
                </a>
              </li>
              <li>
                <a href={`tel:${phoneRaw}`} className="group flex items-center gap-3 text-sm text-slate-500 hover:text-[var(--primary)] transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all duration-200 group-hover:bg-[var(--primary)] group-hover:text-white">
                    <Phone className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{phone}</span>
                </a>
              </li>
              {whatsapp && (
                <li>
                  <a
                    href={sanitizeHref(whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 text-sm text-slate-500 hover:text-emerald-600 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-all duration-200 group-hover:bg-emerald-600 group-hover:text-white shadow-2xs">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <span className="font-medium">WhatsApp Advisory</span>
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Stay Informed (Newsletter) */}
          <div className="lg:col-span-3">
            <h3 className="mb-6 text-xs font-bold uppercase tracking-wider text-slate-900">{newsletterTitle}</h3>
            <p className="mb-4 text-sm leading-relaxed text-slate-500">{newsletterDescription}</p>
            <form onSubmit={handleSubscribe} className="relative flex items-center w-full">
              <input
                type="email"
                name="email"
                required
                disabled={subStatus === "loading"}
                placeholder={newsletterPlaceholder}
                className="w-full rounded-2xl border border-slate-200 bg-white pl-5 pr-28 py-3.5 text-sm shadow-sm transition-all focus:border-[var(--primary)] focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/5 placeholder:text-slate-400 disabled:opacity-75"
              />
              <button
                type="submit"
                disabled={subStatus === "loading"}
                className="absolute bottom-1.5 right-1.5 top-1.5 flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-xs font-bold text-white shadow-sm transition-all duration-200 hover:bg-[var(--primary-hover)] hover:shadow-md active:scale-95 cursor-pointer disabled:opacity-75"
              >
                {subStatus === "loading" ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  newsletterButtonText
                )}
              </button>
            </form>
            {subMessage && (
              <div
                className={`mt-2.5 flex items-center gap-1.5 text-xs font-medium ${
                  subStatus === "success" ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {subStatus === "success" ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{subMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="border-t border-[var(--border)] py-8 bg-transparent">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row text-center sm:text-left">
            <p className="text-sm font-medium text-[var(--fg-muted)]">{copyright}</p>
            <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.id || link.href}
                  href={sanitizeHref(link.href)}
                  className="text-sm font-medium text-[var(--fg-muted)] transition-colors duration-200 hover:text-[var(--primary)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <p className="text-sm text-[var(--fg-muted)]">
              {developerPrefix}{" "}
              <a
                href={developerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[var(--primary)] transition-all hover:underline"
              >
                {developerName}
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
