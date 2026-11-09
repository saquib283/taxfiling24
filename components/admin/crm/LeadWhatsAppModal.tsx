"use client";

import { useState } from "react";
import {
  X,
  Send,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  FileText,
  Clock,
  ShieldCheck,
  Check,
  Copy,
} from "lucide-react";
import { InquiryLead } from "./types";
import { formatDisplayPhone, buildWhatsAppWebUrl } from "@/lib/whatsapp-shared";

interface LeadWhatsAppModalProps {
  lead: InquiryLead;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export default function LeadWhatsAppModal({
  lead,
  isOpen,
  onClose,
  onSuccess,
}: LeadWhatsAppModalProps) {
  const displayPhone = formatDisplayPhone(lead.phone || "");
  const waWebFallbackUrl = buildWhatsAppWebUrl(
    lead.phone || "",
    `Hello ${lead.name}, thank you for contacting TaxFiling24 regarding ${lead.service || "our advisory services"}.`
  );

  const TEMPLATES = [
    {
      id: "intake",
      label: "Consultation Intake",
      text: `Hello ${lead.name}! 👋\n\nThank you for reaching out to TaxFiling24 regarding *${lead.service || "Corporate Advisory Services"}*.\n\nOur senior Chartered Accountant has received your requirement and is reviewing the statutory details. Could you let us know a convenient time for a brief 5-minute discovery call today?\n\nWarm regards,\n*TaxFiling24 Advisory Team*`,
    },
    {
      id: "docs",
      label: "Documents Checklist",
      text: `Dear ${lead.name},\n\nTo initiate statutory filings for *${lead.service || "your engagement"}*, please furnish the following records at your earliest convenience:\n\n1. Self-attested PAN & Aadhaar Card\n2. Passport-size photograph\n3. Proof of registered address (Electricity bill / NOC)\n4. Bank statement for the last 3 months\n\nYou can reply directly to this chat with photos or PDF documents.\n\nBest regards,\n*TaxFiling24 Compliance Desk*`,
    },
    {
      id: "proposal",
      label: "Proposal Discussion",
      text: `Hi ${lead.name},\n\nWe have prepared the detailed scope of work and professional fee structure for *${lead.service || "your requirement"}*.\n\nWe would be pleased to walk you through the deliverables, statutory government pure-agent splits, and timeline. Please let us know if we can connect on a quick call.\n\nRegards,\n*TaxFiling24 Client Advisory*`,
    },
    {
      id: "followup",
      label: "Status Follow-up",
      text: `Dear ${lead.name},\n\nHope you are having a productive week! Just following up regarding your inquiry for *${lead.service || "statutory compliance"}*.\n\nPlease let us know if you have any questions or require any adjustments to move forward.\n\nWarm regards,\n*TaxFiling24*`,
    },
  ];

  const [message, setMessage] = useState(TEMPLATES[0].text);
  const [selectedTemplate, setSelectedTemplate] = useState("intake");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSelectTemplate = (tpl: (typeof TEMPLATES)[0]) => {
    setSelectedTemplate(tpl.id);
    setMessage(tpl.text);
    setError(null);
  };

  const handleSendWhatsApp = async () => {
    if (!message.trim()) {
      setError("Please enter a message before sending.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/inquiries/${lead.id}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch WhatsApp message.");
      }

      onSuccess("WhatsApp message successfully dispatched via Meta Cloud API!");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to send WhatsApp message.");
    } finally {
      setSending(false);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const insertEmoji = (emoji: string) => {
    setMessage((prev) => prev + emoji);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">WhatsApp Messenger</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Meta Cloud API
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Client: <span className="font-semibold text-white">{lead.name}</span> &bull; {displayPhone}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Quick Template Chips */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              CA Advisory Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                    selectedTemplate === tpl.id
                      ? "bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-bold text-slate-700">Message Content</label>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <span>{message.length} characters</span>
                <span>&bull;</span>
                <span className="text-emerald-700 font-mono">*bold* _italic_</span>
              </div>
            </div>

            <textarea
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full p-3.5 text-xs rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium text-slate-900 leading-relaxed"
            />

            {/* Quick Emoji Bar */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1">
                {["👋", "📄", "💼", "⚖️", "📅", "🔔", "✅", "🙏"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-sm transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied" : "Copy text"}</span>
              </button>
            </div>
          </div>

          {/* Live WhatsApp Bubble Preview */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              WhatsApp Chat Bubble Preview
            </label>
            <div className="p-4 rounded-2xl bg-[#EFEAE2] border border-slate-300/80">
              <div className="max-w-md ml-auto bg-[#D9FDD3] rounded-2xl rounded-tr-xs p-3.5 shadow-xs border border-emerald-100/60 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {message || "Enter message above to preview..."}
                <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-slate-400">
                  <span>{new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="text-emerald-600 font-bold">✓✓</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Banner with 1-Click WhatsApp Web Fallback */}
          {error && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-2 text-amber-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Cloud API Notice:</p>
                  <p className="text-[11px] text-amber-800 mt-0.5">{error}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                <span className="text-[11px] text-amber-800">Need to reach the client right now?</span>
                <a
                  href={buildWhatsAppWebUrl(lead.phone || "", message)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 hover:bg-emerald-700 transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open in WhatsApp Web</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <a
            href={buildWhatsAppWebUrl(lead.phone || "", message)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
            <span>Open in WhatsApp Web / App</span>
          </a>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={sending || !lead.phone}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm shadow-emerald-600/30 disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp API</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

