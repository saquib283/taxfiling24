export const dynamic = "force-dynamic";

import GSTCalculator from "@/components/sections/GSTCalculator";
import type { Metadata } from "next";
import JsonLd, {
  breadcrumbSchema,
  softwareApplicationSchema,
  webPageSchema,
} from "@/components/seo/JsonLd";
import { findManagedSection, getManagedPageSections } from "@/lib/managed-pages";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, buildPageMetadataFromSettings } from "@/lib/seo";

type ManagedPresetItem = {
  hsn?: string;
  desc?: string;
  rate?: string;
  category?: string;
  isVisible?: boolean;
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildPageMetadataFromSettings(settings, "gst_calculator", {
    description:
      "Free GST 2.0 Calculator for India (56th GST Council slabs: 0%, 3%, 5%, 18%, 40%). Compute exclusive/inclusive GST, HSN/SAC invoices, Rule 88A ITC offset, RCM, and Composition Bills of Supply.",
    keywords: [
      "GST 2.0 calculator India",
      "56th GST Council slabs calculator",
      "HSN SAC GST invoice calculator",
      "Rule 88A ITC utilization calculator",
      "GST composition bill of supply",
    ],
    path: "/tools/gst-calculator",
    title: "GST 2.0 Calculator & Invoice Builder (HSN / SAC)",
  });
}

export default async function GSTCalculatorPage() {
  const settings = await getSettings();
  const sections = getManagedPageSections("gstCalculator", settings);

  return (
    <div className="bg-[var(--bg)] min-h-screen pb-16 lg:pb-24 pt-0">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Tools", url: absoluteUrl("/tools") },
            { name: "GST Calculator", url: absoluteUrl("/tools/gst-calculator") },
          ]),
          webPageSchema({
            name: "GST 2.0 Calculator & Invoice Builder",
            description:
              "Free GST 2.0 online calculator with HSN/SAC lookup, Rule 88A ITC offset, Reverse Charge, and Section 10 Composition Bill of Supply.",
            url: absoluteUrl("/tools/gst-calculator"),
          }),
          softwareApplicationSchema({
            description:
              "Interactive GST 2.0 calculator and multi-item Tax Invoice / Bill of Supply studio for India with Rule 88A ITC ledger utilization and PDF/Excel exports.",
            name: "GST 2.0 Calculator",
            url: absoluteUrl("/tools/gst-calculator"),
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
            ?.items as ManagedPresetItem[]) || undefined,
          servicePresets: (findManagedSection<Record<string, unknown>>(sections, "gst.service-presets")?.data
            ?.items as ManagedPresetItem[]) || undefined,
        }}
      />
    </div>
  );
}
