"use client";

import { PROCESS_STEPS } from "@/lib/constants";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { slideInLeft, slideInRight } from "@/lib/animations";
import { Shield, Award, Zap, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProcessProps {
  settings?: Record<string, string>;
  content?: {
    badge?: string;
    title?: string;
    subtext?: string;
    steps?: Array<{
      step?: string;
      title?: string;
      description?: string;
      image?: string;
      ctaLabel?: string;
      ctaHref?: string;
      isVisible?: boolean;
    }>;
  };
}

export default function ProcessSection({ settings = {}, content }: ProcessProps) {
  const sectionBadge = content?.badge || settings.process_badge || "Engagement Model";
  const sectionTitle = content?.title || settings.process_title || "Our Strategic Operating Model";
  const sectionSubtext =
    content?.subtext ||
    settings.process_subtext ||
    "A meticulous, tech-enabled framework designed to ensure absolute regulatory accuracy and strategic scalability for your enterprise.";

  // Dynamic process steps from settings with fallback
  let displaySteps = PROCESS_STEPS;
  if (content?.steps?.length) {
    displaySteps = content.steps.filter((step) => step.isVisible !== false && step.title) as typeof PROCESS_STEPS;
  } else if (settings.process_steps_json) {
    try {
      const parsed = JSON.parse(settings.process_steps_json);
      if (Array.isArray(parsed) && parsed.length > 0) {
        displaySteps = parsed;
      }
    } catch (e) {
      console.error("Error parsing process_steps_json:", e);
    }
  }

  return (
    <section className="py-24 lg:py-32 bg-[var(--bg)] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 h-96 w-96 bg-[var(--primary)]/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-0 left-0 h-96 w-96 bg-[var(--accent)]/5 blur-[120px] rounded-full -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mb-20 text-center">
          <span className="mb-4 inline-block rounded-full bg-[var(--primary)]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[var(--primary)] shadow-sm">
            {sectionBadge}
          </span>
          <h2 className="mb-5 text-3xl font-extrabold tracking-tight text-[var(--fg)] sm:text-4xl lg:text-5xl">
            {sectionTitle}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--fg-muted)] leading-relaxed">
            {sectionSubtext}
          </p>
        </AnimatedSection>

        <div className="relative mx-auto max-w-5xl space-y-12 lg:space-y-0">
          {/* Vertical Center Line (Desktop) */}
          <div className="absolute left-1/2 top-0 h-full w-px bg-slate-200 -translate-x-1/2 hidden lg:block" />

          {displaySteps.map((step: any, index) => {
            const isEven = index % 2 === 0;
            return (
              <div key={step.step} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
                <AnimatedSection 
                  variants={isEven ? slideInLeft : slideInRight} 
                  className={`lg:p-6 ${isEven ? 'lg:text-right order-1' : 'lg:order-2 lg:text-left'}`}
                >
                  <div className={`relative flex flex-col ${isEven ? 'lg:items-end' : 'lg:items-start'} items-center text-center`}>
                    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[var(--primary)] shadow-xl border border-slate-100 font-black text-2xl tracking-tighter">
                      {step.step}
                    </div>
                    <h3 className="mb-4 text-2xl font-bold text-[var(--fg)]">
                      {step.title}
                    </h3>
                    <p className="max-w-md text-[var(--fg-muted)] leading-relaxed text-sm">
                      {step.description}
                    </p>
                    <Link 
                      href={step.ctaHref || "/about"}
                      className="mt-6 flex items-center gap-2 text-[var(--primary)] font-bold text-sm underline-offset-4 hover:underline cursor-pointer group transition-all"
                    >
                      {step.ctaLabel || "Explore Framework"}
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </AnimatedSection>
                
                <div className={`flex justify-center ${isEven ? 'order-2' : 'order-1 text-right'}`}>
                   {/* Step Card Visual */}
                   <AnimatedSection 
                     variants={isEven ? slideInRight : slideInLeft}
                     className="relative w-full max-w-sm group"
                   >
                      <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] opacity-5 blur-xl group-hover:opacity-15 transition-opacity duration-500" />
                      <div className="relative rounded-[2rem] border border-white bg-white/40 p-1 backdrop-blur-3xl shadow-2xl transition-transform duration-500 group-hover:-translate-y-2">
                         <div 
                           className="overflow-hidden rounded-[1.8rem] bg-white flex items-center justify-center aspect-square relative"
                           style={{ 
                             maskImage: 'radial-gradient(circle, black 60%, transparent 95%)',
                             WebkitMaskImage: 'radial-gradient(circle, black 60%, transparent 95%)'
                           }}
                         >
                            <Image
                              src={step.image || "/images/process_discovery.png"}
                              alt={step.title}
                              fill
                              className="object-contain p-6 mix-blend-multiply brightness-[1.03] contrast-[1.05] transition-transform duration-700 group-hover:scale-110"
                            />
                         </div>
                      </div>
                   </AnimatedSection>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Trust bar */}
        <AnimatedSection className="mt-32 pt-16 border-t border-slate-100">
           <div className="flex flex-wrap justify-center gap-12 lg:gap-20">
             {[
               { icon: Shield, label: "Trusted Advisory" },
               { icon: Award, label: "Regulatory Precision" },
               { icon: Zap, label: "Data Confidentiality" }
             ].map((trust, idx) => (
               <div key={idx} className="flex items-center gap-3 text-slate-400 font-bold group hover:text-[var(--primary)] transition-colors">
                 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-300 group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)] transition-all">
                   <trust.icon size={20} />
                 </div>
                 <span className="text-xs uppercase tracking-[0.2em]">{trust.label}</span>
               </div>
             ))}
           </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
