export const dynamic = "force-dynamic";

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
      "Free statutory Indian Income Tax Calculator for Tax Year 2026-27 (Income-tax Act, 2025) and FY 2025-26. Compare Old vs. New Regime with Sec 87A/156 rebate, marginal relief, capital gains, HRA, and CA PDF/Excel reports.",
    keywords: [
      "income tax calculator TY 2026-27",
      "Income-tax Act 2025 calculator",
      "income tax calculator FY 2025-26",
      "old vs new tax regime India",
      "section 87A marginal relief calculator",
    ],
    path: "/tools/tax-calculator",
    title: "Income Tax Calculator (TY 2026-27 & FY 2025-26)",
  });
}

export default async function TaxCalculatorPage() {
  const settings = await getSettings();
  const sections = getManagedPageSections("taxCalculator", settings);

  return (
    <div className="bg-[var(--bg)] min-h-screen pb-16 lg:pb-24 pt-0">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Tools", url: absoluteUrl("/tools") },
            { name: "Tax Calculator", url: absoluteUrl("/tools/tax-calculator") },
          ]),
          webPageSchema({
            name: "Income Tax Calculator (TY 2026-27 & FY 2025-26)",
            description:
              "Free statutory Indian income tax calculator for Tax Year 2026-27 (Income-tax Act, 2025), FY 2025-26, and FY 2024-25.",
            url: absoluteUrl("/tools/tax-calculator"),
          }),
          softwareApplicationSchema({
            description:
              "Interactive statutory income tax calculator comparing Old and New tax regimes in India with surcharge caps, marginal relief, capital gains, and Advance Tax schedules.",
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
