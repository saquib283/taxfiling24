"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Send,
  Download,
  Check,
  Building,
  MapPin,
  Sparkles,
  Copy,
  User,
  Trash2,
  Plus,
  Loader2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  X,
} from "lucide-react";
import {
  InquiryLead,
  LeadStage,
  LeadPriority,
  STAGE_META,
  PRIORITY_META,
  LeadProposalRecord,
  LeadFollowUpRecord,
  LeadActivityRecord,
} from "./types";
import ScheduleFollowUpModal from "./ScheduleFollowUpModal";
import LogInteractionModal from "./LogInteractionModal";
import LeadWhatsAppModal from "./LeadWhatsAppModal";

interface LeadDetailPageClientProps {
  initialLead: InquiryLead;
}

const STAGES: LeadStage[] = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP_SCHEDULED",
  "CONSULTATION_BOOKED",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
];

function getAvatarColor(name: string) {
  const colors = [
    "bg-indigo-100 text-indigo-700 ring-indigo-200/60",
    "bg-emerald-100 text-emerald-800 ring-emerald-200/60",
    "bg-sky-100 text-sky-800 ring-sky-200/60",
    "bg-amber-100 text-amber-800 ring-amber-200/60",
    "bg-violet-100 text-violet-800 ring-violet-200/60",
    "bg-rose-100 text-rose-800 ring-rose-200/60",
  ];
  const charCode = name?.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
}

