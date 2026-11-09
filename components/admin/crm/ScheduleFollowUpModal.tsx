"use client";

import { useState } from "react";
import { X, Calendar, Clock, AlertCircle, Loader2, Phone, MessageSquare, Mail, Users, CheckSquare } from "lucide-react";
import { FollowUpType, InquiryLead } from "./types";

interface ScheduleFollowUpModalProps {
  lead: InquiryLead;
  isOpen: boolean;
  onClose: () => void;
  onFollowUpScheduled: (followUp: any) => void;
}

const TYPE_ICONS: Record<FollowUpType, any> = {
  CALL: Phone,
  WHATSAPP: MessageSquare,
  EMAIL: Mail,
  MEETING: Users,
  TASK: CheckSquare,
};

export default function ScheduleFollowUpModal({
  lead,
  isOpen,
  onClose,
  onFollowUpScheduled,
}: ScheduleFollowUpModalProps) {
  // Default to tomorrow 11:00 AM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);

  const localDatetime = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  const [scheduledAt, setScheduledAt] = useState(localDatetime);
  const [type, setType] = useState<FollowUpType>("CALL");
  const [title, setTitle] = useState(`Follow up with ${lead.name} regarding ${lead.service || "proposal"}`);
  const [notes, setNotes] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!scheduledAt) {
      setError("Please pick a scheduled date and time.");
      return;
    }
    if (!title.trim()) {
      setError("Please specify a reminder title.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/admin/inquiries/${lead.id}/follow-ups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledAt: new Date(scheduledAt).toISOString(),
          type,
          title: title.trim(),
          notes: notes.trim() || undefined,
          assignedTo: assignedTo.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to schedule follow-up");
      }

      const created = await res.json();
      onFollowUpScheduled(created);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to schedule follow up.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Schedule Follow-Up Task</h3>
              <p className="text-xs text-slate-400">Keep negotiations moving with reminders</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Follow-up Type Chips */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Follow-Up Channel
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(["CALL", "WHATSAPP", "EMAIL", "MEETING", "TASK"] as FollowUpType[]).map((t) => {
                const Icon = TYPE_ICONS[t];
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`py-2 px-1 text-center rounded-xl border text-[11px] font-bold flex flex-col items-center gap-1 transition ${
                      active
                        ? "bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Date & Scheduled Time *
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Task Reminder Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Call client to discuss fee structure"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Action Notes / Talking Points
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Mention what to discuss, documents needed, discount limit..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm shadow-amber-600/30"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
              Set Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

