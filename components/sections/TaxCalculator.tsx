"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calculator,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Home,
  Briefcase,
  Wallet,
  PieChart,
  ShieldCheck,
  Landmark,
  Plus,
  Minus,
  Smartphone,
  Users,
  Glasses,
  Target,
  FileDown,
  FileText,
  Check,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Info,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { generateTaxReportPdf } from "@/lib/generateTaxPdf";
import { generateTaxExcel } from "@/lib/generateTaxExcel";

type AgeGroup = "citizen" | "senior" | "super-senior";

export default function TaxCalculator({
  content,
}: {
  content?: {
    hero?: {
      titlePrefix?: string;
      titleHighlight?: string;
      description?: string;
    };
    income?: {
      citizenLabel?: string;
      seniorLabel?: string;
      superSeniorLabel?: string;
      panelTitle?: string;
      panelSubtitle?: string;
      salaryLabel?: string;
      rentalLabel?: string;
      otherIncomeLabel?: string;
      businessToggleLabel?: string;
      grossReceiptsLabel?: string;
      netExpensesLabel?: string;
    };
    deductions?: {
      panelTitle?: string;
      panelSubtitle?: string;
      hraGuideLabel?: string;
      hraAssistantTitle?: string;
      basicSalaryLabel?: string;
      hraReceivedLabel?: string;
      rentPaidLabel?: string;
      metroLabel?: string;
      section80cLabel?: string;
      section80cSubtext?: string;
      section80dLabel?: string;
      advancedLabel?: string;
      parents80dLabel?: string;
      npsLabel?: string;
      homeLoanLabel?: string;
      otherDeductionsLabel?: string;
      capitalGainsTitle?: string;
      stcgLabel?: string;
      ltcgLabel?: string;
    };
    compliance?: {
      panelTitle?: string;
      panelSubtitle?: string;
      taxPaidLabel?: string;
      delay234ALabel?: string;
      delay234BLabel?: string;
      monthsLabel?: string;
    };
    results?: {
      panelTitle?: string;
      recommendedLabel?: string;
      strategySuffix?: string;
      savingsLabel?: string;
      oldRegimeLabel?: string;
      newRegimeLabel?: string;
      taxableIncomeLabel?: string;
      delayInterestLabel?: string;
      totalPayableLabel?: string;
      downloadLabel?: string;
      printLabel?: string;
    };
  };
}) {
  // Global Tax Controls
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("citizen");
  const [financialYear, setFinancialYear] = useState<"2024-25" | "2025-26">("2025-26");

  // Income Sources
  const [salary, setSalary] = useState<number>(1200000);
  const [rentalIncome, setRentalIncome] = useState<number>(0);
  const [otherIncome, setOtherIncome] = useState<number>(0);
  const [professionalIncome, setProfessionalIncome] = useState<number>(0);
  const [businessExpenses, setBusinessExpenses] = useState<number>(0);

  // HRA Assistant State
  const [showHraAssistant, setShowHraAssistant] = useState(false);
  const [basicSalary, setBasicSalary] = useState<number>(600000);
  const [hraReceived, setHraReceived] = useState<number>(240000);
  const [rentPaid, setRentPaid] = useState<number>(200000);
  const [isMetro, setIsMetro] = useState(true);

  // Capital Gains
  const [stcgEquity, setStcgEquity] = useState<number>(0);
  const [ltcgEquity, setLtcgEquity] = useState<number>(0);
  const [stcgOther, setStcgOther] = useState<number>(0);
  const [ltcgOther, setLtcgOther] = useState<number>(0);

  // Compliance (Sec 234)
  const [monthsDelay234A, setMonthsDelay234A] = useState<number>(0);
  const [monthsDelay234B, setMonthsDelay234B] = useState<number>(0);
  const [taxPaid, setTaxPaid] = useState<number>(0);

  // Deductions (Old Regime)
  const [deduction80C, setDeduction80C] = useState<number>(150000);
  const [deduction80D, setDeduction80D] = useState<number>(25000);
  const [deduction80D_Parents, setDeduction80D_Parents] = useState<number>(0);
  const [deductionNPS, setDeductionNPS] = useState<number>(0);
  const [homeLoanInterest, setHomeLoanInterest] = useState<number>(0);
  const [deduction80G, setDeduction80G] = useState<number>(0);
  const [deduction80E, setDeduction80E] = useState<number>(0);
  const [deduction80TTA, setDeduction80TTA] = useState<number>(0);
  const [hra, setHra] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);

  // Active Tab in Input Studio
  const [activeInputTab, setActiveInputTab] = useState<"income" | "deductions" | "taxes">("income");

  // Export states
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  // Results calculation
  const results = useMemo(() => {
    const standardDeductionOld = 50000;
    const standardDeductionNew = financialYear === "2025-26" ? 75000 : 50000;

    const netRentalIncome = rentalIncome * 0.7;
    const netProfessional = Math.max(0, professionalIncome - businessExpenses);
    const grossIncome = salary + netRentalIncome + otherIncome + netProfessional;

    const hraExemption = showHraAssistant
      ? Math.min(
          hraReceived,
          isMetro ? basicSalary * 0.5 : basicSalary * 0.4,
          Math.max(0, rentPaid - basicSalary * 0.1)
        )
      : hra;

    const ltcgEquityTax = Math.max(0, ltcgEquity - 125000) * 0.125;
    const stcgEquityTax = stcgEquity * 0.2;
    const capitalGainsTaxTotal =
      ltcgEquityTax + stcgEquityTax + stcgOther * 0.15 + ltcgOther * 0.2;

    // --- NEW REGIME ---
    const taxableNew = Math.max(0, grossIncome - standardDeductionNew);
    let taxNew = 0;
    const bNew: { slab: string; tax: number }[] = [];

    const rebateLimit = 700000;

    if (taxableNew <= rebateLimit) {
      taxNew = 0;
      bNew.push({ slab: "Up to ₹7 Lakhs (Rebate u/s 87A)", tax: 0 });
    } else {
      const slabsNew = [
        { limit: 300000, rate: 0, label: "₹0 - ₹3 Lakhs" },
        { limit: 400000, rate: 0.05, label: "₹3 - ₹7 Lakhs" },
        { limit: 300000, rate: 0.1, label: "₹7 - ₹10 Lakhs" },
        { limit: 200000, rate: 0.15, label: "₹10 - ₹12 Lakhs" },
        { limit: 300000, rate: 0.2, label: "₹12 - ₹15 Lakhs" },
        { limit: Infinity, rate: 0.3, label: "Above ₹15 Lakhs" },
      ];

      let tempTaxable = taxableNew;
      slabsNew.forEach((s) => {
        if (tempTaxable > 0) {
          const taxableInSlab = Math.min(tempTaxable, s.limit);
          const slabTax = taxableInSlab * s.rate;
          if (slabTax > 0) {
            bNew.push({ slab: `${s.label} (${Math.round(s.rate * 100)}%)`, tax: slabTax });
          }
          taxNew += slabTax;
          tempTaxable -= taxableInSlab;
        }
      });

      // Marginal Relief
      if (taxableNew > 700000) {
        const incomeAbove7L = taxableNew - 700000;
        if (taxNew > incomeAbove7L) {
          const relief = taxNew - incomeAbove7L;
          taxNew = incomeAbove7L;
          bNew.push({ slab: "Marginal Relief u/s 87A", tax: -relief });
        }
      }
    }

    taxNew += capitalGainsTaxTotal;
    if (capitalGainsTaxTotal > 0) {
      bNew.push({ slab: "Capital Gains Tax", tax: capitalGainsTaxTotal });
    }

    // --- OLD REGIME ---
    const totalDeductions =
      standardDeductionOld +
      Math.min(deduction80C, 150000) +
      Math.min(deduction80D, 25000) +
      Math.min(deduction80D_Parents, 50000) +
      Math.min(deductionNPS, 50000) +
      Math.min(homeLoanInterest, 200000) +
      deduction80G +
      deduction80E +
      deduction80TTA +
      hraExemption +
      otherDeductions;

    const taxableOld = Math.max(0, grossIncome - totalDeductions);
    let taxOld = 0;
    const bOld: { slab: string; tax: number }[] = [];

    if (taxableOld <= 500000) {
      taxOld = 0;
      bOld.push({ slab: "Up to ₹5 Lakhs (Rebate u/s 87A)", tax: 0 });
    } else {
      const basicExemption =
        ageGroup === "super-senior" ? 500000 : ageGroup === "senior" ? 300000 : 250000;

      if (taxableOld > 1000000) {
        const t = (taxableOld - 1000000) * 0.3;
        taxOld += t;
        bOld.push({ slab: "Above ₹10 Lakhs (30%)", tax: t });
      }
      if (taxableOld > 500000) {
        const t = (Math.min(taxableOld, 1000000) - 500000) * 0.2;
        taxOld += t;
        bOld.push({ slab: "₹5 - ₹10 Lakhs (20%)", tax: t });
      }
      if (taxableOld > basicExemption) {
        const t = (Math.min(taxableOld, 500000) - basicExemption) * 0.05;
        taxOld += t;
        bOld.push({ slab: `₹${basicExemption / 100000} - ₹5 Lakhs (5%)`, tax: t });
      }
    }

    taxOld += capitalGainsTaxTotal;
    if (capitalGainsTaxTotal > 0) {
      bOld.push({ slab: "Capital Gains Tax", tax: capitalGainsTaxTotal });
    }

    // Surcharges
    const calcSurcharge = (tax: number, income: number, isNew: boolean) => {
      let rate = 0;
      if (income > 50000000) rate = isNew ? 0.25 : 0.37;
      else if (income > 20000000) rate = 0.25;
      else if (income > 10000000) rate = 0.15;
      else if (income > 5000000) rate = 0.1;
      return tax * rate;
    };

    const surchargeNew = calcSurcharge(taxNew, taxableNew, true);
    const surchargeOld = calcSurcharge(taxOld, taxableOld, false);

    if (surchargeOld > 0) bOld.push({ slab: "Surcharge", tax: surchargeOld });
    if (surchargeNew > 0) bNew.push({ slab: "Surcharge", tax: surchargeNew });

    // Health & Education Cess @ 4%
    const finalTaxOld = Math.round((taxOld + surchargeOld) * 1.04);
    const finalTaxNew = Math.round((taxNew + surchargeNew) * 1.04);

    const betterRegime = finalTaxNew < finalTaxOld ? "New Regime" : "Old Regime";
    const savings = Math.abs(finalTaxOld - finalTaxNew);

    const activeTax = betterRegime === "New Regime" ? finalTaxNew : finalTaxOld;
    const interest234A = Math.round(Math.max(0, activeTax - taxPaid) * 0.01 * monthsDelay234A);
    const interest234B = Math.round(
      Math.max(0, activeTax * 0.9 - taxPaid) * 0.01 * monthsDelay234B
    );
    const totalPayable = Math.round(activeTax + interest234A + interest234B);

    // Monthly In-Hand estimate
    const annualTakeHome = Math.max(0, grossIncome - totalPayable);
    const monthlyTakeHome = Math.round(annualTakeHome / 12);

    return {
      advanceTax: {
        dec: Math.round(activeTax * 0.75),
        june: Math.round(activeTax * 0.15),
        march: Math.round(activeTax),
        sept: Math.round(activeTax * 0.45),
      },
      annualTakeHome,
      better: betterRegime,
      breakdownNew: bNew,
      breakdownOld: bOld,
      capitalGainsTax: capitalGainsTaxTotal,
      finalTaxNew,
      finalTaxOld,
      grossTotalIncome: grossIncome,
      interest234A,
      interest234B,
      monthlyTakeHome,
      newTax: finalTaxNew,
      oldTax: finalTaxOld,
      savings,
      surchargeNew,
      surchargeOld,
      taxableNew,
      taxableOld,
      totalDeductions,
      totalPayable,
    };
  }, [
    ageGroup,
    basicSalary,
    businessExpenses,
    deduction80C,
    deduction80D,
    deduction80D_Parents,
    deduction80E,
    deduction80G,
    deduction80TTA,
    deductionNPS,
    financialYear,
    homeLoanInterest,
    hra,
    hraReceived,
    isMetro,
    ltcgEquity,
    ltcgOther,
    monthsDelay234A,
    monthsDelay234B,
    otherDeductions,
    otherIncome,
    professionalIncome,
    rentPaid,
    rentalIncome,
    salary,
    showHraAssistant,
    stcgEquity,
    stcgOther,
    taxPaid,
  ]);

  const downloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdfBytes = await generateTaxReportPdf({
        ageGroup,
        assessmentYear: financialYear === "2024-25" ? "2025-26" : "2026-27",
        businessExpenses,
        deduction80C,
        deduction80D,
        deduction80D_Parents,
        deductionNPS,
        financialYear,
        homeLoanInterest,
        hra: showHraAssistant
          ? Math.min(
              hraReceived,
              isMetro ? basicSalary * 0.5 : basicSalary * 0.4,
              Math.max(0, rentPaid - basicSalary * 0.1)
            )
          : hra,
        ltcgEquity,
        otherDeductions,
        otherIncome,
        professionalIncome,
        rentalIncome,
        results,
        salary,
        stcgEquity,
      });

      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TaxFiling24_TaxReport_FY${financialYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const downloadExcel = async () => {
    setIsGeneratingExcel(true);
    try {
      const buffer = await generateTaxExcel({
        ageGroup,
        assessmentYear: financialYear === "2024-25" ? "2025-26" : "2026-27",
        businessExpenses,
        deduction80C,
        deduction80D,
        deduction80D_Parents,
        deduction80E,
        deduction80G,
        deduction80TTA,
        deductionNPS,
        financialYear,
        homeLoanInterest,
        hra: showHraAssistant
          ? Math.min(
              hraReceived,
              isMetro ? basicSalary * 0.5 : basicSalary * 0.4,
              Math.max(0, rentPaid - basicSalary * 0.1)
            )
          : hra,
        ltcgEquity,
        ltcgOther,
        monthsDelay234A,
        monthsDelay234B,
        otherDeductions,
        otherIncome,
        professionalIncome,
        rentalIncome,
        results,
        salary,
        stcgEquity,
        stcgOther,
        taxPaid,
      });

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TaxFiling24_TaxComputation_FY${financialYear}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel generation failed:", err);
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const fmt = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      currency: "INR",
      maximumFractionDigits: 0,
      style: "currency",
    }).format(val);
  };

  const heroCopy = content?.hero || {};

  return (
    <section className="py-10 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb & Context */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-slate-800 transition">
          Home
        </Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-slate-800 transition">
          Tools
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Income Tax Calculator</span>
      </nav>

      {/* Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Budget FY 2025-26 & AY 2026-27 Compliant
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {heroCopy.titlePrefix || "Income Tax"}{" "}
            <span className="text-indigo-600">{heroCopy.titleHighlight || "Calculator"}</span>
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
            {heroCopy.description ||
              "Compare Old vs New Tax Regime under the latest Finance Act. Calculate exact slab taxes, Chapter VI-A deductions, HRA exemptions, and export computation reports."}
          </p>
        </div>

        {/* Global Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Financial Year */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setFinancialYear("2025-26")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                financialYear === "2025-26"
                  ? "bg-white text-slate-900 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              FY 2025-26
            </button>
            <button
              type="button"
              onClick={() => setFinancialYear("2024-25")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                financialYear === "2024-25"
                  ? "bg-white text-slate-900 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              FY 2024-25
            </button>
          </div>

          {/* Age Group */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium">
            <button
              type="button"
              onClick={() => setAgeGroup("citizen")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                ageGroup === "citizen"
                  ? "bg-white text-slate-900 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              &lt; 60 Yrs
            </button>
            <button
              type="button"
              onClick={() => setAgeGroup("senior")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                ageGroup === "senior"
                  ? "bg-white text-slate-900 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              60 - 80 Yrs
            </button>
            <button
              type="button"
              onClick={() => setAgeGroup("super-senior")}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                ageGroup === "super-senior"
                  ? "bg-white text-slate-900 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              &gt; 80 Yrs
            </button>
          </div>
        </div>
      </div>

      {/* Quick Presets Strip */}
      <div className="py-4 flex flex-wrap items-center gap-2 border-b border-slate-100 text-xs">
        <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          Quick CTC Presets:
        </span>
        {[600000, 900000, 1200000, 1500000, 2000000, 3000000, 5000000].map((ctc) => (
          <button
            key={ctc}
            type="button"
            onClick={() => {
              setSalary(ctc);
              setBasicSalary(Math.round(ctc * 0.5));
              setHraReceived(Math.round(ctc * 0.2));
            }}
            className={`px-2.5 py-1 rounded-lg border transition cursor-pointer ${
              salary === ctc
                ? "bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            ₹{ctc / 100000} Lakhs
          </button>
        ))}
      </div>

      {/* Main Grid: Inputs (Left) and Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6">
        {/* Left Column: Input Studio */}
        <div className="lg:col-span-7 space-y-6">
          {/* Segmented Step Tabs */}
          <div className="flex border-b border-slate-200 text-xs sm:text-sm font-semibold">
            <button
              type="button"
              onClick={() => setActiveInputTab("income")}
              className={`flex items-center gap-2 pb-3 px-4 border-b-2 transition cursor-pointer ${
                activeInputTab === "income"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Briefcase className="h-4 w-4" />
              1. Income Sources
            </button>
            <button
              type="button"
              onClick={() => setActiveInputTab("deductions")}
              className={`flex items-center gap-2 pb-3 px-4 border-b-2 transition cursor-pointer ${
                activeInputTab === "deductions"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              2. Deductions (Old Regime)
            </button>
            <button
              type="button"
              onClick={() => setActiveInputTab("taxes")}
              className={`flex items-center gap-2 pb-3 px-4 border-b-2 transition cursor-pointer ${
                activeInputTab === "taxes"
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Target className="h-4 w-4" />
              3. TDS & Penalties
            </button>
          </div>

          {/* TAB 1: INCOME SOURCES */}
          {activeInputTab === "income" && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Salaried & Recurring Income</h3>
                  <span className="text-xs text-slate-500">FY {financialYear}</span>
                </div>

                {/* Primary Salary Input */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Gross Annual Salary (CTC minus non-taxable allowances)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={salary || ""}
                      onChange={(e) => setSalary(Number(e.target.value))}
                      placeholder="12,00,000"
                      className="w-full rounded-xl border border-slate-200 pl-8 pr-4 py-2.5 text-base font-bold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Standard deduction of{" "}
                    <strong>₹{financialYear === "2025-26" ? "75,000" : "50,000"}</strong> (New
                    Regime) or <strong>₹50,000</strong> (Old Regime) will apply automatically.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Rental Income Received (Gross)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={rentalIncome || ""}
                        onChange={(e) => setRentalIncome(Number(e.target.value))}
                        placeholder="0"
                        className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      30% standard maintenance deduction auto-applied
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Interest & Other Income
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={otherIncome || ""}
                        onChange={(e) => setOtherIncome(Number(e.target.value))}
                        placeholder="0"
                        className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Savings account, FD interest, dividends
                    </span>
                  </div>
                </div>
              </div>

              {/* Freelance & Business Income */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Presumptive Business / Professional Income
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      For freelancers, consultants, and professionals u/s 44ADA / 44AD
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setProfessionalIncome(professionalIncome === 0 ? 500000 : 0)
                    }
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {professionalIncome > 0 ? "Remove" : "+ Add Income"}
                  </button>
                </div>

                {professionalIncome > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Gross Receipts / Invoices
                      </label>
                      <input
                        type="number"
                        value={professionalIncome || ""}
                        onChange={(e) => setProfessionalIncome(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Claimed Business Expenses
                      </label>
                      <input
                        type="number"
                        value={businessExpenses || ""}
                        onChange={(e) => setBusinessExpenses(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Capital Gains (Equities) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Capital Gains (Stocks, Mutual Funds)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Revised Budget 2024 rates: STCG @ 20%, LTCG @ 12.5% above ₹1.25 Lakhs
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStcgEquity(stcgEquity === 0 ? 50000 : 0)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {stcgEquity > 0 || ltcgEquity > 0 ? "Reset" : "+ Add Capital Gains"}
                  </button>
                </div>

                {(stcgEquity > 0 || ltcgEquity > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        STCG (Equity &lt; 1 Yr) @ 20%
                      </label>
                      <input
                        type="number"
                        value={stcgEquity || ""}
                        onChange={(e) => setStcgEquity(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        LTCG (Equity &gt; 1 Yr) @ 12.5%
                      </label>
                      <input
                        type="number"
                        value={ltcgEquity || ""}
                        onChange={(e) => setLtcgEquity(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500"
                      />
                      <span className="text-[10px] text-slate-400">
                        First ₹1.25L exempt automatically
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DEDUCTIONS & EXEMPTIONS */}
          {activeInputTab === "deductions" && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Regime Note:</strong> Deductions below apply exclusively under the{" "}
                  <strong>Old Tax Regime</strong>. Under the New Regime, standard deductions are
                  granted with flat progressive slabs and zero paperwork.
                </p>
              </div>

              {/* 80C and 80D */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                  Standard Tax Deductions (Section 80C &amp; 80D)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Section 80C (Max ₹1.5 Lakhs)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={deduction80C || ""}
                        onChange={(e) => setDeduction80C(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">EPF, PPF, ELSS, Term Life</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Section 80D Health Insurance (Self/Family)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        value={deduction80D || ""}
                        onChange={(e) => setDeduction80D(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">Max ₹25,000 for non-seniors</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      80D Parents Health Insurance
                    </label>
                    <input
                      type="number"
                      value={deduction80D_Parents || ""}
                      onChange={(e) => setDeduction80D_Parents(Number(e.target.value))}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400">Max ₹50,000 for senior parents</span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      NPS Additional (Sec 80CCD 1B)
                    </label>
                    <input
                      type="number"
                      value={deductionNPS || ""}
                      onChange={(e) => setDeductionNPS(Number(e.target.value))}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400">Max ₹50,000 extra deduction</span>
                  </div>
                </div>
              </div>

              {/* HRA Assistant */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      House Rent Allowance (HRA) Assistant
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Calculate tax-exempt rent under Section 10(13A)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHraAssistant(!showHraAssistant)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {showHraAssistant ? "Close Assistant" : "Calculate HRA"}
                  </button>
                </div>

                {showHraAssistant && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Basic Salary (Annual)
                      </label>
                      <input
                        type="number"
                        value={basicSalary || ""}
                        onChange={(e) => setBasicSalary(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        HRA Allowance Received
                      </label>
                      <input
                        type="number"
                        value={hraReceived || ""}
                        onChange={(e) => setHraReceived(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Total Rent Paid (Annual)
                      </label>
                      <input
                        type="number"
                        value={rentPaid || ""}
                        onChange={(e) => setRentPaid(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/70">
                      <div>
                        <span className="text-xs font-semibold text-slate-800 block">
                          Metro City?
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Delhi, Mumbai, Kolkata, Chennai (50% basic)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsMetro(!isMetro)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          isMetro
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        }`}
                      >
                        {isMetro ? "Yes (50%)" : "No (40%)"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Home Loan & Others */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                  Home Loan &amp; Other Deductions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Home Loan Interest (Section 24b)
                    </label>
                    <input
                      type="number"
                      value={homeLoanInterest || ""}
                      onChange={(e) => setHomeLoanInterest(Number(e.target.value))}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400">Max ₹2,00,000 for self-occupied</span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Other Deductions (80E / 80G / 80TTA)
                    </label>
                    <input
                      type="number"
                      value={otherDeductions || ""}
                      onChange={(e) => setOtherDeductions(Number(e.target.value))}
                      placeholder="0"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500"
                    />
                    <span className="text-[10px] text-slate-400">Education loan, donations</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TAXES PAID & PENALTIES */}
          {activeInputTab === "taxes" && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                TDS Credits &amp; Delay Interest (Section 234A/B)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    TDS / Advance Tax Paid
                  </label>
                  <input
                    type="number"
                    value={taxPaid || ""}
                    onChange={(e) => setTaxPaid(Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">As shown in Form 26AS / AIS</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    234A Delay (Months)
                  </label>
                  <input
                    type="number"
                    value={monthsDelay234A || ""}
                    onChange={(e) => setMonthsDelay234A(Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">1% per month for late return</span>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    234B Delay (Months)
                  </label>
                  <input
                    type="number"
                    value={monthsDelay234B || ""}
                    onChange={(e) => setMonthsDelay234B(Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">1% per month for short advance tax</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Executive Computation Studio */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-6">
          <div className="rounded-2xl border border-slate-900 bg-slate-950 text-white p-6 shadow-xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-medium text-slate-400 block">Assessment Year</span>
                <span className="text-sm font-bold text-white">
                  AY {financialYear === "2024-25" ? "2025-26" : "2026-27"}
                </span>
              </div>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  results.better === "New Regime"
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                    : "bg-indigo-500/15 text-indigo-300 border-indigo-500/30"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {results.better} Recommended
              </div>
            </div>

            {/* Savings Callout */}
            <div className="text-center py-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Estimated Net Savings
              </span>
              <div className="text-4xl font-extrabold text-emerald-400 mt-1 tracking-tight">
                {fmt(results.savings)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                by opting for the <strong>{results.better}</strong>
              </p>
            </div>

            {/* Side-by-side Regime Comparison Grid */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 text-center">
              <div
                className={`p-3 rounded-lg transition ${
                  results.better === "Old Regime"
                    ? "bg-indigo-500/20 border border-indigo-500/40"
                    : "opacity-80"
                }`}
              >
                <span className="text-[11px] font-semibold text-slate-300 block">Old Regime Tax</span>
                <span className="text-lg font-bold text-white mt-1 block">
                  {fmt(results.oldTax)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Taxable: {fmt(results.taxableOld)}
                </span>
              </div>

              <div
                className={`p-3 rounded-lg transition ${
                  results.better === "New Regime"
                    ? "bg-emerald-500/20 border border-emerald-500/40"
                    : "opacity-80"
                }`}
              >
                <span className="text-[11px] font-semibold text-slate-300 block">New Regime Tax</span>
                <span className="text-lg font-bold text-emerald-400 mt-1 block">
                  {fmt(results.newTax)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Taxable: {fmt(results.taxableNew)}
                </span>
              </div>
            </div>

            {/* Monthly Take-Home & Payable */}
            <div className="space-y-2.5 pt-2 border-t border-white/10 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Gross Income</span>
                <span className="font-semibold text-white">{fmt(results.grossTotalIncome)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Deductions Applied ({results.better})</span>
                <span className="font-semibold text-white">
                  -
                  {fmt(
                    results.better === "New Regime"
                      ? financialYear === "2025-26"
                        ? 75000
                        : 50000
                      : results.totalDeductions
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Estimated Monthly In-Hand</span>
                <span className="font-bold text-indigo-300">{fmt(results.monthlyTakeHome)} / mo</span>
              </div>

              {(results.interest234A > 0 || results.interest234B > 0) && (
                <div className="flex justify-between items-center text-rose-400 pt-1">
                  <span>Late Interest (234A/B)</span>
                  <span className="font-bold">
                    +{fmt(results.interest234A + results.interest234B)}
                  </span>
                </div>
              )}

              {taxPaid > 0 && (
                <div className="flex justify-between items-center text-emerald-400 pt-1">
                  <span>Prepaid Tax (TDS/Advance)</span>
                  <span className="font-bold">-{fmt(taxPaid)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t border-white/10 text-sm">
                <span className="font-bold text-white">Final Net Payable</span>
                <span className="text-xl font-extrabold text-white">
                  {fmt(results.totalPayable)}
                </span>
              </div>
            </div>

            {/* Slab Breakdown Details */}
            <details className="group pt-2 border-t border-white/10 text-xs">
              <summary className="cursor-pointer text-slate-400 hover:text-white flex items-center justify-between font-medium select-none">
                <span>View {results.better} Slab Breakdown</span>
                <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
              </summary>
              <div className="mt-3 space-y-1.5 p-3 rounded-lg bg-white/5 border border-white/5">
                {(results.better === "New Regime"
                  ? results.breakdownNew
                  : results.breakdownOld
                ).map((b, i) => (
                  <div key={i} className="flex justify-between text-slate-300">
                    <span className="truncate max-w-[180px]">{b.slab}</span>
                    <span className="font-semibold text-white">{fmt(b.tax)}</span>
                  </div>
                ))}
              </div>
            </details>

            {/* Export & Actions */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={downloadExcel}
                disabled={isGeneratingExcel}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition disabled:opacity-50 cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                {isGeneratingExcel ? "Generating..." : "Export Excel"}
              </button>

              <button
                type="button"
                onClick={downloadPdf}
                disabled={isGeneratingPdf}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <FileDown className="h-3.5 w-3.5" />
                {isGeneratingPdf ? "Generating..." : "Download PDF"}
              </button>
            </div>
          </div>

          {/* Expert Consultation Banner */}
          <div className="rounded-2xl border border-slate-200 bg-indigo-50/60 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Landmark className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Need Chartered Accountant Assistance?</h4>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  Our tax experts help you maximize legal deductions, handle capital gains, and file ITR with 100% compliance.
                </p>
              </div>
            </div>
            <Link
              href="/book"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 pt-1"
            >
              <span>Schedule 1-on-1 Consultation</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
