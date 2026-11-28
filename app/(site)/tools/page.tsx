import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight, Landmark, ReceiptText } from "lucide-react";
import PageHero from "@/components/layout/PageHero";
import JsonLd, {
  breadcrumbSchema,
  collectionPageSchema,
  itemListSchema,
} from "@/components/seo/JsonLd";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, buildPageMetadataFromSettings } from "@/lib/seo";

const TOOL_ITEMS = [
  {
    description:
      "Estimate income tax under old and new regimes with a detailed, printable breakdown.",
    href: "/tools/tax-calculator",
    icon: Landmark,
    title: "Income Tax Calculator",
  },
  {
    description:
      "Calculate GST payable in inclusive or exclusive mode with item-level bill summaries.",
    href: "/tools/gst-calculator",
    icon: ReceiptText,
    title: "GST Calculator",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildPageMetadataFromSettings(settings, "tools", {
    description:
      "Free tax and GST calculators from TaxFiling24 to help users estimate liabilities and plan compliance faster.",
    keywords: ["GST calculator", "income tax calculator", "tax tools", "financial tools"],
    path: "/tools",
    title: "Tax & Compliance Tools",
  });
}

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pb-20">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Tools", url: absoluteUrl("/tools") },
          ]),
          collectionPageSchema({
            description:
              "Free tax and GST calculators from TaxFiling24 for faster financial planning and compliance checks.",
            name: "Tax & Compliance Tools",
            url: absoluteUrl("/tools"),
          }),
          itemListSchema(
            TOOL_ITEMS.map((tool) => ({
              name: tool.title,
              url: absoluteUrl(tool.href),
            }))
          ),
        ]}
      />

      <PageHero
        title={
          <>
            Tax &amp; Compliance <span className="text-[var(--accent)]">Calculators</span>
          </>
        }
        description="Use our free statutory calculators to estimate income tax liabilities, GST breakdowns, and invoice-level tax impact before you file."
      />

      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-16">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {TOOL_ITEMS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-8 shadow-[var(--shadow-sm)] transition-all hover:-translate-y-1 hover:border-[var(--primary-border)] hover:shadow-[var(--shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius)] bg-[var(--primary-soft)] text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-white">
                  <Icon className="h-7 w-7" />
                </div>
                <h2 className="mt-6 text-2xl font-bold tracking-tight text-[var(--fg)] transition-colors group-hover:text-[var(--primary)]">
                  {tool.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--fg-muted)]">{tool.description}</p>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                  Open tool
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
