"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Save,
  Send,
  Download,
  Check,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Building,
  MapPin,
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Percent,
  Eye,
  Edit3,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  MessageSquare,
  Info,
  Calendar,
  Receipt,
  ShieldCheck,
  Briefcase,
  HelpCircle,
  RotateCcw,
} from "lucide-react";
import {
  InquiryLead,
  LeadProposalRecord,
  ProposalLineItem,
  ProposalMilestone,
} from "./types";
import { calculateProposalTotals } from "@/lib/proposal-math";

interface QuotationStudioClientProps {
  lead: InquiryLead;
  initialProposal?: LeadProposalRecord | null;
  mode: "create" | "edit";
}

const DEFAULT_TERMS =
  "1. Validity & Acceptance: This formal fee quotation is valid for 15 days from the date of issuance.\n" +
  "2. Statutory & Portal Disbursements: Government portal fees, MCA stamp duties, and statutory disbursements are billed at actuals under Pure Agent principles (Rule 33 of CGST Rules 2017).\n" +
  "3. Mobilization: Professional advisory services commence upon receipt of the agreed mobilization advance.\n" +
  "4. Client Documentation: Client shall furnish verified KYC documents, DSC authorizations, and relevant records within 7 business days.";

const STATE_OPTIONS = [
  { code: "07", name: "07 - Delhi" },
  { code: "09", name: "09 - Uttar Pradesh" },
  { code: "06", name: "06 - Haryana" },
  { code: "27", name: "27 - Maharashtra" },
  { code: "29", name: "29 - Karnataka" },
  { code: "19", name: "19 - West Bengal" },
  { code: "33", name: "33 - Tamil Nadu" },
  { code: "24", name: "24 - Gujarat" },
  { code: "36", name: "36 - Telangana" },
  { code: "99", name: "99 - Other State / SEZ" },
];

const AI_QUICK_PROMPTS = [
  {
    label: "Private Limited Incorporation",
    prompt: "Comprehensive Private Limited Company incorporation including 2 Class-3 DSCs, MCA RUN name reservation, SPICe+ Part B, e-MOA & e-AOA drafting, PAN/TAN, and pure-agent government fee split.",
  },
  {
    label: "LLP Incorporation & Deed",
    prompt: "Limited Liability Partnership (LLP) formation with RUN-LLP name approval, FiLLiP MCA filing, and customized LLP Partnership Agreement drafting.",
  },
  {
    label: "GST Registration & 1-Yr Retainer",
    prompt: "New GST registration filing with officer clarification handling, followed by a 12-month GSTR-1 and GSTR-3B monthly compliance and ITC reconciliation retainer.",
  },
  {
    label: "Tax Audit (Sec 44AB)",
    prompt: "Statutory balance sheet review, Schedule III financial statement preparation, and Form 3CA/3CD Tax Audit report filing under Section 44AB.",
  },
  {
    label: "Virtual CFO Retainer",
    prompt: "Monthly Virtual CFO advisory retainer covering MIS dashboards, cash flow forecasting, TDS/advance tax planning, and quarterly board reviews.",
  },
  {
    label: "Trademark Registration",
    prompt: "Comprehensive trademark search report, Class classification advisory, Form TM-A drafting and e-filing with the Trademark Registry.",
  },
];

