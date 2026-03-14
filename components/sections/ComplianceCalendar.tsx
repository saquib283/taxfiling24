"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Info, Bell } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fadeUp } from "@/lib/animations";

const COMPLIANCE_DATA = [
  {
    month: "April 2024",
    deadlines: [
      { date: 7, title: "TDS Payment", category: "Income Tax", desc: "Due date for deposit of Tax Deducted/Collected for March 2024." },
      { date: 11, title: "GSTR-1 Monthly", category: "GST", desc: "Monthly return for outward supplies for March 2024." },
      { date: 20, title: "GSTR-3B Monthly", category: "GST", desc: "Monthly summary return and tax payment for March 2024." },
      { date: 30, title: "Challan-cum-Statement (26QB/26QC)", category: "Income Tax", desc: "Filing of challan-cum-statement for March 2024." },
    ]
  },
  {
    month: "May 2024",
    deadlines: [
      { date: 7, title: "TDS Payment", category: "Income Tax", desc: "Due date for deposit of Tax Deducted/Collected for April 2024." },
      { date: 15, title: "PF & ESI Payment", category: "Labor Law", desc: "Monthly deposit of PF & ESI contributions for April 2024." },
      { date: 20, title: "GSTR-3B Monthly", category: "GST", desc: "Monthly summary return and tax payment for April 2024." },
      { date: 31, title: "TDS Return (Q4)", category: "Income Tax", desc: "Quarterly statement of TDS for the quarter ending March 2024." },
    ]
  },
  {
    month: "June 2024",
    deadlines: [
      { date: 7, title: "TDS Payment", category: "Income Tax", desc: "Due date for deposit of Tax Deducted/Collected for May 2024." },
      { date: 15, title: "Advance Tax (1st Installment)", category: "Income Tax", desc: "First installment of advance tax (15%) for FY 2024-25." },
      { date: 20, title: "GSTR-3B Monthly", category: "GST", desc: "Monthly summary return and tax payment for May 2024." },
    ]
  },
  {
    month: "July 2024",
    deadlines: [
      { date: 7, title: "TDS Payment", category: "Income Tax", desc: "Due date for deposit of Tax Deducted/Collected for June 2024." },
      { date: 20, title: "GSTR-3B Monthly", category: "GST", desc: "Monthly summary return and tax payment for June 2024." },
      { date: 31, title: "ITR Filing (Individuals)", category: "Income Tax", desc: "Last date for filing Income Tax Returns for non-audit cases for AY 2024-25." },
    ]
  }
];

export default function ComplianceCalendar() {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);

  const nextMonth = () => {
    setCurrentMonthIndex((prev) => (prev + 1) % COMPLIANCE_DATA.length);
  };

  const prevMonth = () => {
    setCurrentMonthIndex((prev) => (prev - 1 + COMPLIANCE_DATA.length) % COMPLIANCE_DATA.length);
  };

  const currentData = COMPLIANCE_DATA[currentMonthIndex];

  return (
    <section id="calendar" className="bg-[var(--bg-muted)]/50 py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-1.5 text-xs font-bold tracking-wider text-[var(--primary)] uppercase">
            <Calendar className="h-3.5 w-3.5" />
            Stay Compliant
          </span>
          <h2 className="mb-4 text-3xl font-bold text-[var(--fg)] sm:text-4xl">
            Tax Compliance Calendar 2024
          </h2>
          <p className="mx-auto max-w-2xl text-[var(--fg-muted)]">
            Never miss an important filing deadline. Use our interactive calendar to track GST, Income Tax, and other corporate compliance dates.
          </p>
        </AnimatedSection>

        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between rounded-2xl bg-[var(--bg-card)] p-4 shadow-[var(--shadow-md)]">
            <button
              onClick={prevMonth}
              className="group rounded-xl p-2 text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--primary)]"
            >
              <ChevronLeft className="h-6 w-6 transition-transform group-hover:-translate-x-0.5" />
            </button>
            <h3 className="text-xl font-bold text-[var(--fg)]">{currentData.month}</h3>
            <button
              onClick={nextMonth}
              className="group rounded-xl p-2 text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--primary)]"
            >
              <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="grid gap-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentData.month}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid gap-4"
              >
                {currentData.deadlines.map((deadline, idx) => (
                  <motion.div
                    key={`${deadline.title}-${idx}`}
                    variants={fadeUp}
                    whileHover={{ y: -2 }}
                    className="group relative flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm transition-all hover:border-[var(--accent-light)] hover:shadow-[var(--shadow-md)] sm:flex-row sm:items-center"
                  >
                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-[var(--accent-soft)] p-2 text-[var(--primary)]">
                      <span className="text-2xl font-bold leading-none">{deadline.date}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{currentData.month.split(" ")[0].substring(0, 3)}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h4 className="font-bold text-[var(--fg)]">{deadline.title}</h4>
                        <span className="rounded-full bg-[var(--bg-muted)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--fg-muted)] uppercase">
                          {deadline.category}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--fg-muted)] leading-relaxed">
                        {deadline.desc}
                      </p>
                    </div>

                    <div className="mt-2 flex shrink-0 items-center gap-3 sm:mt-0">
                      <button className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--fg-muted)] transition-colors hover:border-[var(--accent-light)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]">
                        <Bell className="h-3.5 w-3.5" />
                        Remind Me
                      </button>
                      <button className="rounded-full p-2 text-[var(--fg-soft)] hover:bg-[var(--bg-muted)] hover:text-[var(--primary)]">
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Visual indicator bar */}
                    <div className="absolute left-0 top-1/2 h-1/2 w-1 -translate-y-1/2 rounded-r-full bg-[var(--primary)] opacity-0 transition-opacity group-hover:opacity-100" />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-12 rounded-2xl bg-[var(--gradient-primary)] p-8 text-white shadow-[var(--shadow-lg)]">
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                <Bell className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-xl font-bold italic">Never Miss a Deadline Again!</h3>
                <p className="text-white/80">Get automated WhatsApp and email reminders for all your tax compliances.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-xl bg-white px-6 py-3 font-bold text-[var(--primary)] shadow-sm"
              >
                Sign Up for Alerts
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
