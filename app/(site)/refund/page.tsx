import { getSetting, getSettings } from "@/lib/settings";
import type { Metadata } from "next";
import { buildPageMetadataFromSettings } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildPageMetadataFromSettings(settings, "refund", {
    description: "Read TaxFiling24's refund and cancellation policy for all professional services.",
    path: "/refund",
    title: "Refund & Cancellation Policy",
  });
}

export default async function RefundPage() {
  const [title, content] = await Promise.all([
    getSetting("page_refund_title", "Refund & Cancellation Policy"),
    getSetting("page_refund", ""),
  ]);

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-[var(--fg)] mb-8">{title}</h1>
      {content ? (
        <div className="prose prose-lg max-w-none text-[var(--fg-muted)] leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      ) : (
        <p className="text-[var(--fg-muted)]">Refund policy content has not been configured yet. Please update it from the admin panel.</p>
      )}
    </div>
  );
}
