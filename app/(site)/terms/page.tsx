import { getSetting, getSettings } from "@/lib/settings";
import type { Metadata } from "next";
import { absoluteUrl, buildPageMetadataFromSettings } from "@/lib/seo";
import JsonLd, { breadcrumbSchema } from "@/components/seo/JsonLd";
import { sanitizeHtml } from "@/lib/sanitize-html";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildPageMetadataFromSettings(settings, "terms", {
    description:
      "Read TaxFiling24's terms of service to understand the conditions under which we provide our professional services.",
    path: "/terms",
    title: "Terms of Service",
  });
}

const DEFAULT_TERMS_OF_SERVICE = `Effective Date: January 1, 2026

Welcome to TaxFiling24 (https://taxfiling24.com). By accessing our website, calculators, or engaging our professional compliance and advisory services, you agree to these Terms of Service.

1. Scope of Services
TaxFiling24 provides business registration, Income Tax Return (ITR) filing, GST compliance, ROC secretarial filings, accounting, audit support, and financial advisory services across India. Specific deliverables, timelines, and professional fees are confirmed in writing prior to service execution.

2. Informational Tools & Disclaimers
Our free online calculators (Income Tax Calculator, GST Calculator) and Knowledge Base articles are provided for general educational and estimation purposes. They do not constitute formal legal or tax opinions until reviewed in a formal advisory engagement with a qualified professional.

3. Client Responsibilities
Clients are responsible for providing accurate, complete, and timely financial records, OTP verifications, and statutory documents required to complete government portal filings before applicable due dates.

4. Government Portals & Timelines
Filing completion timelines depend on the availability and processing schedules of statutory portals such as the Income Tax Portal, GSTN, MCA, and Trademark Registry.

5. Governing Law & Contact
These terms are governed by the laws of India, with jurisdiction in New Delhi. For any questions regarding these terms, please contact support@taxfiling24.com.`;

export default async function TermsPage() {
  const [title, content] = await Promise.all([
    getSetting("page_terms_title", "Terms of Service"),
    getSetting("page_terms", ""),
  ]);
  const displayContent = content.trim() || DEFAULT_TERMS_OF_SERVICE;
  const isHtmlContent = /<[a-z][\s\S]*>/i.test(displayContent);

  return (
    <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8 max-w-4xl">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Terms of Service", url: absoluteUrl("/terms") },
          ]),
        ]}
      />
      <h1 className="text-3xl font-bold text-[var(--fg)] mb-8">{title}</h1>
      {isHtmlContent ? (
        <div
          className="tiptap prose prose-lg max-w-none text-[var(--fg-muted)] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(displayContent) }}
        />
      ) : (
        <div className="prose prose-lg max-w-none text-[var(--fg-muted)] leading-relaxed whitespace-pre-wrap">
          {displayContent}
        </div>
      )}
    </div>
  );
}
