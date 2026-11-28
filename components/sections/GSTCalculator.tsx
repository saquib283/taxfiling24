"use client";

import { useState, useMemo, useEffect, useRef, useId } from "react";
import {
  Search,
  Receipt,
  FileDown,
  FileText,
  ShieldCheck,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Info,
  X,
} from "lucide-react";
import Link from "next/link";
import PageHero from "@/components/layout/PageHero";
import {
  ALL_GST_RATES,
  COMPOSITION_CATEGORIES,
  GST_2_ACTIVE_SLABS,
  GST_2_HSN_PRESETS,
  GST_2_SAC_PRESETS,
  GST_LEGACY_SLABS,
  type CompositionCategory,
  type GstCalcMode,
  type GstPlaceOfSupply,
  type GstTaxScheme,
} from "@/lib/calculators/gst-rules";
import {
  computeGstInvoice,
  computeQuickGst,
  round2,
  type GstInvoiceInput,
  type GstLineItemInput,
  type ItcCreditInput,
} from "@/lib/calculators/gst-engine";

function fmtPaise(v: number): string {
  const sign = v < 0 ? "-" : "";
  const f = new Intl.NumberFormat("en-IN", {
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: "currency",
  }).format(Math.abs(v));
  return `${sign}${f}`;
}

function fmtSec170(v: number): string {
  return new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Math.round(Math.abs(v)));
}

function parseNonNeg(raw: string): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const DEFAULT_INVOICE_ITEM: GstLineItemInput = {
  id: "1",
  name: "CA, Legal & Advisory Services (SAC 9982)",
  unitPrice: 15000,
  quantity: 1,
  gstRate: 18,
  cessRate: 0,
  discount: 0,
};

