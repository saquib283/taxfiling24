import { SERVICES_DETAIL_DATA } from "@/lib/services-detail-data";
import { notFound } from "next/navigation";
import { CheckCircle2, ChevronDown, Clock, FileText, ArrowLeft, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className={`relative py-20 lg:py-32 text-white bg-gradient-to-br ${data.heroBg}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="max-w-4xl">
            <Link href="/services" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 text-sm font-medium transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Back to Services
            </Link>
            <h1 className="mb-4 text-4xl font-extrabold sm:text-5xl lg:text-6xl tracking-tight">
              {data.title}
            </h1>
            <p className="max-w-2xl text-lg lg:text-xl text-white/90 font-light leading-relaxed mb-8">
              {data.description}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <WhatsAppButton />
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 font-medium text-white hover:bg-white/20 transition-all shadow-md"
              >
                Get a Quote
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </AnimatedSection>
        </div>
        {/* Subtle background graphic */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
      </section>

      {/* Overview & Benefits */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-7">
              <AnimatedSection variants={fadeUp}>
                <h2 className="text-3xl font-bold text-gray-900 mb-6 relative">
                  Overview
                  <span className="absolute bottom-0 left-0 w-12 h-1 bg-blue-600 -mb-2"></span>
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {data.overview}
                </p>
              </AnimatedSection>
            </div>
            <div className="lg:col-span-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 p-8 rounded-2xl border border-blue-100/50 shadow-sm">
              <AnimatedSection variants={fadeUp}>
                <h3 className="text-xl font-bold text-blue-900 mb-6">Key Benefits</h3>
                <ul className="space-y-4">
                  {data.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-Services Grid */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What We Offer</h2>
            <p className="text-gray-500 mt-2">Comprehensive solutions tailored for your legal & financial needs</p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.subServices.map((sub, idx) => (
              <AnimatedSection key={idx} variants={fadeUp}>
                <div className="h-full bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                    {sub.title}
                  </h4>
                  <p className="text-gray-600 text-sm">{sub.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Documents & Process */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Documents */}
            <AnimatedSection variants={fadeUp}>
              <div className="bg-neutral-900 text-white p-8 rounded-2xl shadow-xl h-full">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="h-6 w-6 text-blue-400" />
                  <h3 className="text-2xl font-bold">Documents Required</h3>
                </div>
                <ul className="space-y-4">
                  {data.documentsRequired.map((doc, idx) => (
                    <li key={idx} className="flex items-start gap-3 border-b border-white/10 pb-3 last:border-0 last:pb-0">
                      <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-white/80 text-sm sm:text-base">{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>

            {/* Process Timeline */}
            <AnimatedSection variants={fadeUp}>
              <div className="p-8 h-full">
                <div className="flex items-center gap-3 mb-8">
                  <Clock className="h-6 w-6 text-blue-600" />
                  <h3 className="text-2xl font-bold text-gray-900">Registration Process</h3>
                </div>
                <div className="space-y-6 relative before:absolute before:left-[1rem] before:top-4 before:bottom-4 before:w-0.5 before:bg-blue-100">
                  {data.process.map((p, idx) => (
                    <div key={idx} className="flex gap-4 relative">
                      <div className="z-10 h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {p.step}
                      </div>
                      <div className="pt-1">
                        <h4 className="font-bold text-gray-900 mb-1">{p.title}</h4>
                        <p className="text-gray-500 text-sm leading-relaxed">{p.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </AnimatedSection>

          <div className="space-y-4">
            {data.faqs.map((faq, idx) => (
              <AnimatedSection key={idx} variants={fadeUp}>
                <details className="group bg-white rounded-xl border border-gray-200 shadow-sm [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-1.5 p-6 text-gray-900">
                    <h3 className="font-semibold text-lg">{faq.question}</h3>
                    <ChevronDown className="h-5 w-5 shrink-0 transition duration-300 group-open:-rotate-180 text-gray-500" />
                  </summary>
                  <div className="px-6 pb-6 pt-0 text-gray-600 border-t border-gray-100 mt-2">
                    <p className="pt-4 text-sm leading-relaxed">{faq.answer}</p>
                  </div>
                </details>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section bottom */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-blue-100 max-w-lg mx-auto mb-8">
            Connect with our chartered accountants directly for personalized advice.
          </p>
          <div className="flex justify-center flex-col sm:flex-row gap-4">
            <WhatsAppButton />
            <Link href="/contact" className="inline-flex items-center justify-center bg-white px-6 py-3 rounded-xl font-medium text-blue-800 shadow-lg hover:bg-neutral-100 transition-colors">
              Request Consultation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
