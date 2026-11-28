import { getSetting, getSettings } from "@/lib/settings";
import type { Metadata } from "next";
import { absoluteUrl, buildPageMetadataFromSettings } from "@/lib/seo";
import JsonLd, { breadcrumbSchema } from "@/components/seo/JsonLd";
import PageHero from "@/components/layout/PageHero";
import { sanitizeHtml } from "@/lib/sanitize-html";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildPageMetadataFromSettings(settings, "privacy", {
    description:
      "Read TaxFiling24's privacy policy to understand how we collect, use, and protect your personal information.",
    path: "/privacy",
    title: "Privacy Policy",
  });
}

const DEFAULT_PRIVACY_POLICY = `Effective Date: January 1, 2026

TaxFiling24 ("we", "our", or "us") is committed to protecting the confidentiality and security of the personal, financial, and business information you share with us through https://taxfiling24.com and our advisory services.

1. Information We Collect
We collect information you voluntarily provide when submitting inquiries, booking consultations, subscribing to compliance updates, or engaging our Chartered Accountancy and corporate filing services. This may include your name, email address, phone number, business details, and statutory documentation required for filings.

2. How We Use Your Information
We use your information strictly to:
- Deliver requested tax filing, GST compliance, business registration, audit, and advisory services.
- Communicate appointment confirmations, statutory deadlines, and engagement updates.
- Fulfill legal and regulatory obligations under applicable Indian laws.

3. Data Confidentiality & Security
All client documents and tax records are handled under strict professional confidentiality standards. We implement technical and organizational safeguards to protect data against unauthorized access, disclosure, or misuse. We never sell or rent your personal data to third parties.

4. Cookies & Analytics
Our website uses essential cookies and privacy-conscious analytics tools to measure site performance and improve user experience. You may control cookie preferences through your browser settings.

5. Your Rights & Contact
You may request access to, correction of, or deletion of your personal information (subject to statutory record-retention requirements) by contacting us at support@taxfiling24.com.`;

export default async function PrivacyPage() {
  const [title, content] = await Promise.all([
    getSetting("page_privacy_title", "Privacy Policy"),
    getSetting("page_privacy", ""),
  ]);
  const displayContent = content.trim() || DEFAULT_PRIVACY_POLICY;
  const isHtmlContent = /<[a-z][\s\S]*>/i.test(displayContent);

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-20">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Privacy Policy", url: absoluteUrl("/privacy") },
          ]),
        ]}
      />
      <PageHero
        compact
        title={title}
        description="How TaxFiling24 collects, safeguards, and handles your personal, financial, and statutory filing information."
      />
      <div className="container mx-auto px-4 pt-10 sm:px-6 lg:px-8 max-w-4xl">
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-10 shadow-[var(--shadow-sm)]">
          {isHtmlContent ? (
            <div
              className="tiptap prose prose-slate max-w-none text-[var(--fg-muted)] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(displayContent) }}
            />
          ) : (
            <div className="prose prose-slate max-w-none text-[var(--fg-muted)] leading-relaxed whitespace-pre-wrap">
              {displayContent}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
