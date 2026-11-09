"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X,
  Plus,
  Trash2,
  FileText,
  Send,
  Sparkles,
  Calculator,
  Percent,
  Check,
  AlertCircle,
  Download,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { InquiryLead, ProposalLineItem } from "./types";

interface ProposalBuilderModalProps {
  lead: InquiryLead;
  isOpen: boolean;
  onClose: () => void;
  onProposalCreated: (proposal: any) => void;
}

const DEFAULT_TERMS =
  "1. Validity: This fee quotation is valid for 15 days from the date of issue.\n" +
  "2. Out-of-pocket & Gov Fees: Standard MCA/ROC/GST government portal fees are included in line items where indicated; any extra statutory penalties incurred due to delays in client document delivery will be billed at actuals.\n" +
  "3. Mobilization: Professional assignment commences upon receipt of 50% advance retainer.\n" +
  "4. Turnaround: Standard processing time is 5-7 business days from receipt of all KYC and supporting documents.";

const QUICK_AI_PROMPTS = [
  "Private Limited Company Incorporation & SPICe+",
  "LLP Incorporation & Partnership Deed",
  "GST Registration & 12 Months Filing Retainer",
  "Statutory & Tax Audit under Sec 44AB",
  "Virtual CFO Monthly Advisory Retainer",
];