export default function QuotationStudioClient({
  lead,
  initialProposal,
  mode,
}: QuotationStudioClientProps) {
  const router = useRouter();

  // Navigation mode: Editor vs Live Letterhead Preview
  const [viewTab, setViewTab] = useState<"EDITOR" | "PREVIEW">("EDITOR");

  // Form State
  const defaultValidDate = useMemo(() => {
    if (initialProposal?.validUntil) {
      return new Date(initialProposal.validUntil).toISOString().split("T")[0];
    }
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split("T")[0];
  }, [initialProposal]);

  const [title, setTitle] = useState(
    initialProposal?.title ||
      (lead.service ? `Engagement Proposal: ${lead.service}` : "Professional Fee Quotation & Scope of Work")
  );
  const [validUntil, setValidUntil] = useState(defaultValidDate);
  const [discount, setDiscount] = useState<number>(initialProposal?.discount || 0);
  const [currency, setCurrency] = useState(initialProposal?.currency || "INR");

  // Client Billing Info
  const [clientGstin, setClientGstin] = useState(initialProposal?.clientGstin || "");
  const [clientPan, setClientPan] = useState(initialProposal?.clientPan || "");
  const [clientAddress, setClientAddress] = useState(initialProposal?.clientAddress || "");
  const [placeOfSupply, setPlaceOfSupply] = useState(initialProposal?.placeOfSupply || "07 - Delhi");
  const [taxType, setTaxType] = useState<"IGST" | "CGST_SGST">(
    (initialProposal?.taxType as "IGST" | "CGST_SGST") || (placeOfSupply.startsWith("07") ? "CGST_SGST" : "IGST")
  );
  const [showB2bDetails, setShowB2bDetails] = useState(
    Boolean(initialProposal?.clientGstin || initialProposal?.clientPan || initialProposal?.clientAddress)
  );

  // Line items & Milestones
  const [lineItems, setLineItems] = useState<ProposalLineItem[]>(
    initialProposal?.lineItems && initialProposal.lineItems.length > 0
      ? initialProposal.lineItems
      : [
          {
            category: "Professional Advisory",
            description: lead.service || "Corporate Tax & Compliance Consultation",
            details: "Detailed review of statutory compliance, MCA/ROC documentation, and execution",
            sacCode: "998231",
            qty: 1,
            unit: "Assignment",
            rate: lead.estimatedValue || 7999,
            gstPercent: 18,
            isGovFee: false,
            amount: lead.estimatedValue || 7999,
          },
        ]
  );

  const [milestones, setMilestones] = useState<ProposalMilestone[]>(
    (initialProposal?.paymentMilestones as ProposalMilestone[]) || [
      { title: "Mobilization Advance", percentage: 50, amount: 0, dueTrigger: "On signing of engagement" },
      { title: "Statutory Approval & Sign-off", percentage: 50, amount: 0, dueTrigger: "Upon completion" },
    ]
  );

  const [notes, setNotes] = useState(initialProposal?.notes || "");
  const [terms, setTerms] = useState(initialProposal?.terms || DEFAULT_TERMS);

  // Track persisted proposal ID/number so retrying a failed send updates instead of creating duplicates
  const [activeProposalId, setActiveProposalId] = useState<string | null>(
    initialProposal?.id || null
  );
  const [activeProposalNumber, setActiveProposalNumber] = useState<string | null>(
    initialProposal?.proposalNumber || null
  );

  // Status & Feedback
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // AI Copilot State
  const [aiExpanded, setAiExpanded] = useState(true);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{
    title: string;
    lineItems: ProposalLineItem[];
    milestones: ProposalMilestone[];
    terms: string;
  } | null>(null);

  // Real-time Calculations (shared pure GST & pure-agent calculator matching server)
  const calculations = useMemo(() => {
    const res = calculateProposalTotals(lineItems, discount, milestones, { strict: false });
    return {
      ...res,
      grandTotal: res.totalAmount,
    };
  }, [lineItems, discount, milestones]);

  // Handle POS change (auto-sets CGST+SGST if Delhi, else IGST)
  const handlePosChange = (pos: string) => {
    setPlaceOfSupply(pos);
    if (pos.startsWith("07")) {
      setTaxType("CGST_SGST");
    } else {
      setTaxType("IGST");
    }
  };

  // Line item manipulation
  const handleAddItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        category: "Professional Advisory",
        description: "",
        details: "",
        sacCode: "998231",
        qty: 1,
        unit: "Nos",
        rate: 0,
        gstPercent: 18,
        isGovFee: false,
        amount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (lineItems.length <= 1) {
      setFeedback({ text: "A quotation must have at least one deliverable.", type: "error" });
      return;
    }
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ProposalLineItem, value: any) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };
      const q = Number(field === "qty" ? value : target.qty || 1);
      const r = Number(field === "rate" ? value : target.rate || 0);
      target.amount = q * r;

      if (field === "isGovFee") {
        if (value === true) {
          target.gstPercent = 0;
          target.sacCode = "000000";
        } else {
          target.gstPercent = 18;
          target.sacCode = "998231";
        }
      }
      updated[index] = target;
      return updated;
    });
  };

  // Milestone manipulation
  const handleAddMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      {
        title: "Interim Milestone",
        percentage: 0,
        amount: 0,
        dueTrigger: "On milestone delivery",
      },
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (index: number, field: keyof ProposalMilestone, value: any) => {
    setMilestones((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // AI Quotation Generation
  const handleGenerateAiQuotation = async (customInstruction?: string) => {
    setAiGenerating(true);
    setAiError(null);
    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "quotation",
          title: lead.name,
          category: lead.service || "Chartered Tax & Corporate Advisory",
          inquiryMessage: lead.message || "",
          customPrompt: customInstruction !== undefined ? customInstruction : aiPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate quotation with AI");
      }

      const q = data.quotation;
      if (!q || !Array.isArray(q.lineItems)) {
        throw new Error("AI returned an invalid quotation schema. Please try again.");
      }

      setAiResult({
        title: q.title || `Engagement Proposal: ${lead.service || "Advisory Services"}`,
        lineItems: q.lineItems.map((item: any) => ({
          category: item.category || "Professional Advisory",
          description: item.description || "Advisory Services",
          details: item.details || "",
          sacCode: item.sacCode || (item.isGovFee ? "000000" : "998231"),
          qty: Number(item.qty || 1),
          unit: item.unit || "Nos",
          rate: Number(item.rate || 0),
          gstPercent: item.isGovFee ? 0 : Number(item.gstPercent ?? 18),
          isGovFee: Boolean(item.isGovFee),
          amount: Number(item.amount || Number(item.qty || 1) * Number(item.rate || 0)),
        })),
        milestones:
          Array.isArray(q.milestones) && q.milestones.length > 0
            ? q.milestones.map((m: any) => ({
                title: m.title || "Milestone",
                percentage: Number(m.percentage || 50),
                amount: 0,
                dueTrigger: m.dueTrigger || "On deliverable",
              }))
            : [
                { title: "Mobilization Advance", percentage: 50, amount: 0, dueTrigger: "On signing of engagement" },
                { title: "Statutory Approval & Sign-off", percentage: 50, amount: 0, dueTrigger: "Upon completion" },
              ],
        terms: q.terms || DEFAULT_TERMS,
      });
    } catch (err: any) {
      setAiError(err.message || "Failed to generate quotation");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApplyAiResult = () => {
    if (!aiResult) return;
    setTitle(aiResult.title);
    setLineItems(aiResult.lineItems);
    setMilestones(aiResult.milestones);
    setTerms(aiResult.terms);
    setAiResult(null);
    setAiExpanded(false);
    setFeedback({ text: "AI proposal applied to quotation successfully!", type: "success" });
  };

  // Save Proposal
  const handleSaveProposal = async (dispatchMode: "NONE" | "EMAIL" | "WHATSAPP" = "NONE") => {
    setFeedback(null);
    if (!title.trim()) {
      setFeedback({ text: "Please enter a quotation title.", type: "error" });
      return;
    }
    if (lineItems.length === 0 || lineItems.some((i) => !i.description.trim())) {
      setFeedback({ text: "Please ensure all deliverables have a clear description.", type: "error" });
      return;
    }

    try {
      if (dispatchMode === "EMAIL") setSendingEmail(true);
      else if (dispatchMode === "WHATSAPP") setSendingWhatsApp(true);
      else setSaving(true);

      const payload = {
        title: title.trim(),
        validUntil,
        lineItems: calculations.lineItems,
        discount: calculations.discount,
        currency,
        clientGstin,
        clientPan,
        clientAddress,
        placeOfSupply,
        taxType,
        paymentMilestones: calculations.paymentMilestones || milestones,
        notes,
        terms,
      };

      const isCreating = !activeProposalId;
      let savedProposalId = activeProposalId;

      if (isCreating) {
        const res = await fetch(`/api/admin/inquiries/${lead.id}/proposals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const created = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(created.error || "Failed to create quotation");
        }
        savedProposalId = created.id;
        setActiveProposalId(created.id);
        if (created.proposalNumber) {
          setActiveProposalNumber(created.proposalNumber);
        }
      } else {
        const res = await fetch(`/api/admin/inquiries/${lead.id}/proposals/${activeProposalId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const updated = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(updated.error || "Failed to update quotation");
        }
      }

      // If user selected "Save & Send via Email"
      if (dispatchMode === "EMAIL" && savedProposalId) {
        const emailRes = await fetch(
          `/api/admin/inquiries/${lead.id}/proposals/${savedProposalId}/send`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channel: "EMAIL" }),
          }
        );
        const ed = await emailRes.json().catch(() => ({}));
        if (!emailRes.ok) {
          throw new Error(ed.error || "Quotation saved, but email delivery failed. You can retry sending without creating a duplicate.");
        }
        setFeedback({
          text: "Fee quotation saved and formally dispatched to client email!",
          type: "success",
        });
      } else if (dispatchMode === "WHATSAPP" && savedProposalId) {
        const waRes = await fetch(
          `/api/admin/inquiries/${lead.id}/proposals/${savedProposalId}/send`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ channel: "WHATSAPP" }),
          }
        );
        const ed = await waRes.json().catch(() => ({}));
        if (!waRes.ok) {
          throw new Error(ed.error || "Quotation saved, but WhatsApp delivery failed. You can retry sending without creating a duplicate.");
        }
        setFeedback({
          text: "Fee quotation saved and dispatched to client via WhatsApp Cloud API!",
          type: "success",
        });
      } else {
        setFeedback({
          text: isCreating ? "Quotation drafted and saved successfully!" : "Quotation updated successfully!",
          type: "success",
        });
      }

      if (mode === "create" && savedProposalId) {
        router.push(`/admin/inquiries/${lead.id}`);
        router.refresh();
      } else {
        router.refresh();
      }
    } catch (err: any) {
      setFeedback({ text: err.message || "Failed to save proposal", type: "error" });
    } finally {
      setSaving(false);
      setSendingEmail(false);
      setSendingWhatsApp(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* 1. Header Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/admin/inquiries/${lead.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition group mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
            <span>Back to Lead Dossier ({lead.name})</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {!activeProposalId ? "Draft Fee Quotation" : `Quotation: ${activeProposalNumber || "Saved"}`}
            </h1>
            {activeProposalNumber && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-100 text-indigo-700">
                {activeProposalNumber}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Editor vs Live Preview Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewTab("EDITOR")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewTab === "EDITOR"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Studio Editor
            </button>
            <button
              type="button"
              onClick={() => setViewTab("PREVIEW")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewTab === "PREVIEW"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" /> Letterhead Live Preview
            </button>
          </div>

          {/* Download PDF button if saved */}
          {activeProposalId && (
            <a
              href={`/api/admin/inquiries/${lead.id}/proposals/${activeProposalId}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
              title="Download Official PDF"
            >
              <Download className="w-4 h-4 text-indigo-600" />
            </a>
          )}

          <button
            type="button"
            onClick={() => handleSaveProposal("NONE")}
            disabled={saving || sendingEmail || sendingWhatsApp}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Draft
          </button>

          {lead.phone && (
            <button
              type="button"
              onClick={() => handleSaveProposal("WHATSAPP")}
              disabled={saving || sendingEmail || sendingWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-sm shadow-emerald-600/30 disabled:opacity-50"
              title="Save and dispatch formal quotation via WhatsApp Cloud API"
            >
              {sendingWhatsApp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
              Save & Send WhatsApp
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSaveProposal("EMAIL")}
            disabled={saving || sendingEmail || sendingWhatsApp || !lead.email}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-sm shadow-indigo-600/30 disabled:opacity-50"
          >
            {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Save & Send Email
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
            &times;
          </button>
        </div>
      )}

      {/* 2. Main Studio View */}
      {viewTab === "EDITOR" ? (
        /* ==================== STUDIO EDITOR ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (8-col wide): Proposal Workspace */}
          <div className="lg:col-span-8 space-y-6">
            {/* ==================== AI QUOTATION COPILOT BANNER ==================== */}
            <div className="rounded-3xl border border-indigo-200/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md overflow-hidden transition-all">
              {/* Banner Bar */}
              <div className="p-5 flex items-center justify-between gap-4 border-b border-indigo-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400/30 to-indigo-400/30 border border-indigo-300/40 flex items-center justify-center text-amber-300 shadow-inner">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white tracking-tight">
                        AI Quotation Generator
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-mono">
                        Gemini 2.5
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Intelligently craft itemized CA deliverables, statutory disbursements & payment milestones.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {aiResult && !aiExpanded && (
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-full">
                      Proposal Ready
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setAiExpanded(!aiExpanded)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
                    title={aiExpanded ? "Collapse AI Assistant" : "Expand AI Assistant"}
                  >
                    {aiExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsible Copilot Body */}
              {aiExpanded && (
                <div className="p-5 space-y-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in">
                  {/* Lead Context Pill */}
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Client Inquiry:</span>
                      <strong className="text-white">{lead.name}</strong>
                      {lead.company && <span className="text-slate-400">({lead.company})</span>}
                    </div>
                    {lead.service && (
                      <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-400/30">
                        {lead.service}
                      </span>
                    )}
                  </div>

                  {/* 1-Click Scope Template Pills */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
                      Quick Scope Starters (Click to generate instantly):
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AI_QUICK_PROMPTS.map((qp) => (
                        <button
                          key={qp.label}
                          type="button"
                          disabled={aiGenerating}
                          onClick={() => {
                            setAiPrompt(qp.prompt);
                            handleGenerateAiQuotation(qp.prompt);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-indigo-600/40 hover:border-indigo-400/50 border border-white/10 text-xs font-medium text-slate-200 hover:text-white transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>{qp.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Scope Prompt Box & Generate Button */}
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !aiGenerating) {
                            handleGenerateAiQuotation();
                          }
                        }}
                        placeholder="e.g. Include 1-year GST retainer, trademark search, split out MCA stamp duty disbursement..."
                        className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white/15 transition"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleGenerateAiQuotation()}
                      disabled={aiGenerating}
                      className="px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 shadow-md shadow-indigo-900/40 disabled:opacity-60"
                    >
                      {aiGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                          <span>Drafting with Gemini...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Generate Proposal</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* AI Error Banner */}
                  {aiError && (
                    <div className="p-3.5 rounded-2xl bg-red-900/40 border border-red-500/50 text-xs text-red-200 flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{aiError}</span>
                    </div>
                  )}

                  {/* AI Result Review Box */}
                  {aiResult && !aiGenerating && (
                    <div className="p-4 rounded-2xl bg-white/10 border border-white/20 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> AI Proposal Generated
                        </span>
                        <span className="text-[11px] font-mono text-indigo-300">
                          {aiResult.lineItems.length} Deliverables &bull; {aiResult.milestones.length} Milestones
                        </span>
                      </div>

                      <div className="bg-slate-900/80 rounded-xl p-3 border border-white/10 text-xs space-y-2">
                        <p className="font-bold text-white text-xs">{aiResult.title}</p>
                        <div className="divide-y divide-white/10 text-[11px]">
                          {aiResult.lineItems.map((item, idx) => (
                            <div key={idx} className="py-1.5 flex justify-between items-center gap-2">
                              <div className="flex-1 pr-2">
                                <span className="font-medium text-slate-200">{item.description}</span>
                                {item.isGovFee && (
                                  <span className="ml-1.5 text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                                    Pure Agent (0% GST)
                                  </span>
                                )}
                              </div>
                              <span className="font-mono font-bold text-white">
                                ₹{item.rate.toLocaleString("en-IN")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setAiResult(null)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
                        >
                          Discard
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyAiResult}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                        >
                          <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />
                          <span>Apply to Quotation Studio</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Engagement Details Card */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Engagement Scope & Period
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Official proposal title and quotation validity duration
                    </p>
                  </div>
                </div>

                {/* Lead Context Pill */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600">
                  <Briefcase className="w-3 h-3 text-indigo-500" />
                  <span>{lead.name}</span>
                  {lead.service && (
                    <>
                      <span className="text-slate-300">&bull;</span>
                      <span className="text-indigo-600 max-w-[200px] truncate">{lead.service}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Engagement Subject / Quotation Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Private Limited Company Incorporation & Compliance Retainer"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Quotation Valid Until <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Itemized Deliverables Table Card */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Itemized Deliverables & Professional Fees
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Separate professional advisory fees from pure-agent government statutory disbursements (Rule 33 CGST)
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Deliverable
                </button>
              </div>

              {/* Table / Grid */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <div className="col-span-5">Scope & Deliverables</div>
                  <div className="col-span-3 text-center">Fee Type & SAC</div>
                  <div className="col-span-1 text-center">Qty</div>
                  <div className="col-span-2 text-right">Rate (₹)</div>
                  <div className="col-span-1 text-right">Total</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {lineItems.map((item, index) => (
                    <div key={index} className="p-3 hover:bg-slate-50/50 transition space-y-2">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        {/* Title / Description */}
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, "description", e.target.value)}
                            placeholder="e.g. MCA Name Approval & DSC Video KYC"
                            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
                          />
                        </div>

                        {/* Fee Type Pill & SAC */}
                        <div className="col-span-3 flex items-center gap-1.5 justify-center">
                          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100">
                            <button
                              type="button"
                              onClick={() => handleItemChange(index, "isGovFee", false)}
                              className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${
                                !item.isGovFee
                                  ? "bg-indigo-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                              title="Professional advisory fee subject to 18% GST"
                            >
                              CA Fee (18%)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleItemChange(index, "isGovFee", true)}
                              className={`px-2 py-1 text-[10px] font-bold rounded-md transition ${
                                item.isGovFee
                                  ? "bg-amber-600 text-white shadow-2xs"
                                  : "text-slate-600 hover:text-slate-900"
                              }`}
                              title="Government statutory fee (Pure Agent, 0% GST)"
                            >
                              Govt Fee (0%)
                            </button>
                          </div>
                          <input
                            type="text"
                            value={item.sacCode}
                            onChange={(e) => handleItemChange(index, "sacCode", e.target.value)}
                            placeholder="SAC"
                            className="w-14 px-1.5 py-1 text-[11px] text-center font-mono rounded-lg border border-slate-200 text-slate-600"
                            title="SAC Code"
                          />
                        </div>

                        {/* Qty */}
                        <div className="col-span-1">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => handleItemChange(index, "qty", parseInt(e.target.value) || 1)}
                            className="w-full px-1.5 py-1.5 text-xs text-center rounded-lg border border-slate-200 font-semibold text-slate-800"
                          />
                        </div>

                        {/* Rate */}
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            step="100"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, "rate", parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 text-xs text-right font-mono font-semibold text-slate-900 rounded-lg border border-slate-200"
                          />
                        </div>

                        {/* Total & Delete */}
                        <div className="col-span-1 flex items-center justify-end gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            ₹{((item.qty || 1) * (item.rate || 0)).toLocaleString("en-IN")}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-1 text-slate-400 hover:text-red-600 transition rounded"
                            title="Remove Deliverable"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Scope Breakdown / Details Sub-line */}
                      <div className="pl-1">
                        <input
                          type="text"
                          value={item.details || ""}
                          onChange={(e) => handleItemChange(index, "details", e.target.value)}
                          placeholder="Optional breakdown: Specific filings, turnaround time, or statutory forms included..."
                          className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 text-slate-600 italic bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Milestone Schedule Card */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Payment Milestone Schedule
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      Disbursement milestones printed on formal engagement agreement
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold flex items-center gap-1 transition"
                >
                  <Plus className="w-3 h-3" /> Add Stage
                </button>
              </div>

              <div className="space-y-2.5">
                {milestones.map((m, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        value={m.title}
                        onChange={(e) => handleMilestoneChange(idx, "title", e.target.value)}
                        placeholder="Milestone title (e.g. Mobilization Advance)"
                        className="w-full px-2.5 py-1 rounded-lg border border-slate-200 bg-white font-bold text-slate-800 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={m.percentage}
                          onChange={(e) => handleMilestoneChange(idx, "percentage", parseInt(e.target.value) || 0)}
                          className="w-14 px-2 py-1 text-center font-bold text-xs rounded-lg border border-slate-200 bg-white"
                        />
                        <span className="font-bold text-slate-500">%</span>
                      </div>
                      <input
                        type="text"
                        value={m.dueTrigger}
                        onChange={(e) => handleMilestoneChange(idx, "dueTrigger", e.target.value)}
                        placeholder="Due trigger (e.g. On signing of engagement)"
                        className="w-48 px-2.5 py-1 text-xs text-slate-600 rounded-lg border border-slate-200 bg-white"
                      />
                      {milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(idx)}
                          className="p-1 text-slate-400 hover:text-red-600 transition"
                          title="Remove milestone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Milestone total indicator */}
                <div className="flex justify-end items-center gap-2 text-xs pt-1">
                  <span className="text-slate-500">Total Split:</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${
                      milestones.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0) === 100
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {milestones.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Terms of Engagement Card */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Terms of Engagement & Professional Clauses
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Statutory disclaimers, pure agent disbursement conditions, and validity terms
                  </p>
                </div>
              </div>
              <textarea
                rows={4}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full p-3 text-xs rounded-2xl border border-slate-300 font-mono text-slate-700 leading-relaxed focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Right Column (4-col wide): Unified Billing & Financial Cockpit */}
          <div className="lg:col-span-4 space-y-6 sticky top-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
              {/* Cockpit Header */}
              <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Billing & Tax Cockpit
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Automated GST calculation</p>
                </div>
                <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {taxType === "CGST_SGST" ? "Intra-State" : "Inter-State"}
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* 1. Place of Supply & Tax Regime */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Place of Supply (POS)
                    </label>
                    <select
                      value={placeOfSupply}
                      onChange={(e) => handlePosChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-indigo-600"
                    >
                      {STATE_OPTIONS.map((st) => (
                        <option key={st.code} value={st.name}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Applicable GST Regime
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTaxType("CGST_SGST")}
                        className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] border transition ${
                          taxType === "CGST_SGST"
                            ? "bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-500/20"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        CGST + SGST (9%+9%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaxType("IGST")}
                        className={`py-2 px-2 rounded-xl text-center font-bold text-[11px] border transition ${
                          taxType === "IGST"
                            ? "bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-500/20"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        IGST (18%)
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Client B2B Profile (Collapsible) */}
                <div className="pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowB2bDetails(!showB2bDetails)}
                    className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-slate-900"
                  >
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Client B2B Invoicing Details</span>
                      <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                    </div>
                    {showB2bDetails ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  {showB2bDetails && (
                    <div className="space-y-3 text-xs mt-3 pt-3 border-t border-slate-100 animate-in fade-in">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            GSTIN
                          </label>
                          <input
                            type="text"
                            value={clientGstin}
                            onChange={(e) => setClientGstin(e.target.value.toUpperCase())}
                            placeholder="07AABCT..."
                            maxLength={15}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            PAN
                          </label>
                          <input
                            type="text"
                            value={clientPan}
                            onChange={(e) => setClientPan(e.target.value.toUpperCase())}
                            placeholder="AABCT..."
                            maxLength={10}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs uppercase"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Billing Address
                        </label>
                        <textarea
                          rows={2}
                          value={clientAddress}
                          onChange={(e) => setClientAddress(e.target.value)}
                          placeholder="Complete registered business address..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Financial Breakdown */}
                <div className="pt-4 border-t border-slate-100 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Professional Advisory Fees:</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      ₹{calculations.profSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {calculations.govSubtotal > 0 && (
                    <div className="flex justify-between text-amber-800">
                      <span>Govt Statutory Fees (0% GST):</span>
                      <span className="font-semibold font-mono">
                        ₹{calculations.govSubtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600 items-center">
                    <span>Discount (₹ INR):</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-24 px-2 py-1 text-right text-xs rounded-lg border border-slate-300 font-semibold font-mono"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    {taxType === "CGST_SGST" ? (
                      <>
                        <div className="flex justify-between text-slate-600">
                          <span>CGST (9%):</span>
                          <span className="font-semibold text-slate-900 font-mono">
                            ₹{(calculations.taxAmount / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>SGST (9%):</span>
                          <span className="font-semibold text-slate-900 font-mono">
                            ₹{(calculations.taxAmount / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-slate-600">
                        <span>IGST (18% Integrated):</span>
                        <span className="font-semibold text-slate-900 font-mono">
                          ₹{calculations.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Grand Total */}
                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex justify-between items-baseline">
                      <span className="font-black text-slate-900 text-sm">Grand Total:</span>
                      <span className="text-2xl font-black text-indigo-700 font-mono tracking-tight">
                        ₹{calculations.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Amount in words badge */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Amount in Words:
                    </span>
                    <p className="text-xs font-semibold text-slate-800 italic mt-0.5 leading-snug">
                      {calculations.amountInWords}
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="pt-2 space-y-2">
                  {lead.phone && (
                    <button
                      type="button"
                      onClick={() => handleSaveProposal("WHATSAPP")}
                      disabled={saving || sendingEmail || sendingWhatsApp}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-sm shadow-emerald-600/30 disabled:opacity-50"
                    >
                      {sendingWhatsApp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MessageSquare className="w-3.5 h-3.5" />}
                      <span>Save & Dispatch to WhatsApp</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSaveProposal("EMAIL")}
                    disabled={saving || sendingEmail || sendingWhatsApp || !lead.email}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-sm shadow-indigo-600/30 disabled:opacity-50"
                  >
                    {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Save & Send to Client Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveProposal("NONE")}
                    disabled={saving || sendingEmail || sendingWhatsApp}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save as Draft</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ==================== OFFICIAL LETTERHEAD LIVE PREVIEW ==================== */
        <div className="bg-white rounded-3xl border border-slate-300 shadow-xl overflow-hidden max-w-4xl mx-auto">
          {/* Header Banner */}
          <div className="p-8 bg-slate-900 text-white flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-white">TaxFiling24</h2>
              <p className="text-xs text-slate-300 mt-1">Chartered Tax, Corporate Legal & Statutory Advisory Services</p>
              <p className="text-[11px] text-slate-400 mt-0.5">www.taxfiling24.com &bull; support@taxfiling24.com &bull; GSTIN: 07AABCT2424P1Z4</p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-indigo-600 text-white text-[11px] font-black rounded-lg uppercase tracking-wider">
                Formal Fee Quotation
              </span>
              <p className="font-mono text-sm font-bold text-slate-200 mt-2">
                {activeProposalNumber || "TF24-QT-DRAFT"}
              </p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* Meta Grid */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-6 text-xs">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Billed To:</span>
                <p className="text-sm font-black text-slate-900 mt-0.5">{lead.name}</p>
                <p className="text-slate-600">{lead.company || "Corporate Client"}</p>
                {clientAddress && <p className="text-slate-500 mt-1">{clientAddress}</p>}
                {clientGstin && <p className="text-slate-700 font-mono mt-0.5">GSTIN: {clientGstin}</p>}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">Quotation Details:</span>
                <p className="text-slate-800 font-bold mt-0.5">
                  Date: {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="text-slate-600">
                  Valid Until: {new Date(validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
                <p className="text-slate-600">Place of Supply: {placeOfSupply}</p>
              </div>
            </div>

            {/* Scope Title */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Scope:</span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">{title}</h3>
            </div>

            {/* Table */}
            <table className="w-full text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-900 text-white text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 text-left">#</th>
                  <th className="py-2.5 px-3 text-left">Deliverable Description</th>
                  <th className="py-2.5 px-3 text-center">SAC</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Rate</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {lineItems.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50/50" : ""}>
                    <td className="py-2 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {item.description}
                      {item.isGovFee && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                          Govt Pure Agent
                        </span>
                      )}
                      {item.details && <p className="text-[11px] text-slate-500 font-normal mt-0.5">{item.details}</p>}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-500 font-mono">{item.sacCode || "998231"}</td>
                    <td className="py-2 px-3 text-center font-medium">
                      {item.qty} {item.unit}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">₹{(item.rate || 0).toLocaleString("en-IN")}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      ₹{((item.qty || 1) * (item.rate || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals & Bank Box */}
            <div className="grid grid-cols-2 gap-6 items-start pt-2">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block mb-1">
                  Bank Remittance Particulars
                </span>
                <p className="font-semibold text-slate-800">Account: TaxFiling24 Advisory Services</p>
                <p className="text-slate-600">HDFC Bank Ltd &bull; A/C: 50200088921134 &bull; IFSC: HDFC0001202</p>
                <p className="text-slate-600">UPI ID: taxfiling24@hdfcbank</p>
                <p className="text-xs font-semibold text-indigo-700 mt-2 italic">{calculations.amountInWords}</p>
              </div>

              <div className="text-xs space-y-1.5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold font-mono">
                    ₹{calculations.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {calculations.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span className="font-semibold font-mono">
                      -₹{calculations.discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {taxType === "CGST_SGST" ? (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>CGST (9%):</span>
                      <span className="font-semibold font-mono">
                        ₹{(calculations.taxAmount / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>SGST (9%):</span>
                      <span className="font-semibold font-mono">
                        ₹{(calculations.taxAmount / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-slate-600">
                    <span>IGST (18% Integrated):</span>
                    <span className="font-semibold font-mono">
                      ₹{calculations.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-300 flex justify-between font-bold text-base text-indigo-700">
                  <span>Grand Total:</span>
                  <span className="font-mono">
                    ₹{calculations.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-700 uppercase tracking-wider block text-xs">Terms of Engagement:</span>
              <p className="whitespace-pre-wrap font-mono leading-relaxed">{terms}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
