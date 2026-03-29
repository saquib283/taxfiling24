import { getSetting } from "@/lib/settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Read TaxFiling24's terms of service to understand the conditions under which we provide our professional services.",
  alternates: {
    canonical: "https://taxfiling24.com/terms",
  },
  openGraph: {
    title: "Terms of Service | TaxFiling24",
    description: "Read TaxFiling24's terms of service to understand the conditions under which we provide our professional services.",
    url: "https://taxfiling24.com/terms",
  },
};

export default async function TermsPage() {
  const [title, content] = await Promise.all([
    getSetting("page_terms_title", "Terms of Service"),
    getSetting("page_terms", ""),
  ]);

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-[var(--fg)] mb-8">{title}</h1>
      {content ? (
        <div className="prose prose-lg max-w-none text-[var(--fg-muted)] leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      ) : (
        <p className="text-[var(--fg-muted)]">Terms of service content has not been configured yet. Please update it from the admin panel.</p>
      )}
    </div>
  );
}
