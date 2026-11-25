import type { Metadata } from "next";
import ConsultationBookingClient from "@/components/sections/ConsultationBookingClient";
import JsonLd, { breadcrumbSchema, faqSchema, webPageSchema } from "@/components/seo/JsonLd";
import { absoluteUrl, buildPageMetadataFromSettings } from "@/lib/seo";
import { getSettings } from "@/lib/settings";
import { CalendarClock, HelpCircle } from "lucide-react";

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
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-20">
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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Hero Header */}
        <div className="mx-auto max-w-3xl text-center mb-12 sm:mb-16">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700 shadow-sm">
            <CalendarClock className="h-4 w-4" />
            Advisory Desk
          </span>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Book a Professional{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Consultation
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Connect directly with verified Chartered Accountants and legal specialists for your Income Tax, GST, startup incorporation, and ROC compliance needs.
          </p>
        </div>

        {/* Core Interactive Booking Client */}
        <div className="mx-auto max-w-6xl">
          <ConsultationBookingClient />
        </div>

        {/* FAQ Section */}
        <div className="mx-auto max-w-4xl mt-20 pt-16 border-t border-slate-200">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              <HelpCircle className="h-4 w-4" />
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Appointment Guidelines & FAQs
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {FAQS.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm hover:border-slate-300 transition"
              >
                <h3 className="text-sm font-bold text-slate-900 mb-2">{faq.question}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

