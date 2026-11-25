"use client";

import { useEffect, useState } from "react";
import { X, Phone, MessageSquare, FileText, AlertCircle, Loader2, Check } from "lucide-react";
import { InquiryLead } from "./types";

interface LogInteractionModalProps {
  lead: InquiryLead;
  isOpen: boolean;
  defaultType?: "CALL" | "WHATSAPP" | "NOTE";
  onClose: () => void;
  onActivityLogged: (activity: any) => void;
}

const CALL_OUTCOMES = [
  "Connected & Discussed",
  "Left Voicemail / Message",
  "Number Busy / Not Reachable",
  "No Answer",
  "Requested Callback Later",
  "Wrong / Invalid Number",
];

export default function LogInteractionModal({
  lead,
  isOpen,
  defaultType = "CALL",
  onClose,
  onActivityLogged,
}: LogInteractionModalProps) {
  const [type, setType] = useState<"CALL" | "WHATSAPP" | "NOTE">(defaultType);
  const [callOutcome, setCallOutcome] = useState(CALL_OUTCOMES[0]);
  const [durationMins, setDurationMins] = useState(5);
  const [title, setTitle] = useState(
    defaultType === "CALL"
      ? `Phone Call with ${lead.name}`
      : defaultType === "WHATSAPP"
      ? `WhatsApp Chat with ${lead.name}`
      : `Internal Note on ${lead.name}`
  );
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setType(defaultType);
    setTitle(
      defaultType === "CALL"
        ? `Phone Call with ${lead.name}`
        : defaultType === "WHATSAPP"
        ? `WhatsApp Chat with ${lead.name}`
        : `Internal Note on ${lead.name}`
    );
    setDescription("");
    setError(null);
  }, [isOpen, defaultType, lead.name]);

  if (!isOpen) return null;

  const handleTypeChange = (newType: "CALL" | "WHATSAPP" | "NOTE") => {
    setType(newType);
    if (newType === "CALL") setTitle(`Phone Call with ${lead.name}`);
    else if (newType === "WHATSAPP") setTitle(`WhatsApp Chat with ${lead.name}`);
    else setTitle(`Internal Note on ${lead.name}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError("Please write summary notes for this log.");
      return;
    }

    try {
      setSubmitting(true);
      const metadata: any = {};
      if (type === "CALL") {
        metadata.outcome = callOutcome;
        metadata.durationMins = durationMins;
        metadata.phone = lead.phone;
      } else if (type === "WHATSAPP") {
        metadata.phone = lead.phone;
      }

      const res = await fetch(`/api/admin/inquiries/${lead.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: type === "CALL" ? `Call: ${callOutcome}` : title.trim(),
          description: description.trim(),
          metadata,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to log interaction");
      }

      const created = await res.json();
      onActivityLogged(created);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to log interaction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center border border-blue-400/30">
              {type === "CALL" ? <Phone className="w-5 h-5" /> : type === "WHATSAPP" ? <MessageSquare className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Record Client Interaction</h3>
              <p className="text-xs text-slate-400">Save calls, WhatsApp chats, or staff discussion notes to the lead's activity logs</p>
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

          {/* Type Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange("CALL")}
              className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition ${
                type === "CALL"
                  ? "bg-blue-50 border-blue-600 text-blue-800 ring-2 ring-blue-500/20"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Phone className="w-4 h-4" /> Phone Call
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("WHATSAPP")}
              className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition ${
                type === "WHATSAPP"
                  ? "bg-emerald-50 border-emerald-600 text-emerald-800 ring-2 ring-emerald-500/20"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("NOTE")}
              className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-2 transition ${
                type === "NOTE"
                  ? "bg-slate-100 border-slate-700 text-slate-900 ring-2 ring-slate-500/20"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <FileText className="w-4 h-4" /> Staff Note
            </button>
          </div>

          {type === "CALL" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Call Outcome
                </label>
                <select
                  value={callOutcome}
                  onChange={(e) => setCallOutcome(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium bg-white"
                >
                  {CALL_OUTCOMES.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={durationMins}
                  onChange={(e) => setDurationMins(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Discussion Summary & Client Feedback *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was discussed? Client concerns, budget expectations, next steps..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
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
              className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save Interaction to Logs
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

