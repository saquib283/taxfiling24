"use client";

import ContactSection from "@/components/sections/ContactSection";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { CONTACT } from "@/lib/constants";

export default function ContactPage() {
  return (
    <div className="bg-slate-50/50 min-h-screen pt-32 pb-20 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Direct Layout */}
          <motion.div 
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 max-w-xl mx-auto lg:mx-0 flex flex-col pt-4"
          >
            <span className="inline-flex items-center gap-2 bg-[var(--accent-soft)] text-[var(--primary)] px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-5 border border-[var(--accent-light)]/20 shadow-sm w-fit">
              <MessageCircle className="h-3.5 w-3.5" />
              Contact Us
            </span>
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-5 tracking-tight leading-none">
              Let's connect & alignment your finances.
            </h1>
            <p className="text-slate-600 mb-10 text-base font-normal leading-relaxed">
              Have questions regarding tax filing, GST setup, or general audits? Chat with our certified CAs for accurate corporate compliance modeling.
            </p>

            {/* Structured Support Cards */}
            <div className="space-y-4">
              {[
                { 
                  icon: Phone, 
                  title: "Call our Counsel", 
                  value: CONTACT.phone, 
                  href: `tel:${CONTACT.phoneRaw}`, 
                  btnText: "Call Now" 
                },
                { 
                  icon: Mail, 
                  title: "Email Support Desk", 
                  value: CONTACT.email, 
                  href: `mailto:${CONTACT.email}`, 
                  btnText: "Send Mail" 
                },
              ].map((item, idx) => (
                <div key={idx} className="p-5 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] hover:border-slate-300 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[var(--primary)]">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{item.value}</p>
                    </div>
                  </div>
                  <a href={item.href} className="text-xs font-bold text-[var(--primary)] hover:underline">
                    {item.btnText}
                  </a>
                </div>
              ))}
            </div>

            {/* Bottom Address Block */}
            <div className="mt-8 border-t border-slate-200 pt-6">
              <div className="flex gap-4">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100/80 text-slate-500 flex-shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Corporate Address</h4>
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">{CONTACT.address}</p>
                  <a 
                    href={CONTACT.whatsapp} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs mt-3 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/50 hover:bg-emerald-100/50 transition-colors"
                  >
                    Chat on WhatsApp 
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Overlay Frame with strictly loaded Form Card */}
          <div className="lg:col-span-7">
            <ContactSection />
          </div>

        </div>
      </div>
    </div>
  );
}
