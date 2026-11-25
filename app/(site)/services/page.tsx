export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import ServicesDirectoryPage from "@/components/sections/ServicesDirectoryPage";
import PricingSection, { type PricingPlanItem } from "@/components/sections/PricingSection";
import JsonLd, {
  breadcrumbSchema,
  collectionPageSchema,
  itemListSchema,
} from "@/components/seo/JsonLd";
import { SERVICES } from "@/lib/constants";
import { findManagedSection, getManagedPageSections } from "@/lib/managed-pages";
import prisma from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getSiteContact } from "@/lib/site-contact";
import { absoluteUrl, buildPageMetadataFromSettings } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildPageMetadataFromSettings(settings, "services", {
    description:
      "Explore professional tax, GST, registration, audit, accounting, and advisory services from TaxFiling24.",
    keywords: ["tax services", "GST registration", "company filing", "audit services India"],
    path: "/services",
    title: "Business, Tax & Compliance Services",
  });
}

interface ServiceCard {
  id?: string;
  title: string;
  description: string;
  category?: string | null;
  slug?: string | null;
  href?: string | null;
}

type ServicesPageProps = Parameters<typeof ServicesDirectoryPage>[0];

type PageProps = {
  searchParams?: Promise<{
    q?: string | string[];
  }>;
};

export default async function ServicesPage({ searchParams }: PageProps) {
  const settings = await getSettings();
  const sections = getManagedPageSections("services", settings);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialSearch =
    typeof resolvedSearchParams?.q === "string" ? resolvedSearchParams.q : "";
  let services: ServiceCard[] = [];

  try {
    services = await prisma.service.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.warn("[DB] Failed to fetch services directory content:", error);
    services = SERVICES;
  }

  const heroSection = sections.find((section) => section.type === "services.hero");
  const directorySection = findManagedSection<Record<string, unknown>>(sections, "services.directory");
  const ctaSection = sections.find((section) => section.type === "services.cta");
  const { whatsapp } = getSiteContact(settings);

  let pricingPlans: PricingPlanItem[] = [];
  if (settings.pricing_plans) {
    try {
      const parsed = JSON.parse(settings.pricing_plans);
      if (Array.isArray(parsed)) {
        pricingPlans = parsed
          .filter(
            (plan): plan is Record<string, unknown> =>
              Boolean(
                plan &&
                  typeof plan === "object" &&
                  typeof (plan as Record<string, unknown>).name === "string" &&
                  String((plan as Record<string, unknown>).name).trim() &&
                  typeof (plan as Record<string, unknown>).price === "string"
              )
          )
          .map((plan) => ({
            name: String(plan.name).trim(),
            price: String(plan.price || "").trim(),
            description: String(plan.description || "").trim(),
            features: Array.isArray(plan.features)
              ? plan.features.map((f) => String(f || "").trim()).filter(Boolean)
              : [],
            highlighted: Boolean(plan.highlighted),
          }));
      }
    } catch {
      pricingPlans = [];
    }
  }

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Services", url: absoluteUrl("/services") },
          ]),
          collectionPageSchema({
            description:
              "Explore professional tax, GST, registration, audit, accounting, and advisory services from TaxFiling24.",
            name: "Services",
            url: absoluteUrl("/services"),
          }),
          itemListSchema(
            services.map((service) => ({
              name: service.title,
              url: absoluteUrl(service.href || `/services/${service.slug || service.id}`),
            }))
          ),
        ]}
      />
      <ServicesDirectoryPage
        services={services}
        heroContent={heroSection?.data as ServicesPageProps["heroContent"]}
        showHero={heroSection?.isVisible ?? true}
        directoryContent={directorySection?.data as ServicesPageProps["directoryContent"]}
        ctaContent={ctaSection?.data as ServicesPageProps["ctaContent"]}
        showCta={ctaSection?.isVisible ?? true}
        whatsappUrl={whatsapp}
        initialSearch={initialSearch}
      />
      {pricingPlans.length > 0 && <PricingSection plans={pricingPlans} ctaHref="/book" />}
    </>
  );
}
