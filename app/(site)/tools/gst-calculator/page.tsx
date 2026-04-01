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

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildPageMetadataFromSettings(settings, "gst_calculator", {
    description:
      "Free online GST calculator for India. Instantly calculate GST in inclusive and exclusive modes with item-level summaries.",
    keywords: ["GST calculator", "GST tax calculator", "HSN calculator", "GST invoice calculator"],
    path: "/tools/gst-calculator",
    title: "GST Calculator | Online HSN & SAC GST Tax Calculator",
  });
}

export default async function GSTCalculatorPage() {
  const settings = await getSettings();
  const sections = getManagedPageSections("gstCalculator", settings);

  return (
    <div className="bg-[var(--bg)] min-h-screen pb-16 lg:pb-24 pt-0">
      <h1 className="sr-only">GST Calculator</h1>
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Tools", url: absoluteUrl("/tools") },
            { name: "GST Calculator", url: absoluteUrl("/tools/gst-calculator") },
          ]),
          webPageSchema({
            name: "GST Calculator",
            description: "Free online GST calculator with HSN/SAC lookup.",
            url: absoluteUrl("/tools/gst-calculator"),
          }),
          softwareApplicationSchema({
            description:
              "Interactive GST calculator for India with item-based billing and tax summary support.",
            name: "GST Calculator",
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
            ?.items as Array<Record<string, string>>) || undefined,
          servicePresets: (findManagedSection<Record<string, unknown>>(sections, "gst.service-presets")?.data
            ?.items as Array<Record<string, string>>) || undefined,
        }}
      />
    </div>
  );
}
