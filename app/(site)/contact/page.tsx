import ContactSection from "@/components/sections/ContactSection";
import ContactMap from "@/components/ui/ContactMap";
import { MapPin, Phone, Mail, MessageCircle } from "lucide-react";
import { CONTACT } from "@/lib/constants";
import prisma from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import JsonLd, { webPageSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with TaxFiling24 for expert tax filing, GST registration, company incorporation, and financial advisory services. Call, email, or WhatsApp us today.",
  alternates: {
    canonical: "https://taxfiling24.com/contact",
  },
  openGraph: {
    title: "Contact Us | TaxFiling24",
    description:
      "Get in touch with TaxFiling24 for expert tax filing, GST registration, company incorporation, and financial advisory services.",
    url: "https://taxfiling24.com/contact",
  },
};

export default async function ContactPage() {
  const settings = await getSettings();
  let serviceTitles: string[] = [];
  try {
    const dbServices = await prisma.service.findMany({
      select: { title: true },
      orderBy: { title: "asc" }
    });
    serviceTitles = dbServices.map(s => s.title);
  } catch (error) {
    console.warn("[DB] Failed to fetch services for contact form:", error);
  }

  const phone = settings.contact_phone || CONTACT.phone;
  const phoneRaw = phone.replace(/\D/g, "");
  const email = settings.contact_email || CONTACT.email;
  const address = settings.contact_address || CONTACT.address;
  const whatsapp = settings.contact_whatsapp || CONTACT.whatsapp;

  return (
    <div className="bg-slate-50/50 min-h-screen pt-32 pb-20 overflow-hidden">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: "https://taxfiling24.com" },
            { name: "Contact Us", url: "https://taxfiling24.com/contact" },
          ]),
          webPageSchema({
            name: "Contact TaxFiling24",
            description: "Get in touch with TaxFiling24 for expert tax filing and financial advisory services.",
            url: "https://taxfiling24.com/contact",
          }),
        ]}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Direct Layout */}
          <div className="lg:col-span-5 max-w-xl mx-auto lg:mx-0 flex flex-col pt-4 animate-in fade-in slide-in-from-left-4 duration-700">
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
                  value: phone, 
                  href: `tel:${phoneRaw}`, 
                  btnText: "Call Now" 
                },
                { 
                  icon: Mail, 
                  title: "Email Support Desk", 
                  value: email, 
                  href: `mailto:${email}`, 
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
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">{address}</p>
                  <a 
                    href={whatsapp} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs mt-3 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/50 hover:bg-emerald-100/50 transition-colors"
                  >
                    Chat on WhatsApp 
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Overlay Frame with strictly loaded Form Card */}
          <div className="lg:col-span-7">
            <ContactSection services={serviceTitles} />
          </div>

        </div>

        {/* Global Headquarters Map Section */}
        <div className="mt-24 lg:mt-32 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <div className="mb-10 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Visit Our Headquarters
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto leading-relaxed">
              We are centrally located in New Delhi. Drop by for a coffee and a strategic consultation regarding your corporate compliance.
            </p>
          </div>
          
          <ContactMap address={address} />
        </div>
      </div>
    </div>
  );
}
