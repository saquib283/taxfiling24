import type { Metadata } from "next";
import ConsultationBookingClient from "@/components/sections/ConsultationBookingClient";
import PageHero from "@/components/layout/PageHero";
import JsonLd, { breadcrumbSchema, faqSchema, webPageSchema } from "@/components/seo/JsonLd";
import { absoluteUrl, buildPageMetadataFromSettings } from "@/lib/seo";
import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return buildPageMetadataFromSettings(settings, "book", {
    description:
      "Schedule a one-on-one consultation with certified Chartered Accountants, Company Secretaries, and tax consultants at TaxFiling24.",
    keywords: [
      "book CA consultation",
      "tax advisory appointment",
      "GST consultation India",
      "income tax expert booking",
      "TaxFiling24 booking",
    ],
    path: "/book",
    title: "Book a Consultation",
  });
}

const FAQS = [
  {
    answer:
      "You will receive an automated booking confirmation email with session instructions and a direct video meeting link (Google Meet / Zoom). Our team will join at the scheduled time.",
    question: "What happens after I submit a booking request?",
  },
  {
    answer:
      "Having your previous year's ITR acknowledgement, Form 26AS/AIS, Form 16, or business bank statements on hand helps us give you accurate, tailored advice immediately.",
    question: "What documents should I keep ready for the consultation?",
  },
  {
    answer:
      "Yes. You can contact our support desk or reply to your confirmation email to reschedule your slot up to 2 hours prior to the session.",
    question: "Can I reschedule or cancel my appointment?",
  },
  {
    answer:
      "We provide online video consultations, direct phone advisory sessions, as well as in-person appointments at our corporate office.",
    question: "What format are the consultations conducted in?",
  },
];

export default async function BookPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] pb-20">
      <JsonLd
        data={[
          breadcrumbSchema([
            { name: "Home", url: absoluteUrl("/") },
            { name: "Book Consultation", url: absoluteUrl("/book") },
          ]),
          webPageSchema({
            description: "Schedule a consultation with certified tax advisors and corporate compliance experts.",
            name: "Book a Consultation | TaxFiling24",
            url: absoluteUrl("/book"),
          }),
          faqSchema(FAQS),
        ]}
      />

      <PageHero
        title={
          <>
            Book a Professional <span className="text-[var(--accent)]">Consultation</span>
          </>
        }
        description="Connect directly with verified Chartered Accountants and legal specialists for your Income Tax, GST, startup incorporation, and ROC compliance needs."
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-14">
        {/* Core Interactive Booking Client */}
        <div className="mx-auto max-w-6xl">
          <ConsultationBookingClient />
        </div>

        {/* FAQ Section */}
        <div className="mx-auto max-w-4xl mt-16 pt-14 border-t border-[var(--border)]">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--fg)] sm:text-3xl">
              Appointment Guidelines &amp; FAQs
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FAQS.map((faq, index) => (
              <div
                key={index}
                className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)] hover:border-[var(--primary-border)] transition"
              >
                <h3 className="text-sm font-bold text-[var(--fg)] mb-2">{faq.question}</h3>
                <p className="text-xs text-[var(--fg-muted)] leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
