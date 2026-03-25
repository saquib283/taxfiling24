import HeroSection from "@/components/sections/HeroSection";
import StatsSection from "@/components/sections/StatsSection";
import ServicesSection from "@/components/sections/ServicesSection";
import ProcessSection from "@/components/sections/ProcessSection";
import NeedGuidanceSection from "@/components/sections/NeedGuidanceSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import AboutSection from "@/components/sections/AboutSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import ArticlesSection from "@/components/sections/ArticlesSection";
import CTASection from "@/components/sections/CTASection";
import FAQSection from "@/components/sections/FAQSection";
import ComplianceCalendar from "@/components/sections/ComplianceCalendar";
import { getSettings } from "@/lib/settings";
import prisma from "@/lib/prisma";
import JsonLd, { faqSchema, breadcrumbSchema } from "@/components/seo/JsonLd";

export default async function Home() {
  let settings: Record<string, string> = {};
  let servicesRes: any[] = [];
  let faqsRes: any[] = [];
  let articlesRes: any[] = [];
  let deadlinesRes: any[] = [];
  let dynamicFeatures: { title: string; description: string }[] | undefined;

  try {
    // 1. Fetch settings and core data in parallel
    const [fetchedSettings, [fetchedServices, fetchedFaqs, fetchedArticles, fetchedDeadlines]] = await Promise.all([
      getSettings(),
      Promise.all([
        prisma.service.findMany({ take: 8, orderBy: { createdAt: "desc" } }),
        prisma.fAQ.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
        prisma.article.findMany({ where: { published: true }, take: 3, orderBy: { createdAt: "desc" } }),
        prisma.complianceDeadline.findMany({ where: { isActive: true }, orderBy: { date: "asc" } })
      ])
    ]);
    
    settings = fetchedSettings;
    servicesRes = fetchedServices;
    faqsRes = fetchedFaqs;
    articlesRes = fetchedArticles;
    deadlinesRes = fetchedDeadlines;

    // 2. Parse dynamic features if available
    if (settings.features_list) {
      try {
        dynamicFeatures = JSON.parse(settings.features_list);
      } catch {}
    }
  } catch (error) {
    console.error("Database Resilience: Homepage failed to fetch some or all records. Using static fallbacks.", error);
  }

  // Parse Dynamic Homepage Layout
  const DEFAULT_LAYOUT = [
    { id: "HeroSection", isVisible: true },
    { id: "StatsSection", isVisible: true },
    { id: "AboutSection", isVisible: true },
    { id: "ServicesSection", isVisible: true },
    { id: "ProcessSection", isVisible: true },
    { id: "FeaturesSection", isVisible: true },
    { id: "TestimonialsSection", isVisible: true },
    { id: "ArticlesSection", isVisible: true },
    { id: "ComplianceCalendar", isVisible: true },
    { id: "NeedGuidanceSection", isVisible: true },
    { id: "CTASection", isVisible: true },
    { id: "FAQSection", isVisible: true },
  ];

  let layout = DEFAULT_LAYOUT;
  if (settings.homepage_layout) {
    try {
      const parsed = JSON.parse(settings.homepage_layout);
      // Ensure missing defaults are appended
      const missing = DEFAULT_LAYOUT.filter(d => !parsed.find((p: any) => p.id === d.id));
      layout = [...parsed, ...missing];
    } catch {}
  }

  // Component Registry
  const sectionMap: Record<string, React.ReactNode> = {
    HeroSection: <HeroSection key="HeroSection" settings={settings} />,
    StatsSection: <StatsSection key="StatsSection" settings={settings} />,
    AboutSection: <AboutSection key="AboutSection" settings={settings} />,
    ServicesSection: <ServicesSection key="ServicesSection" services={servicesRes} />,
    ProcessSection: <ProcessSection key="ProcessSection" settings={settings} />,
    FeaturesSection: <FeaturesSection key="FeaturesSection" dynamicFeatures={dynamicFeatures} settings={settings} />,
    TestimonialsSection: <TestimonialsSection key="TestimonialsSection" settings={settings} />,
    ArticlesSection: <ArticlesSection key="ArticlesSection" articles={articlesRes} />,
    ComplianceCalendar: <ComplianceCalendar key="ComplianceCalendar" deadlines={deadlinesRes} />,
    NeedGuidanceSection: <NeedGuidanceSection key="NeedGuidanceSection" settings={settings} />,
    CTASection: <CTASection key="CTASection" settings={settings} />,
    FAQSection: <FAQSection key="FAQSection" faqs={faqsRes} settings={settings} />,
  };

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
             { name: "Home", url: "https://taxfiling24.com" },
          ]),
          ...(faqsRes.length > 0
            ? [
                faqSchema(
                  faqsRes.map((f: any) => ({
                    question: f.question,
                    answer: f.answer,
                  }))
                ),
              ]
            : []),
        ]}
      />
      {layout.filter((s: any) => s.isVisible).map((section: any) => sectionMap[section.id])}
    </>
  );
}
