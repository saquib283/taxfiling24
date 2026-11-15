"use client";

import { useState, useEffect } from "react";
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Send,
  Download,
  Check,
  ChevronRight,
  User,
  Building,
  MapPin,
  ExternalLink,
  Sparkles,
  RotateCcw,
  Copy,
  Tag,
  Loader2,
  Trash2,
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
import ProposalBuilderModal from "./ProposalBuilderModal";
import ScheduleFollowUpModal from "./ScheduleFollowUpModal";
import LogInteractionModal from "./LogInteractionModal";

interface LeadDetailDrawerProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (updatedLead: InquiryLead) => void;
  onOpenEmailModal: (lead: InquiryLead) => void;
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

export default function LeadDetailDrawer({
  leadId,
  isOpen,
  onClose,
  onLeadUpdated,
  onOpenEmailModal,
}: LeadDetailDrawerProps) {
  const [lead, setLead] = useState<InquiryLead | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "PROPOSALS" | "FOLLOW_UPS" | "TIMELINE">("OVERVIEW");
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modals
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logModalType, setLogModalType] = useState<"CALL" | "WHATSAPP" | "NOTE">("CALL");

  // Inline Editing
  const [editingValue, setEditingValue] = useState(false);
  const [valInput, setValInput] = useState<number | "">("");
  const [copied, setCopied] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Fetch full lead data when opened
  useEffect(() => {
    if (!leadId || !isOpen) return;

    let isMounted = true;
    setLoading(true);
    setFeedback(null);

    fetch(`/api/admin/inquiries/${leadId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load lead details");
        return res.json();
      })
      .then((data: InquiryLead) => {
        if (isMounted) {
          setLead(data);
          setValInput(data.estimatedValue || "");
        }
      })
      .catch((err) => {
        if (isMounted) {
          setFeedback({ text: err.message, type: "error" });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [leadId, isOpen]);

  if (!isOpen) return null;

  const refreshLead = async () => {
    if (!leadId) return;
    try {
      const res = await fetch(`/api/admin/inquiries/${leadId}`);
      if (res.ok) {
        const updated = await res.json();
        setLead(updated);
        onLeadUpdated(updated);
      }
    } catch (e) {
      console.error("Failed to refresh lead:", e);
    }
  };

  const handleStageChange = async (newStage: string) => {
    if (!lead || lead.status === newStage) return;
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
      onLeadUpdated(updated);
      setFeedback({ text: `Stage changed to ${STAGE_META[newStage]?.label || newStage}.`, type: "success" });
    } catch (err: any) {
      setFeedback({ text: err.message || "Failed to update stage", type: "error" });
    } finally {
      setActionInProgress(null);
    }
  };

  const handlePriorityChange = async (newPriority: LeadPriority) => {
    if (!lead || lead.priority === newPriority) return;
    try {
      const res = await fetch(`/api/admin/inquiries/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });
      if (!res.ok) throw new Error("Failed to update priority");
      const updated = await res.json();
      setLead(updated);
      onLeadUpdated(updated);
    } catch (err: any) {
      setFeedback({ text: err.message, type: "error" });
    }
  };

  const handleSaveValue = async () => {
    if (!lead) return;
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
      onLeadUpdated(updated);
      setEditingValue(false);
      setFeedback({ text: "Deal valuation updated.", type: "success" });
    } catch (err: any) {
      setFeedback({ text: err.message, type: "error" });
    }
  };

  const handleCompleteFollowUp = async (followUpId: string) => {
    const outcome = window.prompt("Enter task outcome or discussion summary (optional):", "Completed as planned");
    if (outcome === null) return;

    try {
      const res = await fetch(`/api/admin/inquiries/${lead!.id}/follow-ups/${followUpId}`, {
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
      const res = await fetch(`/api/admin/inquiries/${lead!.id}/proposals/${proposalId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "EMAIL" }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to dispatch proposal");
      }
      setFeedback({ text: "Formal quotation sent to client email.", type: "success" });
      refreshLead();
    } catch (err: any) {
      setFeedback({ text: err.message, type: "error" });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleMarkProposalAccepted = async (proposalId: string) => {
    if (!window.confirm("Confirm acceptance of this proposal? This will convert the lead to WON and sync final deal revenue.")) return;
    setActionInProgress(`accept-proposal-${proposalId}`);
    try {
      const res = await fetch(`/api/admin/inquiries/${lead!.id}/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      });
      if (!res.ok) throw new Error("Failed to accept proposal");
      setFeedback({ text: "Proposal marked ACCEPTED! Lead successfully converted to WON.", type: "success" });
      refreshLead();
    } catch (err: any) {
      setFeedback({ text: err.message, type: "error" });
    } finally {
      setActionInProgress(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanPhone = lead?.phone?.replace(/[^0-9]/g, "") || "";
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone}?text=${encodeURIComponent(
        `Hello ${lead?.name}, this is TaxFiling24 Advisory regarding your inquiry for ${lead?.service || "corporate services"}.`
      )}`
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white shrink-0 border-b border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-black text-lg shadow-inner shrink-0">
                {lead?.name?.slice(0, 2).toUpperCase() || "??"}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-black text-white">{lead?.name || "Loading Lead..."}</h2>
                  {lead?.priority && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ring-1 ${PRIORITY_META[lead.priority]?.badge || ""}`}>
                      {lead.priority}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  {lead?.company && <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" />{lead.company}</span>}
                  {lead?.city && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{lead.city}</span>}
                  <span className="text-slate-500">&bull; Source: {lead?.source}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pipeline Stage Bar */}
          {lead && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pipeline Stage:</span>
                <select
                  value={lead.status}
                  onChange={(e) => handleStageChange(e.target.value)}
                  disabled={actionInProgress === "stage"}
                  className="bg-slate-800 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {STAGE_META[s]?.label || s}
                    </option>
                  ))}
                  {/* Legacy options if present */}
                  {lead.status === "PENDING" && <option value="PENDING">Pending (Legacy)</option>}
                  {lead.status === "RESOLVED" && <option value="RESOLVED">Resolved (Legacy)</option>}
                </select>
              </div>

              {/* Deal Valuation Quick Edit */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Deal Value:</span>
                {editingValue ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={valInput}
                      onChange={(e) => setValInput(e.target.value ? parseFloat(e.target.value) : "")}
                      className="w-24 px-2 py-1 text-xs bg-slate-800 text-white rounded border border-indigo-500 font-bold"
                      placeholder="₹"
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
                      className="p-1 bg-slate-700 rounded text-slate-300 hover:bg-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingValue(true)}
                    className="text-xs font-black text-emerald-400 hover:text-emerald-300 hover:underline bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20"
                  >
                    {lead.estimatedValue ? `₹${lead.estimatedValue.toLocaleString("en-IN")}` : "+ Set Value"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Bar */}
        {lead && (
          <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                onClick={() => {
                  setLogModalType("CALL");
                  setShowLogModal(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:border-blue-500 hover:text-blue-700 flex items-center gap-1.5 transition shrink-0 shadow-2xs"
              >
                <Phone className="w-3.5 h-3.5 text-blue-600" /> Call Client
              </a>
            )}

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  setLogModalType("WHATSAPP");
                  setShowLogModal(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 flex items-center gap-1.5 transition shrink-0 shadow-2xs"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
              </a>
            )}

            {lead.email && (
              <button
                onClick={() => onOpenEmailModal(lead)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:border-indigo-500 hover:text-indigo-700 flex items-center gap-1.5 transition shrink-0 shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5 text-indigo-600" /> Email Reply
              </button>
            )}

            <button
              onClick={() => setShowProposalModal(true)}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 transition shrink-0 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" /> + Quotation
            </button>

            <button
              onClick={() => setShowFollowUpModal(true)}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:border-amber-500 hover:text-amber-700 flex items-center gap-1.5 transition shrink-0 shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" /> + Reminder
            </button>

            <button
              onClick={() => {
                setLogModalType("NOTE");
                setShowLogModal(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition shrink-0 shadow-2xs"
              title="Record phone call, WhatsApp chat, or staff note into activity logs"
            >
              + Record Interaction
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 bg-white border-b border-slate-200 flex items-center gap-6 shrink-0">
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "OVERVIEW"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Overview & Scope
          </button>
          <button
            onClick={() => setActiveTab("PROPOSALS")}
            className={`py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "PROPOSALS"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Proposals & Quotations
            {lead?.proposals && lead.proposals.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                {lead.proposals.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("FOLLOW_UPS")}
            className={`py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "FOLLOW_UPS"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Follow-Up Tasks
            {lead?.followUps && lead.followUps.filter((f) => f.status === "PENDING").length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                {lead.followUps.filter((f) => f.status === "PENDING").length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("TIMELINE")}
            className={`py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "TIMELINE"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Activity Logs & History
            {lead?.activities && (
              <span className="text-[10px] text-slate-400">({lead.activities.length})</span>
            )}
          </button>
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-indigo-600 mb-2" />
              <p className="text-xs">Fetching complete lead profile & timeline...</p>
            </div>
          )}

          {!loading && lead && (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "OVERVIEW" && (
                <div className="space-y-6">
                  {/* Contact Info Card */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Contact Credentials
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Email Address</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-slate-900">{lead.email || "Not provided"}</span>
                          {lead.email && (
                            <button
                              onClick={() => copyToClipboard(lead.email)}
                              className="text-slate-400 hover:text-indigo-600"
                              title="Copy email"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Phone / WhatsApp</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-slate-900">{lead.phone || "Not provided"}</span>
                          {lead.phone && (
                            <button
                              onClick={() => copyToClipboard(lead.phone!)}
                              className="text-slate-400 hover:text-indigo-600"
                              title="Copy phone"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Assigned Service</span>
                        <span className="font-semibold text-indigo-700 mt-0.5 block">{lead.service || "General Consulting"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Inquiry Received</span>
                        <span className="font-semibold text-slate-700 mt-0.5 block">
                          {new Date(lead.createdAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Client Inquired Message */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Original Client Inquiry / Requirement
                    </h4>
                    <div className="p-4 rounded-xl bg-slate-50 border-l-4 border-indigo-600 border border-slate-200">
                      <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-mono">
                        &ldquo;{lead.message}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Active Quotations Highlight */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Active Quotations ({lead.proposals?.length || 0})
                      </h4>
                      <button
                        onClick={() => setShowProposalModal(true)}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        + Create New
                      </button>
                    </div>
                    {lead.proposals && lead.proposals.length > 0 ? (
                      <div className="space-y-2">
                        {lead.proposals.slice(0, 2).map((p) => (
                          <div
                            key={p.id}
                            className="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 flex items-center justify-between transition"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">{p.proposalNumber}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                  {p.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-0.5">{p.title}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-black text-indigo-700">
                                ₹{p.totalAmount.toLocaleString("en-IN")}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <a
                                  href={`/api/admin/inquiries/${lead.id}/proposals/${p.id}/pdf`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-bold text-slate-600 hover:text-indigo-600 flex items-center gap-0.5"
                                >
                                  <Download className="w-3 h-3" /> PDF
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                        No proposals generated yet. Click &quot;+ Quotation&quot; to draft one with itemized GST.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: PROPOSALS & QUOTATIONS */}
              {activeTab === "PROPOSALS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Formal Quotations & Fee Proposals
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Draft, generate branded PDFs, dispatch via Email, and record client acceptance.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowProposalModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" /> + New Quotation
                    </button>
                  </div>

                  {lead.proposals && lead.proposals.length > 0 ? (
                    <div className="space-y-3">
                      {lead.proposals.map((proposal) => {
                        const isAccepted = proposal.status === "ACCEPTED";
                        const isSent = proposal.status === "SENT";

                        return (
                          <div
                            key={proposal.id}
                            className={`p-4 rounded-xl border transition ${
                              isAccepted
                                ? "bg-emerald-50/40 border-emerald-300"
                                : isSent
                                ? "bg-indigo-50/40 border-indigo-200"
                                : "bg-white border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-slate-900">
                                    {proposal.proposalNumber}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      isAccepted
                                        ? "bg-emerald-100 text-emerald-800"
                                        : isSent
                                        ? "bg-indigo-100 text-indigo-800"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {proposal.status}
                                  </span>
                                </div>
                                <h5 className="font-bold text-sm text-slate-900 mt-1">{proposal.title}</h5>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Valid until {new Date(proposal.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                              </div>

                              <div className="text-right">
                                <span className="text-base font-black text-slate-900">
                                  ₹{proposal.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                </span>
                                <span className="block text-[10px] text-slate-400">Incl. 18% GST</span>
                              </div>
                            </div>

                            {/* Line Items Summary */}
                            <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs">
                              <span className="text-[11px] font-bold text-slate-500 block mb-1">
                                Scope Items ({(proposal.lineItems as any[])?.length || 0}):
                              </span>
                              <div className="space-y-1">
                                {(proposal.lineItems as any[])?.map((item: any, i: number) => (
                                  <div key={i} className="flex justify-between text-slate-600 text-[11px]">
                                    <span>&bull; {item.description}</span>
                                    <span className="font-medium text-slate-900">
                                      ₹{((item.qty || 1) * (item.rate || 0)).toLocaleString("en-IN")}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <a
                                  href={`/api/admin/inquiries/${lead.id}/proposals/${proposal.id}/pdf`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1"
                                >
                                  <Download className="w-3.5 h-3.5 text-indigo-600" /> Download PDF
                                </a>

                                {!isAccepted && (
                                  <button
                                    onClick={() => handleSendProposalEmail(proposal.id)}
                                    disabled={actionInProgress === `send-proposal-${proposal.id}` || !lead.email}
                                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 hover:bg-indigo-100 flex items-center gap-1 disabled:opacity-50"
                                  >
                                    {actionInProgress === `send-proposal-${proposal.id}` ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Send className="w-3 h-3" />
                                    )}
                                    Send via Email
                                  </button>
                                )}
                              </div>

                              {!isAccepted && (
                                <button
                                  onClick={() => handleMarkProposalAccepted(proposal.id)}
                                  disabled={actionInProgress === `accept-proposal-${proposal.id}`}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-xs"
                                >
                                  <Check className="w-3.5 h-3.5" /> Mark as Accepted (Convert to WON)
                                </button>
                              )}

                              {isAccepted && (
                                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                                  <CheckCircle className="w-4 h-4" /> Client Accepted
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl border border-dashed border-slate-300 text-center">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No proposals created yet</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Create an itemized quote with standard CA presets and 18% GST calculation.
                      </p>
                      <button
                        onClick={() => setShowProposalModal(true)}
                        className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                      >
                        Create First Quotation
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: FOLLOW-UP TASKS */}
              {activeTab === "FOLLOW_UPS" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Scheduled Follow-ups & Reminders
                      </h4>
                      <p className="text-[11px] text-slate-500">Track tasks to prevent leads from slipping through.</p>
                    </div>
                    <button
                      onClick={() => setShowFollowUpModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 flex items-center gap-1.5 shadow-sm"
                    >
                      <Clock className="w-3.5 h-3.5" /> + Schedule Follow-Up
                    </button>
                  </div>

                  {lead.followUps && lead.followUps.length > 0 ? (
                    <div className="space-y-2.5">
                      {lead.followUps.map((task) => {
                        const isPending = task.status === "PENDING";
                        const isCompleted = task.status === "COMPLETED";
                        const dueDate = new Date(task.scheduledAt);
                        const isOverdue = isPending && dueDate < new Date();

                        return (
                          <div
                            key={task.id}
                            className={`p-3.5 rounded-xl border transition ${
                              isCompleted
                                ? "bg-slate-50 border-slate-200 opacity-75"
                                : isOverdue
                                ? "bg-red-50/40 border-red-200"
                                : "bg-white border-slate-200"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                {isPending ? (
                                  <button
                                    onClick={() => handleCompleteFollowUp(task.id)}
                                    className="w-5 h-5 rounded border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center mt-0.5 transition shrink-0"
                                    title="Mark completed"
                                  >
                                    <Check className="w-3 h-3 text-transparent hover:text-emerald-600" />
                                  </button>
                                ) : (
                                  <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                                )}

                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-bold ${isCompleted ? "line-through text-slate-500" : "text-slate-900"}`}>
                                      {task.title}
                                    </span>
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                      {task.type}
                                    </span>
                                    {isOverdue && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                        Overdue
                                      </span>
                                    )}
                                  </div>

                                  {task.notes && (
                                    <p className="text-[11px] text-slate-600 mt-1 whitespace-pre-wrap">{task.notes}</p>
                                  )}

                                  {task.outcome && (
                                    <p className="text-[11px] text-emerald-700 font-medium mt-1">
                                      Outcome: {task.outcome}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <span className="text-[11px] font-bold text-slate-500 shrink-0">
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
                    <div className="p-8 rounded-xl border border-dashed border-slate-300 text-center">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">No follow-ups scheduled</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Schedule a call or review reminder to maintain high conversion.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: CHRONOLOGICAL ACTIVITY LOGS */}
              {activeTab === "TIMELINE" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Activity Logs & Audit History
                    </h4>
                    <button
                      onClick={() => {
                        setLogModalType("NOTE");
                        setShowLogModal(true);
                      }}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      + Record Interaction
                    </button>
                  </div>

                  {lead.activities && lead.activities.length > 0 ? (
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
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
                          Icon = RotateCcw;
                          iconColor = "bg-amber-100 text-amber-800";
                        }

                        return (
                          <div key={act.id} className="relative group">
                            {/* Dot / Icon */}
                            <div className={`absolute -left-6 top-0 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${iconColor}`}>
                              <Icon className="w-3 h-3" />
                            </div>

                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-slate-900">{act.title}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(act.createdAt).toLocaleString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>

                              {act.description && (
                                <p className="text-[11px] text-slate-600 mt-1 whitespace-pre-wrap">
                                  {act.description}
                                </p>
                              )}

                              <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>Logged by {act.performedBy}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                      No logged activities yet. Calls, emails, and quotations will appear here automatically.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Sub-Modals */}
      {lead && (
        <>
          <ProposalBuilderModal
            lead={lead}
            isOpen={showProposalModal}
            onClose={() => setShowProposalModal(false)}
            onProposalCreated={(p) => {
              setFeedback({ text: `Quotation ${p.proposalNumber} created.`, type: "success" });
              refreshLead();
            }}
          />

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
        </>
      )}
    </div>
  );
}

