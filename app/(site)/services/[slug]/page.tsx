import { SERVICES_DETAIL_DATA } from "@/lib/services-detail-data";
import { notFound } from "next/navigation";
import {
  CheckCircle2, Clock, FileText, ArrowLeft,
  ArrowRight, Shield, Zap, HelpCircle, ChevronRight
} from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fadeUp } from "@/lib/animations";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import Link from "next/link";
import JsonLd, { serviceSchema, faqSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { findManagedSection, getManagedPageSections } from "@/lib/managed-pages";
import { getSettings } from "@/lib/settings";
import { getSiteContact } from "@/lib/site-contact";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  let dbData = null;
  try {
    dbData = await prisma.service.findUnique({ where: { slug } });
  } catch (e) {
    console.error("Failed to fetch service metadata from DB", e);
  }

  const data = dbData || SERVICES_DETAIL_DATA[slug];
  if (!data) return { title: "Service Not Found" };

  return {
    title: data.title,
    description: data.description,
    alternates: {
      canonical: `https://taxfiling24.com/services/${slug}`,
    },
    openGraph: {
      title: `${data.title} | TaxFiling24`,
      description: data.description,
      url: `https://taxfiling24.com/services/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.description,
    },
  };
}

export async function generateStaticParams() {
  try {
    const dbServices = await prisma.service.findMany({ select: { slug: true } });
    if (dbServices.length > 0) {
       return dbServices.map((s) => ({ slug: s.slug }));
    }
  } catch (e) {}

  return Object.keys(SERVICES_DETAIL_DATA).map((slug) => ({
    slug,
  }));
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const settings = await getSettings();
  const templateSections = getManagedPageSections("serviceDetail", settings);
  const heroTemplate = findManagedSection<Record<string, unknown>>(templateSections, "service-detail.hero")?.data;
  const overviewTemplate = findManagedSection<Record<string, unknown>>(templateSections, "service-detail.overview")?.data;
  const subServicesTemplate =
    findManagedSection<Record<string, unknown>>(templateSections, "service-detail.subservices")?.data;
  const processTemplate = findManagedSection<Record<string, unknown>>(templateSections, "service-detail.process")?.data;
  const documentsTemplate =
    findManagedSection<Record<string, unknown>>(templateSections, "service-detail.documents")?.data;
  const faqTemplate = findManagedSection<Record<string, unknown>>(templateSections, "service-detail.faq")?.data;
  const ctaTemplate = findManagedSection<Record<string, unknown>>(templateSections, "service-detail.cta")?.data;
  const { whatsapp } = getSiteContact(settings);
  
  let dbData = null;
  try {
    dbData = await prisma.service.findUnique({ where: { slug } });
  } catch (e) {
    console.error("Failed to fetch service from DB", e);
  }

  const data = dbData || SERVICES_DETAIL_DATA[slug];

  if (!data) {
    notFound();
  }

  // Robust parsing of JSON fields with smart fallbacks to static data if newly created services are empty
  const rawBenefits = dbData?.benefits;
  const benefits = Array.isArray(rawBenefits) && rawBenefits.length > 0 ? rawBenefits : (SERVICES_DETAIL_DATA[slug]?.benefits || []);

  const rawSubServices = dbData?.subServices;
  const subServices = Array.isArray(rawSubServices) && rawSubServices.length > 0 ? rawSubServices : (SERVICES_DETAIL_DATA[slug]?.subServices || []);

  const rawProcess = dbData?.process;
  const processSteps = Array.isArray(rawProcess) && rawProcess.length > 0 ? rawProcess : (SERVICES_DETAIL_DATA[slug]?.process || []);

  const rawDocs = dbData?.documentsRequired;
  const documentsRequired = Array.isArray(rawDocs) && rawDocs.length > 0 ? rawDocs : (SERVICES_DETAIL_DATA[slug]?.documentsRequired || []);

  const rawFaqs = dbData?.faqs;
  const faqs = Array.isArray(rawFaqs) && rawFaqs.length > 0 ? rawFaqs : (SERVICES_DETAIL_DATA[slug]?.faqs || []);

  const overviewText = dbData?.overview || SERVICES_DETAIL_DATA[slug]?.overview || data.description;

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-[var(--primary)] selection:text-white text-slate-900">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: "https://taxfiling24.com" },
            { name: "Services", url: "https://taxfiling24.com/services" },
            { name: data.title, url: `https://taxfiling24.com/services/${slug}` },
          ]),
          serviceSchema({
            name: data.title,
            description: data.description,
            url: `https://taxfiling24.com/services/${slug}`,
          }),
          ...(faqs.length > 0 ? [faqSchema(faqs as { question: string; answer: string }[])] : []),
        ]}
      />
      {/* ─── Professional Hero Section ─── */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-24 bg-slate-50 border-b border-slate-200/60 overflow-hidden">
        {/* Subtle geometric grid */}
        <div 
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
             backgroundImage: "linear-gradient(#000000 1px, transparent 1px), linear-gradient(90deg, #000000 1px, transparent 1px)",
             backgroundSize: "32px 32px"
          }}
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <AnimatedSection className="lg:col-span-8 max-w-3xl">
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 mb-6 text-xs font-semibold tracking-wide transition-all group shadow-sm"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                {String(heroTemplate?.backLabel || "Back to Services")}
              </Link>

              <h1 className="mb-5 text-4xl font-black sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-slate-900">
                {data.title}
              </h1>

              <p className="max-w-2xl text-lg lg:text-xl text-slate-600 font-normal leading-relaxed mb-8">
                {data.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <WhatsAppButton
                  message={`Hi, I'm interested in: ${data.title}`}
                  className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold shadow-sm"
                  whatsappUrl={whatsapp}
                  label={String(ctaTemplate?.primaryButtonText || "Chat with CA on WhatsApp")}
                />
                <Link
                  href="/contact"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-slate-300 hover:border-slate-400 px-6 py-3.5 font-bold text-slate-700 hover:text-slate-900 hover:shadow-sm transition-all text-sm"
                >
                  {String(heroTemplate?.quoteButtonText || "Request a Quote")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </AnimatedSection>
            
            {/* Horizontal Grid for Stats to take up right align on lg screens if needed, otherwise stacked below */}
            <div className="lg:col-span-4 lg:border-l border-slate-200 lg:pl-10 grid grid-cols-2 gap-6">
              {(
                Array.isArray(heroTemplate?.stats)
                  ? (heroTemplate?.stats as Array<{ label?: string; value?: string; isVisible?: boolean }>)
                  : [
                      { label: "Clients Served", value: "500+", isVisible: true },
                      { label: "Expert CAs", value: "15+", isVisible: true },
                      { label: "Compliance Rate", value: "99%", isVisible: true },
                      { label: "Support", value: "24/7", isVisible: true },
                    ]
              )
                .filter((stat) => stat.isVisible !== false && stat.label && stat.value)
                .map((stat, idx) => (
                <div key={idx} className="flex flex-col gap-1">
                  <span className="text-3xl font-extrabold text-[var(--primary)] tracking-tight">{stat.value}</span>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Structured Overview & Benefits ─── */}
      <section className="py-20 bg-white relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-7">
              <AnimatedSection variants={fadeUp}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-1 w-6 bg-[var(--primary)] rounded-full" />
                  <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest">
                    {String(overviewTemplate?.badge || "Service Overview")}
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-6 leading-tight">
                  {String(overviewTemplate?.title || "Transparent & Secure Professional Guidance")}
                </h2>
                <div className="prose prose-slate prose-lg max-w-none text-slate-600 leading-[1.8]">
                  <p>{overviewText}</p>
                </div>
              </AnimatedSection>
            </div>

            {benefits.length > 0 && (
              <div className="lg:col-span-5 relative">
                <AnimatedSection>
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm scale-100 hover:shadow-md transition-shadow">
                    <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-[var(--primary)]" /> 
                      {String(overviewTemplate?.benefitsTitle || "Key Benefits & Guarantees")}
                    </h3>
                    <ul className="space-y-4">
                      {benefits.map((benefit: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-3.5 group">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-1 flex-shrink-0" />
                          <span className="text-slate-700 font-medium leading-relaxed">
                            {typeof benefit === 'string' ? benefit : benefit.title || benefit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimatedSection>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Sub-Services Dashboard Grid ─── */}
      {subServices.length > 0 && (
        <section className="py-20 bg-slate-50/70 border-y border-slate-200/60">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="mb-14 text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                {String(subServicesTemplate?.title || "Comprehensive Service Deliverable")}
              </h2>
              <p className="text-slate-600 text-base">
                {String(
                  subServicesTemplate?.description ||
                    "Explore the structured services and technical inclusions packed in this solution."
                )}
              </p>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subServices.map((sub: any, idx: number) => (
                <AnimatedSection key={idx} variants={fadeUp}>
                  <div className="flex flex-col h-full bg-white p-6 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all duration-300 transform hover:-translate-y-1">
                    <div className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 text-slate-700">
                      <Zap className="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">
                      {sub.title}
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed flex-1">
                      {sub.description}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Process & Documents Split ─── */}
      {(processSteps.length > 0 || documentsRequired.length > 0) && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-stretch">
              {/* Clean Vertical Timeline */}
              {processSteps.length > 0 && (
                <AnimatedSection className="flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-200">
                    <Clock className="h-6 w-6 text-slate-500" />
                    <h3 className="text-2xl font-bold text-slate-900">
                      {String(processTemplate?.title || "Standard Execution Roadmap")}
                    </h3>
                  </div>

                  <div className="relative ml-4 pl-8 border-l-2 border-slate-200 space-y-12 flex-1">
                    {processSteps.map((p: any, idx: number) => (
                      <div key={idx} className="relative group">
                        <div className="absolute -left-[41px] top-1.5 w-4 h-4 rounded-full bg-white border-[3px] border-[var(--primary)] group-hover:bg-[var(--primary)] transition-all duration-200" />
                        <h4 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-400 tracking-wider">{p.step || `0${idx + 1}`}.</span>
                          {p.title}
                        </h4>
                        <p className="text-slate-600 text-sm leading-relaxed">{p.description}</p>
                      </div>
                    ))}
                  </div>
                </AnimatedSection>
              )}

              {/* List for Documents */}
              {documentsRequired.length > 0 && (
                <AnimatedSection className={`flex flex-col h-full lg:col-span-1 ${processSteps.length === 0 ? 'lg:col-span-2' : ''}`}>
                  <div className="bg-slate-50 p-8 sm:p-10 rounded-2xl border border-slate-200 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-200">
                      <FileText className="h-6 w-6 text-slate-500" />
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">
                          {String(documentsTemplate?.title || "Required Documents")}
                        </h3>
                        <p className="text-slate-500 text-xs mt-1">
                          {String(documentsTemplate?.description || "Pre-requisites for submitting on the portal")}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 flex-col gap-2 flex-1">
                      {documentsRequired.map((doc: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all cursor-default">
                          <div className="h-2 w-2 rounded-full bg-[var(--primary)] text-white" />
                          <span className="text-slate-700 text-sm font-medium">{typeof doc === 'string' ? doc : doc.title || doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ─── Border-Bottom Accordion FAQs ─── */}
      {faqs.length > 0 && (
        <section className="py-20 bg-slate-50 border-t border-slate-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <AnimatedSection className="text-center mb-12">
              <HelpCircle className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {String(faqTemplate?.title || "Frequently Asked Questions")}
              </h2>
            </AnimatedSection>

            <div className="border-t border-slate-200 divide-y divide-slate-200">
              {faqs.map((faq: any, idx: number) => (
                <AnimatedSection key={idx} variants={fadeUp} className="w-full">
                  <details className="group [&_summary::-webkit-details-marker]:hidden overflow-hidden w-full">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-slate-900 outline-none w-full">
                      <h3 className="font-bold text-base pr-4 text-left group-hover:text-[var(--primary)] transition-colors">
                        {faq.question}
                      </h3>
                      <ChevronRight className="h-5 w-5 text-slate-400 transition-transform duration-200 group-open:rotate-90 flex-shrink-0" />
                    </summary>
                    <div className="pb-5 text-slate-600 text-sm leading-relaxed">
                      <p>{faq.answer}</p>
                    </div>
                  </details>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Bottom Professional CTA Block ─── */}
      <section className="py-20 bg-[var(--primary)] text-white relative">
        <div className="container mx-auto px-4 text-center">
          <AnimatedSection className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-black mb-4 tracking-tight">
              {String(ctaTemplate?.title || "Require End-to-End Assistance?")}
            </h2>
            <p className="text-white/80 mx-auto mb-10 text-lg leading-relaxed font-normal">
              {String(
                ctaTemplate?.description ||
                  "Get corporate advice. No spam. Simply reliable support backed by certified knowledge."
              )}
            </p>
            <div className="flex justify-center flex-col sm:flex-row gap-3">
              <WhatsAppButton
                message={`Hi, I'm interested in getting started with: ${data.title}`}
                className="px-8 py-4 text-base font-bold"
                whatsappUrl={whatsapp}
                label={String(ctaTemplate?.primaryButtonText || "Chat with CA on WhatsApp")}
              />
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white border border-transparent text-slate-900 px-8 py-4 rounded-xl font-bold hover:bg-slate-50 transition-all text-base shadow-sm"
              >
                {String(ctaTemplate?.secondaryButtonText || "Book a Callback")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
