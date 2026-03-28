"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Search } from "lucide-react";
import { FileCheck } from "lucide-react";
 
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
  dynamicServices = [] 
}: { 
  settings?: Record<string, string>,
  dynamicServices?: { title: string; slug: string }[]
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const hardcodedNavItems: NavItem[] = [
    { href: "/", label: "Home", visible: true },
    { href: "/about", label: "About", visible: true },
    { 
      href: "/services", 
      label: "Services",
      visible: true,
      children: [
        { href: "/services", label: "All Services", visible: true },
        { href: "/services#income-tax", label: "Income Tax", visible: true },
        { href: "/services#gst", label: "GST Filings", visible: true },
        { href: "/services#business", label: "Business Registration", visible: true },
      ]
    },
    { 
      href: "/tools", 
      label: "Tools",
      visible: true,
      children: [
        { href: "/tools/tax-calculator", label: "Income Tax Calculator", visible: true },
        { href: "/tools/gst-calculator", label: "GST Calculator (HSN)", visible: true }
      ]
    },
    { href: "/articles", label: "Articles", visible: true },
    { href: "/contact", label: "Contact", visible: true },
  ];

  const [navItems, setNavItems] = useState(hardcodedNavItems);

  useEffect(() => {
    let baseItems = [...hardcodedNavItems];
    
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

    if (settings.NAVBAR_CONFIG) {
      try {
        const config = JSON.parse(settings.NAVBAR_CONFIG);
        if (Array.isArray(config) && config.length > 0) {
          setNavItems(config);
          return;
        }
      } catch (err) {
        console.error("Failed to parse NAVBAR_CONFIG:", err);
      }
    }
    
    setNavItems(baseItems);
  }, [settings.NAVBAR_CONFIG, dynamicServices]);

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
          <img 
            src="/logo.png" 
            className="h-10 w-10 object-cover rounded-full shadow-[var(--shadow-sm)]" 
            alt="TaxFiling24 Logo" 
          />
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
          {navItems.filter(item => item.visible !== false && item.href !== "/contact").map((item) => {
            if (item.children) {
              return (
                <div key={item.label} className="relative group">
                  <button className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--fg-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)] transition-all cursor-pointer">
                    {item.label}
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-hover:rotate-180" />
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-[var(--border)] rounded-xl shadow-[var(--shadow-md)] overflow-hidden hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-2 border-b border-[var(--border)] sticky top-0 bg-white z-10">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search services..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto py-1">
                      {(() => {
                        const filtered = item.children.filter((child: any) => 
                          child.label.toLowerCase().includes(searchQuery.toLowerCase())
                        );
                        
                        if (filtered.length === 0) {
                          return (
                            <div className="px-4 py-3 text-sm text-slate-500 text-center italic">
                              No services found
                            </div>
                          );
                        }
                        
                        return filtered.map((child: any) => (
                          <Link 
                            key={child.href} 
                            href={child.href}
                            className="block px-4 py-2.5 text-sm text-[var(--fg-muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)] transition-colors"
                          >
                            {child.label}
                          </Link>
                        ));
                      })()}
                    </div>
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
            href="/contact"
            className="hidden md:block bg-[var(--primary)] px-6 py-2.5 rounded-xl font-bold text-sm text-[var(--bg-card)] shadow-[var(--shadow-sm)] hover:-translate-y-0.5 hover:bg-[var(--primary-hover)] hover:shadow-[var(--shadow-md)] transition-all duration-200"
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
              {navItems.filter(item => item.visible !== false).map((item) => {
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
                              className="pl-4 space-y-1 bg-gray-50/50 rounded-lg mt-1 mb-1 overflow-hidden"
                            >
                              <div className="p-2 border-b border-gray-100">
                                <div className="relative">
                                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                  <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs focus:outline-none transition-all"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                              </div>
                              <div className="max-h-60 overflow-y-auto py-1">
                                {(() => {
                                  const filtered = item.children?.filter((child: any) => 
                                    child.label.toLowerCase().includes(searchQuery.toLowerCase())
                                  );
                                  
                                  if (filtered?.length === 0) {
                                    return (
                                      <div className="px-3 py-2 text-[10px] text-slate-500 italic">
                                        No results
                                      </div>
                                    );
                                  }
                                  
                                  return filtered?.map((child: any) => (
                                    <Link
                                      key={child.href}
                                      href={child.href}
                                      onClick={() => {
                                        setMobileMenuOpen(false);
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
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block rounded-lg py-2.5 px-3 text-left text-sm font-medium transition-colors ${
                          item.href === "/contact"
                            ? "mt-2 bg-[var(--primary)] text-[var(--bg-card)] text-center font-bold hover:bg-[var(--primary-hover)]"
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
