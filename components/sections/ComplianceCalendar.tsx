"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight, Info, Bell } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fadeUp } from "@/lib/animations";

interface Deadline {
  id: string;
  title: string;
  category: string;
  date: Date | string;
  desc: string;
}

interface CalendarDeadline extends Deadline {
  day: number;
  monthShort: string;
}

interface GroupedDeadlineMonth {
  month: string;
  deadlines: CalendarDeadline[];
}

interface ComplianceCalendarProps {
  deadlines: Deadline[];
  settings?: Record<string, string>;
  content?: {
    badge?: string;
    title?: string;
    subtext?: string;
    alertTitle?: string;
    alertDescription?: string;
    alertButtonText?: string;
  };
}

export default function ComplianceCalendar({ deadlines = [], settings = {}, content }: ComplianceCalendarProps) {
  // Group deadlines by month
  const groupedData = useMemo<GroupedDeadlineMonth[]>(() => {
    if (!deadlines || deadlines.length === 0) return [];

    const months: Record<string, CalendarDeadline[]> = {};
    
    deadlines.forEach(d => {
      const date = new Date(d.date);
      const monthKey = date.toLocaleString("en-US", { month: "long", year: "numeric" });
      
      if (!months[monthKey]) {
        months[monthKey] = [];
      }
      
      months[monthKey].push({
        ...d,
        day: date.getDate(),
        monthShort: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
      });
    });

    // Sort deadlines within each month by day
    return Object.entries(months).map(([month, items]) => ({
      month,
      deadlines: items.sort((a, b) => a.day - b.day)
    })).sort((a, b) => {
      // Sort months chronologically
      return new Date(a.month).getTime() - new Date(b.month).getTime();
    });
  }, [deadlines]);

  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [selectedDeadline, setSelectedDeadline] = useState<Pick<Deadline, "title" | "category" | "desc"> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (groupedData.length === 0) {
    return null; // Or show a placeholder
  }

  const nextMonth = () => {
    setCurrentMonthIndex((prev) => (prev + 1) % groupedData.length);
  };

  const prevMonth = () => {
    setCurrentMonthIndex((prev) => (prev - 1 + groupedData.length) % groupedData.length);
  };

  const currentData = groupedData[currentMonthIndex];

  const sectionBadge = content?.badge || "Stay Compliant";
  const sectionTitle = content?.title || settings.calendar_title || "Tax Compliance Calendar 2026";
  const sectionSubtext =
    content?.subtext ||
    settings.calendar_subtext ||
    "Never miss an important filing deadline. Use our interactive calendar to track GST, Income Tax, and other corporate compliance dates.";
  const alertTitle = content?.alertTitle || "Never Miss a Deadline Again!";
  const alertDescription =
    content?.alertDescription || "Get automated WhatsApp and email reminders for all your tax compliances.";
  const alertButtonText = content?.alertButtonText || "Sign Up for Alerts";

  return (
    <section id="calendar" className="bg-[var(--bg-muted)]/50 py-16 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mb-12 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-1.5 text-xs font-bold tracking-wider text-[var(--primary)] uppercase">
            <Calendar className="h-3.5 w-3.5" />
            {sectionBadge}
          </span>
          <h2 className="mb-4 text-3xl font-bold text-[var(--fg)] sm:text-4xl">
            {sectionTitle}
          </h2>
          <p className="mx-auto max-w-2xl text-[var(--fg-muted)]">
            {sectionSubtext}
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
                      <span className="text-2xl font-bold leading-none">{deadline.day}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">{deadline.monthShort}</span>
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
                      <button 
                        onClick={() => { setSelectedDeadline(deadline); setIsModalOpen(true); setIsSubmitted(false); }}
                        className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--fg-muted)] transition-colors hover:border-[var(--accent-light)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)]"
                      >
                        <Bell className="h-3.5 w-3.5" />
                        Remind Me
                      </button>
                      <button 
                        onClick={() => { setSelectedDeadline(deadline); setIsInfoModalOpen(true); }}
                        className="rounded-full p-2 text-[var(--fg-soft)] hover:bg-[var(--bg-muted)] hover:text-[var(--primary)]"
                      >
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

          <div className="mt-12 rounded-2xl p-8 text-white shadow-[var(--shadow-lg)]" style={{ backgroundImage: "var(--gradient-primary)" }}>
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                <Bell className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h3 className="mb-1 text-xl font-bold italic">{alertTitle}</h3>
                <p className="text-white/80">{alertDescription}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-xl bg-white px-6 py-3 font-bold text-[var(--primary)] shadow-sm"
                onClick={() => {
                  setSelectedDeadline({
                    title: "All Tax Compliances",
                    category: "General Alerts",
                    desc: "Get automated WhatsApp and email reminders for all your tax compliances.",
                  });
                  setIsModalOpen(true);
                  setIsSubmitted(false);
                }}
              >
                {alertButtonText}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Remind Me Modal */}
        <AnimatePresence>
          {isModalOpen && selectedDeadline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 shadow-[var(--shadow-xl)] relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--primary)]">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-[var(--fg)]">Set Reminder</h4>
                    <p className="text-xs text-[var(--fg-soft)]">{selectedDeadline.title}</p>
                  </div>
                </div>

                {!isSubmitted ? (
                  <form onSubmit={(e) => { e.preventDefault(); setIsSubmitted(true); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-[var(--fg)] mb-1">Name</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[var(--fg)] mb-1">Email</label>
                      <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" placeholder="john@example.com" />
                    </div>
                    <button type="submit" className="w-full rounded-xl bg-[var(--primary)] py-2.5 font-bold text-white shadow-sm hover:brightness-110">Get Alerted</button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="w-full text-sm text-[var(--fg-soft)] hover:underline">Cancel</button>
                  </form>
                ) : (
                  <div className="text-center py-6">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                      <Bell className="h-6 w-6" />
                    </div>
                    <h5 className="text-lg font-bold text-[var(--fg)]">Reminder Set!</h5>
                    <p className="text-sm text-[var(--fg-soft)] mt-1">We will alert <strong>{formData.name}</strong> at <code>{formData.email}</code> before the due date!</p>
                    <button onClick={() => setIsModalOpen(false)} className="mt-4 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white">Close</button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* Info Modal */}
          {isInfoModalOpen && selectedDeadline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setIsInfoModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 shadow-[var(--shadow-xl)] relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-muted)] text-[var(--primary)]">
                    <Info className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-bold text-[var(--fg)]">Deadline Details</h4>
                </div>
                <div className="space-y-3">
                  <p className="font-bold text-[var(--primary)] text-sm">{selectedDeadline.category}</p>
                  <h5 className="font-bold text-xl text-[var(--fg)]">{selectedDeadline.title}</h5>
                  <p className="text-[var(--fg-muted)] leading-relaxed">{selectedDeadline.desc}</p>
                </div>
                <button onClick={() => setIsInfoModalOpen(false)} className="mt-6 w-full rounded-xl bg-[var(--bg-muted)] py-2 text-sm font-bold text-[var(--fg)] hover:bg-[var(--border)]">Close</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
