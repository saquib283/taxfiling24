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
import { getManagedPageSections } from "@/lib/managed-pages";
import prisma from "@/lib/prisma";
import JsonLd, { faqSchema, breadcrumbSchema } from "@/components/seo/JsonLd";

interface ServiceSummary {
  id?: string;
  title: string;
  slug?: string | null;
  href?: string | null;
}

interface FAQEntry {
  id: string;
  question: string;
  answer: string;
}

interface ArticleCard {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  thumbnailUrl?: string | null;
  createdAt: Date;
}

interface DeadlineEntry {
  id: string;
  title: string;
  category: string;
  date: Date;
  desc: string;
}

export default async function Home() {
  let settings: Record<string, string> = {};
  let servicesRes: ServiceSummary[] = [];
  let faqsRes: FAQEntry[] = [];
  let articlesRes: ArticleCard[] = [];
  let deadlinesRes: DeadlineEntry[] = [];
  let homeSections = getManagedPageSections("home");

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
    homeSections = getManagedPageSections("home", settings);
  } catch (error) {
    console.error("Database Resilience: Homepage failed to fetch some or all records. Using static fallbacks.", error);
  }

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
                  faqsRes.map((f) => ({
                    question: f.question,
                    answer: f.answer,
                  }))
                ),
              ]
            : []),
        ]}
      />
      {homeSections
        .filter((section) => section.isVisible)
        .map((section) => {
          switch (section.type) {
            case "home.hero":
              return <HeroSection key={section.id} settings={settings} content={section.data as Parameters<typeof HeroSection>[0]["content"]} />;
            case "home.stats":
              return <StatsSection key={section.id} settings={settings} content={section.data as Parameters<typeof StatsSection>[0]["content"]} />;
            case "home.about":
              return <AboutSection key={section.id} settings={settings} content={section.data as Parameters<typeof AboutSection>[0]["content"]} />;
            case "home.services":
              return <ServicesSection key={section.id} services={servicesRes} settings={settings} content={section.data as Parameters<typeof ServicesSection>[0]["content"]} />;
            case "home.process":
              return <ProcessSection key={section.id} settings={settings} content={section.data as Parameters<typeof ProcessSection>[0]["content"]} />;
            case "home.features":
              return <FeaturesSection key={section.id} settings={settings} content={section.data as Parameters<typeof FeaturesSection>[0]["content"]} />;
            case "home.testimonials":
              return <TestimonialsSection key={section.id} settings={settings} content={section.data as Parameters<typeof TestimonialsSection>[0]["content"]} />;
            case "home.articles":
              return <ArticlesSection key={section.id} articles={articlesRes} settings={settings} content={section.data as Parameters<typeof ArticlesSection>[0]["content"]} />;
            case "home.calendar":
              return <ComplianceCalendar key={section.id} deadlines={deadlinesRes} settings={settings} content={section.data as Parameters<typeof ComplianceCalendar>[0]["content"]} />;
            case "home.guidance":
              return <NeedGuidanceSection key={section.id} settings={settings} content={section.data as Parameters<typeof NeedGuidanceSection>[0]["content"]} />;
            case "home.cta":
              return <CTASection key={section.id} settings={settings} content={section.data as Parameters<typeof CTASection>[0]["content"]} />;
            case "home.faq":
              return <FAQSection key={section.id} faqs={faqsRes} settings={settings} content={section.data as Parameters<typeof FAQSection>[0]["content"]} />;
            default:
              return null;
          }
        })}
    </>
  );
}
