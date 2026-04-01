import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { buildPageMetadataFromSettings } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildPageMetadataFromSettings(settings, "services", {
    description:
      "Comprehensive chartered accountant services including income tax filing, GST registration, company incorporation, audit, compliance, and virtual CFO advisory across India.",
    keywords: [
      "chartered accountant services",
      "tax filing India",
      "GST registration",
      "company registration",
      "audit services",
      "virtual CFO",
    ],
    path: "/services",
    title: "Our Services",
  });
}

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
