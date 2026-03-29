import GSTCalculator from "@/components/sections/GSTCalculator";
import type { Metadata } from "next";
import JsonLd, { breadcrumbSchema, webPageSchema } from "@/components/seo/JsonLd";
import { findManagedSection, getManagedPageSections } from "@/lib/managed-pages";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "GST Calculator | Online HSN & SAC GST Tax Calculator",
  description:
    "Free online GST calculator for India. Instantly calculate GST (CGST, SGST, IGST) with exclusive and inclusive modes. Features built-in HSN/SAC code lookup for accurate rates.",
  alternates: {
    canonical: "https://taxfiling24.com/tools/gst-calculator",
  },
  openGraph: {
    title: "GST Calculator with HSN Lookup | TaxFiling24",
    description:
      "Free online GST calculator for India. Instantly calculate CGST, SGST, IGST with exclusive and inclusive modes and HSN code lookup.",
    url: "https://taxfiling24.com/tools/gst-calculator",
  },
};

export default async function GSTCalculatorPage() {
  const settings = await getSettings();
  const sections = getManagedPageSections("gstCalculator", settings);

  return (
    <div className="bg-[var(--bg)] min-h-screen pb-16 lg:pb-24 pt-0">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: "https://taxfiling24.com" },
            { name: "Tools", url: "https://taxfiling24.com/tools" },
            { name: "GST Calculator", url: "https://taxfiling24.com/tools/gst-calculator" },
          ]),
          webPageSchema({
            name: "GST Calculator",
            description: "Free online GST calculator with HSN/SAC lookup.",
            url: "https://taxfiling24.com/tools/gst-calculator",
          }),
        ]}
      />
      <GSTCalculator
        content={{
          hero: findManagedSection<Record<string, unknown>>(sections, "gst.hero")?.data as Record<string, string> | undefined,
          controls: findManagedSection<Record<string, unknown>>(sections, "gst.controls")?.data as Record<string, string> | undefined,
          entry: findManagedSection<Record<string, unknown>>(sections, "gst.entry")?.data as Record<string, string> | undefined,
          compliance: findManagedSection<Record<string, unknown>>(sections, "gst.compliance")?.data as Record<string, string> | undefined,
          entries: findManagedSection<Record<string, unknown>>(sections, "gst.entries")?.data as Record<string, string> | undefined,
          summary: findManagedSection<Record<string, unknown>>(sections, "gst.summary")?.data as Record<string, string> | undefined,
          goodsPresets: (findManagedSection<Record<string, unknown>>(sections, "gst.goods-presets")?.data
            ?.items as Array<Record<string, string>>) || undefined,
          servicePresets: (findManagedSection<Record<string, unknown>>(sections, "gst.service-presets")?.data
            ?.items as Array<Record<string, string>>) || undefined,
        }}
      />
    </div>
  );
}
