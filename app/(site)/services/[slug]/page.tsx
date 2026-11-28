export const dynamic = "force-dynamic";

import { SERVICES_DETAIL_DATA } from "@/lib/services-detail-data";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  FileCheck2,
  FileText,
  HelpCircle,
  Phone,
  Shield,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fadeUp } from "@/lib/animations";
import Link from "next/link";
import JsonLd, { serviceSchema, breadcrumbSchema, faqSchema } from "@/components/seo/JsonLd";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import { findManagedSection, getManagedPageSections } from "@/lib/managed-pages";
import { getSettings } from "@/lib/settings";
import { getSiteContact } from "@/lib/site-contact";
import { absoluteUrl, buildMetadata, buildNoIndexMetadata } from "@/lib/seo";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

type ServiceBenefit = string | { title?: string };
type ServiceSubService = { description?: string; title?: string };
type ServiceProcessStep = { description?: string; step?: string; title?: string };
type ServiceDocument = string | { title?: string };
type ServiceFaq = { answer: string; question: string };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const settings = await getSettings();
  let dbData = null;
  try {
    dbData = await prisma.service.findUnique({ where: { slug } });
  } catch (e) {
    console.error("Failed to fetch service metadata from DB", e);
  }

  const data = dbData || SERVICES_DETAIL_DATA[slug];
  if (!data) return buildNoIndexMetadata("Service Not Found", settings);

  return buildMetadata({
    description: data.description,
    keywords: [data.title, "tax services", "GST services", "business compliance", "chartered accountant"],
    path: `/services/${slug}`,
    settings,
    title: data.title,
  });
}

