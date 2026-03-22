import HeroSection from "@/components/sections/HeroSection";
import StatsSection from "@/components/sections/StatsSection";
import ServicesSection from "@/components/sections/ServicesSection";
import NeedGuidanceSection from "@/components/sections/NeedGuidanceSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import AboutSection from "@/components/sections/AboutSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import CTASection from "@/components/sections/CTASection";
import FAQSection from "@/components/sections/FAQSection";
import ComplianceCalendar from "@/components/sections/ComplianceCalendar";
import { getSettings } from "@/lib/settings";
import prisma from "@/lib/prisma";

export default async function Home() {
  const settings = await getSettings();

  // Parse dynamic features from admin if available
  let dynamicFeatures: { title: string; description: string }[] | undefined;
  if (settings.features_list) {
    try {
      dynamicFeatures = JSON.parse(settings.features_list);
    } catch {}
  }

  const servicesRes = await prisma.service.findMany({
    take: 8,
    orderBy: { createdAt: "desc" },
  });

  const faqsRes = await prisma.fAQ.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <HeroSection settings={settings} />
      <StatsSection settings={settings} />
      <AboutSection settings={settings} />
      <ServicesSection services={servicesRes} />
      <FeaturesSection dynamicFeatures={dynamicFeatures} />
      <TestimonialsSection />
      <ComplianceCalendar />
      <NeedGuidanceSection settings={settings} />
      <CTASection settings={settings} />
      <FAQSection faqs={faqsRes} />
    </>
  );
}
