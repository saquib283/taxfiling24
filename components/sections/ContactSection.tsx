"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FORM_SERVICES } from "@/lib/constants";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export default function ContactSection({
  services = [],
  content,
}: {
  services?: string[];
  content?: {
    title?: string;
    description?: string;
    submitButtonText?: string;
    fullNameLabel?: string;
    fullNamePlaceholder?: string;
    phoneLabel?: string;
    phonePlaceholder?: string;
    emailLabel?: string;
    emailPlaceholder?: string;
    serviceLabel?: string;
    servicePlaceholder?: string;
    messageLabel?: string;
    messagePlaceholder?: string;
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

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!formData.phone.trim() && !formData.email.trim()) {
      setError("Please provide at least a phone number or email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit inquiry.");
      }

      setSuccess(true);
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        service: "",
        message: "",
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
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

      {success ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-8 text-center space-y-4 animate-in fade-in zoom-in-95">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h4 className="text-lg font-bold text-emerald-900">Inquiry Received!</h4>
          <p className="text-sm text-emerald-700 max-w-md mx-auto leading-relaxed">
            Thank you for reaching out. An instant acknowledgment has been sent to your WhatsApp/email. One of our chartered accountants or corporate legal advisors will review your requirements promptly.
          </p>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {[ 
            {
              name: "fullName",
              label: content?.fullNameLabel || "Full Name",
              type: "text",
              required: true,
              placeholder: content?.fullNamePlaceholder || "John Doe",
            },
            {
              name: "phone",
              label: content?.phoneLabel || "Phone Number",
              type: "tel",
              required: true,
              placeholder: content?.phonePlaceholder || "+91 98765 43210",
            },
            {
              name: "email",
              label: content?.emailLabel || "Email Address",
              type: "email",
              required: false,
              placeholder: content?.emailPlaceholder || "john@example.com",
            },
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
              {content?.serviceLabel || "Select Service"} <span className="text-red-500">*</span>
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
              <option value="">{content?.servicePlaceholder || "Choose service"}</option>
              {displayServices.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-bold text-slate-700">{content?.messageLabel || "Message"}</label>
            <div className="relative">
              <textarea
                name="message"
                placeholder={content?.messagePlaceholder || "How can we help you?"}
                value={formData.message}
                onChange={handleChange}
                maxLength={500}
                rows={4}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-slate-900 text-sm focus:border-[var(--primary)] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/5 transition-all resize-none"
              />
              <span className="absolute bottom-3 right-3 text-xs text-slate-400 font-medium">
                {formData.message.length}/500
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3.5 font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              content?.submitButtonText || "Submit Application"
            )}
          </button>
        </form>
      )}
    </motion.div>
  );
}