export default function GSTCalculator({
  content,
}: {
  content?: {
    hero?: { titlePrefix?: string; titleHighlight?: string; description?: string };
    controls?: Record<string, string | undefined>;
    entry?: Record<string, string | undefined>;
    compliance?: Record<string, string | undefined>;
    entries?: Record<string, string | undefined>;
    summary?: Record<string, string | undefined>;
    goodsPresets?: Array<{ hsn?: string; desc?: string; rate?: string; category?: string; isVisible?: boolean }>;
    servicePresets?: Array<{ hsn?: string; desc?: string; rate?: string; category?: string; isVisible?: boolean }>;
  };
}) {
  const uid = useId();
  const hsnBoxRef = useRef<HTMLDivElement>(null);

  // Navigation: Instant Quick Calculator vs Multi-Item Invoice Builder
  const [view, setView] = useState<"quick" | "invoice">("quick");
  const [showLegacyRates, setShowLegacyRates] = useState(false);

  // Quick Calculator State
  const [quickAmount, setQuickAmount] = useState<number>(10000);
  const [quickRate, setQuickRate] = useState<number>(18);
  const [quickMode, setQuickMode] = useState<GstCalcMode>("exclusive");
  const [quickSupply, setQuickSupply] = useState<GstPlaceOfSupply>("intra");

  // Invoice Builder State
  const [calcMode, setCalcMode] = useState<GstCalcMode>("exclusive");
  const [placeOfSupply, setPlaceOfSupply] = useState<GstPlaceOfSupply>("intra");
  const [taxScheme, setTaxScheme] = useState<GstTaxScheme>("regular");
  const [compositionCategory, setCompositionCategory] = useState<CompositionCategory>("trader_manufacturer");
  const [isRcm, setIsRcm] = useState(false);
  const [showMarginMode, setShowMarginMode] = useState(false);
  const [marginPct, setMarginPct] = useState<number>(20);

  // Rule 88A ITC Ledger State
  const [itcMode, setItcMode] = useState<"simple" | "ledger">("simple");
  const [inputPurchases, setInputPurchases] = useState<number>(0);
  const [inputGstRate, setInputGstRate] = useState<number>(18);
  const [purchaseSupplyType, setPurchaseSupplyType] = useState<GstPlaceOfSupply>("intra");
  const [manualItc, setManualItc] = useState<ItcCreditInput>({ igst: 0, cgst: 0, sgst: 0, cess: 0 });

  // HSN / SAC Autocomplete State
  const [activePresetTab, setActivePresetTab] = useState<"goods" | "services">("goods");
  const [hsnSearch, setHsnSearch] = useState("");
  const [showHsnPanel, setShowHsnPanel] = useState(false);

  const [items, setItems] = useState<GstLineItemInput[]>([DEFAULT_INVOICE_ITEM]);
  const [newItem, setNewItem] = useState<GstLineItemInput>({
    id: "",
    name: "",
    unitPrice: 0,
    quantity: 1,
    gstRate: 18,
    cessRate: 0,
    discount: 0,
  });

  // Export states
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Load saved invoice items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("gst_items_v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
        }
      } catch {
        // Ignore invalid persisted JSON
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("gst_items_v2", JSON.stringify(items));
  }, [items]);

  // Dismiss HSN dropdown on outside click or Escape key
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (hsnBoxRef.current && !hsnBoxRef.current.contains(e.target as Node)) {
        setShowHsnPanel(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowHsnPanel(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const goodsPresets = useMemo(() => {
    const cms = (content?.goodsPresets || [])
      .filter((item) => item.isVisible !== false && item.hsn && item.desc && item.category)
      .map((item) => ({
        hsn: item.hsn || "",
        desc: item.desc || "",
        rate: Number(item.rate || 0),
        category: item.category || "",
      }));
    if (cms.length === 0) return GST_2_HSN_PRESETS;
    const seen = new Set(cms.map((c) => `${c.hsn}:${c.desc.toLowerCase()}`));
    return [...cms, ...GST_2_HSN_PRESETS.filter((p) => !seen.has(`${p.hsn}:${p.desc.toLowerCase()}`))];
  }, [content?.goodsPresets]);

  const servicePresets = useMemo(() => {
    const cms = (content?.servicePresets || [])
      .filter((item) => item.isVisible !== false && item.hsn && item.desc && item.category)
      .map((item) => ({
        hsn: item.hsn || "",
        desc: item.desc || "",
        rate: Number(item.rate || 0),
        category: item.category || "",
      }));
    if (cms.length === 0) return GST_2_SAC_PRESETS;
    const seen = new Set(cms.map((c) => `${c.hsn}:${c.desc.toLowerCase()}`));
    return [...cms, ...GST_2_SAC_PRESETS.filter((p) => !seen.has(`${p.hsn}:${p.desc.toLowerCase()}`))];
  }, [content?.servicePresets]);

  const presets = activePresetTab === "goods" ? goodsPresets : servicePresets;
  const filteredPresets = useMemo(() => {
    const q = hsnSearch.trim().toLowerCase();
    if (!q) return presets;
    const rateQ = q.endsWith("%") ? q.slice(0, -1) : q;
    return presets.filter(
      (h) =>
        h.desc.toLowerCase().includes(q) ||
        h.hsn.toLowerCase().includes(q) ||
        h.category.toLowerCase().includes(q) ||
        String(h.rate) === rateQ
    );
  }, [hsnSearch, presets]);

  // Quick Mode Result
  const quickResult = useMemo(
    () =>
      computeQuickGst({
        amount: quickAmount,
        gstRate: quickRate,
        mode: quickMode,
        placeOfSupply: quickSupply,
      }),
    [quickAmount, quickMode, quickRate, quickSupply]
  );

  // Effective ITC Credits
  const effectiveItc = useMemo<ItcCreditInput>(() => {
    if (itcMode === "ledger") return manualItc;
    const totalPurchaseTax = round2(inputPurchases * (inputGstRate / 100));
    if (purchaseSupplyType === "inter") {
      return { igst: totalPurchaseTax, cgst: 0, sgst: 0, cess: 0 };
    }
    const half = round2(totalPurchaseTax / 2);
    return { igst: 0, cgst: half, sgst: round2(totalPurchaseTax - half), cess: 0 };
  }, [inputGstRate, inputPurchases, itcMode, manualItc, purchaseSupplyType]);

  const invoiceInput = useMemo<GstInvoiceInput>(
    () => ({
      items,
      calcMode,
      placeOfSupply,
      taxScheme,
      compositionCategory,
      isRcm,
      showMarginMode,
      marginPct,
      itc: effectiveItc,
    }),
    [calcMode, compositionCategory, effectiveItc, isRcm, items, marginPct, placeOfSupply, showMarginMode, taxScheme]
  );

  const invoiceResult = useMemo(() => computeGstInvoice(invoiceInput), [invoiceInput]);

  const getExportPayload = () => {
    if (view === "quick" || items.length === 0) {
      const quickSynthInput: GstInvoiceInput = {
        items: [
          {
            id: "quick-1",
            name: `Taxable Supply (${quickRate}% GST)`,
            unitPrice: quickMode === "exclusive" ? quickAmount : quickResult.grossTotal,
            quantity: 1,
            gstRate: quickRate,
            cessRate: 0,
            discount: 0,
          },
        ],
        calcMode: quickMode,
        placeOfSupply: quickSupply,
        taxScheme: "regular",
        compositionCategory: "trader_manufacturer",
        isRcm: false,
        showMarginMode: false,
        marginPct: 0,
        itc: { igst: 0, cgst: 0, sgst: 0, cess: 0 },
      };
      return { input: quickSynthInput, result: computeGstInvoice(quickSynthInput) };
    }
    return { input: invoiceInput, result: invoiceResult };
  };

  const downloadPdf = async () => {
    setIsGeneratingPdf(true);
    setExportError(null);
    try {
      const { generateGstReportPdf } = await import("@/lib/generateGstPdf");
      const pdfBytes = await generateGstReportPdf(getExportPayload());
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TaxFiling24_GST_${invoiceResult.documentType}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      console.error("GST PDF generation failed:", err);
      setExportError("Unable to generate GST PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const downloadExcel = async () => {
    setIsGeneratingExcel(true);
    setExportError(null);
    try {
      const { generateGstExcel } = await import("@/lib/generateGstExcel");
      const buffer = await generateGstExcel(getExportPayload());
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TaxFiling24_GST_Computation_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      console.error("GST Excel generation failed:", err);
      setExportError("Unable to export GST Excel workbook. Please try again.");
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const addItem = () => {
    if (newItem.unitPrice <= 0) return;
    setItems((prev) => [
      ...prev,
      {
        ...newItem,
        id: Date.now().toString(),
        name: newItem.name.trim() || `Line Item ${prev.length + 1}`,
        quantity: Math.max(1, Math.floor(newItem.quantity || 1)),
        discount: Math.min(100, Math.max(0, newItem.discount)),
        cessRate: Math.max(0, newItem.cessRate),
      },
    ]);
    setNewItem({ id: "", name: "", unitPrice: 0, quantity: 1, gstRate: 18, cessRate: 0, discount: 0 });
    setHsnSearch("");
    setShowHsnPanel(false);
  };

  const updateItemQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const resetAll = () => {
    if (view === "quick") {
      setQuickAmount(10000);
      setQuickRate(18);
      setQuickMode("exclusive");
      setQuickSupply("intra");
    } else {
      setItems([DEFAULT_INVOICE_ITEM]);
      setCalcMode("exclusive");
      setPlaceOfSupply("intra");
      setTaxScheme("regular");
      setCompositionCategory("trader_manufacturer");
      setIsRcm(false);
      setShowMarginMode(false);
      setInputPurchases(0);
      setManualItc({ igst: 0, cgst: 0, sgst: 0, cess: 0 });
    }
    setExportError(null);
  };

  const visibleSlabs = showLegacyRates
    ? [...GST_2_ACTIVE_SLABS, ...GST_LEGACY_SLABS].sort((a, b) => a.rate - b.rate)
    : GST_2_ACTIVE_SLABS;

  const heroCopy = content?.hero || {};
  const isComposition = invoiceResult.documentType === "BILL_OF_SUPPLY";
  const isRcmActive = invoiceResult.documentType === "RCM_INVOICE";

  return (
    <div className="pb-24 lg:pb-12">
      {/* ─── Unified Editorial Navy Hero ─── */}
      <PageHero
        compact
        align="left"
        title={
          <>
            {heroCopy.titlePrefix || "GST &"}{" "}
            <span className="text-[var(--accent)]">{heroCopy.titleHighlight || "Invoicing Calculator"}</span>
          </>
        }
        description={
          heroCopy.description ||
          "Compute GST 2.0 (0%, 3%, 5%, 18%, 40%) in inclusive or exclusive mode with exact paise precision, Section 10 Composition Bill of Supply, Reverse Charge (RCM), and Rule 88A ITC utilization."
        }
        bottomSlot={
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-white/75">
              <Link href="/" className="hover:text-white transition">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <Link href="/tools" className="hover:text-white transition">
                Tools
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-white font-semibold">GST Calculator</span>
            </nav>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 font-semibold text-[var(--accent)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              GST 2.0 (56th Council • Eff. 22 Sept 2025)
            </span>
          </div>
        }
        rightSlot={
          <div
            role="tablist"
            aria-label="GST Calculator Mode"
            className="inline-flex flex-wrap p-1 rounded-[var(--radius)] bg-white/10 border border-white/15 text-xs font-semibold backdrop-blur-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={view === "quick"}
              onClick={() => setView("quick")}
              className={`px-4 py-2 rounded-[var(--radius-sm)] transition cursor-pointer ${
                view === "quick"
                  ? "bg-white text-[var(--primary)] font-bold shadow-xs"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              Instant Calculator
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={view === "invoice"}
              onClick={() => setView("invoice")}
              className={`px-4 py-2 rounded-[var(--radius-sm)] transition cursor-pointer ${
                view === "invoice"
                  ? "bg-white text-[var(--primary)] font-bold shadow-xs"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              Invoice &amp; ITC Builder
            </button>
          </div>
        }
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* ─── VIEW 1: INSTANT GST CALCULATOR (12-Col Desktop Split!) ─── */}
        {view === "quick" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-sm)] space-y-6">
                {/* Amount + Pricing Mode */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label
                      htmlFor={`${uid}-quick-amt`}
                      className="text-xs font-bold text-[var(--fg)] uppercase tracking-wide"
                    >
                      {quickMode === "exclusive" ? "Base Taxable Amount (₹)" : "GST-Inclusive Total Amount (₹)"}
                    </label>
                    <div
                      role="radiogroup"
                      aria-label="GST Pricing Mode"
                      className="inline-flex flex-wrap gap-1.5 text-xs"
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={quickMode === "exclusive"}
                        onClick={() => setQuickMode("exclusive")}
                        className={`px-3 py-1.5 rounded-[var(--radius-sm)] font-semibold transition cursor-pointer border ${
                          quickMode === "exclusive"
                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                            : "bg-[var(--bg)] text-[var(--fg-soft)] border-[var(--border)] hover:bg-[var(--bg-muted)]"
                        }`}
                      >
                        Add GST (Exclusive)
                      </button>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={quickMode === "inclusive"}
                        onClick={() => setQuickMode("inclusive")}
                        className={`px-3 py-1.5 rounded-[var(--radius-sm)] font-semibold transition cursor-pointer border ${
                          quickMode === "inclusive"
                            ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                            : "bg-[var(--bg)] text-[var(--fg-soft)] border-[var(--border)] hover:bg-[var(--bg-muted)]"
                        }`}
                      >
                        Remove GST (Inclusive)
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <span aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-[var(--fg-muted)]">
                      ₹
                    </span>
                    <input
                      id={`${uid}-quick-amt`}
                      type="number"
                      min={0}
                      inputMode="decimal"
                      value={quickAmount === 0 ? "" : quickAmount}
                      onChange={(e) => setQuickAmount(parseNonNeg(e.target.value))}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="10,000"
                      className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] pl-11 pr-4 py-3.5 text-2xl sm:text-3xl font-extrabold tabular-nums text-[var(--fg)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-[var(--fg-muted)] font-medium mr-1">Presets:</span>
                      {[1000, 5000, 10000, 25000, 50000, 100000, 500000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setQuickAmount(amt)}
                          className={`px-2.5 py-1 rounded-[var(--radius-sm)] text-xs font-semibold tabular-nums border transition cursor-pointer ${
                            quickAmount === amt
                              ? "bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary-border)] font-bold"
                              : "bg-[var(--bg-card)] text-[var(--fg-soft)] border-[var(--border)] hover:bg-[var(--bg)]"
                          }`}
                        >
                          ₹{amt.toLocaleString("en-IN")}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={resetAll}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Reset
                    </button>
                  </div>
                </div>

                {/* GST 2.0 Slab Selector */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[var(--fg)] uppercase tracking-wide">
                      Select Applicable GST 2.0 Tax Slab
                    </span>
                    <label className="inline-flex items-center gap-2 text-xs text-[var(--fg-muted)] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showLegacyRates}
                        onChange={(e) => setShowLegacyRates(e.target.checked)}
                        className="h-3.5 w-3.5 rounded accent-[var(--primary)]"
                      />
                      <span>Show Legacy / Special Slabs (0.25%, 12%, 28%)</span>
                    </label>
                  </div>

                  <div
                    role="radiogroup"
                    aria-label="GST Tax Slab"
                    className={`grid gap-2.5 ${
                      showLegacyRates ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-5"
                    }`}
                  >
                    {visibleSlabs.map((slab) => {
                      const selected = quickRate === slab.rate;
                      return (
                        <button
                          key={slab.rate}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => setQuickRate(slab.rate)}
                          className={`p-3 rounded-[var(--radius)] border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                            selected
                              ? "bg-[var(--primary-soft)] border-[var(--primary)] ring-2 ring-[var(--primary)]/20"
                              : "bg-[var(--bg-card)] border-[var(--border)] hover:border-[var(--primary-border)] hover:bg-[var(--bg)]"
                          }`}
                        >
                          <span
                            className={`text-lg font-black tabular-nums tracking-tight ${
                              selected ? "text-[var(--primary)]" : "text-[var(--fg)]"
                            }`}
                          >
                            {slab.label}
                          </span>
                          <span
                            className={`text-[11px] mt-0.5 leading-tight ${
                              selected ? "text-[var(--primary)] font-semibold" : "text-[var(--fg-muted)]"
                            }`}
                          >
                            {slab.sublabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Place of Supply */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--border)] text-xs">
                  <div>
                    <span className="font-bold text-[var(--fg)] block">Place of Supply</span>
                    <span className="text-[var(--fg-muted)]">
                      Intra-State splits 50/50 into CGST + SGST; Inter-State levies 100% IGST
                    </span>
                  </div>
                  <div
                    role="radiogroup"
                    aria-label="Place of Supply"
                    className="inline-flex flex-wrap p-1 rounded-[var(--radius)] bg-[var(--bg-card)] border border-[var(--border)] font-semibold shrink-0"
                  >
                    <button
                      type="button"
                      role="radio"
                      aria-checked={quickSupply === "intra"}
                      onClick={() => setQuickSupply("intra")}
                      className={`px-3 py-1.5 rounded-[var(--radius-sm)] transition cursor-pointer ${
                        quickSupply === "intra"
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "text-[var(--fg-soft)] hover:text-[var(--fg)]"
                      }`}
                    >
                      Intra-State (CGST+SGST)
                    </button>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={quickSupply === "inter"}
                      onClick={() => setQuickSupply("inter")}
                      className={`px-3 py-1.5 rounded-[var(--radius-sm)] transition cursor-pointer ${
                        quickSupply === "inter"
                          ? "bg-[var(--primary)] text-white shadow-xs"
                          : "text-[var(--fg-soft)] hover:text-[var(--fg)]"
                      }`}
                    >
                      Inter-State (IGST)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sticky Live Breakdown Studio (lg:top-28!) */}
            <div id="gst-summary-studio" className="lg:col-span-5 lg:sticky lg:top-28 space-y-5">
              <div
                aria-live="polite"
                className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-md)] space-y-5 tabular-nums"
              >
                <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                  <div>
                    <span className="text-[11px] font-bold text-[var(--fg-muted)] uppercase tracking-wider block">
                      {quickMode === "exclusive" ? "Grand Total (Post-GST)" : "Net Base Value (Pre-GST)"}
                    </span>
                    <div className="text-3xl sm:text-4xl font-extrabold text-[var(--fg)] mt-1 tracking-tight">
                      {fmtPaise(quickMode === "exclusive" ? quickResult.grossTotal : quickResult.baseAmount)}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-soft)] border border-[var(--primary-border)] px-3 py-1 text-xs font-bold text-[var(--primary)]">
                    {quickRate}% GST
                  </span>
                </div>

                {/* Split Tiles (Exact 2-Decimal Paise Precision!) */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--border)]">
                    <span className="text-xs text-[var(--fg-muted)] font-medium block">Taxable Base</span>
                    <span className="text-base font-bold text-[var(--fg)] mt-1 block">
                      {fmtPaise(quickResult.baseAmount)}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-[var(--radius)] bg-emerald-50 border border-emerald-200">
                    <span className="text-xs text-emerald-800 font-medium block">Total GST ({quickRate}%)</span>
                    <span className="text-base font-bold text-emerald-900 mt-1 block">
                      +{fmtPaise(quickResult.totalGst)}
                    </span>
                  </div>

                  {quickSupply === "intra" ? (
                    <>
                      <div className="p-3.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--border)]">
                        <span className="text-xs text-[var(--fg-muted)] font-medium block">
                          CGST ({quickRate / 2}%)
                        </span>
                        <span className="text-base font-bold text-[var(--primary)] mt-1 block">
                          {fmtPaise(quickResult.cgst)}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--border)]">
                        <span className="text-xs text-[var(--fg-muted)] font-medium block">
                          SGST / UTGST ({quickRate / 2}%)
                        </span>
                        <span className="text-base font-bold text-[var(--primary)] mt-1 block">
                          {fmtPaise(quickResult.sgst)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2 p-3.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--border)]">
                      <span className="text-xs text-[var(--fg-muted)] font-medium block">
                        Integrated GST — IGST ({quickRate}%)
                      </span>
                      <span className="text-base font-bold text-[var(--primary)] mt-1 block">
                        {fmtPaise(quickResult.igst)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Sec 170 Rounded Total Strip */}
                <div className="p-3.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--border)] flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[var(--fg)] block">Invoice Payable (Sec 170 Rounded)</span>
                    <span className="text-[11px] text-[var(--fg-muted)]">
                      Exact: {fmtPaise(quickResult.grossTotal)}
                      {quickResult.roundingDiff !== 0
                        ? ` • Round-off: ${quickResult.roundingDiff > 0 ? "+" : ""}${quickResult.roundingDiff.toFixed(2)}`
                        : ""}
                    </span>
                  </div>
                  <span className="text-xl font-black text-[var(--primary)]">
                    {fmtSec170(quickResult.roundedTotalSec170)}
                  </span>
                </div>

                {exportError ? (
                  <div className="rounded-[var(--radius)] bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{exportError}</span>
                  </div>
                ) : null}

                {/* Exports + Lossless Transfer */}
                <div className="space-y-2.5 pt-1">
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={downloadExcel}
                      disabled={isGeneratingExcel}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg)] text-xs font-semibold text-[var(--fg)] transition cursor-pointer disabled:opacity-50"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      {isGeneratingExcel ? "Exporting..." : "Export Excel"}
                    </button>
                    <button
                      type="button"
                      onClick={downloadPdf}
                      disabled={isGeneratingPdf}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 rounded-[var(--radius)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      {isGeneratingPdf ? "Generating..." : "Download PDF"}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNewItem({
                        id: Date.now().toString(),
                        name: `Taxable Supply (${quickRate}% GST)`,
                        unitPrice: quickResult.baseAmount,
                        quantity: 1,
                        gstRate: quickRate,
                        cessRate: 0,
                        discount: 0,
                      });
                      setCalcMode("exclusive");
                      setPlaceOfSupply(quickSupply);
                      setView("invoice");
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] cursor-pointer"
                  >
                    <span>Transfer Exact Base ({fmtPaise(quickResult.baseAmount)}) to Invoice Builder</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── VIEW 2: MULTI-ITEM INVOICE, COMPOSITION, RCM & RULE 88A ITC BUILDER ─── */}
        {view === "invoice" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Item Entry Card */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5 sm:p-6 shadow-[var(--shadow-sm)] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border)]">
                  <div>
                    <h2 className="text-sm font-bold text-[var(--fg)]">Add Line Item (GST 2.0 HSN / SAC Lookup)</h2>
                    <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                      Updated post-56th Council rates (Cement 18%, Small Cars 18%, Luxury 40%, Insurance 0%)
                    </p>
                  </div>
                  <div
                    role="tablist"
                    aria-label="HSN or SAC Lookup"
                    className="inline-flex p-1 rounded-[var(--radius)] bg-[var(--bg-muted)] border border-[var(--border)] text-xs font-semibold"
                  >
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activePresetTab === "goods"}
                      onClick={() => setActivePresetTab("goods")}
                      className={`px-3 py-1 rounded-[var(--radius-sm)] transition cursor-pointer ${
                        activePresetTab === "goods"
                          ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-xs font-bold"
                          : "text-[var(--fg-muted)]"
                      }`}
                    >
                      Goods (HSN)
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activePresetTab === "services"}
                      onClick={() => setActivePresetTab("services")}
                      className={`px-3 py-1 rounded-[var(--radius-sm)] transition cursor-pointer ${
                        activePresetTab === "services"
                          ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-xs font-bold"
                          : "text-[var(--fg-muted)]"
                      }`}
                    >
                      Services (SAC)
                    </button>
                  </div>
                </div>

                {/* Accessible HSN / SAC Autocomplete (Escape + Outside-click dismiss!) */}
                <div ref={hsnBoxRef} className="relative">
                  <label htmlFor={`${uid}-hsn`} className="sr-only">
                    Search HSN or SAC code
                  </label>
                  <Search aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-muted)]" />
                  <input
                    id={`${uid}-hsn`}
                    type="text"
                    role="combobox"
                    aria-expanded={showHsnPanel}
                    aria-controls={`${uid}-hsn-list`}
                    placeholder={
                      activePresetTab === "goods"
                        ? "Search GST 2.0 goods HSN (e.g. 2523 Cement 18%, 8703 Car, 8471 Laptop)..."
                        : "Search GST 2.0 services SAC (e.g. 9971 Insurance 0%, 9983 SaaS, 9982 CA)..."
                    }
                    value={hsnSearch}
                    onChange={(e) => {
                      setHsnSearch(e.target.value);
                      setShowHsnPanel(true);
                    }}
                    onFocus={() => setShowHsnPanel(true)}
                    className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] pl-10 pr-9 py-2.5 text-xs sm:text-sm text-[var(--fg)] placeholder:text-[var(--fg-muted)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                  />
                  {(hsnSearch || showHsnPanel) && (
                    <button
                      type="button"
                      onClick={() => {
                        setHsnSearch("");
                        setShowHsnPanel(false);
                      }}
                      aria-label="Close HSN suggestions"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--fg-muted)] hover:text-[var(--fg)] cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {showHsnPanel && (
                    <div
                      id={`${uid}-hsn-list`}
                      role="listbox"
                      className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-60 overflow-y-auto rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] p-1.5 shadow-[var(--shadow-xl)]"
                    >
                      {filteredPresets.length === 0 ? (
                        <div className="p-3 text-xs text-[var(--fg-muted)] text-center">
                          No presets found matching &quot;{hsnSearch}&quot;
                        </div>
                      ) : (
                        filteredPresets.map((item) => (
                          <button
                            key={`${item.hsn}-${item.desc}`}
                            type="button"
                            role="option"
                            aria-selected={false}
                            onClick={() => {
                              setNewItem((prev) => ({
                                ...prev,
                                gstRate: item.rate,
                                name: `${item.desc} (${activePresetTab === "goods" ? "HSN" : "SAC"} ${item.hsn})`,
                              }));
                              setHsnSearch(item.desc);
                              setShowHsnPanel(false);
                            }}
                            className="w-full p-2.5 rounded-[var(--radius-sm)] text-left hover:bg-[var(--bg)] transition flex items-center justify-between gap-2 text-xs cursor-pointer"
                          >
                            <div>
                              <span className="font-semibold text-[var(--fg)]">{item.desc}</span>
                              <span className="ml-2 font-mono text-[10px] text-[var(--fg-muted)] bg-[var(--bg-muted)] px-1.5 py-0.5 rounded">
                                {item.hsn}
                              </span>
                              <span className="ml-1.5 text-[10px] text-[var(--fg-muted)]">
                                {item.category}
                              </span>
                            </div>
                            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200 shrink-0 tabular-nums">
                              {item.rate}% GST
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Line Item Form Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label htmlFor={`${uid}-item-name`} className="text-xs font-semibold text-[var(--fg)] block mb-1">
                      Item Description / HSN *
                    </label>
                    <input
                      id={`${uid}-item-name`}
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="e.g. Cloud Advisory Services (SAC 9983)"
                      className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs sm:text-sm text-[var(--fg)] outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-item-price`} className="text-xs font-semibold text-[var(--fg)] block mb-1">
                      Unit Price (₹) *
                    </label>
                    <input
                      id={`${uid}-item-price`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={newItem.unitPrice === 0 ? "" : newItem.unitPrice}
                      onChange={(e) => setNewItem({ ...newItem, unitPrice: parseNonNeg(e.target.value) })}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="10,000"
                      className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs sm:text-sm font-semibold tabular-nums text-[var(--fg)] outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label htmlFor={`${uid}-item-qty`} className="font-semibold text-[var(--fg)] block mb-1">
                      Qty
                    </label>
                    <input
                      id={`${uid}-item-qty`}
                      type="number"
                      min={1}
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: Math.max(1, Math.floor(parseNonNeg(e.target.value) || 1)) })}
                      onWheel={(e) => e.currentTarget.blur()}
                      className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 tabular-nums text-[var(--fg)] outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-item-rate`} className="font-semibold text-[var(--fg)] block mb-1">
                      GST Rate
                    </label>
                    <select
                      id={`${uid}-item-rate`}
                      value={newItem.gstRate}
                      disabled={isComposition}
                      onChange={(e) => setNewItem({ ...newItem, gstRate: Number(e.target.value) })}
                      className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-2 font-semibold tabular-nums text-[var(--fg)] outline-none focus:border-[var(--primary)] disabled:opacity-50"
                    >
                      {ALL_GST_RATES.map((r) => (
                        <option key={r} value={r}>
                          {r}%{r === 12 || r === 28 ? " (Legacy)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`${uid}-item-disc`} className="font-semibold text-[var(--fg)] block mb-1">
                      Discount %
                    </label>
                    <input
                      id={`${uid}-item-disc`}
                      type="number"
                      min={0}
                      max={100}
                      value={newItem.discount === 0 ? "" : newItem.discount}
                      onChange={(e) => setNewItem({ ...newItem, discount: Math.min(100, parseNonNeg(e.target.value)) })}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="0"
                      className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 tabular-nums text-[var(--fg)] outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-item-cess`} className="font-semibold text-[var(--fg)] block mb-1">
                      Cess %
                    </label>
                    <input
                      id={`${uid}-item-cess`}
                      type="number"
                      min={0}
                      max={200}
                      disabled={isComposition}
                      value={newItem.cessRate === 0 ? "" : newItem.cessRate}
                      onChange={(e) => setNewItem({ ...newItem, cessRate: Math.min(200, parseNonNeg(e.target.value)) })}
                      onWheel={(e) => e.currentTarget.blur()}
                      placeholder="0"
                      className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 tabular-nums text-[var(--fg)] outline-none focus:border-[var(--primary)] disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={addItem}
                    disabled={newItem.unitPrice <= 0}
                    className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-5 py-2.5 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Add to {isComposition ? "Bill of Supply" : "Invoice"}
                  </button>
                </div>
              </div>

              {/* Invoice Entries Table */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] shadow-[var(--shadow-sm)] overflow-hidden">
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[var(--fg)]">
                    {isComposition ? "Bill of Supply Entries" : "Invoice Line Items"} ({items.length})
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={resetAll}
                      className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg)] font-semibold cursor-pointer"
                    >
                      Reset
                    </button>
                    {items.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setItems([])}
                        className="text-xs text-rose-700 hover:text-rose-900 font-semibold cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {items.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--fg-muted)]">
                    No line items yet. Add goods or services using the form above.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs tabular-nums">
                      <thead>
                        <tr className="bg-[var(--bg)] border-b border-[var(--border)] text-[var(--fg-muted)] font-semibold">
                          <th className="py-2.5 px-4">Item</th>
                          <th className="py-2.5 px-2 text-center">Qty</th>
                          <th className="py-2.5 px-3 text-right">Unit Price</th>
                          <th className="py-2.5 px-2 text-right">Disc</th>
                          <th className="py-2.5 px-2 text-right">Tax</th>
                          <th className="py-2.5 px-4 text-right">Total</th>
                          <th className="py-2.5 px-2 text-center">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border)]">
                        {invoiceResult.items.map((item) => (
                          <tr key={item.id} className="hover:bg-[var(--bg)]/60">
                            <td className="py-3 px-4 font-semibold text-[var(--fg)] max-w-[190px] truncate" title={item.name}>
                              {item.name}
                            </td>
                            <td className="py-2 px-2">
                              <div className="inline-flex items-center justify-center gap-1 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)]">
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(item.id, -1)}
                                  aria-label={`Decrease quantity for ${item.name}`}
                                  className="h-7 w-7 inline-flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--fg)] cursor-pointer"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="min-w-[20px] text-center font-bold text-[var(--fg)]">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateItemQty(item.id, 1)}
                                  aria-label={`Increase quantity for ${item.name}`}
                                  className="h-7 w-7 inline-flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--fg)] cursor-pointer"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right text-[var(--fg-muted)]">{fmtPaise(item.unitPrice)}</td>
                            <td className="py-3 px-2 text-right text-[var(--fg-muted)]">
                              {item.discount > 0 ? `${item.discount}%` : "—"}
                            </td>
                            <td className="py-3 px-2 text-right font-semibold text-emerald-800 whitespace-nowrap">
                              {isComposition ? "0% (BoS)" : `${item.gstRate}%${item.cessRate > 0 ? `+${item.cessRate}%` : ""}`}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-[var(--fg)]">{fmtPaise(item.total)}</td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                aria-label={`Remove ${item.name}`}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-[var(--fg-muted)] hover:bg-rose-50 hover:text-rose-700 cursor-pointer transition"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Tax Scheme, Pricing Mode, RCM & Rule 88A ITC Controls */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)] space-y-5 text-xs">
                <h2 className="text-sm font-bold text-[var(--fg)] pb-2 border-b border-[var(--border)]">
                  Statutory Scheme, RCM &amp; Rule 88A Input Tax Credit (ITC)
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={`${uid}-scheme`} className="font-semibold text-[var(--fg)] block mb-1.5">
                      GST Registration Scheme
                    </label>
                    <select
                      id={`${uid}-scheme`}
                      value={taxScheme}
                      onChange={(e) => setTaxScheme(e.target.value as GstTaxScheme)}
                      className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-[var(--fg)] font-semibold outline-none focus:border-[var(--primary)]"
                    >
                      <option value="regular">Regular Scheme (Tax Invoice + ITC)</option>
                      <option value="composition">Composition Scheme — Sec 10 (Bill of Supply)</option>
                    </select>
                  </div>

                  {isComposition ? (
                    <div>
                      <label htmlFor={`${uid}-comp-cat`} className="font-semibold text-[var(--fg)] block mb-1.5">
                        Composition Taxpayer Category
                      </label>
                      <select
                        id={`${uid}-comp-cat`}
                        value={compositionCategory}
                        onChange={(e) => setCompositionCategory(e.target.value as CompositionCategory)}
                        className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-[var(--fg)] font-semibold outline-none focus:border-[var(--primary)]"
                      >
                        {Object.values(COMPOSITION_CATEGORIES).map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[11px] text-[var(--fg-muted)]">
                        {COMPOSITION_CATEGORIES[compositionCategory].section} • {COMPOSITION_CATEGORIES[compositionCategory].turnoverCap}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor={`${uid}-pos`} className="font-semibold text-[var(--fg)] block mb-1.5">
                        Place of Supply
                      </label>
                      <select
                        id={`${uid}-pos`}
                        value={placeOfSupply}
                        onChange={(e) => setPlaceOfSupply(e.target.value as GstPlaceOfSupply)}
                        className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-[var(--fg)] font-semibold outline-none focus:border-[var(--primary)]"
                      >
                        <option value="intra">Intra-State (CGST 50% + SGST 50%)</option>
                        <option value="inter">Inter-State (IGST 100%)</option>
                      </select>
                    </div>
                  )}
                </div>

                {isComposition ? (
                  <div className="rounded-[var(--radius)] bg-amber-50 border border-amber-200 p-3 text-amber-950 flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>Section 10 Composition Rules Applied:</strong> You issue a <strong>Bill of Supply</strong> (₹0 GST collected from buyer), cannot make Inter-State outward supplies (Sec 10(2)(c)), cannot claim ITC (Sec 10(4)), and pay <strong>{invoiceResult.compositionRate}%</strong> out of pocket on taxable turnover.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Wired Pricing Mode & RCM & Margin Toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--border)]">
                      <div>
                        <span className="font-semibold text-[var(--fg)] block mb-1.5">Unit Price Mode</span>
                        <div className="inline-flex w-full p-1 rounded-[var(--radius)] bg-[var(--bg-muted)] border border-[var(--border)]">
                          <button
                            type="button"
                            onClick={() => setCalcMode("exclusive")}
                            className={`flex-1 py-1 rounded-[var(--radius-sm)] font-semibold cursor-pointer ${
                              calcMode === "exclusive" ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-xs" : "text-[var(--fg-muted)]"
                            }`}
                          >
                            Exclusive
                          </button>
                          <button
                            type="button"
                            onClick={() => setCalcMode("inclusive")}
                            className={`flex-1 py-1 rounded-[var(--radius-sm)] font-semibold cursor-pointer ${
                              calcMode === "inclusive" ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-xs" : "text-[var(--fg-muted)]"
                            }`}
                          >
                            Inclusive
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--border)]">
                        <div>
                          <span className="font-semibold text-[var(--fg)] block">Reverse Charge (RCM)</span>
                          <span className="text-[10px] text-[var(--fg-muted)]">Sec 9(3) / 49(4) Cash</span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isRcm}
                          onClick={() => setIsRcm((v) => !v)}
                          className={`px-2.5 py-1 rounded-[var(--radius-sm)] font-bold cursor-pointer ${
                            isRcm ? "bg-amber-600 text-white" : "bg-[var(--bg-muted)] text-[var(--fg)]"
                          }`}
                        >
                          {isRcm ? "ON" : "OFF"}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--border)]">
                        <div>
                          <span className="font-semibold text-[var(--fg)] block">Profit Markup</span>
                          <span className="text-[10px] text-[var(--fg-muted)]">Add % over cost</span>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={showMarginMode}
                          onClick={() => setShowMarginMode((v) => !v)}
                          className={`px-2.5 py-1 rounded-[var(--radius-sm)] font-bold cursor-pointer ${
                            showMarginMode ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-muted)] text-[var(--fg)]"
                          }`}
                        >
                          {showMarginMode ? `${marginPct}%` : "OFF"}
                        </button>
                      </div>
                    </div>

                    {showMarginMode ? (
                      <div className="flex items-center gap-3 p-3 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--border)]">
                        <label htmlFor={`${uid}-margin-pct`} className="font-semibold text-[var(--fg)] shrink-0">
                          Markup % on Unit Cost:
                        </label>
                        <input
                          id={`${uid}-margin-pct`}
                          type="number"
                          min={0}
                          max={500}
                          value={marginPct}
                          onChange={(e) => setMarginPct(Math.min(500, parseNonNeg(e.target.value)))}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="w-24 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-1 font-bold tabular-nums text-[var(--fg)]"
                        />
                        <span className="text-[var(--fg-muted)]">
                          Estimated Profit: <strong className="text-emerald-700">{fmtPaise(invoiceResult.estimatedMarginProfit)}</strong>
                        </span>
                      </div>
                    ) : null}

                    {/* Rule 88A ITC Ledger Section (Disabled under RCM u/s 49(4)) */}
                    {isRcm ? (
                      <div className="rounded-[var(--radius)] bg-amber-50 border border-amber-200 p-3 text-amber-950 flex items-start gap-2">
                        <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                        <p>
                          <strong>Reverse Charge Mechanism (Sec 9(3) &amp; Sec 49(4)):</strong> Output tax liability shifts to the recipient, who must pay <strong>100% strictly via Electronic Cash Ledger</strong> (ITC cannot discharge RCM output tax).
                        </p>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-[var(--border)] space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-bold text-[var(--fg)]">Input Tax Credit (Rule 88A Order)</span>
                          <div className="inline-flex p-0.5 rounded-[var(--radius-sm)] bg-[var(--bg-muted)] border border-[var(--border)] text-[11px] font-semibold">
                            <button
                              type="button"
                              onClick={() => setItcMode("simple")}
                              className={`px-2.5 py-1 rounded-[var(--radius-sm)] cursor-pointer ${
                                itcMode === "simple" ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-xs" : "text-[var(--fg-muted)]"
                              }`}
                            >
                              By Purchases
                            </button>
                            <button
                              type="button"
                              onClick={() => setItcMode("ledger")}
                              className={`px-2.5 py-1 rounded-[var(--radius-sm)] cursor-pointer ${
                                itcMode === "ledger" ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-xs" : "text-[var(--fg-muted)]"
                              }`}
                            >
                              Exact Credit Ledger
                            </button>
                          </div>
                        </div>

                        {itcMode === "simple" ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label htmlFor={`${uid}-purch`} className="font-semibold text-[var(--fg)] block mb-1">
                                Eligible Purchases (₹)
                              </label>
                              <input
                                id={`${uid}-purch`}
                                type="number"
                                min={0}
                                value={inputPurchases === 0 ? "" : inputPurchases}
                                onChange={(e) => setInputPurchases(parseNonNeg(e.target.value))}
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="0"
                                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 tabular-nums text-[var(--fg)] outline-none focus:border-[var(--primary)]"
                              />
                            </div>
                            <div>
                              <label htmlFor={`${uid}-purch-rate`} className="font-semibold text-[var(--fg)] block mb-1">
                                Input GST Rate %
                              </label>
                              <select
                                id={`${uid}-purch-rate`}
                                value={inputGstRate}
                                onChange={(e) => setInputGstRate(Number(e.target.value))}
                                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-2 tabular-nums text-[var(--fg)] outline-none focus:border-[var(--primary)]"
                              >
                                {ALL_GST_RATES.map((r) => (
                                  <option key={r} value={r}>
                                    {r}%
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label htmlFor={`${uid}-purch-pos`} className="font-semibold text-[var(--fg)] block mb-1">
                                Purchase Supply Type
                              </label>
                              <select
                                id={`${uid}-purch-pos`}
                                value={purchaseSupplyType}
                                onChange={(e) => setPurchaseSupplyType(e.target.value as GstPlaceOfSupply)}
                                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-2 text-[var(--fg)] outline-none focus:border-[var(--primary)]"
                              >
                                <option value="intra">Intra-State (CGST+SGST ITC)</option>
                                <option value="inter">Inter-State (IGST ITC)</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {(
                              [
                                { key: "igst", label: "IGST ITC (₹)" },
                                { key: "cgst", label: "CGST ITC (₹)" },
                                { key: "sgst", label: "SGST ITC (₹)" },
                                { key: "cess", label: "Cess ITC (₹)" },
                              ] as Array<{ key: keyof ItcCreditInput; label: string }>
                            ).map((field) => (
                              <div key={field.key}>
                                <label htmlFor={`${uid}-itc-${field.key}`} className="font-semibold text-[var(--fg)] block mb-1">
                                  {field.label}
                                </label>
                                <input
                                  id={`${uid}-itc-${field.key}`}
                                  type="number"
                                  min={0}
                                  value={manualItc[field.key] === 0 ? "" : manualItc[field.key]}
                                  onChange={(e) =>
                                    setManualItc((prev) => ({ ...prev, [field.key]: parseNonNeg(e.target.value) }))
                                  }
                                  onWheel={(e) => e.currentTarget.blur()}
                                  placeholder="0"
                                  className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-2.5 py-2 tabular-nums text-[var(--fg)] outline-none focus:border-[var(--primary)]"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="text-[11px] text-[var(--fg-muted)]">
                          Rule 88A enforced: IGST credit exhausts first; CGST credit never offsets SGST (and vice versa); Cess offsets Cess only.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right Sticky Invoice Summary Studio (lg:top-28!) */}
            <div id="gst-summary-studio" className="lg:col-span-5 lg:sticky lg:top-28 space-y-5">
              <div
                aria-live="polite"
                className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-md)] space-y-5 tabular-nums"
              >
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-[var(--border)]">
                  <div>
                    <span className="text-[11px] font-bold text-[var(--fg-muted)] uppercase tracking-wider block">
                      {invoiceResult.effectivePlaceOfSupply === "intra" ? "Intra-State (CGST/SGST)" : "Inter-State (IGST)"}
                    </span>
                    <span className="text-sm font-extrabold text-[var(--fg)]">{invoiceResult.documentLabel}</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      isComposition || isRcmActive
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    }`}
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    {isComposition ? "Bill of Supply" : isRcmActive ? "RCM" : "Tax Invoice"}
                  </span>
                </div>

                {/* Grand Total */}
                <div className="text-center py-1">
                  <span className="text-[11px] font-bold text-[var(--fg-muted)] uppercase tracking-wider block">
                    {isComposition ? "Bill of Supply Total (Buyer Pays)" : "Grand Total Invoice Value"}
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-[var(--fg)] mt-1 tracking-tight">
                    {fmtPaise(invoiceResult.grandTotalExact)}
                  </div>
                  <p className="text-xs text-[var(--fg-muted)] mt-1">
                    {isComposition
                      ? "₹0 GST charged on Bill of Supply (Sec 10(4))"
                      : `Sec 170 Rounded Total: ${fmtSec170(invoiceResult.grandTotalRoundedSec170)}`}
                  </p>
                </div>

                {/* Breakdown Lines */}
                <div className="space-y-2 pt-2 border-t border-[var(--border)] text-xs">
                  <div className="flex justify-between text-[var(--fg-muted)]">
                    <span>Net Taxable Turnover</span>
                    <span className="font-semibold text-[var(--fg)]">{fmtPaise(invoiceResult.subTotal)}</span>
                  </div>
                  {invoiceResult.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Pre-Supply Discount (Sec 15(3))</span>
                      <span className="font-semibold">-{fmtPaise(invoiceResult.totalDiscount)}</span>
                    </div>
                  )}

                  {!isComposition && (
                    <>
                      <div className="flex justify-between text-[var(--fg-muted)]">
                        <span>Total GST Levied</span>
                        <span className="font-semibold text-[var(--fg)]">{fmtPaise(invoiceResult.totalGst)}</span>
                      </div>
                      {invoiceResult.effectivePlaceOfSupply === "intra" ? (
                        <>
                          <div className="flex justify-between text-[var(--fg-muted)] pl-3">
                            <span>• CGST (50%)</span>
                            <span>{fmtPaise(invoiceResult.cgst)}</span>
                          </div>
                          <div className="flex justify-between text-[var(--fg-muted)] pl-3">
                            <span>• SGST / UTGST (50%)</span>
                            <span>{fmtPaise(invoiceResult.sgst)}</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-[var(--fg-muted)] pl-3">
                          <span>• IGST (100%)</span>
                          <span>{fmtPaise(invoiceResult.igst)}</span>
                        </div>
                      )}
                      {invoiceResult.totalCess > 0 && (
                        <div className="flex justify-between text-amber-800">
                          <span>Compensation Cess (Separate Head)</span>
                          <span className="font-semibold">{fmtPaise(invoiceResult.totalCess)}</span>
                        </div>
                      )}
                    </>
                  )}

                  {!isComposition && !isRcmActive && invoiceResult.rule88A.utilized.totalUtilized > 0 && (
                    <div className="flex justify-between text-emerald-700 pt-1">
                      <span>Less: Rule 88A ITC Offset</span>
                      <span className="font-bold">-{fmtPaise(invoiceResult.rule88A.utilized.totalUtilized)}</span>
                    </div>
                  )}

                  {!isComposition && !isRcmActive && invoiceResult.rule88A.carryForward.total > 0 && (
                    <div className="flex justify-between text-[var(--primary)] bg-[var(--primary-soft)] px-2.5 py-1.5 rounded-[var(--radius-sm)]">
                      <span>Credit Ledger Carry-Forward</span>
                      <span className="font-bold">{fmtPaise(invoiceResult.rule88A.carryForward.total)}</span>
                    </div>
                  )}

                  {isComposition && (
                    <div className="flex justify-between text-[var(--fg-muted)] pt-1">
                      <span>Composition Levy ({invoiceResult.compositionRate}% out-of-pocket)</span>
                      <span className="font-semibold text-[var(--fg)]">
                        {fmtPaise(invoiceResult.compositionCgst)} CGST + {fmtPaise(invoiceResult.compositionSgst)} SGST
                      </span>
                    </div>
                  )}

                  {/* Net Cash Callout */}
                  {isRcmActive ? (
                    <div className="p-3.5 rounded-[var(--radius)] bg-amber-50 border border-amber-200 flex justify-between items-center mt-2">
                      <div>
                        <span className="font-bold text-amber-950 block">Recipient RCM Cash Liability</span>
                        <span className="text-[10px] text-amber-800">Supplier Cash: ₹0.00 • Exact: {fmtPaise(invoiceResult.recipientRcmCashLiabilityExact)}</span>
                      </div>
                      <span className="text-xl font-black text-amber-900">
                        {fmtSec170(invoiceResult.recipientRcmCashLiabilityRounded)}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-[var(--radius)] bg-emerald-50 border border-emerald-200 flex justify-between items-center mt-2">
                      <div>
                        <span className="font-bold text-emerald-950 block">
                          {isComposition ? "Composition Cash Tax (Sec 10)" : "Net GST Cash Payable (Sec 170)"}
                        </span>
                        <span className="text-[10px] text-emerald-800">
                          Exact: {fmtPaise(invoiceResult.supplierCashLiabilityExact)}
                          {!isComposition && invoiceResult.rule88A.cashPayable.cess > 0
                            ? ` (incl. ${fmtPaise(invoiceResult.rule88A.cashPayable.cess)} Cess)`
                            : ""}
                        </span>
                      </div>
                      <span className="text-xl font-black text-emerald-900">
                        {fmtSec170(invoiceResult.supplierCashLiabilityRounded)}
                      </span>
                    </div>
                  )}
                </div>

                {exportError ? (
                  <div className="rounded-[var(--radius)] bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{exportError}</span>
                  </div>
                ) : null}

                {/* Exports */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={downloadExcel}
                    disabled={isGeneratingExcel}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg)] text-xs font-semibold text-[var(--fg)] transition cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {isGeneratingExcel ? "Generating..." : "Export Excel"}
                  </button>
                  <button
                    type="button"
                    onClick={downloadPdf}
                    disabled={isGeneratingPdf}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 rounded-[var(--radius)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    {isGeneratingPdf ? "Generating..." : "Download PDF"}
                  </button>
                </div>
              </div>

              {/* GST Filing Advisory Callout */}
              <div className="rounded-[var(--radius-lg)] border border-[var(--primary-border)] bg-[var(--primary-soft)] p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-[var(--radius)] bg-[var(--primary)] text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--fg)]">Monthly GST Filing &amp; GSTR-2B Reconciliation</h3>
                    <p className="text-xs text-[var(--fg-muted)] mt-0.5 leading-relaxed">
                      Avoid late fees u/s 47 and Rule 88A mismatch notices. Our CA desk reconciles GSTR-2B ITC and files GSTR-1 / 3B accurately.
                    </p>
                  </div>
                </div>
                <Link
                  href="/services/taxation-gst-compliance-management"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)]"
                >
                  <span>Explore GST Management Services</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Mobile Sticky Live Summary Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur-md px-4 py-3 shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto tabular-nums">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fg-muted)] block">
              {view === "quick"
                ? `Total GST (${quickRate}%)`
                : isRcmActive
                  ? "Recipient RCM Cash"
                  : isComposition
                    ? "Composition Cash Tax"
                    : "Net GST Cash Payable"}
            </span>
            <span className="text-base font-black text-[var(--primary)]">
              {view === "quick"
                ? fmtPaise(quickResult.totalGst)
                : fmtSec170(isRcmActive ? invoiceResult.recipientRcmCashLiabilityRounded : invoiceResult.supplierCashLiabilityRounded)}
            </span>
          </div>
          <a
            href="#gst-summary-studio"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius)] bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white"
          >
            View Breakdown
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
