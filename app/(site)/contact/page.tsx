import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import ContactSection from "@/components/sections/ContactSection";
import ContactMap from "@/components/ui/ContactMap";
import prisma from "@/lib/prisma";
import { CONTACT } from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import { getManagedPageSections } from "@/lib/managed-pages";
import JsonLd, { webPageSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import type { Metadata } from "next";

interface ContactCardItem {
  id: string;
  title?: string;
  value?: string;
  href?: string;
  buttonText?: string;
  isVisible?: boolean;
}

interface ContactSectionData {
  eyebrow?: string;
  title?: string;
  description?: string;
  whatsappLabel?: string;
  items?: ContactCardItem[];
  submitButtonText?: string;
}

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
  const sections = getManagedPageSections("contact", settings);
  let serviceTitles: string[] = [];

  try {
    const dbServices = await prisma.service.findMany({
      select: { title: true },
      orderBy: { title: "asc" },
    });
    serviceTitles = dbServices.map((service) => service.title);
  } catch (error) {
    console.warn("[DB] Failed to fetch services for contact form:", error);
  }

  const phone = settings.contact_phone || CONTACT.phone;
  const phoneRaw = phone.replace(/\D/g, "");
  const email = settings.contact_email || CONTACT.email;
  const address = settings.contact_address || CONTACT.address;
  const whatsapp = settings.contact_whatsapp || CONTACT.whatsapp;

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-20">
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

      {sections
        .filter((section) => section.isVisible)
        .map((section) => {
          const data = section.data as ContactSectionData;

          switch (section.type) {
            case "contact.hero":
              return (
                <section key={section.id} className="container mx-auto px-4 pb-8 sm:px-6 lg:px-8">
                  <div className="mx-auto max-w-4xl text-center">
                    <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--accent-light)]/20 bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[var(--primary)] shadow-sm">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {data.eyebrow}
                    </span>
                    <h1 className="mb-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                      {data.title}
                    </h1>
                    <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600">{data.description}</p>
                  </div>
                </section>
              );

            case "contact.cards":
              return (
                <section key={section.id} className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
                  <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
                    {(Array.isArray(data.items) ? data.items : [])
                      .filter((item) => item.isVisible !== false && item.title)
                      .map((item, index) => {
                        const Icon = index % 2 === 0 ? Phone : Mail;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-[var(--primary)]">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <h2 className="text-sm font-bold text-slate-900">{item.title}</h2>
                                <p className="mt-0.5 text-xs font-medium text-slate-500">{item.value}</p>
                              </div>
                            </div>
                            <a href={item.href} className="text-xs font-bold text-[var(--primary)] hover:underline">
                              {item.buttonText}
                            </a>
                          </div>
                        );
                      })}
                  </div>
                </section>
              );

            case "contact.address":
              return (
                <section key={section.id} className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
                  <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100/80 text-slate-500">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-800">{data.title}</h2>
                        <p className="mt-1 text-sm leading-relaxed text-slate-500">{data.description || address}</p>
                        <a
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1 rounded-lg border border-emerald-200/50 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 transition-colors hover:bg-emerald-100/50"
                        >
                          {data.whatsappLabel}
                        </a>
                      </div>
                    </div>
                  </div>
                </section>
              );

            case "contact.form":
              return (
                <section key={section.id} className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
                  <div className="mx-auto max-w-4xl">
                    <ContactSection services={serviceTitles} content={data} />
                  </div>
                </section>
              );

            case "contact.map":
              return (
                <section key={section.id} className="container mx-auto px-4 pt-8 sm:px-6 lg:px-8">
                  <div className="mb-10 text-center">
                    <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                      {data.title}
                    </h2>
                    <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-500">{data.description}</p>
                  </div>
                  <ContactMap address={address} />
                </section>
              );

            default:
              return null;
          }
        })}

      <div className="container mx-auto px-4 pt-8 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
        Direct contact: <a href={`tel:${phoneRaw}`} className="font-semibold text-[var(--primary)]">{phone}</a> {" | "}
        <a href={`mailto:${email}`} className="font-semibold text-[var(--primary)]">{email}</a>
      </div>
    </div>
  );
}