export async function generateStaticParams() {
  try {
    const dbServices = await prisma.service.findMany({ select: { slug: true } });
    if (dbServices.length > 0) {
      return dbServices.map((s) => ({ slug: s.slug }));
    }
  } catch {}

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
  const { whatsapp, phone, phoneRaw, email } = getSiteContact(settings);

  let dbData = null;
  let relatedServices: Array<{
    category: string | null;
    description: string;
    slug: string;
    title: string;
  }> = [];

  try {
    dbData = await prisma.service.findUnique({ where: { slug } });
    const fetchedRelated = await prisma.service.findMany({
      where: { slug: { not: slug } },
      select: {
        category: true,
        description: true,
        id: true,
        slug: true,
        title: true,
      },
      take: 3,
      orderBy: { createdAt: "desc" },
    });
    relatedServices = fetchedRelated;
  } catch (e) {
    console.error("Failed to fetch service from DB", e);
  }

  if (relatedServices.length === 0) {
    relatedServices = Object.entries(SERVICES_DETAIL_DATA)
      .filter(([s]) => s !== slug)
      .slice(0, 3)
      .map(([s, val]) => ({
        category: "Compliance",
        description: val.description,
        slug: s,
        title: val.title,
      }));
  }

  const data = dbData || SERVICES_DETAIL_DATA[slug];

  if (!data) {
    notFound();
  }

  const rawBenefits = dbData?.benefits;
  const benefits: ServiceBenefit[] =
    Array.isArray(rawBenefits) && rawBenefits.length > 0
      ? (rawBenefits as ServiceBenefit[])
      : (SERVICES_DETAIL_DATA[slug]?.benefits || []);

  const rawSubServices = dbData?.subServices;
  const subServices: ServiceSubService[] =
    Array.isArray(rawSubServices) && rawSubServices.length > 0
      ? (rawSubServices as ServiceSubService[])
      : (SERVICES_DETAIL_DATA[slug]?.subServices || []);

  const rawProcess = dbData?.process;
  const processSteps: ServiceProcessStep[] =
    Array.isArray(rawProcess) && rawProcess.length > 0
      ? (rawProcess as ServiceProcessStep[])
      : (SERVICES_DETAIL_DATA[slug]?.process || []);

  const rawDocs = dbData?.documentsRequired;
  const documentsRequired: ServiceDocument[] =
    Array.isArray(rawDocs) && rawDocs.length > 0
      ? (rawDocs as ServiceDocument[])
      : (SERVICES_DETAIL_DATA[slug]?.documentsRequired || []);

  const rawFaqs = dbData?.faqs;
  const faqs: ServiceFaq[] =
    Array.isArray(rawFaqs) && rawFaqs.length > 0
      ? (rawFaqs as ServiceFaq[])
      : (SERVICES_DETAIL_DATA[slug]?.faqs || []);

  const overviewText = dbData?.overview || SERVICES_DETAIL_DATA[slug]?.overview || data.description;
  const whatsappConsultUrl = whatsapp
    ? `${whatsapp}?text=${encodeURIComponent(`Hi TaxFiling24, I would like consultation regarding: ${data.title}`)}`
    : undefined;

  const heroStats = (
    Array.isArray(heroTemplate?.stats)
      ? (heroTemplate?.stats as Array<{ label?: string; value?: string; isVisible?: boolean }>)
      : [
          { label: "Clients Served", value: "500+", isVisible: true },
          { label: "Expert CAs", value: "15+", isVisible: true },
          { label: "Compliance Rate", value: "99%", isVisible: true },
          { label: "Direct Support", value: "24/7", isVisible: true },
        ]
  ).filter((stat) => stat.isVisible !== false && stat.label && stat.value);

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans text-slate-900 selection:bg-[var(--primary)] selection:text-white">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Services", url: absoluteUrl("/services") },
            { name: data.title, url: absoluteUrl(`/services/${slug}`) },
          ]),
          serviceSchema({
            name: data.title,
            description: data.description,
            url: absoluteUrl(`/services/${slug}`),
          }),
          ...(faqs.length > 0 ? [faqSchema(faqs)] : []),
        ]}
      />

      {/* ─── Sleek Compact Hero Section ─── */}
      <section className="relative overflow-hidden bg-[var(--primary)] border-b border-white/10">
        {/* Subtle geometric grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Ambient Subtle Glow */}
        <div className="absolute top-0 right-0 h-80 w-80 -translate-y-1/2 translate-x-1/4 rounded-full bg-[var(--accent)]/10 blur-[100px]" />

        <div className="container relative mx-auto px-6 py-8 sm:py-10 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Service Identity & Primary Actions */}
            <div className="lg:col-span-7 xl:col-span-8">
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/60 transition-colors hover:text-white mb-3 group"
              >
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                <span>{String(heroTemplate?.backLabel || "All Services")}</span>
              </Link>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight mb-3">
                {data.title}
              </h1>

              <p className="max-w-2xl text-sm sm:text-base text-white/70 leading-relaxed font-normal mb-6">
                {data.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/book"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-[var(--primary)] shadow-sm transition-all hover:bg-white/95 active:scale-[0.98]"
                >
                  <span>Book Consultation</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                {whatsappConsultUrl && (
                  <a
                    href={whatsappConsultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.98]"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    <span>WhatsApp Advisor</span>
                  </a>
                )}

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 px-4 py-2.5 text-xs sm:text-sm font-medium text-white/85 transition-all hover:bg-white/10 hover:text-white"
                >
                  <span>Request Quote</span>
                </Link>
              </div>
            </div>

            {/* Right: Integrated Performance Metrics Card */}
            {heroStats.length > 0 && (
              <div className="lg:col-span-5 xl:col-span-4">
                <div className="rounded-[var(--radius-lg)] border border-white/15 bg-white/[0.06] p-5 sm:p-6 backdrop-blur-xs shadow-sm">
                  <div className="grid grid-cols-2 gap-5">
                    {heroStats.map((stat, idx) => (
                      <div key={idx} className="flex flex-col">
                        <div className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                          {stat.value}
                        </div>
                        <div className="text-[11px] font-medium uppercase tracking-wider text-white/75 mt-0.5">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── Main Content & Sticky Advisory Desk ─── */}
      <div className="container mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* ── Left Column: Detailed Service Delivery ── */}
          <div className="lg:col-span-8 space-y-12">
            {/* Overview */}
            <section className="bg-white rounded-2xl border border-slate-200/60 p-7 sm:p-9 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-5">
                {String(overviewTemplate?.title || "Service Overview & Compliance Scope")}
              </h2>
              <div className="text-base text-slate-600 leading-[1.8] space-y-4">
                <p>{overviewText}</p>
              </div>

              {/* Benefits Checklist */}
              {benefits.length > 0 && (
                <div className="mt-8 pt-8 border-t border-slate-100">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
                    <span>{String(overviewTemplate?.benefitsTitle || "Key Deliverables & Guarantees")}</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                          {typeof benefit === "string" ? benefit : benefit.title || ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Sub-Services / Scope Grid */}
            {subServices.length > 0 && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
                    {String(subServicesTemplate?.title || "What's Included in This Service")}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {String(
                      subServicesTemplate?.description ||
                        "Structured statutory deliverables and scope inclusions managed by our certified professionals."
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subServices.map((sub, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/60 hover:border-[var(--primary)]/20 hover:shadow-sm transition-all"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-[var(--primary)] mb-4 border border-slate-100">
                        <Zap className="h-4 w-4" />
                      </div>
                      <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                        {sub.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 leading-relaxed flex-1">
                        {sub.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Process Execution Roadmap */}
            {processSteps.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200/60 p-7 sm:p-9 shadow-sm">
                <div className="flex items-center gap-3 mb-8 pb-5 border-b border-slate-100">
                  <Clock className="h-5 w-5 text-slate-500" />
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {String(processTemplate?.title || "Standard Execution Roadmap")}
                  </h2>
                </div>

                <div className="space-y-6">
                  {processSteps.map((p, idx) => (
                    <div key={idx} className="flex gap-4 items-start group">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-xs font-bold text-white">
                        {p.step || `0${idx + 1}`}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <h3 className="text-base font-semibold text-slate-900 mb-1">
                          {p.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                          {p.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Required Documents */}
            {documentsRequired.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200/60 p-7 sm:p-9 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                  <FileText className="h-5 w-5 text-slate-500" />
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      {String(documentsTemplate?.title || "Required Documentation")}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {String(documentsTemplate?.description || "Pre-requisites for government portal filing and legal onboarding")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {documentsRequired.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 font-medium"
                    >
                      <FileCheck2 className="h-4 w-4 text-[var(--primary)] shrink-0" />
                      <span>{typeof doc === "string" ? doc : doc.title || ""}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* FAQs Accordion */}
            {faqs.length > 0 && (
              <section className="bg-white rounded-2xl border border-slate-200/60 p-7 sm:p-9 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <HelpCircle className="h-5 w-5 text-slate-400" />
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {String(faqTemplate?.title || "Frequently Asked Questions")}
                  </h2>
                </div>

                <div className="divide-y divide-slate-100">
                  {faqs.map((faq, idx) => (
                    <details key={idx} className="group py-4.5 first:pt-0 last:pb-0">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 text-sm sm:text-base hover:text-[var(--primary)] transition-colors">
                        <span>{faq.question}</span>
                        <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-open:rotate-180 shrink-0" />
                      </summary>
                      <div className="mt-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed pr-6">
                        <p>{faq.answer}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Right Column: Sticky Advisory & Booking Desk ── */}
          <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
            {/* Direct Consultation Card */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-ink)] mb-3">
                <Sparkles className="h-3.5 w-3.5 text-[var(--accent-ink)]" />
                <span>Certified Advisory</span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                Need Guidance on {data.title}?
              </h2>

              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Consult with verified Chartered Accountants and Company Secretaries for tailored compliance, filings, and audit representation.
              </p>

              <div className="space-y-3">
                <Link
                  href="/book"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-3.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--primary-hover)] active:scale-[0.98]"
                >
                  <CalendarCheck2 className="h-4 w-4" />
                  <span>Book 1-on-1 CA Session</span>
                </Link>

                {whatsappConsultUrl && (
                  <a
                    href={whatsappConsultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-800 transition-all hover:bg-slate-50"
                  >
                    <span>Chat on WhatsApp</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  </a>
                )}
              </div>

              {/* Trust Micro-Badges */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>100% Confidential & Secure Advisory</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Verified Indian CA & CS Network</span>
                </div>
              </div>
            </div>

            {/* Quick Contact Info */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-5 text-xs text-slate-600 shadow-xs space-y-2.5">
              <div className="font-semibold text-slate-900 text-xs mb-1">Direct Assistance</div>
              {phone && (
                <a href={`tel:${phoneRaw}`} className="flex items-center gap-2 text-slate-600 hover:text-[var(--primary)] transition-colors">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{phone}</span>
                </a>
              )}
              {email && (
                <a href={`mailto:${email}`} className="flex items-center gap-2 text-slate-600 hover:text-[var(--primary)] transition-colors">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{email}</span>
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* ─── Complementary Services Interlinking Section ─── */}
      {relatedServices.length > 0 && (
        <section className="border-t border-slate-200/60 bg-white py-14 lg:py-16">
          <div className="container mx-auto px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Complementary Compliance Services
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Businesses frequently bundle these statutory services for complete legal and financial coverage.
                </p>
              </div>
              <Link
                href="/services"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                <span>View all services</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {relatedServices.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/services/${rel.slug}`}
                  className="group flex flex-col justify-between rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all duration-300 hover:border-[var(--primary-border)] hover:shadow-[var(--shadow-md)]"
                >
                  <div>
                    {rel.category && (
                      <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
                        {rel.category}
                      </span>
                    )}
                    <h3 className="font-semibold text-[var(--fg)] text-base group-hover:text-[var(--primary)] transition-colors leading-snug line-clamp-2">
                      {rel.title}
                    </h3>
                    <p className="text-xs text-[var(--fg-muted)] mt-2 line-clamp-2 leading-relaxed">
                      {rel.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs font-semibold text-[var(--fg)] group-hover:text-[var(--primary)]">
                    <span>Explore details</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Bottom Professional CTA ─── */}
      <section className="container mx-auto px-6 pb-16 sm:pb-20">
        <div className="relative overflow-hidden rounded-2xl bg-[var(--primary)] p-8 sm:p-12 lg:p-14">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[var(--accent)]/10 blur-[90px]" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
                {String(ctaTemplate?.title || "Ready to get started with your filing?")}
              </h2>
              <p className="text-sm sm:text-base text-white/60 leading-relaxed font-normal">
                {String(
                  ctaTemplate?.description ||
                    "Connect with our qualified team for confidential, verified corporate compliance and accounting advisory."
                )}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/book"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[var(--primary)] shadow-sm transition-all hover:bg-white/90 active:scale-[0.98]"
              >
                <span>Book 1-on-1 Consultation</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              {whatsappConsultUrl && (
                <a
                  href={whatsappConsultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 active:scale-[0.98]"
                >
                  <span>Chat on WhatsApp</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
