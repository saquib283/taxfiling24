"use client";

import { useState, useMemo, useId } from "react";
import {
  Briefcase,
  ShieldCheck,
  Landmark,
  Target,
  FileDown,
  FileText,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Info,
  RotateCcw,
  AlertCircle,
  CalendarClock,
  Globe,
} from "lucide-react";
import Link from "next/link";
import PageHero from "@/components/layout/PageHero";
import {
  DEFAULT_TAX_YEAR,
  TAX_YEAR_CONFIGS,
  TAX_YEAR_ORDER,
  type AgeGroup,
  type BusinessTaxMode,
  type ResidencyStatus,
  type TaxYearKey,
} from "@/lib/calculators/income-tax-rules";
import { computeIncomeTax, type IncomeTaxInput } from "@/lib/calculators/income-tax-engine";

function formatINR(val: number): string {
  const sign = val < 0 ? "-" : "";
  const formatted = new Intl.NumberFormat("en-IN", {
    currency: "INR",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Math.round(Math.abs(val)));
  return `${sign}${formatted}`;
}

function formatIndianWords(val: number): string | null {
  if (!Number.isFinite(val) || val < 100000) return null;
  if (val >= 10000000) {
    return `= ₹${(val / 10000000).toFixed(2)} Crore`;
  }
  return `= ₹${(val / 100000).toFixed(2)} Lakhs`;
}

function parseNonNeg(raw: string): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function MoneyInput({
  id,
  label,
  value,
  onChange,
  placeholder = "0",
  helper,
  large = false,
  showWords = false,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (val: number) => void;
  placeholder?: string;
  helper?: string;
  large?: boolean;
  showWords?: boolean;
}) {
  const helperId = helper ? `${id}-help` : undefined;
  const wordsHint = showWords ? formatIndianWords(value) : null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <label htmlFor={id} className="text-xs font-semibold text-[var(--fg)] block">
          {label}
        </label>
        {wordsHint ? (
          <span className="text-[11px] font-semibold text-[var(--primary)] tabular-nums shrink-0">
            {wordsHint}
          </span>
        ) : null}
      </div>
      <div className="relative">
        <span
          aria-hidden="true"
          className={`absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-[var(--fg-muted)] ${
            large ? "text-sm" : "text-xs"
          }`}
        >
          ₹
        </span>
        <input
          id={id}
          type="number"
          min={0}
          inputMode="numeric"
          value={value === 0 ? "" : value}
          onChange={(e) => onChange(parseNonNeg(e.target.value))}
          onWheel={(e) => e.currentTarget.blur()}
          placeholder={placeholder}
          aria-describedby={helperId}
          className={`w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] tabular-nums text-[var(--fg)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15 transition ${
            large ? "pl-8 pr-4 py-2.5 text-base font-bold" : "pl-7 pr-3 py-2 text-xs sm:text-sm font-semibold"
          }`}
        />
      </div>
      {helper ? (
        <p id={helperId} className="mt-1 text-[11px] text-[var(--fg-muted)] leading-snug">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

const INITIAL_STATE: IncomeTaxInput = {
  taxYear: DEFAULT_TAX_YEAR,
  ageGroup: "citizen",
  residency: "resident",
  salary: 1200000,
  rentalIncome: 0,
  homeLoanInterestLetOut: 0,
  homeLoanInterestSelfOccupied: 0,
  otherIncome: 0,
  businessMode: "regular",
  professionalIncome: 0,
  businessExpenses: 0,
  stcgEquity: 0,
  ltcgEquity: 0,
  stcgOther: 0,
  ltcgOther: 0,
  ltcgOtherUseIndexation: false,
  useHraAssistant: false,
  basicSalary: 600000,
  hraReceived: 240000,
  rentPaid: 200000,
  isMetro: true,
  manualHraExemption: 0,
  employerNps80CCD2: 0,
  deduction80C: 150000,
  deduction80D: 25000,
  deduction80DParents: 0,
  parentsSenior: false,
  deductionNPS80CCD1B: 0,
  savingsInterestDeduction: 0,
  deduction80E: 0,
  deduction80G: 0,
  otherDeductions: 0,
  taxPaid: 0,
  monthsDelay234A: 0,
  monthsDelay234B: 0,
};

export default function TaxCalculator({
  content,
}: {
  content?: {
    hero?: {
      titlePrefix?: string;
      titleHighlight?: string;
      description?: string;
    };
    income?: Record<string, string | undefined>;
    deductions?: Record<string, string | undefined>;
    compliance?: Record<string, string | undefined>;
    results?: Record<string, string | undefined>;
  };
}) {
  const uid = useId();
  const [form, setForm] = useState<IncomeTaxInput>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<"income" | "deductions" | "compliance">("income");
  const [showBusinessPanel, setShowBusinessPanel] = useState(false);
  const [showCgPanel, setShowCgPanel] = useState(false);
  const [showHraPanel, setShowHraPanel] = useState(false);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const update = <K extends keyof IncomeTaxInput>(key: K, val: IncomeTaxInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleReset = () => {
    setForm({ ...INITIAL_STATE, taxYear: form.taxYear });
    setShowBusinessPanel(false);
    setShowCgPanel(false);
    setShowHraPanel(false);
    setExportError(null);
  };

  const result = useMemo(() => computeIncomeTax(form), [form]);
  const { config, oldRegime, newRegime } = result;

  const downloadPdf = async () => {
    setIsGeneratingPdf(true);
    setExportError(null);
    try {
      const { generateTaxReportPdf } = await import("@/lib/generateTaxPdf");
      const pdfBytes = await generateTaxReportPdf({ input: form, result });
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TaxFiling24_TaxReport_${form.taxYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setExportError("Unable to generate PDF report. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const downloadExcel = async () => {
    setIsGeneratingExcel(true);
    setExportError(null);
    try {
      const { generateTaxExcel } = await import("@/lib/generateTaxExcel");
      const buffer = await generateTaxExcel({ input: form, result });
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TaxFiling24_TaxComputation_${form.taxYear}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (err) {
      console.error("Excel generation failed:", err);
      setExportError("Unable to export Excel workbook. Please try again.");
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const maxRegimeTax = Math.max(oldRegime.totalTax, newRegime.totalTax, 1);
  const oldBarPct = Math.round((oldRegime.totalTax / maxRegimeTax) * 100);
  const newBarPct = Math.round((newRegime.totalTax / maxRegimeTax) * 100);
  const heroCopy = content?.hero || {};
  const dynamicHeroHighlight =
    !heroCopy.titleHighlight || /^(FY|TY)\s*202\d-\d{2}$/i.test(heroCopy.titleHighlight.trim())
      ? config.shortLabel
      : heroCopy.titleHighlight;
  const totalSpecialCg = form.stcgEquity + form.ltcgEquity + form.stcgOther + form.ltcgOther;

  return (
    <div className="pb-24 lg:pb-12">
      {/* ─── Unified Editorial Navy Hero ─── */}
      <PageHero
        compact
        align="left"
        title={
          <>
            {heroCopy.titlePrefix || "Income Tax"}{" "}
            <span className="text-[var(--accent)]">{dynamicHeroHighlight}</span>
          </>
        }
        description={
          heroCopy.description ||
          "Compare Old vs. New Tax Regime with statutory slab rates, Section 87A / 156 rebate & marginal relief, surcharge caps, HRA, capital gains, and printable CA computation reports."
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
              <span className="text-white font-semibold">Income Tax Calculator</span>
            </nav>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 font-semibold text-[var(--accent)]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {config.badgeText}
            </span>
          </div>
        }
        rightSlot={
          <div
            role="radiogroup"
            aria-label="Select Tax Year"
            className="inline-flex flex-wrap p-1 rounded-[var(--radius)] bg-white/10 border border-white/15 text-xs font-semibold backdrop-blur-xs"
          >
            {TAX_YEAR_ORDER.map((yr: TaxYearKey) => {
              const selected = form.taxYear === yr;
              return (
                <button
                  key={yr}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => update("taxYear", yr)}
                  className={`px-3.5 py-2 rounded-[var(--radius-sm)] transition cursor-pointer ${
                    selected
                      ? "bg-white text-[var(--primary)] font-bold shadow-xs"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {TAX_YEAR_CONFIGS[yr].shortLabel}
                </button>
              );
            })}
          </div>
        }
      />

      {/* ─── Workbench Container ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Global Taxpayer Context Strip */}
        <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-[var(--shadow-sm)] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Age Group */}
              <div
                role="radiogroup"
                aria-label="Taxpayer Age Group"
                className="inline-flex p-1 rounded-[var(--radius)] bg-[var(--bg-muted)] border border-[var(--border)] text-xs font-medium"
              >
                {(
                  [
                    { id: "citizen", label: "< 60 Yrs" },
                    { id: "senior", label: "60–80 Senior" },
                    { id: "super-senior", label: "80+ Super Senior" },
                  ] as Array<{ id: AgeGroup; label: string }>
                ).map((item) => {
                  const active = form.ageGroup === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => update("ageGroup", item.id)}
                      className={`px-3 py-1.5 rounded-[var(--radius-sm)] transition cursor-pointer ${
                        active
                          ? "bg-[var(--bg-card)] text-[var(--primary)] font-bold shadow-xs border border-[var(--border)]"
                          : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Residency */}
              <div
                role="radiogroup"
                aria-label="Residency Status"
                className="inline-flex p-1 rounded-[var(--radius)] bg-[var(--bg-muted)] border border-[var(--border)] text-xs font-medium"
              >
                {(
                  [
                    { id: "resident", label: "Resident" },
                    { id: "nri", label: "NRI" },
                  ] as Array<{ id: ResidencyStatus; label: string }>
                ).map((item) => {
                  const active = form.residency === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => update("residency", item.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-sm)] transition cursor-pointer ${
                        active
                          ? "bg-[var(--bg-card)] text-[var(--primary)] font-bold shadow-xs border border-[var(--border)]"
                          : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                      }`}
                    >
                      {item.id === "nri" ? <Globe className="h-3 w-3" /> : null}
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--primary-border)] transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Inputs
            </button>
          </div>

          {/* Quick CTC Presets */}
          <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[var(--fg-muted)] font-semibold mr-1 inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" />
              Quick Salary Presets:
            </span>
            {[750000, 1200000, 1275000, 1500000, 2000000, 2500000, 5000000].map((ctc) => (
              <button
                key={ctc}
                type="button"
                onClick={() => {
                  setForm((prev) => ({
                    ...prev,
                    salary: ctc,
                    basicSalary: Math.round(ctc * 0.5),
                    hraReceived: Math.round(ctc * 0.2),
                  }));
                }}
                className={`px-2.5 py-1 rounded-[var(--radius-sm)] border tabular-nums transition cursor-pointer ${
                  form.salary === ctc
                    ? "bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary-border)] font-bold"
                    : "bg-[var(--bg-card)] text-[var(--fg-soft)] border-[var(--border)] hover:bg-[var(--bg)]"
                }`}
              >
                ₹{ctc / 100000}L
              </button>
            ))}
          </div>

          {form.residency === "nri" ? (
            <div className="rounded-[var(--radius)] bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900 flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-700 shrink-0" />
              <span>
                <strong>NRI Rule Applied:</strong> Non-Residents are ineligible for {config.sections.rebate} tax rebate and unexhausted basic exemption limit set-off against special-rate capital gains.
              </span>
            </div>
          ) : null}
        </div>

        {/* ─── Main 12-Col Workbench ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: 3-Step Input Studio */}
          <div className="lg:col-span-7 space-y-6">
            <div
              role="tablist"
              aria-label="Income Tax Calculator Steps"
              className="flex overflow-x-auto border-b border-[var(--border)] text-xs sm:text-sm font-semibold [&::-webkit-scrollbar]:hidden"
            >
              {[
                { id: "income" as const, label: "1. Income & Gains", icon: Briefcase },
                { id: "deductions" as const, label: "2. Deductions", icon: ShieldCheck },
                { id: "compliance" as const, label: "3. TDS & Penalties", icon: Target },
              ].map((tab) => {
                const Icon = tab.icon;
                const selected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`${uid}-tab-${tab.id}`}
                    aria-selected={selected}
                    aria-controls={`${uid}-panel-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 whitespace-nowrap min-h-[44px] px-4 border-b-2 transition cursor-pointer ${
                      selected
                        ? "border-[var(--primary)] text-[var(--primary)] font-bold"
                        : "border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ── TAB 1: INCOME & CAPITAL GAINS ── */}
            {activeTab === "income" && (
              <div
                id={`${uid}-panel-income`}
                role="tabpanel"
                aria-labelledby={`${uid}-tab-income`}
                className="space-y-4"
              >
                {/* Salary, House Property & Other */}
                <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)] space-y-4">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border)]">
                    <h2 className="text-sm font-bold text-[var(--fg)]">Salary, Rental &amp; Other Sources</h2>
                    <span className="text-xs text-[var(--fg-muted)] font-medium">{config.shortLabel}</span>
                  </div>

                  <MoneyInput
                    id={`${uid}-salary`}
                    label="Gross Annual Salary / Pension"
                    value={form.salary}
                    onChange={(v) => update("salary", v)}
                    placeholder="12,00,000"
                    large
                    showWords
                    helper={`Standard deduction (${config.sections.standardDeduction}) of ₹75,000 (New Regime) or ₹50,000 (Old Regime) applies automatically to salary/pension income only.`}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <MoneyInput
                      id={`${uid}-rental`}
                      label="Gross Annual Rental Income (Let-out)"
                      value={form.rentalIncome}
                      onChange={(v) => update("rentalIncome", v)}
                      showWords
                      helper="30% standard deduction u/s 24(a) auto-applied"
                    />
                    <MoneyInput
                      id={`${uid}-other`}
                      label="Interest, Dividends & Other Income"
                      value={form.otherIncome}
                      onChange={(v) => update("otherIncome", v)}
                      showWords
                      helper="Savings, FD interest, dividends, misc. income"
                    />
                  </div>

                  {form.rentalIncome > 0 ? (
                    <div className="pt-2 border-t border-[var(--border)]">
                      <MoneyInput
                        id={`${uid}-letout-int`}
                        label="Home Loan Interest on Let-out Property (Sec 24(b))"
                        value={form.homeLoanInterestLetOut}
                        onChange={(v) => update("homeLoanInterestLetOut", v)}
                        showWords
                        helper="Deductible against net rental income in BOTH regimes (HP loss up to ₹2L allowed only in Old Regime u/s 71(3A))"
                      />
                    </div>
                  ) : null}
                </div>

                {/* Business / Profession (Regular vs Presumptive 44ADA / 44AD) */}
                <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)] space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-[var(--fg)] flex items-center gap-2">
                        Business / Professional Income
                        {result.netBusinessIncome > 0 ? (
                          <span className="rounded-full bg-[var(--primary-soft)] border border-[var(--primary-border)] px-2 py-0.5 text-[11px] font-bold text-[var(--primary)] tabular-nums">
                            Net: {formatINR(result.netBusinessIncome)}
                          </span>
                        ) : null}
                      </h2>
                      <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                        Regular books of accounts or Presumptive u/s 44ADA (50%) / 44AD (6%–8%)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBusinessPanel((s) => !s)}
                      aria-expanded={showBusinessPanel}
                      className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] shrink-0 cursor-pointer"
                    >
                      {showBusinessPanel ? "Hide" : result.netBusinessIncome > 0 ? "Edit" : "+ Add Income"}
                    </button>
                  </div>

                  {showBusinessPanel && (
                    <div className="space-y-4 pt-3 border-t border-[var(--border)]">
                      <div>
                        <label htmlFor={`${uid}-biz-mode`} className="text-xs font-semibold text-[var(--fg)] block mb-1.5">
                          Taxation Method
                        </label>
                        <select
                          id={`${uid}-biz-mode`}
                          value={form.businessMode}
                          onChange={(e) => update("businessMode", e.target.value as BusinessTaxMode)}
                          className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs sm:text-sm font-semibold text-[var(--fg)] outline-none focus:border-[var(--primary)]"
                        >
                          <option value="regular">Regular Books (Gross Receipts minus Expenses)</option>
                          <option value="44ada">Presumptive Profession — Sec 44ADA (50% Net Profit)</option>
                          <option value="44ad_digital">Presumptive Business — Sec 44AD Digital (6% Profit)</option>
                          <option value="44ad_cash">Presumptive Business — Sec 44AD Cash/Non-Digital (8% Profit)</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <MoneyInput
                          id={`${uid}-prof-inc`}
                          label="Gross Annual Turnover / Receipts"
                          value={form.professionalIncome}
                          onChange={(v) => update("professionalIncome", v)}
                          showWords
                        />
                        {form.businessMode === "regular" ? (
                          <MoneyInput
                            id={`${uid}-biz-exp`}
                            label="Allowable Business Expenses"
                            value={form.businessExpenses}
                            onChange={(v) => update("businessExpenses", v)}
                            showWords
                          />
                        ) : (
                          <div className="rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--border)] p-3 flex flex-col justify-center">
                            <span className="text-[11px] font-semibold text-[var(--fg-muted)]">
                              Deemed Taxable Profit ({form.businessMode === "44ada" ? "50%" : form.businessMode === "44ad_digital" ? "6%" : "8%"})
                            </span>
                            <span className="text-base font-extrabold text-[var(--primary)] tabular-nums mt-0.5">
                              {formatINR(result.netBusinessIncome)}
                            </span>
                            <span className="text-[10px] text-[var(--fg-muted)]">
                              Single 15th March advance tax installment applies
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Capital Gains */}
                <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)] space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-[var(--fg)] flex items-center gap-2">
                        Capital Gains (Equity, MF, Property &amp; Gold)
                        {totalSpecialCg > 0 ? (
                          <span className="rounded-full bg-[var(--primary-soft)] border border-[var(--primary-border)] px-2 py-0.5 text-[11px] font-bold text-[var(--primary)] tabular-nums">
                            {formatINR(totalSpecialCg)}
                          </span>
                        ) : null}
                      </h2>
                      <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                        STCG Equity 20% • LTCG Equity 12.5% (&gt;₹1.25L) • LTCG Other 12.5% • STCG Other at Slab Rate
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCgPanel((s) => !s)}
                      aria-expanded={showCgPanel}
                      className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] shrink-0 cursor-pointer"
                    >
                      {showCgPanel ? "Hide" : totalSpecialCg > 0 ? "Edit" : "+ Add Capital Gains"}
                    </button>
                  </div>

                  {showCgPanel && (
                    <div className="space-y-4 pt-3 border-t border-[var(--border)]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <MoneyInput
                          id={`${uid}-stcg-eq`}
                          label={`STCG Listed Equity (${config.sections.stcgEquity}) @ 20%`}
                          value={form.stcgEquity}
                          onChange={(v) => update("stcgEquity", v)}
                          showWords
                          helper="Held ≤ 12 months (STT paid)"
                        />
                        <MoneyInput
                          id={`${uid}-ltcg-eq`}
                          label={`LTCG Listed Equity (${config.sections.ltcgEquity}) @ 12.5%`}
                          value={form.ltcgEquity}
                          onChange={(v) => update("ltcgEquity", v)}
                          showWords
                          helper="First ₹1.25 Lakhs exempt automatically"
                        />
                        <MoneyInput
                          id={`${uid}-stcg-other`}
                          label="STCG Other Assets (Property, Gold, Debt MF)"
                          value={form.stcgOther}
                          onChange={(v) => update("stcgOther", v)}
                          showWords
                          helper="Added to normal income & taxed at applicable slab rates"
                        />
                        <MoneyInput
                          id={`${uid}-ltcg-other`}
                          label={`LTCG Other Assets (${config.sections.ltcgOther})`}
                          value={form.ltcgOther}
                          onChange={(v) => update("ltcgOther", v)}
                          showWords
                          helper={
                            form.ltcgOtherUseIndexation && form.residency === "resident"
                              ? "Grandfathered pre-23 Jul 2024 property @ 20% with indexation"
                              : "Standard post-23 Jul 2024 rate @ 12.5% without indexation"
                          }
                        />
                      </div>

                      {form.ltcgOther > 0 && form.residency === "resident" ? (
                        <label className="flex items-center gap-2 text-xs text-[var(--fg-muted)] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(form.ltcgOtherUseIndexation)}
                            onChange={(e) => update("ltcgOtherUseIndexation", e.target.checked)}
                            className="h-4 w-4 rounded accent-[var(--primary)]"
                          />
                          <span>
                            Land/Building acquired before 23 July 2024 — apply grandfathered 20% rate (enter indexed gain above)
                          </span>
                        </label>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 2: DEDUCTIONS & EXEMPTIONS ── */}
            {activeTab === "deductions" && (
              <div
                id={`${uid}-panel-deductions`}
                role="tabpanel"
                aria-labelledby={`${uid}-tab-deductions`}
                className="space-y-4"
              >
                {/* Allowed in BOTH Regimes: Employer NPS 80CCD(2) */}
                <div className="rounded-[var(--radius-lg)] border border-[var(--primary-border)] bg-[var(--primary-soft)] p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-sm font-bold text-[var(--primary)]">
                      Allowed Under BOTH New &amp; Old Regimes
                    </h2>
                    <span className="rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      {config.sections.employerNps}
                    </span>
                  </div>
                  <MoneyInput
                    id={`${uid}-emp-nps`}
                    label="Employer NPS Contribution (Sec 80CCD(2))"
                    value={form.employerNps80CCD2}
                    onChange={(v) => update("employerNps80CCD2", v)}
                    showWords
                    helper="Salaried employees: capped at 14% of salary under New Regime (both Govt & Private post-Finance Act 2024) and 10% under Old Regime."
                  />
                </div>

                {/* Old Regime Chapter VI-A Note */}
                <div className="p-3.5 rounded-[var(--radius)] bg-amber-50 border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <p>
                    <strong>Old Regime Deductions:</strong> Deductions below apply exclusively when opting for the <strong>Old Tax Regime</strong>. Standard deduction (₹75,000) &amp; Employer NPS (14%) are already credited in the New Regime.
                  </p>
                </div>

                {/* 80C & 80D */}
                <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)] space-y-4">
                  <h2 className="text-sm font-bold text-[var(--fg)] pb-2 border-b border-[var(--border)]">
                    Section 80C, 80D Health Insurance &amp; NPS
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <MoneyInput
                      id={`${uid}-80c`}
                      label="Section 80C (Max ₹1.50 Lakhs)"
                      value={form.deduction80C}
                      onChange={(v) => update("deduction80C", v)}
                      helper="EPF, PPF, ELSS, LIC, Tuition Fees, Home Loan Principal"
                    />
                    <MoneyInput
                      id={`${uid}-80d-self`}
                      label={`Section 80D — Self & Family (Max ${form.ageGroup === "citizen" ? "₹25,000" : "₹50,000"})`}
                      value={form.deduction80D}
                      onChange={(v) => update("deduction80D", v)}
                      helper={
                        form.ageGroup === "citizen"
                          ? "Limit automatically increases to ₹50,000 for Senior Citizens"
                          : "Senior Citizen enhanced cap (₹50,000) active"
                      }
                    />
                    <div>
                      <MoneyInput
                        id={`${uid}-80d-parents`}
                        label={`Section 80D — Parents (Max ${form.parentsSenior ? "₹50,000" : "₹25,000"})`}
                        value={form.deduction80DParents}
                        onChange={(v) => update("deduction80DParents", v)}
                      />
                      <label className="mt-2 inline-flex items-center gap-2 text-xs text-[var(--fg-muted)] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.parentsSenior}
                          onChange={(e) => update("parentsSenior", e.target.checked)}
                          className="h-4 w-4 rounded accent-[var(--primary)]"
                        />
                        <span>Parents are Senior Citizens (60+ yrs → ₹50,000 cap)</span>
                      </label>
                    </div>
                    <MoneyInput
                      id={`${uid}-80ccd1b`}
                      label="Additional Self NPS — Sec 80CCD(1B) (Max ₹50,000)"
                      value={form.deductionNPS80CCD1B}
                      onChange={(v) => update("deductionNPS80CCD1B", v)}
                      helper="Over and above the ₹1.50L Section 80C ceiling"
                    />
                  </div>
                </div>

                {/* Persistent HRA Card */}
                <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)] space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-bold text-[var(--fg)] flex items-center gap-2">
                        House Rent Allowance (HRA — Sec 10(13A))
                        {result.hraComputed > 0 ? (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800 tabular-nums">
                            Exempt: {formatINR(result.hraComputed)}
                          </span>
                        ) : null}
                      </h2>
                      <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                        Applies to salaried individuals under Old Regime (persists when collapsed)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowHraPanel((s) => !s)}
                      aria-expanded={showHraPanel}
                      className="text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] shrink-0 cursor-pointer"
                    >
                      {showHraPanel ? "Collapse" : result.hraComputed > 0 ? "Edit HRA" : "Configure HRA"}
                    </button>
                  </div>

                  {showHraPanel && (
                    <div className="space-y-4 pt-3 border-t border-[var(--border)]">
                      <div className="inline-flex p-1 rounded-[var(--radius)] bg-[var(--bg-muted)] border border-[var(--border)] text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => update("useHraAssistant", true)}
                          className={`px-3 py-1.5 rounded-[var(--radius-sm)] transition cursor-pointer ${
                            form.useHraAssistant
                              ? "bg-[var(--bg-card)] text-[var(--primary)] font-bold shadow-xs"
                              : "text-[var(--fg-muted)]"
                          }`}
                        >
                          Auto-Compute HRA
                        </button>
                        <button
                          type="button"
                          onClick={() => update("useHraAssistant", false)}
                          className={`px-3 py-1.5 rounded-[var(--radius-sm)] transition cursor-pointer ${
                            !form.useHraAssistant
                              ? "bg-[var(--bg-card)] text-[var(--primary)] font-bold shadow-xs"
                              : "text-[var(--fg-muted)]"
                          }`}
                        >
                          Enter Exempt HRA Directly
                        </button>
                      </div>

                      {form.useHraAssistant ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <MoneyInput
                            id={`${uid}-hra-basic`}
                            label="Annual Basic Salary + DA"
                            value={form.basicSalary}
                            onChange={(v) => update("basicSalary", v)}
                          />
                          <MoneyInput
                            id={`${uid}-hra-rec`}
                            label="Annual HRA Received"
                            value={form.hraReceived}
                            onChange={(v) => update("hraReceived", v)}
                          />
                          <MoneyInput
                            id={`${uid}-hra-rent`}
                            label="Total Annual Rent Paid"
                            value={form.rentPaid}
                            onChange={(v) => update("rentPaid", v)}
                          />
                          <div className="flex items-center justify-between p-3 bg-[var(--bg)] rounded-[var(--radius)] border border-[var(--border)]">
                            <div>
                              <span className="text-xs font-semibold text-[var(--fg)] block">Metro City?</span>
                              <span className="text-[10px] text-[var(--fg-muted)]">
                                Delhi, Mumbai, Kolkata, Chennai (50%)
                              </span>
                            </div>
                            <button
                              type="button"
                              aria-pressed={form.isMetro}
                              onClick={() => update("isMetro", !form.isMetro)}
                              className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-bold transition cursor-pointer ${
                                form.isMetro
                                  ? "bg-[var(--primary)] text-white"
                                  : "bg-[var(--bg-muted)] text-[var(--fg)] border border-[var(--border)]"
                              }`}
                            >
                              {form.isMetro ? "Yes (50%)" : "No (40%)"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <MoneyInput
                          id={`${uid}-hra-manual`}
                          label="Exempt HRA Amount (u/s 10(13A))"
                          value={form.manualHraExemption}
                          onChange={(v) => update("manualHraExemption", v)}
                          showWords
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Home Loan, 80TTA/80TTB, 80E, 80G */}
                <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)] space-y-4">
                  <h2 className="text-sm font-bold text-[var(--fg)] pb-2 border-b border-[var(--border)]">
                    Home Loan Interest &amp; Other Chapter VI-A Deductions
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <MoneyInput
                      id={`${uid}-24b-self`}
                      label="Self-Occupied Home Loan Interest — Sec 24(b)"
                      value={form.homeLoanInterestSelfOccupied}
                      onChange={(v) => update("homeLoanInterestSelfOccupied", v)}
                      helper="Max ₹2,00,000 loss set-off u/s 71(3A) (Old Regime)"
                    />
                    <MoneyInput
                      id={`${uid}-80tta`}
                      label={
                        form.ageGroup === "citizen"
                          ? "Savings Bank Interest — Sec 80TTA (Max ₹10,000)"
                          : "Savings & FD Interest — Sec 80TTB (Max ₹50,000)"
                      }
                      value={form.savingsInterestDeduction}
                      onChange={(v) => update("savingsInterestDeduction", v)}
                      helper={
                        form.ageGroup === "citizen"
                          ? "Savings account interest only (FD excluded)"
                          : "Senior Citizen deduction covers Savings, FD & Post Office"
                      }
                    />
                    <MoneyInput
                      id={`${uid}-80e`}
                      label="Education Loan Interest — Sec 80E"
                      value={form.deduction80E}
                      onChange={(v) => update("deduction80E", v)}
                      helper="No upper monetary limit (for up to 8 years)"
                    />
                    <MoneyInput
                      id={`${uid}-80g`}
                      label="Charitable Donations (Eligible Amount) — Sec 80G"
                      value={form.deduction80G}
                      onChange={(v) => update("deduction80G", v)}
                    />
                  </div>
                  <MoneyInput
                    id={`${uid}-other-ded`}
                    label="Other Chapter VI-A Deductions (80DD, 80DDB, 80U, etc.)"
                    value={form.otherDeductions}
                    onChange={(v) => update("otherDeductions", v)}
                  />
                </div>
              </div>
            )}

            {/* ── TAB 3: TDS, ADVANCE TAX & PENALTIES ── */}
            {activeTab === "compliance" && (
              <div
                id={`${uid}-panel-compliance`}
                role="tabpanel"
                aria-labelledby={`${uid}-tab-compliance`}
                className="space-y-4"
              >
                <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)] space-y-4">
                  <h2 className="text-sm font-bold text-[var(--fg)] pb-2 border-b border-[var(--border)]">
                    Prepaid Taxes &amp; Statutory Delay Interest ({config.sections.interest234A} / {config.sections.interest234B})
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <MoneyInput
                      id={`${uid}-tax-paid`}
                      label="TDS / Advance Tax Paid"
                      value={form.taxPaid}
                      onChange={(v) => update("taxPaid", v)}
                      showWords
                      helper="Per Form 26AS / AIS; excess triggers Refund"
                    />
                    <div>
                      <label htmlFor={`${uid}-234a`} className="text-xs font-semibold text-[var(--fg)] block mb-1.5">
                        Late Return Delay (Months)
                      </label>
                      <input
                        id={`${uid}-234a`}
                        type="number"
                        min={0}
                        max={60}
                        value={form.monthsDelay234A === 0 ? "" : form.monthsDelay234A}
                        onChange={(e) => update("monthsDelay234A", Math.min(60, parseNonNeg(e.target.value)))}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs sm:text-sm font-semibold tabular-nums text-[var(--fg)] outline-none focus:border-[var(--primary)]"
                      />
                      <p className="mt-1 text-[11px] text-[var(--fg-muted)]">
                        {config.sections.interest234A} (1%/mo) + {config.sections.lateFee234F} fee
                      </p>
                    </div>
                    <div>
                      <label htmlFor={`${uid}-234b`} className="text-xs font-semibold text-[var(--fg)] block mb-1.5">
                        Advance Tax Delay (Months)
                      </label>
                      <input
                        id={`${uid}-234b`}
                        type="number"
                        min={0}
                        max={60}
                        value={form.monthsDelay234B === 0 ? "" : form.monthsDelay234B}
                        onChange={(e) => update("monthsDelay234B", Math.min(60, parseNonNeg(e.target.value)))}
                        onWheel={(e) => e.currentTarget.blur()}
                        placeholder="0"
                        className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-xs sm:text-sm font-semibold tabular-nums text-[var(--fg)] outline-none focus:border-[var(--primary)]"
                      />
                      <p className="mt-1 text-[11px] text-[var(--fg-muted)]">
                        {config.sections.interest234B} (1%/mo on 100% shortfall if paid &lt;90%)
                      </p>
                    </div>
                  </div>

                  {!result.advanceTax.applicable && result.advanceTax.exemptReason ? (
                    <div className="rounded-[var(--radius)] bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-900 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{result.advanceTax.exemptReason}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Sticky Executive Computation Studio (lg:top-28 clears floating navbar!) */}
          <div id="tax-summary-studio" className="lg:col-span-5 lg:sticky lg:top-28 space-y-5">
            <div
              aria-live="polite"
              className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[var(--shadow-md)] space-y-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 pb-4 border-b border-[var(--border)]">
                <div>
                  <span className="text-[11px] font-bold text-[var(--fg-muted)] uppercase tracking-wider block">
                    {config.actName}
                  </span>
                  <span className="text-sm font-extrabold text-[var(--fg)]">{config.periodLabel}</span>
                </div>
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
                    result.betterRegime === "New Regime"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-[var(--primary-soft)] text-[var(--primary)] border-[var(--primary-border)]"
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {result.betterRegime} Optimal
                </div>
              </div>

              {/* Savings Hero */}
              <div className="text-center py-1">
                <span className="text-[11px] font-bold text-[var(--fg-muted)] uppercase tracking-wider block">
                  {result.savings > 0 ? "Estimated Annual Tax Savings" : "Regime Parity"}
                </span>
                <div className="text-4xl font-extrabold text-emerald-700 mt-1 tracking-tight tabular-nums">
                  {formatINR(result.savings)}
                </div>
                <p className="text-xs text-[var(--fg-muted)] mt-1">
                  {result.savings > 0 ? (
                    <>
                      by choosing the <strong className="text-[var(--fg)]">{result.betterRegime}</strong>
                    </>
                  ) : (
                    <>Both regimes result in identical tax liability</>
                  )}
                </p>
              </div>

              {/* Side-by-Side Regime Comparison + Visual Bars */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--border)]">
                <div
                  className={`p-3 rounded-[var(--radius-sm)] border transition ${
                    result.betterRegime === "Old Regime"
                      ? "bg-[var(--bg-card)] border-[var(--primary)] ring-2 ring-[var(--primary)]/15 shadow-xs"
                      : "bg-[var(--bg-card)]/75 border-[var(--border)]"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--fg-muted)]">
                    <span>Old Regime</span>
                    <span className="tabular-nums">{oldRegime.effectiveTaxRatePct.toFixed(1)}%</span>
                  </div>
                  <div className="text-lg font-extrabold text-[var(--fg)] mt-1 tabular-nums">
                    {formatINR(oldRegime.totalTax)}
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--bg-muted)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                      style={{ width: `${oldRegime.totalTax === 0 ? 0 : Math.max(6, oldBarPct)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--fg-muted)] block mt-1.5 tabular-nums">
                    Taxable: {formatINR(oldRegime.totalTaxableIncome)}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-[var(--radius-sm)] border transition ${
                    result.betterRegime === "New Regime"
                      ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                      : "bg-[var(--bg-card)]/75 border-[var(--border)]"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--fg-muted)]">
                    <span>New Regime</span>
                    <span className="tabular-nums">{newRegime.effectiveTaxRatePct.toFixed(1)}%</span>
                  </div>
                  <div className="text-lg font-extrabold text-emerald-800 mt-1 tabular-nums">
                    {formatINR(newRegime.totalTax)}
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-emerald-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                      style={{ width: `${newRegime.totalTax === 0 ? 0 : Math.max(6, newBarPct)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[var(--fg-muted)] block mt-1.5 tabular-nums">
                    Taxable: {formatINR(newRegime.totalTaxableIncome)}
                  </span>
                </div>
              </div>

              {/* Financial Summary Lines */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)] text-xs tabular-nums">
                <div className="flex justify-between text-[var(--fg-muted)]">
                  <span>Gross Total Income</span>
                  <span className="font-semibold text-[var(--fg)]">{formatINR(result.grossTotalIncome)}</span>
                </div>
                <div className="flex justify-between text-[var(--fg-muted)]">
                  <span>Deductions Applied ({result.betterRegime})</span>
                  <span className="font-semibold text-[var(--fg)]">
                    -{formatINR(result.betterRegime === "New Regime" ? newRegime.totalDeductions : oldRegime.totalDeductions)}
                  </span>
                </div>
                <div className="flex justify-between text-[var(--fg-muted)]">
                  <span>Estimated Monthly In-Hand</span>
                  <span className="font-bold text-[var(--primary)]">{formatINR(result.monthlyTakeHome)} / mo</span>
                </div>

                {(result.betterRegime === "New Regime" ? newRegime.surchargeMarginalRelief : oldRegime.surchargeMarginalRelief) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Surcharge Marginal Relief Saved</span>
                    <span className="font-bold">
                      -{formatINR(result.betterRegime === "New Regime" ? newRegime.surchargeMarginalRelief : oldRegime.surchargeMarginalRelief)}
                    </span>
                  </div>
                )}

                {result.totalInterestAndFees > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>Interest &amp; Late Fee ({config.sections.interest234A}/{config.sections.interest234B})</span>
                    <span className="font-bold">+{formatINR(result.totalInterestAndFees)}</span>
                  </div>
                )}

                {result.taxPaid > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Less: Prepaid Tax (TDS / Advance)</span>
                    <span className="font-bold">-{formatINR(result.taxPaid)}</span>
                  </div>
                )}

                {/* Final Net Payable OR Refund Due */}
                {result.refundDue > 0 ? (
                  <div className="p-3.5 rounded-[var(--radius)] bg-emerald-50 border border-emerald-200 flex justify-between items-center mt-2">
                    <div>
                      <span className="font-bold text-emerald-900 text-sm block">Income Tax Refund Due</span>
                      <span className="text-[10px] text-emerald-700">Excess prepaid tax u/s 288B</span>
                    </div>
                    <span className="text-xl font-black text-emerald-800">{formatINR(result.refundDue)}</span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--border)] flex justify-between items-center mt-2">
                    <div>
                      <span className="font-bold text-[var(--fg)] text-sm block">Final Net Payable</span>
                      <span className="text-[10px] text-[var(--fg-muted)]">Rounded u/s 288B after TDS</span>
                    </div>
                    <span className="text-xl font-black text-[var(--fg)]">{formatINR(result.netPayable)}</span>
                  </div>
                )}
              </div>

              {/* Slab Breakdown Accordion */}
              <details className="group pt-2 border-t border-[var(--border)] text-xs">
                <summary className="cursor-pointer text-[var(--fg)] hover:text-[var(--primary)] flex items-center justify-between font-semibold select-none py-1">
                  <span>View {result.betterRegime} Slab &amp; Cess Breakdown</span>
                  <ChevronDown className="h-4 w-4 transition group-open:rotate-180 text-[var(--fg-muted)]" />
                </summary>
                <div className="mt-2.5 space-y-1.5 p-3 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--border)] tabular-nums">
                  {(result.betterRegime === "New Regime" ? newRegime : oldRegime).breakdown.map((b, i) => (
                    <div key={i} className="flex justify-between gap-2 text-[var(--fg-muted)]">
                      <span>{b.slab}</span>
                      <span className={`font-semibold shrink-0 ${b.tax < 0 ? "text-emerald-700" : "text-[var(--fg)]"}`}>
                        {formatINR(b.tax)}
                      </span>
                    </div>
                  ))}
                  {(result.betterRegime === "New Regime" ? newRegime : oldRegime).surcharge > 0 && (
                    <div className="flex justify-between gap-2 text-[var(--fg-muted)]">
                      <span>Surcharge (net of relief &amp; 15% CG cap)</span>
                      <span className="font-semibold text-[var(--fg)]">
                        {formatINR((result.betterRegime === "New Regime" ? newRegime : oldRegime).surcharge)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between gap-2 text-[var(--fg-muted)] pt-1 border-t border-[var(--border)]">
                    <span>Health &amp; Education Cess (4%)</span>
                    <span className="font-semibold text-[var(--fg)]">
                      {formatINR((result.betterRegime === "New Regime" ? newRegime : oldRegime).cess)}
                    </span>
                  </div>
                </div>
              </details>

              {/* Advance Tax Schedule Accordion */}
              <details className="group pt-2 border-t border-[var(--border)] text-xs">
                <summary className="cursor-pointer text-[var(--fg)] hover:text-[var(--primary)] flex items-center justify-between font-semibold select-none py-1">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 text-[var(--primary)]" />
                    Advance Tax Installment Schedule
                  </span>
                  <ChevronDown className="h-4 w-4 transition group-open:rotate-180 text-[var(--fg-muted)]" />
                </summary>
                <div className="mt-2.5 p-3 rounded-[var(--radius)] bg-[var(--bg)] border border-[var(--border)] space-y-1.5 tabular-nums">
                  {!result.advanceTax.applicable ? (
                    <p className="text-[var(--fg-muted)] leading-relaxed">{result.advanceTax.exemptReason}</p>
                  ) : (
                    result.advanceTax.installments.map((inst) => (
                      <div key={inst.dueDate} className="flex justify-between gap-2 text-[var(--fg-muted)]">
                        <div>
                          <span className="font-semibold text-[var(--fg)]">{inst.dueDate}</span>
                          <span className="block text-[10px]">{inst.percentageLabel}</span>
                        </div>
                        <span className="font-bold text-[var(--primary)]">{formatINR(inst.cumulativeAmount)}</span>
                      </div>
                    ))
                  )}
                </div>
              </details>

              {exportError ? (
                <div className="rounded-[var(--radius)] bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{exportError}</span>
                </div>
              ) : null}

              {/* Export Actions */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={downloadExcel}
                  disabled={isGeneratingExcel}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] hover:bg-[var(--bg)] text-xs font-semibold text-[var(--fg)] transition disabled:opacity-50 cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {isGeneratingExcel ? "Generating..." : "Export Excel"}
                </button>
                <button
                  type="button"
                  onClick={downloadPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2.5 rounded-[var(--radius)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-xs font-bold text-white transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  {isGeneratingPdf ? "Generating..." : "Download PDF"}
                </button>
              </div>
            </div>

            {/* CA Advisory Banner */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--primary-border)] bg-[var(--primary-soft)] p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-[var(--radius)] bg-[var(--primary)] text-white flex items-center justify-center shrink-0">
                  <Landmark className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--fg)]">Need Chartered Accountant Review?</h3>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5 leading-relaxed">
                    Our CAs structure capital gains, NPS 80CCD(2), presumptive 44ADA filings, and ITR verification for 100% compliance under {config.actName}.
                  </p>
                </div>
              </div>
              <Link
                href="/book"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)]"
              >
                <span>Schedule 1-on-1 CA Consultation</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Sticky Live Summary Bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur-md px-4 py-3 shadow-[var(--shadow-lg)]">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto tabular-nums">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fg-muted)] block">
              {result.betterRegime} • {result.refundDue > 0 ? "Refund Due" : "Net Payable"}
            </span>
            <span className={`text-base font-black ${result.refundDue > 0 ? "text-emerald-700" : "text-[var(--primary)]"}`}>
              {formatINR(result.refundDue > 0 ? result.refundDue : result.netPayable)}
            </span>
          </div>
          <a
            href="#tax-summary-studio"
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
