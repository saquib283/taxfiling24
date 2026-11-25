export const dynamic = "force-dynamic";

import fs from "fs";
import path from "path";
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
import { getSettings, pickPublicSettings } from "@/lib/settings";
import { getManagedPageSections } from "@/lib/managed-pages";
import { FAQ_ITEMS } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo";
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

interface ReviewEntry {
  id?: string;
  name: string;
  role?: string | null;
  content: string;
  rating?: number;
  isApproved?: boolean;
}

function loadFallbackReviews(): ReviewEntry[] {
  try {
    const filePath = path.join(process.cwd(), "data", "testimonials.json");
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (Array.isArray(parsed)) {
        return parsed.filter((r): r is ReviewEntry => Boolean(r?.isApproved !== false && r?.name && r?.content));
      }
    }
  } catch {}
  return [];
}

export default async function Home() {
  let settings: Record<string, string> = {};
  let servicesRes: ServiceSummary[] = [];
  let faqsRes: FAQEntry[] = [];
  let articlesRes: ArticleCard[] = [];
  let deadlinesRes: DeadlineEntry[] = [];
  let reviewsRes: ReviewEntry[] = [];
  let homeSections = getManagedPageSections("home");

  try {
    // 1. Fetch settings and core data in parallel
    const [fetchedSettings, [fetchedServices, fetchedFaqs, fetchedArticles, fetchedDeadlines, fetchedReviews]] = await Promise.all([
      getSettings(),
      Promise.all([
        prisma.service.findMany({ take: 8, orderBy: { createdAt: "desc" } }),
        prisma.fAQ.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
        prisma.article.findMany({ where: { published: true }, take: 3, orderBy: { createdAt: "desc" } }),
        prisma.complianceDeadline.findMany({ where: { isActive: true }, orderBy: { date: "asc" } }),
        prisma.review.findMany({ where: { isApproved: true }, orderBy: { createdAt: "desc" } }),
      ])
    ]);
    
    settings = fetchedSettings;
    servicesRes = fetchedServices;
    faqsRes = fetchedFaqs;
    articlesRes = fetchedArticles;
    deadlinesRes = fetchedDeadlines;
    reviewsRes = fetchedReviews.length > 0 ? fetchedReviews : loadFallbackReviews();
    homeSections = getManagedPageSections("home", settings);
  } catch (error) {
    console.error("Database Resilience: Homepage failed to fetch some or all records. Using static fallbacks.", error);
    reviewsRes = loadFallbackReviews();
  }

  const publicSettings = pickPublicSettings(settings);

  const schemaFaqs =
    faqsRes.length > 0
      ? faqsRes.map((f) => ({ question: f.question, answer: f.answer }))
      : FAQ_ITEMS.map((f) => ({ question: f.question, answer: f.answer }));

  return (
    <>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
          ]),
          ...(schemaFaqs.length > 0 ? [faqSchema(schemaFaqs)] : []),
        ]}
      />
      {homeSections
        .filter((section) => section.isVisible)
        .map((section) => {
          switch (section.type) {
            case "home.hero":
              return <HeroSection key={section.id} settings={publicSettings} content={section.data as Parameters<typeof HeroSection>[0]["content"]} />;
            case "home.stats":
              return <StatsSection key={section.id} settings={publicSettings} content={section.data as Parameters<typeof StatsSection>[0]["content"]} />;
            case "home.about":
              return <AboutSection key={section.id} settings={publicSettings} content={section.data as Parameters<typeof AboutSection>[0]["content"]} />;
            case "home.services":
              return <ServicesSection key={section.id} services={servicesRes} settings={publicSettings} content={section.data as Parameters<typeof ServicesSection>[0]["content"]} />;
            case "home.process":
              return <ProcessSection key={section.id} settings={publicSettings} content={section.data as Parameters<typeof ProcessSection>[0]["content"]} />;
            case "home.features":
              return <FeaturesSection key={section.id} settings={publicSettings} content={section.data as Parameters<typeof FeaturesSection>[0]["content"]} />;
            case "home.testimonials":
              return <TestimonialsSection key={section.id} initialReviews={reviewsRes} settings={publicSettings} content={section.data as Parameters<typeof TestimonialsSection>[0]["content"]} />;
            case "home.articles":
              return <ArticlesSection key={section.id} articles={articlesRes} settings={publicSettings} content={section.data as Parameters<typeof ArticlesSection>[0]["content"]} />;
            case "home.calendar":
              return <ComplianceCalendar key={section.id} deadlines={deadlinesRes} settings={publicSettings} content={section.data as Parameters<typeof ComplianceCalendar>[0]["content"]} />;
            case "home.guidance":
              return <NeedGuidanceSection key={section.id} settings={publicSettings} content={section.data as Parameters<typeof NeedGuidanceSection>[0]["content"]} />;
            case "home.cta":
              return <CTASection key={section.id} settings={publicSettings} content={section.data as Parameters<typeof CTASection>[0]["content"]} />;
            case "home.faq":
              return <FAQSection key={section.id} faqs={faqsRes} settings={publicSettings} content={section.data as Parameters<typeof FAQSection>[0]["content"]} />;
            default:
              return null;
          }
        })}
    </>
  );
}