export default function ProposalBuilderModal({
  lead,
  isOpen,
  onClose,
  onProposalCreated,
}: ProposalBuilderModalProps) {
  // Pre-calculate default validity date (15 days from now)
  const defaultValidDate = new Date();
  defaultValidDate.setDate(defaultValidDate.getDate() + 15);
  const defaultValidStr = defaultValidDate.toISOString().split("T")[0];

  const [title, setTitle] = useState(
    lead.service
      ? `Engagement Proposal: ${lead.service}`
      : "Professional Fee Quotation & Scope of Work"
  );
  const [validUntil, setValidUntil] = useState(defaultValidStr);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [lineItems, setLineItems] = useState<ProposalLineItem[]>([
    {
      description: lead.service || "Corporate Tax & Compliance Consultation",
      sacCode: "998231",
      qty: 1,
      rate: lead.estimatedValue || 4999,
      gstPercent: 18,
      amount: lead.estimatedValue || 4999,
    },
  ]);

  // AI Copilot in Modal
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);

  const [saving, setSaving] = useState(false);
  const [sendingNow, setSendingNow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time Calculations
  const subtotal = lineItems.reduce((acc, item) => acc + Number(item.qty || 1) * Number(item.rate || 0), 0);
  const taxable = Math.max(0, subtotal - (Number(discount) || 0));
  const taxAmount = Math.round(taxable * 0.18 * 100) / 100;
  const grandTotal = Math.round((taxable + taxAmount) * 100) / 100;

  const handleGenerateAi = async (promptOverride?: string) => {
    setAiGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "quotation",
          title: lead.name,
          category: lead.service || "Chartered Tax & Corporate Advisory",
          inquiryMessage: lead.message || "",
          customPrompt: promptOverride || aiPrompt,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate quotation with AI");
      }

      const q = data.quotation;
      if (!q || !Array.isArray(q.lineItems)) {
        throw new Error("AI returned invalid quotation structure.");
      }

      setTitle(q.title || `Engagement Proposal: ${lead.service || "Advisory Services"}`);
      setLineItems(
        q.lineItems.map((item: any) => ({
          category: item.category || "Professional Advisory",
          description: item.description || "Advisory Service",
          details: item.details || "",
          sacCode: item.sacCode || (item.isGovFee ? "000000" : "998231"),
          qty: Number(item.qty || 1),
          rate: Number(item.rate || 0),
          gstPercent: item.isGovFee ? 0 : Number(item.gstPercent ?? 18),
          amount: Number(item.amount || Number(item.qty || 1) * Number(item.rate || 0)),
        }))
      );
      if (q.terms) setTerms(q.terms);
    } catch (err: any) {
      setError(err.message || "Failed to generate quotation with AI.");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAddItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        description: "",
        sacCode: "998231",
        qty: 1,
        rate: 0,
        gstPercent: 18,
        amount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof ProposalLineItem, value: any) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };
      const q = Number(field === "qty" ? value : target.qty || 1);
      const r = Number(field === "rate" ? value : target.rate || 0);
      target.amount = q * r;
      updated[index] = target;
      return updated;
    });
  };

  const handleSave = async (andSendEmail: boolean = false) => {
    setError(null);
    if (!title.trim()) {
      setError("Please specify a proposal scope title.");
      return;
    }
    if (lineItems.length === 0 || lineItems.some((i) => !i.description.trim())) {
      setError("Please ensure every line item has a clear description.");
      return;
    }

    try {
      if (andSendEmail) {
        setSendingNow(true);
      } else {
        setSaving(true);
      }

      // 1. Create Proposal
      const res = await fetch(`/api/admin/inquiries/${lead.id}/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          validUntil,
          lineItems,
          discount,
          notes,
          terms,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to create proposal");
      }

      const createdProposal = await res.json();

      // 2. If dispatch requested
      if (andSendEmail) {
        const sendRes = await fetch(
          `/api/admin/inquiries/${lead.id}/proposals/${createdProposal.id}/send`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              channel: "EMAIL",
              customMessage: `Please find attached our formal quotation (${createdProposal.proposalNumber}) for ${title}.`,
            }),
          }
        );

        if (!sendRes.ok) {
          const sd = await sendRes.json();
          throw new Error(sd.error || "Proposal created, but email dispatch failed.");
        }
      }

      onProposalCreated(createdProposal);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while saving quotation.");
    } finally {
      setSaving(false);
      setSendingNow(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Draft Fee Proposal</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  GST 18% Enabled
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Prepared for <strong className="text-slate-200">{lead.name}</strong>
                {lead.company ? ` (${lead.company})` : ""} &bull; {lead.email || "No email"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/inquiries/${lead.id}/proposals/new`}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Full Studio</span>
            </Link>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-800 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Quotation Copilot Bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Quotation Assistant (Gemini)
                </span>
              </div>
              <span className="text-[10px] text-slate-300 font-mono">1-Click Auto-Draft</span>
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_AI_PROMPTS.map((qp) => (
                <button
                  key={qp}
                  type="button"
                  disabled={aiGenerating}
                  onClick={() => handleGenerateAi(qp)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-indigo-600/50 border border-white/15 text-[11px] font-medium text-slate-200 transition disabled:opacity-50"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Prompt input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Or type custom scope: e.g. LLP formation with 2 partners + GST registration..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <button
                type="button"
                onClick={() => handleGenerateAi()}
                disabled={aiGenerating}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 disabled:opacity-50"
              >
                {aiGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Generate</span>
              </button>
            </div>
          </div>

          {/* Proposal Scope & Validity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Proposal Title / Engagement Scope *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Private Limited Company Incorporation & Compliance"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quotation Valid Until *
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium text-slate-900"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Itemized Professional Services ({lineItems.length})
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Service Line
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-slate-100 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <div className="col-span-6 sm:col-span-5">Service Description</div>
                <div className="col-span-2 hidden sm:block">SAC Code</div>
                <div className="col-span-2 sm:col-span-1 text-center">Qty</div>
                <div className="col-span-2 sm:col-span-2 text-right">Fee Rate (₹)</div>
                <div className="col-span-2 sm:col-span-2 text-right">Amount (₹)</div>
              </div>

              <div className="divide-y divide-slate-200 bg-white">
                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 p-2.5 items-center">
                    <div className="col-span-6 sm:col-span-5">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        placeholder="Description of CA / Tax deliverable"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-900"
                      />
                    </div>
                    <div className="col-span-2 hidden sm:block">
                      <input
                        type="text"
                        value={item.sacCode}
                        onChange={(e) => handleItemChange(index, "sacCode", e.target.value)}
                        placeholder="998231"
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono text-slate-700"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, "qty", parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-300 font-semibold"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-2">
                      <input
                        type="number"
                        min="0"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, "rate", parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 text-xs text-right rounded-lg border border-slate-300 font-mono font-semibold"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        ₹{(Number(item.qty || 1) * Number(item.rate || 0)).toLocaleString("en-IN")}
                      </span>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-slate-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Totals & Discount Card */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Special Discount (₹):</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-24 px-2 py-1 rounded-lg border border-slate-300 text-right font-mono font-bold"
              />
            </div>

            <div className="flex items-center gap-6 self-end sm:self-auto">
              <div>
                <span className="text-slate-500 block text-[11px]">Subtotal:</span>
                <span className="font-bold text-slate-800 font-mono">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">GST (18%):</span>
                <span className="font-bold text-slate-800 font-mono">₹{taxAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="pl-4 border-l border-slate-300">
                <span className="text-slate-900 font-bold block text-[11px]">Grand Total:</span>
                <span className="text-base font-black text-indigo-700 font-mono">
                  ₹{grandTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions (Collapsible/Standard) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Standard CA Engagement Terms
            </label>
            <textarea
              rows={3}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl border border-slate-300 font-mono text-slate-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving || sendingNow}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Save Proposal Draft</span>
            </button>

            {lead.email && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving || sendingNow}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm shadow-indigo-600/30 disabled:opacity-50"
              >
                {sendingNow ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Save & Dispatch Email</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
