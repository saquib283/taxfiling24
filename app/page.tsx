import HeroSection from "@/components/sections/HeroSection";
import StatsSection from "@/components/sections/StatsSection";
import ServicesSection from "@/components/sections/ServicesSection";
import NeedGuidanceSection from "@/components/sections/NeedGuidanceSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import AboutSection from "@/components/sections/AboutSection";
import PricingSection from "@/components/sections/PricingSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import CTASection from "@/components/sections/CTASection";
import FAQSection from "@/components/sections/FAQSection";
import ContactSection from "@/components/sections/ContactSection";
import ComplianceCalendar from "@/components/sections/ComplianceCalendar";
import TaxCalculator from "@/components/sections/TaxCalculator";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <HeroSection />
      <StatsSection />
      <ServicesSection />
      <NeedGuidanceSection />
      <PricingSection />
      <FeaturesSection />
      <AboutSection />
      <TestimonialsSection />
      <TaxCalculator />
      <ComplianceCalendar />
      <CTASection />
      <FAQSection />
      <ContactSection />
      <Footer />
    </>
  );
}
