import HeroSection from "@/components/sections/HeroSection";
import StatsSection from "@/components/sections/StatsSection";
import ServicesSection from "@/components/sections/ServicesSection";
import NeedGuidanceSection from "@/components/sections/NeedGuidanceSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import AboutSection from "@/components/sections/AboutSection";

import TestimonialsSection from "@/components/sections/TestimonialsSection";
import CTASection from "@/components/sections/CTASection";
import FAQSection from "@/components/sections/FAQSection";
import ComplianceCalendar from "@/components/sections/ComplianceCalendar";


export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <AboutSection />
      <ServicesSection />
      <FeaturesSection />

      <TestimonialsSection />
      <ComplianceCalendar />
      <NeedGuidanceSection />
      <CTASection />
      <FAQSection />

    </>
  );
}
