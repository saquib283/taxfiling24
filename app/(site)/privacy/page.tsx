import { getSetting, getSettings } from "@/lib/settings";
import type { Metadata } from "next";
import { buildPageMetadataFromSettings } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildPageMetadataFromSettings(settings, "privacy", {
    description:
      "Read TaxFiling24's privacy policy to understand how we collect, use, and protect your personal information.",
    path: "/privacy",
    title: "Privacy Policy",
  });
}

export default async function PrivacyPage() {
  const [title, content] = await Promise.all([
    getSetting("page_privacy_title", "Privacy Policy"),
    getSetting("page_privacy", ""),
  ]);

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-[var(--fg)] mb-8">{title}</h1>
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
