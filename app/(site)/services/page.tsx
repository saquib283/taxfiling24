import ServicesDirectoryPage from "@/components/sections/ServicesDirectoryPage";
import { SERVICES } from "@/lib/constants";
import { getManagedPageSections } from "@/lib/managed-pages";
import prisma from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

interface ServiceCard {
  id?: string;
  title: string;
  description: string;
  category?: string | null;
  slug?: string | null;
  href?: string | null;
}

type ServicesPageProps = Parameters<typeof ServicesDirectoryPage>[0];

export default async function ServicesPage() {
  const settings = await getSettings();
  const sections = getManagedPageSections("services", settings);
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
  const ctaSection = sections.find((section) => section.type === "services.cta");

  return (
    <ServicesDirectoryPage
      services={services}
      heroContent={heroSection?.data as ServicesPageProps["heroContent"]}
      showHero={heroSection?.isVisible ?? true}
      ctaContent={ctaSection?.data as ServicesPageProps["ctaContent"]}
      showCta={ctaSection?.isVisible ?? true}
    />
  );
}
