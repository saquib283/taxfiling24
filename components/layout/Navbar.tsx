"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Search } from "lucide-react";
import { sanitizeHref } from "@/lib/url-safety";
 
interface NavItem {
  label: string;
  href: string;
  visible?: boolean;
  children?: {
    label: string;
    href: string;
    visible?: boolean;
  }[];
}

export default function Navbar({ 
  settings = {}, 
  dynamicServices = [],
  content,
}: { 
  settings?: Record<string, string>,
  dynamicServices?: { title: string; slug: string }[],
  content?: {
    brandPrefix?: string;
    brandHighlight?: string;
    logo?: string;
    contactButtonLabel?: string;
    searchPlaceholder?: string;
    mobileSearchPlaceholder?: string;
    noResultsText?: string;
  }
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpandedLabel, setMobileExpandedLabel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const brandPrefix = content?.brandPrefix || "TaxFiling";
  const brandHighlight = content?.brandHighlight || "24";
  const contactButtonLabel = content?.contactButtonLabel || "Contact";
  const searchPlaceholder = content?.searchPlaceholder || "Search services...";
  const mobileSearchPlaceholder = content?.mobileSearchPlaceholder || "Search...";
  const noResultsText = content?.noResultsText || "No services found";

  const hardcodedNavItems: NavItem[] = [
    { href: "/", label: "Home", visible: true },
    { href: "/about", label: "About", visible: true },
    { 
      href: "/services", 
      label: "Services",
      visible: true,
      children: [
        { href: "/services", label: "All Services", visible: true },
        { href: "/services/taxation-gst-compliance-management", label: "Taxation & GST Compliance", visible: true },
        { href: "/services/business-setup-registration-services", label: "Company & Startup Registration", visible: true },
        { href: "/services/corporate-roc-secretarial-filings", label: "ROC & Corporate Filings", visible: true },
        { href: "/services/virtual-cfo-advisory-services", label: "Virtual CFO Advisory", visible: true },
      ]
    },
    { 
      href: "/tools", 
      label: "Tools",
      visible: true,
      children: [
        { href: "/tools", label: "All Tax & GST Tools", visible: true },
        { href: "/tools/tax-calculator", label: "Income Tax Calculator", visible: true },
        { href: "/tools/gst-calculator", label: "GST Calculator (HSN)", visible: true }
      ]
    },
    { href: "/articles", label: "Articles", visible: true },
    { href: "/book", label: "Book CA", visible: true },
    { href: "/contact", label: "Contact", visible: true },
  ];

  const navItems: NavItem[] = useMemo(() => {
    if (settings.NAVBAR_CONFIG) {
      try {
        const config = JSON.parse(settings.NAVBAR_CONFIG);
        if (Array.isArray(config) && config.length > 0) {
          return config;
        }
      } catch (err) {
        console.error("Failed to parse NAVBAR_CONFIG:", err);
      }
    }

    const baseItems = [...hardcodedNavItems];
    if (dynamicServices && dynamicServices.length > 0) {
      const servicesIndex = baseItems.findIndex(item => item.label === "Services");
      if (servicesIndex !== -1) {
        baseItems[servicesIndex] = {
          ...baseItems[servicesIndex],
          children: [
            { href: "/services", label: "All Services", visible: true },
            ...dynamicServices.map(s => ({
              href: `/services/${s.slug}`,
              label: s.title,
              visible: true
            }))
          ]
        };
      }
    }

    return baseItems;
  }, [settings.NAVBAR_CONFIG, dynamicServices]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-4 z-50 transition-all duration-300 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className={`rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/75 shadow-[var(--shadow-lg)] backdrop-blur-md transition-all duration-200 ${scrolled ? "py-0" : "py-1"}`}>
      <nav className="container mx-auto flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8 relative">
        <Link
          href="/"
          className="flex items-center transition-opacity hover:opacity-90 py-0.5"
          onClick={() => setMobileMenuOpen(false)}
        >
          <Image 
            src={content?.logo || settings.site_logo || "/brand-logo.png"} 
            width={170}
            height={60}
            priority
            className="h-11 sm:h-12 md:h-13 w-auto object-contain" 
            alt="TaxFiling24" 
          />
        </Link>

        <div className="hidden absolute left-1/2 -translate-x-1/2 items-center gap-1 md:flex">
          {navItems.filter(item => item.visible !== false && item.href !== "/contact").map((item) => {
            if (item.children) {
              const isOpen = activeDropdown === item.label;
              return (
                <div 
                  key={item.label} 
                  className="relative group focus-within:block"
                  onMouseEnter={() => setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button 
                    type="button"
                    onClick={() => setActiveDropdown(isOpen ? null : item.label)}
                    aria-haspopup="true"
                    aria-expanded={isOpen}
                    className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--fg-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all cursor-pointer"
                  >
                    {item.label}
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : "group-hover:rotate-180"}`} />
                  </button>
                  <div className={`absolute top-full left-0 pt-2 w-64 z-50 animate-in fade-in slide-in-from-top-2 before:absolute before:-top-2 before:left-0 before:right-0 before:h-2 before:content-[''] ${isOpen ? "block" : "hidden group-hover:block group-focus-within:block"}`}>
                    <div className="w-full bg-white border border-[var(--border)] rounded-xl shadow-[var(--shadow-md)] overflow-hidden">
                    <div className="p-2 border-b border-[var(--border)] sticky top-0 bg-white z-10">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder={searchPlaceholder}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-[var(--bg)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25 focus-visible:border-[var(--primary)] transition-all"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto py-1" role="menu">
                      {(() => {
                        const filtered = item.children.filter(
                          (child: any) =>
                            child.visible !== false &&
                            child.label.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                        
                        if (filtered.length === 0) {
                          return (
                            <div className="px-4 py-3 text-sm text-slate-500 text-center italic">
                              {noResultsText}
                            </div>
                          );
                        }
                        
                        return filtered.map((child: any) => (
                          <Link 
                            key={child.href} 
                            href={sanitizeHref(child.href)}
                            role="menuitem"
                            onClick={() => setActiveDropdown(null)}
                            className="block px-4 py-2.5 text-sm text-[var(--fg-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)] focus:bg-[var(--accent-soft)] focus:text-[var(--primary)] focus:outline-none transition-colors"
                          >
                            {child.label}
                          </Link>
                        ));
                      })()}
                    </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={sanitizeHref(item.href)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--fg-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 transition-all duration-200"
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/contact"
            className="hidden md:block bg-[var(--primary)] px-6 py-2.5 rounded-xl font-bold text-sm text-[var(--bg-card)] shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-md)] transition-all duration-200"
          >
            {contactButtonLabel}
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-[var(--fg)] md:hidden focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[var(--border)] bg-transparent px-4 py-4 md:hidden"
          >
            <div className="flex flex-col gap-0.5">
              {navItems.filter(item => item.visible !== false).map((item) => {
                const hasChildren = !!item.children;
                const isSubmenuOpen = mobileExpandedLabel === item.label;
                
                return (
                  <div key={item.label}>
                    {hasChildren ? (
                      <div>
                        <button 
                          type="button"
                          onClick={() => setMobileExpandedLabel(isSubmenuOpen ? null : item.label)}
                          aria-expanded={isSubmenuOpen}
                          className="w-full flex items-center justify-between rounded-lg py-2.5 px-3 text-left text-sm font-medium text-[var(--fg)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)] transition-colors"
                        >
                          {item.label}
                          <ChevronDown className={`h-4 w-4 transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {isSubmenuOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pl-4 space-y-1 bg-[var(--bg-muted)]/60 rounded-lg mt-1 mb-1 overflow-hidden"
                            >
                              <div className="p-2 border-b border-[var(--border)]">
                                <div className="relative">
                                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--fg-muted)]" />
                                  <input
                                    type="text"
                                    placeholder={mobileSearchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-md text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25 focus-visible:border-[var(--primary)] transition-all"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                              <div className="max-h-60 overflow-y-auto py-1">
                                {(() => {
                                  const filtered = item.children?.filter(
                                    (child: any) =>
                                      child.visible !== false &&
                                      child.label.toLowerCase().includes(searchQuery.toLowerCase())
                                  );
                                  
                                  if (filtered?.length === 0) {
                                    return (
                                      <div className="px-3 py-2 text-[10px] text-slate-500 italic">
                                        {noResultsText}
                                      </div>
                                    );
                                  }
                                  
                                  return filtered?.map((child: any) => (
                                    <Link
                                      key={child.href}
                                      href={sanitizeHref(child.href)}
                                      onClick={() => {
                                        setMobileMenuOpen(false);
                                        setMobileExpandedLabel(null);
                                        setSearchQuery("");
                                      }}
                                      className="block py-2 px-3 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--primary)] transition-colors"
                                    >
                                      {child.label}
                                    </Link>
                                  ));
                                })()}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        href={sanitizeHref(item.href)}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block rounded-lg py-2.5 px-3 text-left text-sm font-medium transition-colors ${
                          item.href === "/contact"
                            ? "mt-2 bg-[var(--primary)] text-[var(--bg-card)] text-center font-bold hover:bg-[var(--primary-hover)]"
                            : "text-[var(--fg)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]"
                        }`}
                      >
                        {item.href === "/contact" ? contactButtonLabel : item.label}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </header>
  );
}
