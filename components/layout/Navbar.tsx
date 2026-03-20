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
      <nav className="container mx-auto flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
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

        <div className="hidden items-center gap-1 md:flex">
          {[
            { href: "/", label: "Home" },
            { href: "/services", label: "Services" },
            { href: "/#contact", label: "Contact" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                item.href === "/#contact"
                  ? "ml-3 bg-[var(--fg)] px-6 py-2.5 font-bold text-[var(--bg-card)] shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:bg-[var(--primary)] hover:text-white hover:shadow-[var(--shadow-md)]"
                  : "text-[var(--fg-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-[var(--fg)] md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
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
              {[
                { href: "/", label: "Home" },
                { href: "/services", label: "Services" },
                { href: "/#contact", label: "Contact" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg py-2.5 px-3 text-left text-sm font-medium text-[var(--fg)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </header>
  );
}
