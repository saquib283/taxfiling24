"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <section id="contact" className="border-t border-[var(--border)] bg-[var(--bg-card)] py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 text-2xl font-bold uppercase tracking-wide text-[var(--fg)] sm:text-3xl">
            Contact Us
          </h2>
          <p className="mx-auto max-w-xl text-[var(--fg-muted)]">
            Fill out the form and our team will get back to you within 24 hours
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-xl)]"
        >
          <div className="grid lg:grid-cols-5">
            <div className="rounded-t-[var(--radius-xl)] p-8 text-white lg:rounded-l-[var(--radius-xl)] lg:rounded-tr-none sm:p-12" style={{ backgroundImage: "var(--gradient-primary)" }}>
              <span className="mb-6 inline-block rounded-full bg-white/20 px-5 py-2 text-sm font-extrabold uppercase tracking-wider backdrop-blur-md shadow-sm">
                Get Started Today
              </span>
              <h3 className="mb-4 text-2xl font-bold">Get in Touch</h3>
              <p className="mb-8 text-white/90 text-sm leading-relaxed">
                Schedule your free consultation and discover how we can help your business.
              </p>
              <div className="space-y-5">
                {[
                  { icon: Phone, label: "Phone", value: CONTACT.phone, href: `tel:${CONTACT.phoneRaw}` },
                  { icon: Mail, label: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}` },
                  { icon: MapPin, label: "Head Office", value: CONTACT.address, href: null },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/70">{item.label}</p>
                      {item.href ? (
                        <a href={item.href} className="text-white/95 hover:underline">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-white/95 text-sm">{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <a
                href={CONTACT.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-block rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-95"
              >
                WhatsApp
              </a>
            </div>

            <div className="col-span-3 rounded-b-[var(--radius-lg)] bg-[var(--bg)] p-8 lg:rounded-r-[var(--radius-lg)] lg:rounded-bl-none sm:p-10">
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                {[
                  { name: "fullName", label: "Full Name", type: "text", required: true },
                  { name: "phone", label: "Phone Number", type: "tel", required: true },
                  { name: "email", label: "Email Address", type: "email", required: false },
                ].map((field) => (
                  <div key={field.name}>
                    <label className="mb-1.5 block text-sm font-medium text-[var(--fg)]">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={formData[field.name as keyof typeof formData]}
                      onChange={handleChange}
                      required={field.required}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
                    />
                  </div>
                ))}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--fg)]">
                    Select Service <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="service"
                    value={formData.service}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
                  >
                    <option value="">Choose service</option>
                    {FORM_SERVICES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--fg)]">Message</label>
                  <div className="relative">
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      maxLength={180}
                      rows={4}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2.5 pr-14 text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
                    />
                    <span className="absolute bottom-2.5 right-3 text-xs text-[var(--fg-soft)]">
                      {formData.message.length}/180
                    </span>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-xl py-3.5 font-bold text-white shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  Submit Form
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
