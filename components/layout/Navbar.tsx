"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { CheckCircle } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white shadow-md"
          : "bg-white/95 backdrop-blur-sm"
      }`}
    >
      <nav className="container mx-auto flex items-center justify-between px-4 py-4 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setMobileMenuOpen(false)}
        >
          <CheckCircle
            className="h-8 w-8 text-[var(--color-accent-teal)]"
            strokeWidth={2}
          />
          <span className="text-xl font-bold">
            <span className="text-[var(--color-primary-light)]">TaxFiling</span>
            <span className="text-[var(--color-accent-teal)]">24</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <button
            onClick={() => scrollToSection("hero")}
            className="text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-accent-teal)]"
          >
            Home
          </button>
          <div className="relative">
            <button
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
              className="flex items-center gap-1 text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-accent-teal)]"
            >
              Services
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  servicesOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {servicesOpen && (
              <div
                onMouseEnter={() => setServicesOpen(true)}
                onMouseLeave={() => setServicesOpen(false)}
                className="absolute left-0 top-full mt-1 w-64 rounded-lg bg-white py-2 shadow-lg"
              >
                <Link
                  href="#services"
                  onClick={() => scrollToSection("services")}
                  className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  All Services
                </Link>
              </div>
            )}
          </div>
          <button
            onClick={() => scrollToSection("contact")}
            className="text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-accent-teal)]"
          >
            Contact Us
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[var(--color-primary-light)]"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-4">
          <button
            onClick={() => scrollToSection("hero")}
            className="block w-full py-2 text-left text-[var(--color-primary-light)]"
          >
            Home
          </button>
          <button
            onClick={() => {
              scrollToSection("services");
            }}
            className="block w-full py-2 text-left text-[var(--color-primary-light)]"
          >
            Services
          </button>
          <button
            onClick={() => scrollToSection("contact")}
            className="block w-full py-2 text-left text-[var(--color-primary-light)]"
          >
            Contact Us
          </button>
        </div>
      )}
    </header>
  );
}