function getInitials(name: string) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function LeadDetailPageClient({
  initialLead,
}: LeadDetailPageClientProps) {
  const router = useRouter();
  const [lead, setLead] = useState<InquiryLead>(initialLead);
  const [activeTab, setActiveTab] = useState<"PROPOSALS" | "FOLLOW_UPS" | "TIMELINE" | "REQUIREMENT">("PROPOSALS");
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modals
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [logModalType, setLogModalType] = useState<"CALL" | "WHATSAPP" | "NOTE">("CALL");

  // Inline Deal Value Editing
  const [editingValue, setEditingValue] = useState(false);
  const [valInput, setValInput] = useState<number | "">(lead.estimatedValue || "");

  // Fast In-Page Note
  const [quickNote, setQuickNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Email Reply Modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [replySubject, setReplySubject] = useState(`Re: Your inquiry regarding ${lead.service || "TaxFiling24 Services"}`);
  const [replyMessage, setReplyMessage] = useState(
    `Hello ${lead.name},\n\nThank you for reaching out to TaxFiling24. We have reviewed your inquiry regarding ${lead.service || "our professional services"}.\n\n`
  );
  const [markAsResolved, setMarkAsResolved] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Delete Confirm
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Operation Loading States
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const refreshLead = async () => {
    try {
      const res = await fetch(`/api/admin/inquiries/${lead.id}`);
      if (res.ok) {
        const updated = await res.json();
        setLead(updated);
        setValInput(updated.estimatedValue || "");
      }
    } catch (e) {
      console.error("Failed to refresh lead:", e);
    }
  };

  const handleStageChange = async (newStage: string) => {
    if (lead.status === newStage) return;
    setActionInProgress("stage");
    try {
      const res = await fetch(`/api/admin/inquiries/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStage }),
      });
      if (!res.ok) throw new Error("Failed to update lead stage");
      const updated = await res.json();
      setLead(updated);
      setFeedback({ text: `Lead moved to ${STAGE_META[newStage]?.label || newStage}.`, type: "success" });
    } catch (err: any) {
      setFeedback({ text: err.message || "Failed to update stage", type: "error" });
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePriorityChange = async (newPriority: LeadPriority) => {
    if (lead.priority === newPriority) return;
    try {
      const res = await fetch(`/api/admin/inquiries/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (!res.ok) throw new Error("Failed to update priority");
      const updated = await res.json();
      setLead(updated);
      setFeedback({ text: `Priority set to ${newPriority}.`, type: "success" });
    } catch (err: any) {
      setFeedback({ text: err.message, type: "error" });
    }
  };

  const handleSaveValue = async () => {
    const num = valInput === "" ? null : Number(valInput);
    try {
      const res = await fetch(`/api/admin/inquiries/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimatedValue: num }),
      });
      if (!res.ok) throw new Error("Failed to update deal value");
      const updated = await res.json();
      setLead(updated);
      setEditingValue(false);
      setFeedback({ text: "Deal valuation updated.", type: "success" });
    } catch (err: any) {
      setFeedback({ text: err.message, type: "error" });
    }
  };

  const handleSaveQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNote.trim()) return;

    try {
      setSavingNote(true);
      const res = await fetch(`/api/admin/inquiries/${lead.id}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "NOTE",
          title: "Internal Staff Note",
          description: quickNote.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to save note");
      setQuickNote("");
      setFeedback({ text: "Note recorded in activity timeline.", type: "success" });
      refreshLead();
    } catch (err: any) {
      setFeedback({ text: err.message || "Failed to save note", type: "error" });
    } finally {
      setSavingNote(false);
    }
  };

  const handleCompleteFollowUp = async (followUpId: string) => {
    const outcome = window.prompt("Enter task outcome or discussion summary (optional):", "Completed as planned");
    if (outcome === null) return;

    try {
      const res = await fetch(`/api/admin/inquiries/${lead.id}/follow-ups/${followUpId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "COMPLETED",
          outcome: outcome || "Completed",
        }),
      });
      if (!res.ok) throw new Error("Failed to complete task");
      setFeedback({ text: "Follow-up marked as completed.", type: "success" });
      refreshLead();
    } catch (err: any) {
      setFeedback({ text: err.message, type: "error" });
    }
  };

  const handleSendProposalEmail = async (proposalId: string) => {
    setActionInProgress(`send-proposal-${proposalId}`);
    try {
      const res = await fetch(`/api/admin/inquiries/${lead.id}/proposals/${proposalId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "EMAIL" }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to dispatch proposal");
      }
      setFeedback({ text: "Formal fee quotation sent directly to client email.", type: "success" });
      refreshLead();
    } catch (err: any) {
      setFeedback({ text: err.message, type: "error" });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleSendProposalWhatsApp = async (proposalId: string) => {
    if (!lead.phone) {
      setFeedback({ text: "This lead does not have a registered phone number.", type: "error" });
      return;
    }
    setActionInProgress(`send-proposal-wa-${proposalId}`);
    try {
      const res = await fetch(`/api/admin/inquiries/${lead.id}/proposals/${proposalId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "WHATSAPP" }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to dispatch proposal via WhatsApp");
      }
      setFeedback({ text: "Fee quotation dispatched to client via WhatsApp Cloud API!", type: "success" });
      refreshLead();
    } catch (err: any) {
      setFeedback({ text: err.message, type: "error" });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleMarkProposalAccepted = async (proposalId: string) => {
    if (!window.confirm("Confirm acceptance of this quotation? This will automatically advance the lead to WON and sync the accepted deal revenue.")) return;
    setActionInProgress(`accept-proposal-${proposalId}`);
    try {
      const res = await fetch(`/api/admin/inquiries/${lead.id}/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      });
      if (!res.ok) throw new Error("Failed to accept proposal");
      setFeedback({ text: "Proposal marked ACCEPTED! Lead converted to WON with updated revenue.", type: "success" });
      refreshLead();
    } catch (err: any) {
      setFeedback({ text: err.message, type: "error" });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleAIDraft = async () => {
    setAiDrafting(true);
    setAiError(null);

    try {
      const res = await fetch("/api/admin/ai/generate", {
        body: JSON.stringify({
          category: lead.service || "General Tax Consulting",
          title: `Inquiry from ${lead.name}`,
          topic: lead.message,
          type: "reply",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate AI response");
      }

      const data = await res.json();
      if (data.content) {
        setReplyMessage(data.content);
      }
    } catch (err: any) {
      setAiError(err.message || "Failed to generate draft.");
    } finally {
      setAiDrafting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!replyMessage.trim()) return;
    setSendingEmail(true);
    setAiError(null);

    try {
      const res = await fetch(`/api/admin/inquiries/${lead.id}/reply`, {
        body: JSON.stringify({
          markAsResolved,
          message: replyMessage,
          subject: replySubject,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send email");
      }

      setFeedback({
        text: `Email response sent successfully to ${lead.email}.`,
        type: "success",
      });
      setShowEmailModal(false);
      refreshLead();
    } catch (err: any) {
      setAiError(err.message || "Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDeleteLead = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${lead.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete lead");
      router.push("/admin/inquiries");
    } catch (err: any) {
      setFeedback({ text: err.message || "Failed to delete lead", type: "error" });
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const cleanPhone = lead.phone?.replace(/[^0-9]/g, "") || "";
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}?text=${encodeURIComponent(
        `Hello ${lead.name}, this is TaxFiling24 Advisory regarding your inquiry for ${lead.service || "corporate services"}.`
      )}`
    : null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Breadcrumb Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/inquiries"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
          <span>Back to All Leads & CRM Pipeline</span>
        </Link>

        <span className="text-[11px] font-mono text-slate-400">
          ID: {lead.id}
        </span>
      </div>

      {/* 2. Executive Lead Cockpit Header */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Client Identity Block */}
          <div className="flex items-start gap-4">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ring-1 shadow-inner ${getAvatarColor(
                lead.name
              )}`}
            >
              {getInitials(lead.name)}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  {lead.name}
                </h1>

                {/* Priority Selector Pill */}
                <select
                  value={lead.priority}
                  onChange={(e) => handlePriorityChange(e.target.value as LeadPriority)}
                  className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ring-1 border-0 focus:outline-none focus:ring-2 cursor-pointer ${
                    PRIORITY_META[lead.priority]?.badge || ""
                  }`}
                >
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>

                {/* Source Pill */}
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                  {lead.source}
                </span>
              </div>

              {/* Sub-line metadata */}
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 flex-wrap">
                {lead.company && (
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> {lead.company}
                  </span>
                )}
                {lead.city && (
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {lead.city}
                  </span>
                )}
                {lead.service && (
                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {lead.service}
                  </span>
                )}
                <span>&bull; Inquired {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            </div>
          </div>

          {/* Pipeline Stage & Valuation Widget */}
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 shrink-0 self-start">
            {/* Stage Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Pipeline Stage
              </label>
              <select
                value={lead.status}
                onChange={(e) => handleStageChange(e.target.value)}
                disabled={actionInProgress === "stage"}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer ${
                  STAGE_META[lead.status]?.badge || "bg-white text-slate-800 border-slate-300"
                }`}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_META[s]?.label || s}
                  </option>
                ))}
                {lead.status === "PENDING" && <option value="PENDING">Pending (Legacy)</option>}
                {lead.status === "RESOLVED" && <option value="RESOLVED">Resolved (Legacy)</option>}
              </select>
            </div>

            {/* Deal Valuation */}
            <div className="pl-4 border-l border-slate-200">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Estimated Deal Value
              </label>
              {editingValue ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    value={valInput}
                    onChange={(e) => setValInput(e.target.value ? parseFloat(e.target.value) : "")}
                    className="w-24 px-2 py-1 text-xs bg-white text-slate-900 rounded-lg border border-indigo-500 font-bold"
                    placeholder="0"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveValue}
                    className="p-1 bg-indigo-600 rounded text-white hover:bg-indigo-700"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setEditingValue(false)}
                    className="p-1 bg-slate-200 rounded text-slate-600 hover:bg-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingValue(true)}
                  className="text-base font-black text-slate-900 hover:text-indigo-600 transition flex items-center gap-1"
                >
                  {lead.estimatedValue ? `₹${lead.estimatedValue.toLocaleString("en-IN")}` : "₹ -- (Set Value)"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                onClick={() => {
                  setLogModalType("CALL");
                  setShowLogModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:border-blue-500 hover:text-blue-700 flex items-center gap-1.5 transition shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" /> Call Client
              </a>
            )}

            {lead.phone && (
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-xs font-bold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 transition shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp Chat
              </button>
            )}

            {lead.email && (
              <button
                onClick={() => setShowEmailModal(true)}
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:border-indigo-500 hover:text-indigo-700 flex items-center gap-1.5 transition shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-600" /> Send Email Reply
              </button>
            )}

            <Link
              href={`/admin/inquiries/${lead.id}/proposals/new`}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 transition shadow-sm shadow-indigo-600/30"
            >
              <FileText className="w-3.5 h-3.5" /> + Create Quotation
            </Link>

            <button
              onClick={() => setShowFollowUpModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:border-amber-500 hover:text-amber-700 flex items-center gap-1.5 transition shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" /> + Schedule Reminder
            </button>

            <button
              onClick={() => {
                setLogModalType("NOTE");
                setShowLogModal(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition shadow-2xs"
            >
              + Log Activity
            </button>
          </div>

          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
            title="Delete Lead"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Main Operational Cockpit: 8-Column Work Area & 4-Column Client Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ==================== LEFT 8 COLUMNS: INTERACTIVE TABS ==================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Tab Navigation Strip */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 flex items-center gap-1 shadow-2xs">
            <button
              onClick={() => setActiveTab("PROPOSALS")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === "PROPOSALS"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Formal Quotations</span>
              {lead.proposals && lead.proposals.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "PROPOSALS" ? "bg-white/20 text-white" : "bg-indigo-100 text-indigo-700"}`}>
                  {lead.proposals.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("FOLLOW_UPS")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === "FOLLOW_UPS"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Follow-Up Tasks</span>
              {lead.followUps && lead.followUps.filter((f) => f.status === "PENDING").length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === "FOLLOW_UPS" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>
                  {lead.followUps.filter((f) => f.status === "PENDING").length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("TIMELINE")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === "TIMELINE"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Activity Timeline</span>
              {lead.activities && (
                <span className="text-[10px] opacity-70">({lead.activities.length})</span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("REQUIREMENT")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === "REQUIREMENT"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span>Client Message</span>
            </button>
          </div>

          {/* TAB 1: FORMAL PROPOSALS & QUOTATIONS */}
          {activeTab === "PROPOSALS" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Formal Quotations & Fee Proposals
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Generate itemized quotes with SAC 998231, compute 18% GST, dispatch via email, and download PDFs.
                  </p>
                </div>
                <Link
                  href={`/admin/inquiries/${lead.id}/proposals/new`}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> New Quotation
                </Link>
              </div>

              {lead.proposals && lead.proposals.length > 0 ? (
                <div className="space-y-4">
                  {lead.proposals.map((proposal) => {
                    const isAccepted = proposal.status === "ACCEPTED";
                    const isSent = proposal.status === "SENT";

                    return (
                      <div
                        key={proposal.id}
                        className={`p-5 rounded-2xl border transition ${
                          isAccepted
                            ? "bg-emerald-50/40 border-emerald-300"
                            : isSent
                            ? "bg-indigo-50/30 border-indigo-200"
                            : "bg-slate-50/50 border-slate-200"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-slate-900">
                                {proposal.proposalNumber}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  isAccepted
                                    ? "bg-emerald-100 text-emerald-800"
                                    : isSent
                                    ? "bg-indigo-100 text-indigo-800"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {proposal.status}
                              </span>
                            </div>
                            <h4 className="font-bold text-base text-slate-900 mt-1">{proposal.title}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Issued {new Date(proposal.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} &bull; Valid until {new Date(proposal.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xl font-black text-slate-900 block">
                              ₹{proposal.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-xs text-slate-500">
                              Subtotal: ₹{proposal.subtotal.toLocaleString("en-IN")} + 18% GST
                            </span>
                          </div>
                        </div>

                        {/* Itemized Table */}
                        <div className="mt-4 pt-4 border-t border-slate-200/80">
                          <span className="text-xs font-bold text-slate-700 block mb-2">
                            Scope Deliverables ({(proposal.lineItems as any[])?.length || 0}):
                          </span>
                          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                            {(proposal.lineItems as any[])?.map((item: any, i: number) => (
                              <div key={i} className="p-2.5 flex items-center justify-between text-slate-700">
                                <div>
                                  <span className="font-semibold text-slate-900">{item.description}</span>
                                  {item.sacCode && <span className="text-[10px] text-slate-400 ml-2">SAC: {item.sacCode}</span>}
                                </div>
                                <div className="text-right font-medium">
                                  {item.qty || 1} &times; ₹{(item.rate || 0).toLocaleString("en-IN")} ={" "}
                                  <strong className="text-slate-900">₹{((item.qty || 1) * (item.rate || 0)).toLocaleString("en-IN")}</strong>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Proposal Actions Bar */}
                        <div className="mt-4 pt-4 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2.5">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/inquiries/${lead.id}/proposals/${proposal.id}`}
                              className="px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 text-xs font-bold text-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5 transition"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600" /> Open in Studio
                            </Link>

                            <a
                              href={`/api/admin/inquiries/${lead.id}/proposals/${proposal.id}/pdf`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-white flex items-center gap-1.5 transition"
                            >
                              <Download className="w-3.5 h-3.5 text-indigo-600" /> Download PDF
                            </a>

                            {!isAccepted && (
                              <button
                                onClick={() => handleSendProposalEmail(proposal.id)}
                                disabled={actionInProgress === `send-proposal-${proposal.id}` || !lead.email}
                                className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100 flex items-center gap-1.5 disabled:opacity-50 transition"
                              >
                                {actionInProgress === `send-proposal-${proposal.id}` ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                Send to Client Email
                              </button>
                            )}

                            {!isAccepted && (
                              <button
                                onClick={() => handleSendProposalWhatsApp(proposal.id)}
                                disabled={actionInProgress === `send-proposal-wa-${proposal.id}` || !lead.phone}
                                className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 disabled:opacity-50 transition"
                              >
                                {actionInProgress === `send-proposal-wa-${proposal.id}` ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                )}
                                Send via WhatsApp
                              </button>
                            )}
                          </div>

                          {!isAccepted && (
                            <button
                              onClick={() => handleMarkProposalAccepted(proposal.id)}
                              disabled={actionInProgress === `accept-proposal-${proposal.id}`}
                              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs transition"
                            >
                              <Check className="w-3.5 h-3.5" /> Mark as Accepted & Advance to WON
                            </button>
                          )}

                          {isAccepted && (
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-100/60 px-3 py-1.5 rounded-xl">
                              <CheckCircle className="w-4 h-4" /> Client Formally Accepted Quotation
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-800">No proposals drafted yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Draft a formal professional fee proposal with standard CA presets (Pvt Ltd, LLP, GST Retainer, Audit) and 18% GST.
                  </p>
                  <Link
                    href={`/admin/inquiries/${lead.id}/proposals/new`}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                  >
                    <Plus className="w-3.5 h-3.5" /> Draft First Quotation
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FOLLOW-UP TASKS */}
          {activeTab === "FOLLOW_UPS" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Follow-Up Tasks & Reminders
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Never lose a deal to silence. Set reminders for calls, WhatsApp reviews, and meeting follow-ups.
                  </p>
                </div>
                <button
                  onClick={() => setShowFollowUpModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Schedule Reminder
                </button>
              </div>

              {lead.followUps && lead.followUps.length > 0 ? (
                <div className="space-y-3">
                  {lead.followUps.map((task) => {
                    const isPending = task.status === "PENDING";
                    const isCompleted = task.status === "COMPLETED";
                    const dueDate = new Date(task.scheduledAt);
                    const isOverdue = isPending && dueDate < new Date();

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-2xl border transition ${
                          isCompleted
                            ? "bg-slate-50 border-slate-200 opacity-70"
                            : isOverdue
                            ? "bg-red-50/50 border-red-200"
                            : "bg-white border-slate-200 shadow-2xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5">
                            {isPending ? (
                              <button
                                onClick={() => handleCompleteFollowUp(task.id)}
                                className="w-5 h-5 rounded-md border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center mt-0.5 transition shrink-0"
                                title="Mark completed"
                              >
                                <Check className="w-3 h-3 text-transparent hover:text-emerald-600" />
                              </button>
                            ) : (
                              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                            )}

                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${isCompleted ? "line-through text-slate-500" : "text-slate-900"}`}>
                                  {task.title}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {task.type}
                                </span>
                                {isOverdue && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-800">
                                    Overdue Task
                                  </span>
                                )}
                              </div>

                              {task.notes && (
                                <p className="text-xs text-slate-600 mt-1.5 whitespace-pre-wrap">{task.notes}</p>
                              )}

                              {task.outcome && (
                                <div className="mt-2 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg inline-block">
                                  Outcome: {task.outcome}
                                </div>
                              )}
                            </div>
                          </div>

                          <span className="text-xs font-bold text-slate-500 shrink-0">
                            {dueDate.toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-800">No active follow-ups scheduled</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Keep your sales velocity high by setting a call reminder.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT TIMELINE */}
          {activeTab === "TIMELINE" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Activity & Interaction Audit Trail
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chronological record of phone calls, WhatsApp chats, emails, stage transitions, and team notes.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setLogModalType("NOTE");
                    setShowLogModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Touchpoint
                </button>
              </div>

              {lead.activities && lead.activities.length > 0 ? (
                <div className="relative pl-7 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {lead.activities.map((act) => {
                    let Icon = FileText;
                    let iconColor = "bg-slate-100 text-slate-700";

                    if (act.type === "CALL") {
                      Icon = Phone;
                      iconColor = "bg-blue-100 text-blue-800";
                    } else if (act.type === "WHATSAPP") {
                      Icon = MessageSquare;
                      iconColor = "bg-emerald-100 text-emerald-800";
                    } else if (act.type === "EMAIL") {
                      Icon = Mail;
                      iconColor = "bg-indigo-100 text-indigo-800";
                    } else if (act.type.includes("PROPOSAL")) {
                      Icon = FileText;
                      iconColor = "bg-purple-100 text-purple-800";
                    } else if (act.type.includes("STATUS")) {
                      Icon = TrendingUp;
                      iconColor = "bg-amber-100 text-amber-800";
                    }

                    return (
                      <div key={act.id} className="relative group">
                        <div className={`absolute -left-7 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${iconColor}`}>
                          <Icon className="w-3 h-3" />
                        </div>

                        {(() => {
                          const meta = (act.metadata || {}) as Record<string, any>;
                          const isInboundWa = act.type === "WHATSAPP" && meta.direction === "INBOUND";
                          const isFailed = meta.deliveryStatus === "failed" || meta.error;

                          return (
                            <div
                              className={`p-4 rounded-2xl border transition ${
                                isInboundWa
                                  ? "bg-emerald-50/70 border-emerald-200/90 shadow-2xs"
                                  : isFailed
                                  ? "bg-rose-50/50 border-rose-200"
                                  : "bg-slate-50/80 border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900">{act.title}</span>
                                  {isInboundWa && (
                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                                      From Client
                                    </span>
                                  )}
                                  {act.type === "WHATSAPP" && !isInboundWa && meta.deliveryStatus && (
                                    <span className="text-[10px] font-mono font-bold flex items-center gap-1">
                                      {meta.deliveryStatus === "read" ? (
                                        <span className="text-sky-600">✓✓ Read</span>
                                      ) : meta.deliveryStatus === "delivered" ? (
                                        <span className="text-emerald-600">✓✓ Delivered</span>
                                      ) : meta.deliveryStatus === "sent" ? (
                                        <span className="text-slate-500">✓ Sent</span>
                                      ) : (
                                        <span className="text-rose-600">⚠ Failed</span>
                                      )}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 font-medium">
                                  {new Date(act.createdAt).toLocaleString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              {act.description && (
                                <p className="text-xs text-slate-700 mt-2 whitespace-pre-wrap leading-relaxed font-sans">
                                  {act.description}
                                </p>
                              )}

                              {meta.error && (
                                <div className="mt-2 p-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 font-medium flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{meta.error}</span>
                                </div>
                              )}

                              <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <User className="w-3 h-3 text-slate-400" />
                                  <span>{act.performedBy}</span>
                                </div>
                                {isInboundWa && lead.phone && (
                                  <button
                                    type="button"
                                    onClick={() => setShowWhatsAppModal(true)}
                                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    <span>Reply via WhatsApp</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 text-xs text-slate-400">
                  No logged touchpoints yet. Calls, emails, and quotations will appear here automatically.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ORIGINAL CLIENT REQUIREMENT */}
          {activeTab === "REQUIREMENT" && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
              <h3 className="text-base font-black text-slate-900">
                Original Client Inquiry Message
              </h3>
              <div className="p-5 rounded-2xl bg-slate-50 border-l-4 border-indigo-600 border border-slate-200">
                <p className="text-xs text-slate-800 whitespace-pre-wrap font-mono leading-relaxed">
                  &ldquo;{lead.message}&rdquo;
                </p>
              </div>

              <div className="text-xs text-slate-500 pt-2">
                Received via website form on {new Date(lead.createdAt).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          )}
        </div>

        {/* ==================== RIGHT 4 COLUMNS: CLIENT DOSSIER & SIDEBAR ==================== */}
        <div className="lg:col-span-4 space-y-6 sticky top-6">
          {/* Client Credentials Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Client Credentials
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Email Address</span>
                <div className="flex items-center justify-between mt-1 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-900 truncate">{lead.email || "N/A"}</span>
                  {lead.email && (
                    <button
                      onClick={() => copyToClipboard(lead.email, "email")}
                      className="text-slate-400 hover:text-indigo-600 p-1"
                      title="Copy email"
                    >
                      {copiedField === "email" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Phone / WhatsApp</span>
                <div className="flex items-center justify-between mt-1 p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-semibold text-slate-900">{lead.phone || "N/A"}</span>
                  {lead.phone && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copyToClipboard(lead.phone!, "phone")}
                        className="text-slate-400 hover:text-indigo-600 p-1"
                        title="Copy phone"
                      >
                        {copiedField === "phone" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <a href={`tel:${lead.phone}`} className="text-slate-400 hover:text-blue-600 p-1" title="Call">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Company / Business</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{lead.company || "Not specified"}</span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 block">Assigned Staff</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">{lead.assignedTo || "Unassigned (Admin)"}</span>
              </div>
            </div>
          </div>

          {/* Fast Note / Discussion Logger */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Quick Staff Note
            </h4>
            <form onSubmit={handleSaveQuickNote} className="space-y-2.5">
              <textarea
                rows={3}
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="Log a client phone call summary, document status, or meeting note directly..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-900"
              />
              <button
                type="submit"
                disabled={savingNote || !quickNote.trim()}
                className="w-full py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {savingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Save to Timeline
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Sub-Modals */}
      <ScheduleFollowUpModal
        lead={lead}
        isOpen={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        onFollowUpScheduled={() => {
          setFeedback({ text: "Follow-up task scheduled.", type: "success" });
          refreshLead();
        }}
      />

      <LogInteractionModal
        lead={lead}
        defaultType={logModalType}
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onActivityLogged={() => {
          setFeedback({ text: "Interaction logged successfully.", type: "success" });
          refreshLead();
        }}
      />

      {/* Email Reply Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Send Email to Client</h3>
                  <p className="text-xs text-slate-400">
                    To: <strong className="text-slate-200">{lead.email}</strong> &bull; {lead.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {aiError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Subject *
                </label>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">Message Body *</label>
                  <button
                    type="button"
                    onClick={handleAIDraft}
                    disabled={aiDrafting}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline disabled:opacity-50"
                  >
                    {aiDrafting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Generate AI Draft (Gemini)
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono leading-relaxed text-slate-800"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={markAsResolved}
                  onChange={(e) => setMarkAsResolved(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Automatically mark inquiry as RESOLVED upon dispatch
                </span>
              </label>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  disabled={sendingEmail}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={sendingEmail || !replyMessage.trim()}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5 disabled:opacity-50 shadow-sm shadow-indigo-600/30"
                >
                  {sendingEmail ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Send Email Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      <LeadWhatsAppModal
        lead={lead}
        isOpen={showWhatsAppModal}
        onClose={() => setShowWhatsAppModal(false)}
        onSuccess={(msg) => {
          setFeedback({ text: msg, type: "success" });
          refreshLead();
        }}
      />

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Permanently Delete Lead?</h3>
            <p className="text-xs text-slate-500 mt-1">
              This will remove all associated follow-ups, activity audit logs, and quotation records.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLead}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 flex items-center gap-1.5 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
