import { SERVICES_DETAIL_DATA } from "@/lib/services-detail-data";
import { notFound } from "next/navigation";
import {
  CheckCircle2, ChevronDown, Clock, FileText, ArrowLeft,
  ArrowRight, Sparkles, Shield, Zap
} from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fadeUp } from "@/lib/animations";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return Object.keys(SERVICES_DETAIL_DATA).map((slug) => ({
    slug,
  }));
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const data = SERVICES_DETAIL_DATA[slug];

  if (!data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* ─── Hero Section ─── */}
      <section className={`relative py-24 lg:py-36 text-white bg-gradient-to-br ${data.heroBg} overflow-hidden`}>
        {/* Decorative shapes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-white/[0.04] blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-black/[0.06] blur-3xl -translate-x-1/3 translate-y-1/3" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
          <AnimatedSection className="max-w-4xl">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 text-xs font-semibold tracking-wider uppercase transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
              All Services
            </Link>

            <h1 className="mb-5 text-4xl font-extrabold sm:text-5xl lg:text-[3.5rem] tracking-tight leading-[1.1]">
              {data.title}
            </h1>

            <p className="max-w-2xl text-lg lg:text-xl text-white/80 font-light leading-relaxed mb-10">
              {data.description}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <WhatsAppButton />
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/20 transition-all shadow-md text-sm"
              >
                Request a Quote
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Overview & Benefits ─── */}
      <section className="py-20 bg-white relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7">
              <AnimatedSection variants={fadeUp}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-1 w-8 bg-[var(--primary)] rounded-full" />
                  <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest">
                    Overview
                  </span>
                </div>
                <h2 className="text-3xl font-extrabold text-[var(--fg)] mb-6 leading-tight">
                  What You Need to Know
                </h2>
                <p className="text-[var(--fg-muted)] text-lg leading-[1.85]">
                  {data.overview}
                </p>
              </AnimatedSection>
            </div>

            <div className="lg:col-span-5">
              <AnimatedSection variants={fadeUp}>
                <div className="bg-[var(--primary)] text-white p-8 rounded-2xl shadow-[var(--shadow-lg)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.05] rounded-full blur-2xl translate-x-8 -translate-y-8" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center">
                        <Shield className="h-4.5 w-4.5 text-[var(--accent)]" />
                      </div>
                      <h3 className="text-lg font-bold">Key Benefits</h3>
                    </div>
                    <ul className="space-y-3.5">
                      {data.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className="h-5 w-5 rounded-full bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent)]" />
                          </div>
                          <span className="text-white/90 text-sm font-medium leading-relaxed">
                            {benefit}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Sub-Services Grid ─── */}
      <section className="py-20 bg-[var(--bg)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-[var(--accent-soft)] text-[var(--primary)] px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-4 border border-[var(--accent-light)]/20">
              <Sparkles className="h-3.5 w-3.5" />
              What We Offer
            </div>
            <h2 className="text-3xl font-extrabold text-[var(--fg)]">
              Comprehensive Solutions
            </h2>
            <p className="text-[var(--fg-soft)] mt-2 max-w-md mx-auto text-sm">
              Tailored for your legal & financial needs
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.subServices.map((sub, idx) => (
              <AnimatedSection key={idx} variants={fadeUp}>
                <div className="h-full bg-white p-6 rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] transition-all duration-300 group hover:-translate-y-0.5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-[var(--primary)]/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[var(--primary)]/[0.1] transition-colors">
                      <Zap className="h-4 w-4 text-[var(--primary)]" />
                    </div>
                    <h4 className="text-base font-bold text-[var(--fg)] leading-snug pt-1">
                      {sub.title}
                    </h4>
                  </div>
                  <p className="text-[var(--fg-soft)] text-sm leading-relaxed pl-11">
                    {sub.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Documents & Process ─── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Documents Required */}
            <AnimatedSection variants={fadeUp}>
              <div className="bg-[var(--primary)] text-white p-8 rounded-2xl shadow-[var(--shadow-lg)] h-full relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/[0.03] rounded-full blur-3xl translate-x-12 translate-y-12" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-[var(--accent)]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Documents Required</h3>
                      <p className="text-white/50 text-xs">Keep these ready to start</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {data.documentsRequired.map((doc, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 bg-white/[0.05] rounded-xl px-4 py-3"
                      >
                        <span className="h-5 w-5 rounded-md bg-[var(--accent)]/20 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-[var(--accent)]">
                          {idx + 1}
                        </span>
                        <span className="text-white/85 text-sm leading-relaxed">
                          {doc}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AnimatedSection>

            {/* Process Timeline */}
            <AnimatedSection variants={fadeUp}>
              <div className="p-8 bg-[var(--bg)] rounded-2xl border border-[var(--border)] h-full">
                <div className="flex items-center gap-3 mb-8">
                  <div className="h-10 w-10 rounded-xl bg-[var(--primary)]/[0.06] flex items-center justify-center">
                    <Clock className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[var(--fg)]">Our Process</h3>
                    <p className="text-[var(--fg-soft)] text-xs">Step-by-step journey</p>
                  </div>
                </div>

                <div className="space-y-0">
                  {data.process.map((p, idx) => (
                    <div key={idx} className="flex gap-4 relative">
                      {/* Vertical line */}
                      {idx < data.process.length - 1 && (
                        <div className="absolute left-[18px] top-10 bottom-0 w-[2px] bg-[var(--border)]" />
                      )}

                      {/* Step circle */}
                      <div className="z-10 h-9 w-9 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                        {p.step}
                      </div>

                      <div className="pb-8">
                        <h4 className="font-bold text-[var(--fg)] mb-1 text-sm">
                          {p.title}
                        </h4>
                        <p className="text-[var(--fg-soft)] text-sm leading-relaxed">
                          {p.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── FAQs ─── */}
      <section className="py-20 bg-[var(--bg)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <AnimatedSection className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[var(--accent-soft)] text-[var(--primary)] px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase mb-4 border border-[var(--accent-light)]/20">
              FAQ
            </div>
            <h2 className="text-3xl font-extrabold text-[var(--fg)]">
              Frequently Asked Questions
            </h2>
          </AnimatedSection>

          <div className="space-y-3">
            {data.faqs.map((faq, idx) => (
              <AnimatedSection key={idx} variants={fadeUp}>
                <details className="group bg-white rounded-2xl border border-[var(--border)] shadow-[var(--shadow-sm)] [&_summary::-webkit-details-marker]:hidden overflow-hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-3 p-6 text-[var(--fg)] hover:bg-[var(--bg-muted)]/30 transition-colors">
                    <h3 className="font-bold text-sm sm:text-base pr-4">
                      {faq.question}
                    </h3>
                    <div className="h-7 w-7 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center flex-shrink-0 group-open:bg-[var(--primary)] group-open:text-white transition-all">
                      <ChevronDown className="h-4 w-4 transition-transform duration-300 group-open:rotate-180" />
                    </div>
                  </summary>
                  <div className="px-6 pb-6 text-[var(--fg-muted)]">
                    <div className="h-px bg-[var(--border)] mb-5" />
                    <p className="text-sm leading-[1.8]">{faq.answer}</p>
                  </div>
                </details>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom CTA ─── */}
      <section className="py-20 bg-[var(--primary)] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[var(--accent)]/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-white/[0.04] blur-3xl" />
        </div>

        <div className="container mx-auto px-4 text-center relative">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Ready to Get Started?
          </h2>
          <p className="text-white/60 max-w-md mx-auto mb-8 text-sm leading-relaxed">
            Connect with our chartered accountants directly for personalized
            advice and a free initial consultation.
          </p>
          <div className="flex justify-center flex-col sm:flex-row gap-3">
            <WhatsAppButton />
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white text-[var(--primary)] px-7 py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-neutral-50 transition-all text-sm"
            >
              Request Consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
