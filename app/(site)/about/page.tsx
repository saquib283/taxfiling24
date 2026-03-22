import Image from "next/image";
import { Building2, FileCheck, Receipt, Briefcase, Calculator, Shield, ShoppingCart, UserCheck, Award } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fadeUp } from "@/lib/animations";

export const metadata = {
  title: "About Us | Taxfiling24",
  description: "Learn about Taxfiling24, your trusted partner for registration, tax filing, and compliance in India.",
};

export default function AboutPage() {
  return (
    <div className="pt-24 pb-16 lg:pt-32 lg:pb-24">
      {/* Hero Header */}
      <section className="bg-[var(--primary)] text-white py-16 lg:py-20 relative overflow-hidden">
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
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white">
            About <span className="text-[var(--accent-light)]">Taxfiling24</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/90 sm:text-xl">
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
              <div className="flex items-center gap-4 bg-[var(--bg-card)] p-4 rounded-xl shadow-sm border border-[var(--border)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--primary)]">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-[var(--fg)]">Certified Excellence</h4>
                  <p className="text-sm text-[var(--fg-muted)]">Recognized industry leaders</p>
                </div>
              </div>
            </AnimatedSection>
            <AnimatedSection variants={fadeUp}>
              <div className="relative overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] aspect-[4/3]">
                <Image
                  src="/images/services_accounting.png"
                  alt="Accounting and Finance"
                  fill
                  className="object-cover"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 lg:py-24 bg-[var(--bg-card)] border-t border-[var(--border)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[var(--fg)] mb-4">Our Core Values</h2>
            <p className="text-[var(--fg-muted)] max-w-2xl mx-auto">
              The principles that drive every decision we make and every service we provide.
            </p>
          </AnimatedSection>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { title: "Integrity", icon: Shield, desc: "Absolute transparency and honesty in all our dealings. Your trust is our biggest asset." },
              { title: "Excellence", icon: Award, desc: "Commitment to delivering error-free, timely, and premium quality service." },
              { title: "Client First", icon: UserCheck, desc: "Bespoke solutions tailored to meet the unique challenges of your business." }
            ].map((v, i) => (
              <AnimatedSection key={v.title} variants={fadeUp} className="bg-[var(--bg)] p-8 rounded-[var(--radius-xl)] border border-[var(--border)] text-center shadow-sm hover:shadow-md transition-shadow">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--primary)] mb-6">
                  <v.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-[var(--fg)] mb-3">{v.title}</h3>
                <p className="text-[var(--fg-muted)] leading-relaxed">{v.desc}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
