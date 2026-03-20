"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search, Filter, Percent, Building2, SearchCode, ShieldCheck, Briefcase } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fadeUp } from "@/lib/animations";

import { SERVICES } from "@/lib/constants";

const servicesWithCategories = SERVICES.map(service => ({
  ...service,
  category: service.title.toLowerCase().includes('tax') ? 'tax' :
           service.title.toLowerCase().includes('gst') ? 'gst' :
           service.title.toLowerCase().includes('audit') ? 'audit' :
           service.title.toLowerCase().includes('compliance') ? 'compliance' : 'advisory'
}));

const categoryIcons = {
  tax: Percent,
  gst: Building2,
  audit: SearchCode,
  compliance: ShieldCheck,
  advisory: Briefcase
};

export default function ServicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "All Services" },
    { id: "tax", name: "Tax Services" },
    { id: "gst", name: "GST Services" },
    { id: "audit", name: "Audit Services" },
    { id: "compliance", name: "Compliance" },
    { id: "advisory", name: "Advisory" }
  ];

  const filteredServices = servicesWithCategories.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-4xl mx-auto">
            <h1 className="mb-6 text-4xl font-extrabold text-blue-900 sm:text-5xl">
              Our <span className="text-blue-600">Professional Services</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Comprehensive CA services tailored to meet your business and personal financial needs
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="py-8 bg-white border-b border-blue-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === category.id
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service, index) => {
              const IconComponent = categoryIcons[service.category as keyof typeof categoryIcons] || Briefcase;
              return (
              <AnimatedSection key={service.title} variants={fadeUp}>
                <motion.a
                  href={service.href}
                  className="block relative rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--accent-light)] hover:shadow-[var(--shadow-lg)] group overflow-hidden h-full flex flex-col"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="absolute top-0 right-0 -mt-6 -mr-6 w-24 h-24 bg-[var(--primary)] opacity-[0.03] rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none"></div>
                  
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-white transition-all duration-300 group-hover:scale-110 group-hover:shadow-[var(--shadow-md)] flex-shrink-0" style={{ backgroundImage: "var(--gradient-primary)" }}>
                    <IconComponent className="h-6 w-6 text-white" strokeWidth={2} />
                  </div>
                  
                  <div className="flex-1 flex flex-col">
                    <span className="inline-block w-fit px-2.5 py-1 rounded-md text-xs font-bold bg-[var(--accent-soft)] text-[var(--primary)] mb-3 border border-[var(--accent-light)]/20 uppercase tracking-wider">
                      {service.category}
                    </span>

                    <h3 className="mb-2 text-lg font-bold text-[var(--fg)] group-hover:text-[var(--primary)] transition-colors leading-tight">
                      {service.title}
                    </h3>
                    
                    <p className="mb-6 text-[var(--fg-soft)] text-sm leading-relaxed line-clamp-2">
                      {service.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center text-[var(--primary)] font-bold text-sm pt-4 border-t border-[var(--border)] mt-auto">
                    <span>Explore Details</span>
                    <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </motion.a>
              </AnimatedSection>
            );
            })}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No services found matching your criteria.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="mb-4 text-3xl font-bold text-white">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-xl text-blue-100">
              Contact us today for a free consultation and let us help you achieve your financial goals.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <motion.a
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-3 font-medium text-blue-600 transition-colors hover:bg-blue-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Get Started
                <ArrowRight className="h-4 w-4" />
              </motion.a>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
