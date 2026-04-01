import Link from "next/link";
import type { Metadata } from "next";
import { Calculator, ChevronRight, Landmark, ReceiptText } from "lucide-react";
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
    <div className="bg-[var(--bg)] py-16 lg:py-24">
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

      <section className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            <Calculator className="h-3.5 w-3.5" />
            Practical Tools
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Tax and compliance tools built for quick decision making
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Use our free calculators to estimate income tax, GST, and invoice-level tax impact
            before you file or plan the next step.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
          {TOOL_ITEMS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Icon className="h-7 w-7" />
                </div>
                <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-700">
                  {tool.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{tool.description}</p>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
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
