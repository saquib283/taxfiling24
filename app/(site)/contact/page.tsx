export const dynamic = "force-dynamic";

import { Mail, MapPin, Phone } from "lucide-react";
import ContactSection from "@/components/sections/ContactSection";
import ContactMap from "@/components/ui/ContactMap";
import PageHero from "@/components/layout/PageHero";
import prisma from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getManagedPageSections } from "@/lib/managed-pages";
import JsonLd, { webPageSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import type { Metadata } from "next";
import { getSiteContact } from "@/lib/site-contact";
import { absoluteUrl, buildPageMetadataFromSettings } from "@/lib/seo";
import { sanitizeHref } from "@/lib/url-safety";

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
  directContactLabel?: string;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildPageMetadataFromSettings(settings, "contact", {
    description:
      "Contact TaxFiling24 for expert tax filing, GST registration, company incorporation, and financial advisory services.",
    keywords: ["contact TaxFiling24", "tax consultant contact", "GST registration help"],
    path: "/contact",
    title: "Contact Us",
  });
}

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

  const { phone, phoneRaw, email, address, whatsapp } = getSiteContact(settings);

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-20">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Contact Us", url: absoluteUrl("/contact") },
          ]),
          webPageSchema({
            name: "Contact TaxFiling24",
            description: "Get in touch with TaxFiling24 for expert tax filing and financial advisory services.",
            url: absoluteUrl("/contact"),
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
                <PageHero
                  key={section.id}
                  title={data.title || "Contact TaxFiling24"}
                  description={data.description}
                />
              );

            case "contact.cards":
              return (
                <section key={section.id} className="container mx-auto px-4 pt-10 pb-6 sm:px-6 lg:px-8">
                  <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
                    {(Array.isArray(data.items) ? data.items : [])
                      .filter((item) => item.isVisible !== false && item.title)
                      .map((item, index) => {
                        const Icon = index % 2 === 0 ? Phone : Mail;
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary)]">
                                <Icon className="h-5 w-5" />
                              </div>
                              <div>
                                <h2 className="text-sm font-bold text-[var(--fg)]">{item.title}</h2>
                                <p className="mt-0.5 text-xs font-medium text-[var(--fg-muted)]">{item.value}</p>
                              </div>
                            </div>
                            <a href={sanitizeHref(item.href)} className="text-xs font-bold text-[var(--primary)] hover:underline">
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
                  <div className="mx-auto max-w-5xl rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)]">
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary)]">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-[var(--fg)]">{data.title}</h2>
                        <p className="mt-1 text-sm leading-relaxed text-[var(--fg-muted)]">{data.description || address}</p>
                        <a
                          href={sanitizeHref(whatsapp)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1 rounded-lg border border-emerald-200/70 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100/70"
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
                  <div className="mx-auto max-w-5xl">
                    <ContactSection services={serviceTitles} content={data} />
                  </div>
                </section>
              );

            case "contact.map":
              return (
                <section key={section.id} className="container mx-auto px-4 pt-8 sm:px-6 lg:px-8">
                  <div className="mx-auto max-w-5xl">
                    <div className="mb-10 text-center">
                      <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        {data.title}
                      </h2>
                      <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-500">{data.description}</p>
                    </div>
                    <ContactMap address={address} />
                  </div>
                </section>
              );

            default:
              return null;
          }
        })}

      <div className="container mx-auto px-4 pt-8 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
        {String((sections.find((section) => section.type === "contact.map")?.data as ContactSectionData | undefined)?.directContactLabel || "Direct contact:")}{" "}
        <a href={`tel:${phoneRaw}`} className="font-semibold text-[var(--primary)]">{phone}</a> {" | "}
        <a href={`mailto:${email}`} className="font-semibold text-[var(--primary)]">{email}</a>
      </div>
    </div>
  );
}
