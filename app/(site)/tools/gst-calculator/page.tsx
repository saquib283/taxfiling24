import GSTCalculator from "@/components/sections/GSTCalculator";
import type { Metadata } from "next";
import JsonLd, { breadcrumbSchema, webPageSchema } from "@/components/seo/JsonLd";

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

export default function GSTCalculatorPage() {
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
      <GSTCalculator />
    </div>
  );
}
