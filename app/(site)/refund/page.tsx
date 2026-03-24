import { getSetting } from "@/lib/settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "Read TaxFiling24's refund and cancellation policy for all professional services.",
  alternates: {
    canonical: "https://taxfiling24.com/refund",
  },
  openGraph: {
    title: "Refund & Cancellation Policy | TaxFiling24",
    description: "Read TaxFiling24's refund and cancellation policy for all professional services.",
    url: "https://taxfiling24.com/refund",
  },
};

export default async function RefundPage() {
  const content = await getSetting("page_refund", "");

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-[var(--fg)] mb-8">Refund & Cancellation Policy</h1>
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
