import TaxCalculator from "@/components/sections/TaxCalculator";
import type { Metadata } from "next";
import JsonLd, {
  breadcrumbSchema,
  softwareApplicationSchema,
  webPageSchema,
} from "@/components/seo/JsonLd";
import { findManagedSection, getManagedPageSections } from "@/lib/managed-pages";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, buildPageMetadataFromSettings } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildPageMetadataFromSettings(settings, "tax_calculator", {
    description:
      "Free online income tax calculator for FY 2025-26. Calculate your tax liability under old and new tax regimes instantly.",
    keywords: ["income tax calculator", "tax calculator India", "old vs new regime"],
    path: "/tools/tax-calculator",
    title: "Income Tax Calculator",
  });
}

export default async function TaxCalculatorPage() {
  const settings = await getSettings();
  const sections = getManagedPageSections("taxCalculator", settings);

  return (
    <div className="bg-[var(--bg)] min-h-screen pb-16 lg:pb-24 pt-0">
      <h1 className="sr-only">Income Tax Calculator</h1>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Tools", url: absoluteUrl("/tools") },
            { name: "Tax Calculator", url: absoluteUrl("/tools/tax-calculator") },
          ]),
          webPageSchema({
            name: "Income Tax Calculator",
            description: "Free online income tax calculator for FY 2025-26.",
            url: absoluteUrl("/tools/tax-calculator"),
          }),
          softwareApplicationSchema({
            description:
              "Interactive web-based income tax calculator for comparing old and new tax regimes in India.",
            name: "Income Tax Calculator",
            url: absoluteUrl("/tools/tax-calculator"),
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
