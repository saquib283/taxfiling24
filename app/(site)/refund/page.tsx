import { getSetting, getSettings } from "@/lib/settings";
import type { Metadata } from "next";
import { absoluteUrl, buildPageMetadataFromSettings } from "@/lib/seo";
import JsonLd, { breadcrumbSchema } from "@/components/seo/JsonLd";
import PageHero from "@/components/layout/PageHero";
import { sanitizeHtml } from "@/lib/sanitize-html";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildPageMetadataFromSettings(settings, "refund", {
    description: "Read TaxFiling24's refund and cancellation policy for all professional services.",
    path: "/refund",
    title: "Refund & Cancellation Policy",
  });
}

const DEFAULT_REFUND_POLICY = `Effective Date: January 1, 2026

At TaxFiling24 (https://taxfiling24.com), we strive to deliver transparent, accurate, and timely statutory and advisory services. This policy outlines our guidelines for cancellations and refunds.

1. Consultation Rescheduling & Cancellation
Booked CA consultation sessions may be rescheduled at no additional charge when requested at least 2 hours prior to the scheduled time slot.

2. Eligibility for Service Refunds
- Before Work Commences: If you cancel a service engagement before document review, drafting, or government portal submission has started, you may request a full refund of professional fees (excluding any payment gateway charges).
- After Work Commences: Once advisory work, computation, drafting, or statutory form preparation has started, refunds are evaluated pro-rata based on work completed.
- Non-Refundable Government Fees: Statutory fees, stamp duties, DSC costs, and third-party government challans already paid to MCA, GSTN, Income Tax, or IP India are non-refundable.

3. Refund Processing Timeline
Approved refunds are processed to the original payment method within 7–10 business days of confirmation.

4. How to Request a Refund or Cancellation
Please email support@taxfiling24.com with your booking reference or invoice number and reason for request.`;

export default async function RefundPage() {
  const [title, content] = await Promise.all([
    getSetting("page_refund_title", "Refund & Cancellation Policy"),
    getSetting("page_refund", ""),
  ]);
  const displayContent = content.trim() || DEFAULT_REFUND_POLICY;
  const isHtmlContent = /<[a-z][\s\S]*>/i.test(displayContent);

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-20">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Refund & Cancellation Policy", url: absoluteUrl("/refund") },
          ]),
        ]}
      />
      <PageHero
        compact
        title={title}
        description="Transparent cancellation, rescheduling, and refund terms for TaxFiling24 advisory and statutory filings."
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
