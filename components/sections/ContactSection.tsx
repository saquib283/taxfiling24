"use client";

import { useState } from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import { CONTACT, FORM_SERVICES } from "@/lib/constants";

export default function ContactSection() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    service: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <section id="contact" className="bg-[var(--color-background-light)] py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold uppercase text-[var(--color-primary-light)]">
            Contact Us
          </h2>
          <p className="mx-auto max-w-2xl text-[var(--color-text-secondary)]">
            Fill out the form below and our expert team will get back to you
            within 24 hours with the best solution for your business
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl shadow-xl">
          <div className="grid lg:grid-cols-5">
            {/* Left - Get in Touch */}
            <div className="rounded-t-2xl bg-gradient-to-b from-[var(--color-primary)] to-[#1a2e5c] p-8 text-white lg:rounded-l-2xl lg:rounded-tr-none">
              <span className="mb-4 inline-block rounded-lg bg-[var(--color-accent-teal)] px-4 py-1.5 text-sm font-medium">
                Get Started Today
              </span>
              <h3 className="mb-4 text-3xl font-bold">Get in Touch</h3>
              <p className="mb-8 text-white/90">
                Schedule your free consultation today and discover how
                professional financial guidance can transform your business.
              </p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-teal)]/20">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">Phone</p>
                    <a href={`tel:${CONTACT.phoneRaw}`} className="text-white/90 hover:underline">
                      {CONTACT.phone}
                    </a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-teal)]/20">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">Email</p>
                    <a href={`mailto:${CONTACT.email}`} className="text-white/90 hover:underline">
                      {CONTACT.email}
                    </a>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-teal)]/20">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">Head Office</p>
                    <p className="text-white/90">{CONTACT.address}</p>
                  </div>
                </div>
              </div>
              <a
                href={CONTACT.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-6 py-3 font-medium text-white"
              >
                WhatsApp
              </a>
            </div>

            {/* Right - Form */}
            <div className="col-span-3 rounded-b-2xl bg-white p-8 lg:rounded-r-2xl lg:rounded-bl-none">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="mb-1 block font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-gray-700">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]/20"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-gray-700">
                    Select Required Service <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]/20"
                  >
                    <option value="">Choose service</option>
                    {FORM_SERVICES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block font-medium text-gray-700">
                    Message
                  </label>
                  <div className="relative">
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      maxLength={180}
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-16 focus:border-[var(--color-primary-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-light)]/20"
                    />
                    <span className="absolute bottom-3 right-3 text-xs text-gray-500">
                      {formData.message.length}/180
                    </span>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[var(--color-primary)] py-3 font-medium text-white transition-colors hover:bg-[var(--color-primary-dark)]"
                >
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
