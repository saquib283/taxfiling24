export const dynamic = "force-dynamic";

import Image from "next/image";
import {
  Award,
  Building2,
  Calculator,
  FileCheck,
  Receipt,
  Shield,
  UserCheck,
} from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fadeUp } from "@/lib/animations";
import JsonLd, { webPageSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import { getSettings } from "@/lib/settings";
import { getManagedPageSections } from "@/lib/managed-pages";
import type { Metadata } from "next";
import { absoluteUrl, buildPageMetadataFromSettings } from "@/lib/seo";

interface TextItem {
  id: string;
  text?: string;
  isVisible?: boolean;
}

interface ContentItem {
  id: string;
  title?: string;
  description?: string;
  isVisible?: boolean;
}

interface MetricItem {
  id: string;
  label?: string;
  value?: string;
  isVisible?: boolean;
}

interface AboutSectionData {
  title?: string;
  highlight?: string;
  description?: string;
  backgroundImage?: string;
  paragraphs?: TextItem[];
  badgeTitle?: string;
  badgeDescription?: string;
  image?: string;
  items?: ContentItem[] | MetricItem[];
  quote?: string;
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildPageMetadataFromSettings(settings, "about", {
    description:
      "Learn about TaxFiling24 and our business registration, tax filing, GST compliance, and financial advisory expertise across India.",
    image: "/images/team_consulting.png",
    keywords: ["about TaxFiling24", "chartered accountant firm", "tax consultants India"],
    path: "/about",
    title: "About Us",
  });
}

export default async function AboutPage() {
  const settings = await getSettings();
  const sections = getManagedPageSections("about", settings);
  const expertiseIcons = [Receipt, Calculator, Building2, FileCheck];
  const valueIcons = [Shield, Award, UserCheck];

  return (
    <div className="pt-0 pb-16 lg:pb-24">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "About Us", url: absoluteUrl("/about") },
          ]),
          webPageSchema({
            name: "About TaxFiling24",
            description:
              "Learn about TaxFiling24 - your trusted partner for business registration, tax filing, GST compliance, and financial advisory services across India.",
            url: absoluteUrl("/about"),
          }),
        ]}
      />

      {sections
        .filter((section) => section.isVisible)
        .map((section) => {
          const data = section.data as AboutSectionData;

          switch (section.type) {
            case "about.hero":
              return (
                <section key={section.id} className="relative overflow-hidden bg-[var(--primary)] border-b border-white/10 py-12 sm:py-16 lg:py-20 text-white">
                  {/* Atmospheric background blend */}
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={data.backgroundImage || "/images/about_hero_bg.jpg"}
                      alt="TaxFiling24 Corporate Advisory"
                      fill
                      className="object-cover object-center opacity-20 mix-blend-luminosity"
                      priority
                      quality={90}
                      sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary)]/80 via-[var(--primary)]/90 to-[var(--primary)]" />
                    <div
                      className="absolute inset-0 opacity-[0.035]"
                      style={{
                        backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                        backgroundSize: "24px 24px",
                      }}
                    />
                  </div>

                  {/* Ambient Gold Glow */}
                  <div className="absolute top-0 right-0 h-96 w-96 -translate-y-1/2 translate-x-1/3 rounded-full bg-[var(--accent)]/15 blur-[120px] pointer-events-none" />

                  {/* Editorial Hero Content */}
                  <div className="container relative z-10 mx-auto px-6 text-center">
                    <div className="mx-auto max-w-3xl">
                      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight mb-4">
                        {typeof data.title === "string" && data.highlight && data.title.includes(data.highlight) ? (
                          <>
                            {data.title.split(data.highlight)[0]}
                            <span className="text-[var(--accent)] font-bold">{data.highlight}</span>
                            {data.title.split(data.highlight).slice(1).join(data.highlight)}
                          </>
                        ) : (
                          data.title
                        )}
                      </h1>

                      <p className="mx-auto max-w-2xl text-base sm:text-lg text-white/70 leading-relaxed font-normal mb-8">
                        {data.description}
                      </p>

                      {/* Editorial Trust Markers */}
                      <div className="inline-flex flex-wrap items-center justify-center gap-6 sm:gap-10 pt-6 border-t border-white/10 text-xs sm:text-sm font-medium text-white/80">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                          <span>Est. 2020</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                          <span>Certified CA & CS Advisors</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                          <span>Pan-India Statutory Practice</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              );

            case "about.story":
              return (
                <section key={section.id} className="bg-[var(--bg)] py-16 lg:py-24">
                  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                      <AnimatedSection>
                        <h2 className="mb-6 text-3xl font-bold text-[var(--fg)]">{data.title}</h2>
                        {(Array.isArray(data.paragraphs) ? data.paragraphs : [])
                          .filter((item) => item.isVisible !== false && item.text)
                          .map((item) => (
                            <p key={item.id} className="mb-4 text-lg leading-relaxed text-[var(--fg-muted)]">
                              {item.text}
                            </p>
                          ))}
                        <div className="mt-6 flex max-w-sm items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--primary)]">
                            <Award className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="font-bold text-[var(--fg)]">{data.badgeTitle}</h4>
                            <p className="text-sm text-[var(--fg-muted)]">{data.badgeDescription}</p>
                          </div>
                        </div>
                      </AnimatedSection>

                      <AnimatedSection variants={fadeUp}>
                        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border-4 border-white shadow-[var(--shadow-xl)]">
                          <Image
                            src={data.image || "/images/team_consulting.png"}
                            alt={data.title || "About TaxFiling24"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </AnimatedSection>
                    </div>
                  </div>
                </section>
              );

            case "about.expertise":
              return (
                <section key={section.id} className="border-y border-slate-100 bg-slate-50 py-16 lg:py-24">
                  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection className="mb-16 text-center">
                      <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">{data.title}</h2>
                      <p className="mx-auto max-w-2xl text-slate-500">{data.description}</p>
                    </AnimatedSection>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                      {(Array.isArray(data.items) ? data.items : [])
                        .filter((item): item is ContentItem => item.isVisible !== false && "title" in item && Boolean(item.title))
                        .map((item, index) => {
                          const Icon = expertiseIcons[index % expertiseIcons.length];
                          return (
                            <AnimatedSection key={item.id} variants={fadeUp} className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition hover:shadow-lg">
                              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-[var(--primary)]">
                                <Icon className="h-7 w-7" />
                              </div>
                              <h3 className="mb-3 text-lg font-bold text-slate-900">{item.title}</h3>
                              <p className="text-sm leading-relaxed text-slate-500">{item.description}</p>
                            </AnimatedSection>
                          );
                        })}
                    </div>
                  </div>
                </section>
              );

            case "about.reasons":
              return (
                <section key={section.id} className="bg-white py-16 lg:py-24">
                  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection className="mx-auto max-w-4xl">
                      <h2 className="mb-10 text-3xl font-bold tracking-tight text-slate-900">{data.title}</h2>
                      <div className="space-y-8">
                        {(Array.isArray(data.items) ? data.items : [])
                          .filter((item): item is ContentItem => item.isVisible !== false && "title" in item && Boolean(item.title))
                          .map((item) => (
                            <div key={item.id} className="flex gap-4">
                              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                                <div className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                              </div>
                              <div>
                                <h3 className="mb-1 font-bold text-slate-900">{item.title}</h3>
                                <p className="text-sm leading-relaxed text-slate-500">{item.description}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                    </AnimatedSection>
                  </div>
                </section>
              );

            case "about.metrics":
              return (
                <section key={section.id} className="bg-white pb-16 lg:pb-24">
                  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection variants={fadeUp} className="mx-auto max-w-5xl">
                      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 text-white shadow-2xl lg:p-14">
                        <div className="absolute right-0 top-0 h-40 w-40 bg-[var(--primary)]/20 blur-[100px]" />
                        <div className="absolute bottom-0 left-0 h-40 w-40 bg-[var(--accent)]/20 blur-[100px]" />

                        <h2 className="mb-10 border-b border-white/10 pb-6 text-2xl font-bold italic">{data.title}</h2>
                        <div className="grid gap-10 sm:grid-cols-2">
                          {(Array.isArray(data.items) ? data.items : [])
                            .filter((item): item is MetricItem => item.isVisible !== false && "label" in item && Boolean(item.label))
                            .map((item) => (
                              <div key={item.id}>
                                <p className="text-4xl font-extrabold text-[var(--accent-light)]">{item.value}</p>
                                <p className="border-l-2 border-[var(--primary)] pl-3 text-sm font-medium tracking-wide text-white/60">
                                  {item.label}
                                </p>
                              </div>
                            ))}
                        </div>
                        {data.quote ? (
                          <div className="mt-12 border-t border-white/10 pt-10 text-center">
                            <p className="mx-auto max-w-md text-sm leading-relaxed text-white/80">&ldquo;{data.quote}&rdquo;</p>
                          </div>
                        ) : null}
                      </div>
                    </AnimatedSection>
                  </div>
                </section>
              );

            case "about.values":
              return (
                <section key={section.id} className="border-t border-slate-100 bg-slate-50 py-16 lg:py-24">
                  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <AnimatedSection className="mb-16 text-center">
                      <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900">{data.title}</h2>
                      <p className="mx-auto max-w-2xl text-slate-500">{data.description}</p>
                    </AnimatedSection>
                    <div className="grid gap-8 sm:grid-cols-3">
                      {(Array.isArray(data.items) ? data.items : [])
                        .filter((item): item is ContentItem => item.isVisible !== false && "title" in item && Boolean(item.title))
                        .map((item, index) => {
                          const Icon = valueIcons[index % valueIcons.length];
                          return (
                            <AnimatedSection key={item.id} variants={fadeUp} className="rounded-[2rem] border border-slate-100 bg-white p-8 text-center shadow-sm transition hover:shadow-xl">
                              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-[var(--primary)]">
                                <Icon className="h-8 w-8" />
                              </div>
                              <h3 className="mb-3 text-xl font-bold text-slate-900">{item.title}</h3>
                              <p className="text-sm leading-relaxed text-slate-500">{item.description}</p>
                            </AnimatedSection>
                          );
                        })}
                    </div>
                  </div>
                </section>
              );

            default:
              return null;
          }
        })}
    </div>
  );
}
