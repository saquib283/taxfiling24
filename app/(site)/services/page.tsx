import ServicesDirectoryPage from "@/components/sections/ServicesDirectoryPage";
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
import { absoluteUrl } from "@/lib/seo";

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
    </>
  );
}
