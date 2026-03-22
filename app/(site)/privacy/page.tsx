import { getSetting } from "@/lib/settings";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | TaxFiling24",
  description: "Read TaxFiling24's privacy policy to understand how we collect, use, and protect your personal information.",
};

export default async function PrivacyPage() {
  const content = await getSetting("page_privacy", "");

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-[var(--fg)] mb-8">Privacy Policy</h1>
      {content ? (
        <div className="prose prose-lg max-w-none text-[var(--fg-muted)] leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      ) : (
        <p className="text-[var(--fg-muted)]">Privacy policy content has not been configured yet. Please update it from the admin panel.</p>
      )}
    </div>
  );
}
