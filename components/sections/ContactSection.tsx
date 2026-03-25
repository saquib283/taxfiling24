"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FORM_SERVICES } from "@/lib/constants";

export default function ContactSection({
  services = [],
  content,
}: {
  services?: string[];
  content?: {
    title?: string;
    description?: string;
    submitButtonText?: string;
  };
}) {
  const displayServices = services.length > 0 ? services : FORM_SERVICES;

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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] p-8 sm:p-10"
    >
      <div className="mb-8">
        <h3 className="text-2xl font-black text-slate-900 mb-2">{content?.title || "Send us a Message"}</h3>
        <p className="text-slate-500 text-sm">{content?.description || "We typically respond within 24 hours on business days."}</p>
      </div>

      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        {[
          { name: "fullName", label: "Full Name", type: "text", required: true, placeholder: "John Doe" },
          { name: "phone", label: "Phone Number", type: "tel", required: true, placeholder: "+91 98765 43210" },
          { name: "email", label: "Email Address", type: "email", required: false, placeholder: "john@example.com" },
        ].map((field) => (
          <div key={field.name}>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              value={formData[field.name as keyof typeof formData]}
              onChange={handleChange}
              required={field.required}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 text-sm focus:border-[var(--primary)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/5 transition-all"
            />
          </div>
        ))}
        
        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">
            Select Service <span className="text-red-500">*</span>
          </label>
          <select
            name="service"
            value={formData.service}
            onChange={handleChange}
            required
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 text-sm focus:border-[var(--primary)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/5 transition-all appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: `right 12px center`,
              backgroundRepeat: `no-repeat`,
              backgroundSize: `20px`,
            }}
          >
            <option value="">Choose service</option>
            {displayServices.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">Message</label>
          <div className="relative">
            <textarea
              name="message"
              placeholder="How can we help you?"
              value={formData.message}
              onChange={handleChange}
              maxLength={180}
              rows={4}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 text-sm focus:border-[var(--primary)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/5 transition-all resize-none"
            />
            <span className="absolute bottom-3 right-3 text-xs text-slate-400 font-medium">
              {formData.message.length}/180
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl py-3.5 font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 shadow-sm transition-all hover:-translate-y-0.5"
        >
          {content?.submitButtonText || "Submit Application"}
        </button>
      </form>
    </motion.div>
  );
}
