import TaxCalculator from "@/components/sections/TaxCalculator";
import type { Metadata } from "next";
import JsonLd, { breadcrumbSchema, webPageSchema } from "@/components/seo/JsonLd";
import { findManagedSection, getManagedPageSections } from "@/lib/managed-pages";
import { getSettings } from "@/lib/settings";

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

export default async function TaxCalculatorPage() {
  const settings = await getSettings();
  const sections = getManagedPageSections("taxCalculator", settings);

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
      <TaxCalculator
        content={{
          hero: findManagedSection<Record<string, unknown>>(sections, "tax.hero")?.data as Record<string, string> | undefined,
          income: findManagedSection<Record<string, unknown>>(sections, "tax.income")?.data as Record<string, string> | undefined,
          deductions: findManagedSection<Record<string, unknown>>(sections, "tax.deductions")?.data as Record<string, string> | undefined,
          compliance: findManagedSection<Record<string, unknown>>(sections, "tax.compliance")?.data as Record<string, string> | undefined,
          results: findManagedSection<Record<string, unknown>>(sections, "tax.results")?.data as Record<string, string> | undefined,
        }}
      />
    </div>
  );
}
