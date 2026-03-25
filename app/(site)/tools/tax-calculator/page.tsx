import TaxCalculator from "@/components/sections/TaxCalculator";
import type { Metadata } from "next";
import JsonLd, { breadcrumbSchema, webPageSchema } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Income Tax Calculator",
  description:
    "Free online income tax calculator for FY 2025-26. Calculate your tax liability under old and new tax regimes instantly. Powered by TaxFiling24.",
  alternates: {
    canonical: "https://taxfiling24.com/tools/tax-calculator",
  },
  openGraph: {
    title: "Income Tax Calculator | TaxFiling24",
    description:
      "Free online income tax calculator for FY 2025-26. Calculate your tax liability under old and new tax regimes instantly.",
    url: "https://taxfiling24.com/tools/tax-calculator",
  },
};

export default function TaxCalculatorPage() {
  return (
    <div className="bg-[var(--bg)] min-h-screen pb-16 lg:pb-24 pt-0">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: "https://taxfiling24.com" },
            { name: "Tools", url: "https://taxfiling24.com/tools" },
            { name: "Tax Calculator", url: "https://taxfiling24.com/tools/tax-calculator" },
          ]),
          webPageSchema({
            name: "Income Tax Calculator",
            description: "Free online income tax calculator for FY 2025-26.",
            url: "https://taxfiling24.com/tools/tax-calculator",
          }),
        ]}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <TaxCalculator />
        </div>
      </div>
    </div>
  );
}
