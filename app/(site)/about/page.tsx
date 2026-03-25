import Image from "next/image";
import { Building2, FileCheck, Receipt, Briefcase, Calculator, Shield, ShoppingCart, UserCheck, Award } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fadeUp } from "@/lib/animations";
import JsonLd, { webPageSchema, breadcrumbSchema } from "@/components/seo/JsonLd";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about TaxFiling24 — your trusted partner for business registration, tax filing, GST compliance, and financial advisory services across India.",
  alternates: {
    canonical: "https://taxfiling24.com/about",
  },
  openGraph: {
    title: "About Us | TaxFiling24",
    description:
      "Learn about TaxFiling24 — your trusted partner for business registration, tax filing, GST compliance, and financial advisory services across India.",
    url: "https://taxfiling24.com/about",
    images: [{ url: "/images/team_consulting.png", width: 1200, height: 630, alt: "TaxFiling24 Team" }],
  },
};

export default function AboutPage() {
  return (
    <div className="pt-0 pb-16 lg:pb-24">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: "https://taxfiling24.com" },
            { name: "About Us", url: "https://taxfiling24.com/about" },
          ]),
          webPageSchema({
            name: "About TaxFiling24",
            description: "Learn about TaxFiling24 — your trusted partner for business registration, tax filing, GST compliance, and financial advisory services across India.",
            url: "https://taxfiling24.com/about",
          }),
        ]}
      />
      <section className="bg-[var(--primary)] text-white py-32 lg:py-40 relative overflow-hidden">
        <div className="absolute inset-0 z-0 bg-black/40" />
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/team_consulting.png"
            alt="Taxfiling24 Professional Team"
            fill
            className="object-cover opacity-30 mix-blend-overlay"
            priority
          />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-7xl text-white">
            About <span className="text-[var(--accent-light)]">Taxfiling24</span>
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-white/90 sm:text-2xl">
            Empowering businesses through simplified taxation, seamless compliance, and expert financial advisory.
          </p>
        </div>
      </section>

      {/* Story & Vision */}
      <section className="py-16 lg:py-24 bg-[var(--bg)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <AnimatedSection>
              <h2 className="mb-6 text-3xl font-bold text-[var(--fg)]">Our Journey & Vision</h2>
              <p className="mb-4 text-[var(--fg-muted)] leading-relaxed text-lg">
                Established with a singular mission to demystify complex tax laws, Taxfiling24 has grown into a premier destination for business compliance in India. We believe that entrepreneurs should focus on what they do best—building their business—while we handle the regulatory heavy lifting.
              </p>
              <p className="mb-6 text-[var(--fg-muted)] leading-relaxed text-lg">
                Our vision is to be the most trusted, tech-driven financial advisory firm, fostering growth for startups and established enterprises alike through absolute transparency and unmatched expertise.
              </p>
              <div className="flex items-center gap-4 bg-[var(--bg-card)] p-4 rounded-xl shadow-sm border border-[var(--border)] max-w-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--primary)] shrink-0">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-[var(--fg)]">Certified Excellence</h4>
                  <p className="text-sm text-[var(--fg-muted)]">Recognized industry leaders</p>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection variants={fadeUp}>
              <div className="relative overflow-hidden rounded-[2rem] shadow-[var(--shadow-xl)] aspect-[4/3] border-4 border-white">
                <Image
                  src="/images/team_consulting.png"
                  alt="Accounting and Finance"
                  fill
                  className="object-cover"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Domain Expertise */}
      <section className="py-16 lg:py-24 bg-slate-50 border-y border-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Domain Expertise</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              We bring specialized knowledge across multiple professional domains to ensure your business stays compliant and competitive.
            </p>
          </AnimatedSection>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "GST & Indirect Tax", icon: Receipt, desc: "End-to-end GST management including registration, returns, reconciliation, and audit representation." },
              { title: "Direct Taxation", icon: Calculator, desc: "Expert income tax planning for individuals and corporations, handling scrutiny and appeals." },
              { title: "Corporate Law", icon: Building2, desc: "Comprehensive ROC compliance, annual filings, and secretarial audits for Private Limited Companies and LLPs." },
              { title: "Business Licensing", icon: FileCheck, desc: "Fast-track handling of FSSAI, MSME, Startup India, and specialized industrial licenses." }
            ].map((skill, idx) => (
              <AnimatedSection key={skill.title} variants={fadeUp} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-[var(--primary)] group-hover:bg-[var(--primary)] group-hover:text-white transition-all">
                  <skill.icon className="h-7 w-7" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-3">{skill.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{skill.desc}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us & Milestones */}
      <section className="py-16 lg:py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <AnimatedSection>
              <h2 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">Why Choose TaxFiling24?</h2>
              <div className="space-y-8">
                {[
                  { title: "Technology-First Approach", desc: "We use modern cloud-based tools for bookkeeping and task management, ensuring real-time visibility for our clients." },
                  { title: "Unmatched Expertise", desc: "Our team consists of senior CAs, CSs, and Legal experts with over 15 years of cumulative experience." },
                  { title: "Transparent Pricing", desc: "No hidden costs. We provide clear, competitive pricing from day one with detailed engagement letters." },
                  { title: "Dedicated Support", desc: "Every client is assigned a dedicated compliance manager for personalized communication and faster resolution." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                      <div className="h-2 w-2 rounded-full bg-[var(--primary)]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection variants={fadeUp} className="relative">
              <div className="bg-slate-900 rounded-[2.5rem] p-10 lg:p-14 text-white relative z-10 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 h-40 w-40 bg-[var(--primary)]/20 blur-[100px]" />
                <div className="absolute bottom-0 left-0 h-40 w-40 bg-[var(--accent)]/20 blur-[100px]" />
                
                <h3 className="text-2xl font-bold mb-10 border-b border-white/10 pb-6 italic">Scaling Success with Data</h3>
                <div className="grid sm:grid-cols-2 gap-10">
                  {[
                    { label: "Company Registrations", value: "2,500+" },
                    { label: "Annual Filings Done", value: "10,000+" },
                    { label: "Expert Professionals", value: "25+" },
                    { label: "Positive Feedbacks", value: "98%" }
                  ].map((stat, idx) => (
                    <div key={idx} className="space-y-1">
                      <p className="text-4xl font-extrabold text-[var(--accent-light)]">{stat.value}</p>
                      <p className="text-sm text-white/60 font-medium tracking-wide border-l-2 border-[var(--primary)] pl-3">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-12 pt-10 border-t border-white/10 text-center">
                  <p className="text-white/80 text-sm leading-relaxed max-w-md mx-auto">
                    "From the narrowest compliance query to broad strategic transformations, we are the catalyst for your business growth."
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 lg:py-24 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">Our Core Values</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              The principles that drive every decision we make and every service we provide.
            </p>
          </AnimatedSection>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { title: "Integrity", icon: Shield, desc: "Absolute transparency and honesty in all our dealings. Your trust is our biggest asset." },
              { title: "Excellence", icon: Award, desc: "Commitment to delivering error-free, timely, and premium quality service." },
              { title: "Client First", icon: UserCheck, desc: "Bespoke solutions tailored to meet the unique challenges of your business." }
            ].map((v, i) => (
              <AnimatedSection key={v.title} variants={fadeUp} className="bg-white p-8 rounded-[2rem] border border-slate-100 text-center shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-[var(--primary)] mb-6">
                  <v.icon className="h-8 w-8 text-[var(--primary)]" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{v.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
