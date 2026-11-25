"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Inbox,
  Clock,
  CheckCircle,
  Archive,
  Trash2,
  Mail,
  Phone,
  Send,
  Sparkles,
  Search,
  Filter,
  Download,
  RefreshCw,
  X,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Loader2,
  MessageSquare,
  Copy,
  ExternalLink,
  RotateCcw,
  User,
  Building,
  MapPin,
  TrendingUp,
  DollarSign,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  AlertCircle,
  ArrowRight,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  InquiryLead,
  LeadMetrics,
  LeadStage,
  LeadPriority,
  STAGE_META,
  PRIORITY_META,
} from "./crm/types";
import AddLeadModal from "./crm/AddLeadModal";

// Re-export type for backward compatibility
export type InquiryRecord = InquiryLead;

interface InquiryInboxManagerProps {
  initialInquiries: InquiryLead[];
  initialMetrics?: LeadMetrics;
}

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

function formatRelativeTime(dateInput: string | Date) {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const KANBAN_STAGES: LeadStage[] = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP_SCHEDULED",
  "CONSULTATION_BOOKED",
  "PROPOSAL_SENT",
  "WON",
  "LOST",
];

export default function InquiryInboxManager({
  initialInquiries,
  initialMetrics,
}: InquiryInboxManagerProps) {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<InquiryLead[]>(initialInquiries);
  const [metrics, setMetrics] = useState<LeadMetrics | undefined>(initialMetrics);

  // Studio View Controls
  const [viewMode, setViewMode] = useState<"LIST" | "KANBAN">("LIST");
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [refreshing, setRefreshing] = useState(false);

  // Add Lead Modal
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);

  // Email Reply Modal State
  const [replyInquiry, setReplyInquiry] = useState<InquiryLead | null>(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [markAsResolved, setMarkAsResolved] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Delete State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Feedback Toast
  const [feedback, setFeedback] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refresh data from server
  const handleRefresh = async () => {
    setRefreshing(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/inquiries");
      if (res.ok) {
        const data = await res.json();
        if (data.leads) {
          setInquiries(data.leads);
          setMetrics(data.metrics);
        } else if (Array.isArray(data)) {
          setInquiries(data);
        }
        setFeedback({ text: "CRM leads and metrics refreshed.", type: "success" });
      }
    } catch {
      setFeedback({ text: "Failed to refresh inquiries.", type: "error" });
    } finally {
      setRefreshing(false);
    }
  };

  // Distinct Services for filter
  const distinctServices = useMemo(() => {
    const set = new Set<string>();
    inquiries.forEach((i) => {
      if (i.service) set.add(i.service);
    });
    return Array.from(set);
  }, [inquiries]);

  // Filtered Leads
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry) => {
      const matchesSearch =
        inquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inquiry.phone || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inquiry.company || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inquiry.service || "").toLowerCase().includes(searchTerm.toLowerCase());

      let matchesStage = true;
      if (stageFilter === "ACTIVE") {
        matchesStage = !["WON", "LOST", "ARCHIVED", "RESOLVED"].includes(inquiry.status);
      } else if (stageFilter !== "ALL") {
        matchesStage = inquiry.status === stageFilter;
      }

      const matchesPriority =
        priorityFilter === "ALL" || inquiry.priority === priorityFilter;

      const matchesService =
        serviceFilter === "ALL" || inquiry.service === serviceFilter;

      return matchesSearch && matchesStage && matchesPriority && matchesService;
    });
  }, [inquiries, searchTerm, stageFilter, priorityFilter, serviceFilter]);

  // Computed KPI Metrics (Always live-synced with current inquiries state)
  const stats = useMemo(() => {
    let pipelineVal = 0;
    let wonVal = 0;
    let wonCount = 0;
    let activeCount = 0;

    inquiries.forEach((lead) => {
      const val = Number(lead.estimatedValue || 0);
      const st = lead.status?.toUpperCase();
      if (st === "WON" || st === "RESOLVED") {
        wonCount++;
        wonVal += val;
      } else if (st !== "LOST" && st !== "ARCHIVED") {
        activeCount++;
        pipelineVal += val;
      }
    });

    const total = inquiries.length;
    const convRate = total > 0 ? Math.round((wonCount / total) * 100) : 0;

    return {
      total,
      activeCount,
      pipelineVal,
      wonVal,
      convRate,
      todayFollowUps: metrics?.todayFollowUpsCount ?? 0,
      overdueFollowUps: metrics?.overdueFollowUpsCount ?? 0,
      proposalsSent: metrics?.proposalsSentCount ?? 0,
    };
  }, [inquiries, metrics]);

  // Stage Update inline
  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update stage");

      const updated = await res.json();
      setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
      setFeedback({
        text: `Lead stage changed to ${STAGE_META[newStatus]?.label || newStatus}.`,
        type: "success",
      });
      router.refresh();
    } catch (err) {
      setFeedback({
        text: err instanceof Error ? err.message : "Failed to update status.",
        type: "error",
      });
    }
  };

  // Delete Inquiry
  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete lead");

      setInquiries((prev) => prev.filter((i) => i.id !== id));
      setConfirmDeleteId(null);
      setFeedback({ text: "Lead permanently removed from CRM.", type: "success" });
      router.refresh();
    } catch (err) {
      setFeedback({
        text: err instanceof Error ? err.message : "Failed to delete lead.",
        type: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Open Dedicated Lead Page
  const openLeadPage = (leadId: string) => {
    router.push(`/admin/inquiries/${leadId}`);
  };

  // Open Reply Modal
  const openReplyModal = (inquiry: InquiryLead) => {
    setReplyInquiry(inquiry);
    setReplySubject(
      `Re: Your inquiry regarding ${inquiry.service || "TaxFiling24 Services"}`
    );
    setReplyMessage(
      `Hello ${inquiry.name},\n\nThank you for reaching out to TaxFiling24. We have received your inquiry regarding ${inquiry.service || "our professional services"}.\n\n`
    );
    setMarkAsResolved(false);
    setAiError(null);
    setFeedback(null);
  };

  // AI Draft Generator
  const handleAIDraft = async () => {
    if (!replyInquiry) return;
    setAiDrafting(true);
    setAiError(null);

    try {
      const res = await fetch("/api/admin/ai/generate", {
        body: JSON.stringify({
          category: replyInquiry.service || "General Tax Consulting",
          title: `Inquiry from ${replyInquiry.name}`,
          topic: replyInquiry.message,
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
      const draft = data.reply || data.content;
      if (draft) {
        setReplyMessage(draft);
      }
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Failed to generate draft.");
    } finally {
      setAiDrafting(false);
    }
  };

  // Send Email Response
  const handleSendEmail = async () => {
    if (!replyInquiry || !replyMessage.trim()) return;
    setSendingEmail(true);
    setAiError(null);

    try {
      const res = await fetch(`/api/admin/inquiries/${replyInquiry.id}/reply`, {
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
        text: `Email response sent successfully to ${replyInquiry.email}.`,
        type: "success",
      });
      setReplyInquiry(null);
      handleRefresh();
    } catch (err: any) {
      setAiError(err.message || "Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export to CSV (Blob download + Excel formula neutralization)
  const handleExportCSV = () => {
    const csvCell = (val: unknown) => {
      let s = String(val ?? "");
      if (/^\s*[=+\-@\t\r\n]/.test(s)) {
        s = `'${s}`;
      }
      return `"${s.replace(/"/g, '""')}"`;
    };

    const headers = [
      "ID",
      "Name",
      "Company",
      "Email",
      "Phone",
      "Service",
      "Stage",
      "Priority",
      "Estimated Value (INR)",
      "Created At",
    ];
    const rows = filteredInquiries.map((i) => [
      csvCell(i.id),
      csvCell(i.name),
      csvCell(i.company || ""),
      csvCell(i.email),
      csvCell(i.phone || ""),
      csvCell(i.service || ""),
      csvCell(i.status),
      csvCell(i.priority || "MEDIUM"),
      csvCell(i.estimatedValue || 0),
      csvCell(new Date(i.createdAt).toISOString()),
    ]);

    const csvBody = "\uFEFF" + [headers.map(csvCell).join(","), ...rows.map((e) => e.join(","))].join("\r\n");
    const blob = new Blob([csvBody], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `TaxFiling24_CRM_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Studio Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Leads & CRM Studio
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-100 text-indigo-700">
              {stats.total} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track client negotiations, schedule follow-ups, dispatch formal fee quotations, and close deals.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* List / Kanban Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("LIST")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === "LIST"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="w-3.5 h-3.5" /> List View
            </button>
            <button
              onClick={() => setViewMode("KANBAN")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === "KANBAN"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Pipeline Board
            </button>
          </div>

          <button
            onClick={() => setShowAddLeadModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Lead
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Export CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
            title="Refresh CRM"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Executive Pipeline Strip (KPI Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pipeline Value */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Active Pipeline</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            ₹{stats.pipelineVal.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-bold text-indigo-700">{stats.activeCount} active leads</span> in negotiation
          </div>
        </div>

        {/* Won Revenue */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Won Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            ₹{stats.wonVal.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <strong className="text-emerald-700">{stats.convRate}%</strong> overall conversion rate
          </div>
        </div>

        {/* Follow-up Tasks */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Follow-Up Tasks</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {stats.todayFollowUps}
            </div>
            <span className="text-xs text-slate-500">Due Today</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {stats.overdueFollowUps > 0 ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {stats.overdueFollowUps} overdue tasks
              </span>
            ) : (
              <span className="text-emerald-600 font-medium">All tasks on schedule</span>
            )}
          </div>
        </div>

        {/* Proposals Sent */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Quotations Sent</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {stats.proposalsSent}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Awaiting client sign-off & advance
          </div>
        </div>
      </div>

      {/* 3. Search & Dimension Filters */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client name, email, phone, company, message..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium transition"
            />
          </div>

          {/* Stage Filter */}
          <div className="sm:col-span-3">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium cursor-pointer"
            >
              <option value="ALL">All Stages</option>
              <option value="ACTIVE">Active Pipeline Only</option>
              {KANBAN_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_META[s]?.label || s}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="sm:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Service Filter */}
          <div className="sm:col-span-2">
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium cursor-pointer truncate"
            >
              <option value="ALL">All Services</option>
              {distinctServices.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Stage Chips */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Quick Filter:
          </span>
          <button
            onClick={() => setStageFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
              stageFilter === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({inquiries.length})
          </button>
          <button
            onClick={() => setStageFilter("ACTIVE")}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
              stageFilter === "ACTIVE"
                ? "bg-indigo-600 text-white"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            Active Pipeline ({stats.activeCount})
          </button>
          {KANBAN_STAGES.map((s) => {
            const count = inquiries.filter((i) => i.status === s).length;
            const meta = STAGE_META[s];
            return (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 ${
                  stageFilter === s
                    ? "bg-slate-900 text-white ring-1 ring-slate-900"
                    : `${meta.bg} ${meta.color} hover:opacity-80`
                }`}
              >
                {meta.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between animate-in fade-in ${
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

      {/* 4. Main View (List View or Kanban Pipeline Board) */}
      {viewMode === "LIST" ? (
        /* ==================== LIST VIEW ==================== */
        <div className="space-y-3">
          {filteredInquiries.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No matching leads found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try loosening your filters or create a new lead using the &ldquo;+ Add Lead&rdquo; button.
              </p>
            </div>
          ) : (
            filteredInquiries.map((lead) => {
              const pendingFollowUp = lead.followUps?.find((f) => f.status === "PENDING");
              const isOverdue =
                pendingFollowUp && new Date(pendingFollowUp.scheduledAt) < new Date();

              return (
                <div
                  key={lead.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xs transition group flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Client & Meta */}
                  <div
                    onClick={() => openLeadPage(lead.id)}
                    className="flex items-start gap-3.5 cursor-pointer flex-1 min-w-0"
                  >
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ring-1 shadow-inner ${getAvatarColor(
                        lead.name
                      )}`}
                    >
                      {getInitials(lead.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-sm text-slate-900 group-hover:text-indigo-600 transition">
                          {lead.name}
                        </span>
                        {lead.priority && (
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] uppercase font-bold ring-1 ${
                              PRIORITY_META[lead.priority]?.badge || ""
                            }`}
                          >
                            {lead.priority}
                          </span>
                        )}
                        {lead.service && (
                          <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                            {lead.service}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        {lead.company && (
                          <span className="flex items-center gap-1 font-medium text-slate-700">
                            <Building className="w-3 h-3 text-slate-400" /> {lead.company}
                          </span>
                        )}
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {lead.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {lead.email}
                        </span>
                        <span>&bull; {formatRelativeTime(lead.createdAt)}</span>
                      </div>

                      <p className="text-xs text-slate-600 mt-2 line-clamp-1 italic font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-100 max-w-2xl">
                        &ldquo;{lead.message}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* Right: Stage, Deal Value, Next Task & Actions */}
                  <div className="flex items-center gap-3 justify-between lg:justify-end shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Next Follow Up pill */}
                    {pendingFollowUp && (
                      <div
                        onClick={() => openLeadPage(lead.id)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 cursor-pointer border ${
                          isOverdue
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                        title={pendingFollowUp.title}
                      >
                        <Clock className="w-3 h-3" />
                        <span className="truncate max-w-[110px]">
                          {isOverdue ? "Overdue" : "Next"}: {new Date(pendingFollowUp.scheduledAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    )}

                    {/* Deal Value */}
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 block">
                        {lead.estimatedValue ? `₹${lead.estimatedValue.toLocaleString("en-IN")}` : "₹ --"}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Deal Value</span>
                    </div>

                    {/* Stage Dropdown */}
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer ${
                        STAGE_META[lead.status]?.badge || "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {KANBAN_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {STAGE_META[s]?.label || s}
                        </option>
                      ))}
                      {lead.status === "PENDING" && <option value="PENDING">Pending</option>}
                      {lead.status === "RESOLVED" && <option value="RESOLVED">Resolved</option>}
                    </select>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-1">
                      {lead.email && (
                        <button
                          onClick={() => openReplyModal(lead)}
                          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="Send Email Reply"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      )}

                      <Link
                        href={`/admin/inquiries/${lead.id}`}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1"
                        title="Open complete lead dossier, proposals, follow-ups, and activity logs"
                      >
                        View Lead & Logs <ChevronRight className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => setConfirmDeleteId(lead.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete Lead"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ==================== KANBAN BOARD ==================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 items-start">
          {KANBAN_STAGES.map((stageKey) => {
            const meta = STAGE_META[stageKey];
            const stageLeads = filteredInquiries.filter((lead) => {
              if (stageKey === "NEW" && lead.status === "PENDING") return true;
              if (stageKey === "WON" && lead.status === "RESOLVED") return true;
              return lead.status === stageKey;
            });
            const columnTotal = stageLeads.reduce(
              (acc, l) => acc + (Number(l.estimatedValue) || 0),
              0
            );

            return (
              <div
                key={stageKey}
                className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 flex flex-col max-h-[82vh]"
              >
                {/* Column Header */}
                <div className="pb-3 border-b border-slate-200 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      {meta.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.badge}`}>
                      {stageLeads.length}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 mt-1">
                    ₹{columnTotal.toLocaleString("en-IN")}
                  </div>
                </div>

                {/* Column Cards */}
                <div className="py-2 space-y-2.5 overflow-y-auto flex-1 mt-1">
                  {stageLeads.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400 font-medium border border-dashed border-slate-300 rounded-xl">
                      Empty stage
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const nextStageIdx = KANBAN_STAGES.indexOf(stageKey) + 1;
                      const prevStageIdx = KANBAN_STAGES.indexOf(stageKey) - 1;
                      const nextStage = nextStageIdx < KANBAN_STAGES.length ? KANBAN_STAGES[nextStageIdx] : null;
                      const prevStage = prevStageIdx >= 0 ? KANBAN_STAGES[prevStageIdx] : null;

                      return (
                        <div
                          key={lead.id}
                          className="p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 shadow-2xs hover:shadow-xs transition group"
                        >
                          {/* Card Top */}
                          <div
                            onClick={() => openLeadPage(lead.id)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <h5 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 line-clamp-1">
                                {lead.name}
                              </h5>
                              {lead.priority && (
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ring-1 shrink-0 ${
                                    PRIORITY_META[lead.priority]?.badge || ""
                                  }`}
                                >
                                  {lead.priority}
                                </span>
                              )}
                            </div>

                            {lead.company && (
                              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 line-clamp-1">
                                <Building className="w-2.5 h-2.5" /> {lead.company}
                              </p>
                            )}

                            {lead.service && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 mt-1.5 line-clamp-1">
                                {lead.service}
                              </span>
                            )}
                          </div>

                          {/* Card Bottom: Deal value & quick stage transitions */}
                          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900">
                              {lead.estimatedValue ? `₹${lead.estimatedValue.toLocaleString("en-IN")}` : "₹ --"}
                            </span>

                            <div className="flex items-center gap-1">
                              {prevStage && (
                                <button
                                  onClick={() => updateStatus(lead.id, prevStage)}
                                  className="w-5 h-5 rounded hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
                                  title={`Move back to ${STAGE_META[prevStage]?.label}`}
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {nextStage && (
                                <button
                                  onClick={() => updateStatus(lead.id, nextStage)}
                                  className="w-5 h-5 rounded hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition"
                                  title={`Advance to ${STAGE_META[nextStage]?.label}`}
                                >
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==================== ADD LEAD MODAL ==================== */}
      <AddLeadModal
        isOpen={showAddLeadModal}
        onClose={() => setShowAddLeadModal(false)}
        onLeadCreated={(newLead) => {
          setInquiries((prev) => [newLead, ...prev]);
          setFeedback({ text: "New lead successfully added to CRM.", type: "success" });
          openLeadPage(newLead.id);
        }}
      />

      {/* ==================== EMAIL REPLY MODAL ==================== */}
      {replyInquiry && (
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
                    To: <strong className="text-slate-200">{replyInquiry.email}</strong> &bull; {replyInquiry.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReplyInquiry(null)}
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

              {/* Subject */}
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

              {/* Original Message Reference */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Client Inquiry Context:
                </span>
                <p className="text-xs text-slate-600 line-clamp-2 italic">
                  &ldquo;{replyInquiry.message}&rdquo;
                </p>
              </div>

              {/* Body with AI Assistant */}
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

              {/* Mark resolved toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={markAsResolved}
                  onChange={(e) => setMarkAsResolved(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="text-xs text-slate-700 font-medium">
                  Advance lead stage to CONTACTED after sending (if still New)
                </span>
              </label>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setReplyInquiry(null)}
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

      {/* ==================== DELETE CONFIRMATION MODAL ==================== */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Permanently Delete Lead?</h3>
            <p className="text-xs text-slate-500 mt-1">
              This will remove all associated follow-ups, activity audit logs, and quotation records. This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 flex items-center gap-1.5 disabled:opacity-50"
              >
                {deletingId === confirmDeleteId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
