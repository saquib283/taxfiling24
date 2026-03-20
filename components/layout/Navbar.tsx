"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { FileCheck } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/#about", label: "About" },
    { 
      href: "/services", 
      label: "Services",
      children: [
        { href: "/services", label: "All Services" },
        { href: "/services#income-tax", label: "Income Tax" },
        { href: "/services#gst", label: "GST Filings" },
        { href: "/services#business", label: "Business Registration" },
      ]
    },
    { 
      href: "/tools", 
      label: "Tools",
      children: [
        { href: "/tools/tax-calculator", label: "Tax Calculator" },
      ]
    },
    { href: "/articles", label: "Articles" },
    { href: "/contact", label: "Contact" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-4 z-50 transition-all duration-300 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className={`rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/75 shadow-[var(--shadow-lg)] backdrop-blur-md transition-all duration-200 ${scrolled ? "py-0" : "py-1"}`}>
      <nav className="container mx-auto flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8 relative">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-[var(--shadow-sm)]"
            style={{ backgroundImage: "var(--gradient-primary)" }}
          >
            <FileCheck className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="text-xl font-bold tracking-tight text-[var(--fg)]">
            TaxFiling
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              24
            </span>
          </span>
        </Link>

        <div className="hidden absolute left-1/2 -translate-x-1/2 items-center gap-1 md:flex">
          {navItems.filter(i => i.href !== "/#contact").map((item) => {
            if (item.children) {
              return (
                <div key={item.label} className="relative group">
                  <button className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--fg-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)] transition-all cursor-pointer">
                    {item.label}
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-[var(--border)] rounded-xl shadow-[var(--shadow-md)] py-2 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2">
                    {item.children.map((child) => (
                      <Link 
                        key={child.href} 
                        href={child.href}
                        className="block px-4 py-2.5 text-sm text-[var(--fg-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)] transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--fg-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)] transition-all duration-200"
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/#contact"
            className="hidden md:block bg-[var(--fg)] px-6 py-2.5 rounded-xl font-bold text-sm text-[var(--bg-card)] shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:bg-[var(--primary)] hover:text-white hover:shadow-[var(--shadow-md)] transition-all duration-200"
          >
            Contact
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-[var(--fg)] md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[var(--border)] bg-transparent px-4 py-4 md:hidden"
          >
            <div className="flex flex-col gap-0.5">
              {navItems.map((item) => {
                const hasChildren = !!item.children;
                
                return (
                  <div key={item.label}>
                    {hasChildren ? (
                      <div>
                        <button 
                          onClick={() => setServicesOpen(!servicesOpen)}
                          className="w-full flex items-center justify-between rounded-lg py-2.5 px-3 text-left text-sm font-medium text-[var(--fg)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)] transition-colors"
                        >
                          {item.label}
                          <ChevronDown className={`h-4 w-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                          {servicesOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="pl-4 space-y-1 bg-gray-50/50 rounded-lg mt-1 mb-1"
                            >
                              {item.children?.map((child) => (
                                <Link
                                  key={child.href}
                                  href={child.href}
                                  onClick={() => setMobileMenuOpen(false)}
                                  className="block py-2 px-3 text-xs font-medium text-[var(--fg-muted)] hover:text-[var(--primary)] transition-colors"
                                >
                                  {child.label}
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block rounded-lg py-2.5 px-3 text-left text-sm font-medium transition-colors ${
                          item.href === "/#contact"
                            ? "mt-2 bg-[var(--fg)] text-[var(--bg-card)] text-center font-bold hover:bg-[var(--primary)] hover:text-white"
                            : "text-[var(--fg)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]"
                        }`}
                      >
                        {item.label}
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
