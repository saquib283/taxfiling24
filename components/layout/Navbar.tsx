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
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-[var(--border)] bg-[var(--bg-card)]/80 shadow-[var(--shadow-md)] backdrop-blur-xl"
          : "border-b border-transparent bg-[var(--bg-card)]"
      }`}
    >
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
            { id: "hero", label: "Home" },
            { id: "services", label: "Services", dropdown: true },
            { id: "contact", label: "Contact" },
          ].map((item) =>
            item.dropdown ? (
              <div key={item.id} className="relative">
                <button
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                  className="flex items-center gap-1 rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--fg-muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]"
                >
                  {item.label}
                  <ChevronDown className={`h-4 w-4 transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {servicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      onMouseEnter={() => setServicesOpen(true)}
                      onMouseLeave={() => setServicesOpen(false)}
                      className="absolute left-0 top-full mt-1 w-48 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-[var(--shadow-lg)]"
                    >
                      <Link
                        href="#services"
                        onClick={() => scrollToSection("services")}
                        className="block rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--fg-muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]"
                      >
                        All Services
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={
                  item.id === "contact"
                    ? "ml-3 rounded-xl bg-[var(--fg)] px-6 py-2.5 text-sm font-semibold text-[var(--bg-card)] shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:bg-[var(--primary)] hover:shadow-[var(--shadow-md)]"
                    : "rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--fg-muted)] transition-colors hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]"
                }
              >
                {item.label}
              </button>
            )
          )}
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
            className="border-t border-[var(--border)] bg-[var(--bg-card)] px-4 py-4 md:hidden"
          >
            <div className="flex flex-col gap-0.5">
              {["hero", "services", "contact"].map((id) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className="rounded-lg py-2.5 px-3 text-left text-sm font-medium text-[var(--fg)]"
                >
                  {id === "hero" ? "Home" : id === "services" ? "Services" : "Contact"}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
