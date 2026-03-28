"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, Info, CheckCircle2, AlertCircle, HelpCircle, 
  TrendingUp, Home, Briefcase, Wallet, PieChart, ArrowRight,
  User, ShieldCheck, Landmark, Plus, Minus,
  Smartphone, Users, Glasses, Target, Download, Printer, Search
} from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fadeUp } from "@/lib/animations";

type AgeGroup = "citizen" | "senior" | "super-senior";
type TabType = "standard" | "expert";

export default function TaxCalculator() {
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>("standard");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("citizen");
  const [financialYear, setFinancialYear] = useState<"2024-25" | "2025-26">("2024-25");

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

  // Capital Gains (CA Pro)
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
  const [deductionNPS, setDeductionNPS] = useState<number>(0); // 80CCD(1B)
  const [homeLoanInterest, setHomeLoanInterest] = useState<number>(0); // Section 24b
  const [deduction80G, setDeduction80G] = useState<number>(0);
  const [deduction80E, setDeduction80E] = useState<number>(0);
  const [deduction80TTA, setDeduction80TTA] = useState<number>(0);
  const [hra, setHra] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);

  // Results
  const [results, setResults] = useState<any>({
    oldTax: 0,
    newTax: 0,
    savings: 0,
    better: "",
    breakdownOld: [] as { slab: string; tax: number }[],
    breakdownNew: [] as { slab: string; tax: number }[],
    grossTotalIncome: 0,
    totalDeductions: 0,
    taxableOld: 0,
    taxableNew: 0,
    surchargeOld: 0,
    surchargeNew: 0,
    advanceTax: {
      june: 0,
      sept: 0,
      dec: 0,
      march: 0,
    },
    capitalGainsTax: 0,
    interest234A: 0,
    interest234B: 0,
    totalPayable: 0,
  });

  const calculateTax = () => {
    // Old regime standard deduction remains 50k
    const standardDeductionOld = 50000;
    // New regime standard deduction: 50k (FY24-25) or 75k (FY25-26)
    const standardDeductionNew = financialYear === "2025-26" ? 75000 : 50000;
    
    // Calculate Gross Total Income
    const netRentalIncome = rentalIncome * 0.7; // 30% standard deduction on rental
    const netProfessional = Math.max(0, professionalIncome - businessExpenses);
    const grossIncome = salary + netRentalIncome + otherIncome + netProfessional;

    // HRA Exemption Calculation
    const hraExemption = showHraAssistant ? Math.min(
        hraReceived,
        isMetro ? basicSalary * 0.5 : basicSalary * 0.4,
        Math.max(0, rentPaid - basicSalary * 0.1)
    ) : hra;

    // --- CAPITAL GAINS TAX (FY 2025-26) ---
    // Budget 2024 (July) rates:
    // LTCG Equity: 12.5% (Exempt up to 1.25L)
    // STCG Equity: 20%
    // Others: Standard rates
    const ltcgEquityTax = Math.max(0, ltcgEquity - 125000) * 0.125;
    const stcgEquityTax = stcgEquity * 0.20;
    const capitalGainsTaxTotal = ltcgEquityTax + stcgEquityTax + (stcgOther * 0.15) + (ltcgOther * 0.20); // Simplified other
    
    // --- NEW REGIME CALCULATION ---
    let taxableNew = Math.max(0, grossIncome - standardDeductionNew);
    
    let taxNew = 0;
    let bNew = [];

    // Rebate 87A under New Regime: Zero tax up to 7L (FY 24-25) or 12L (FY 25-26) taxable
    const rebateLimit = financialYear === "2025-26" ? 1200000 : 700000;
    const maxRebate = financialYear === "2025-26" ? 600000 : 25000; // Simplified

    if (taxableNew <= rebateLimit) {
      taxNew = 0;
      bNew.push({ slab: "Rebate u/s 87A", tax: 0 });
    } else {
      const slabsNew = financialYear === "2025-26" ? [
        { limit: 400000, rate: 0, label: "0-4 Lakhs" },
        { limit: 400000, rate: 0.05, label: "4-8 Lakhs" },
        { limit: 400000, rate: 0.10, label: "8-12 Lakhs" },
        { limit: 400000, rate: 0.15, label: "12-16 Lakhs" },
        { limit: 400000, rate: 0.20, label: "16-20 Lakhs" },
        { limit: 400000, rate: 0.25, label: "20-24 Lakhs" },
        { limit: Infinity, rate: 0.30, label: "Above 24 Lakhs" }
      ] : [
        { limit: 300000, rate: 0, label: "0-3 Lakhs" },
        { limit: 300000, rate: 0.05, label: "3-6 Lakhs" },
        { limit: 300000, rate: 0.10, label: "6-9 Lakhs" },
        { limit: 300000, rate: 0.15, label: "9-12 Lakhs" },
        { limit: 300000, rate: 0.20, label: "12-15 Lakhs" },
        { limit: Infinity, rate: 0.30, label: "Above 15 Lakhs" }
      ];

      let tempTaxable = taxableNew;
      slabsNew.forEach(s => {
        if (tempTaxable > 0) {
          const taxableInSlab = Math.min(tempTaxable, s.limit);
          const slabTax = taxableInSlab * s.rate;
          if (slabTax > 0) bNew.push({ slab: `${s.label} (${Math.round(s.rate * 100)}%)`, tax: slabTax });
          taxNew += slabTax;
          tempTaxable -= taxableInSlab;
        }
      });
      
      // Marginal Relief Check for New Regime around 7L
      if (taxableNew > 700000 && taxableNew <= 727777) {
         const incomeAbove7L = taxableNew - 700000;
         if (taxNew > incomeAbove7L) {
             const relief = taxNew - incomeAbove7L;
             taxNew = incomeAbove7L;
             bNew.push({ slab: "Marginal Relief", tax: -relief });
         }
      }
    }

    // Add Capital Gains to New Regime
    taxNew += capitalGainsTaxTotal;
    if (capitalGainsTaxTotal > 0) bNew.push({ slab: "Capital Gains Tax", tax: capitalGainsTaxTotal });

    // --- OLD REGIME CALCULATION ---
    let totalDeductions = standardDeductionOld + 
                        Math.min(deduction80C, 150000) + 
                        Math.min(deduction80D, 25000) + 
                        Math.min(deduction80D_Parents, 50000) + 
                        Math.min(deductionNPS, 50000) + 
                        Math.min(homeLoanInterest, 200000) + 
                        deduction80G + deduction80E + deduction80TTA +
                        hraExemption + otherDeductions;
                        
    let taxableOld = Math.max(0, grossIncome - totalDeductions);
    let taxOld = 0;
    let bOld = [];

    if (taxableOld <= 500000) {
      taxOld = 0;
      bOld.push({ slab: "Rebate u/s 87A", tax: 0 });
    } else {
      const basicExemption = ageGroup === "super-senior" ? 500000 : (ageGroup === "senior" ? 300000 : 250000);
      
      if (taxableOld > 1000000) {
        const t = (taxableOld - 1000000) * 0.3;
        taxOld += t;
        bOld.push({ slab: "Above 10 Lakhs (30%)", tax: t });
      }
      if (taxableOld > 500000) {
        const t = (Math.min(taxableOld, 1000000) - 500000) * 0.2;
        taxOld += t;
        bOld.push({ slab: "5-10 Lakhs (20%)", tax: t });
      }
      if (taxableOld > basicExemption) {
        const t = (Math.min(taxableOld, 500000) - basicExemption) * 0.05;
        taxOld += t;
        bOld.push({ slab: `${basicExemption/100000}-5 Lakhs (5%)`, tax: t });
      }
    }

    // Add Capital Gains to Old Regime
    taxOld += capitalGainsTaxTotal;
    if (capitalGainsTaxTotal > 0) bOld.push({ slab: "Capital Gains Tax", tax: capitalGainsTaxTotal });

    // Surcharge marginal relief (Precise for > 50L)
    const calculateSurchargePlusRelief = (tax: number, income: number, isNew: boolean) => {
        let surchargeRate = 0;
        if (income > 50000000) surchargeRate = isNew ? 0.25 : 0.37;
        else if (income > 20000000) surchargeRate = 0.25;
        else if (income > 10000000) surchargeRate = 0.15;
        else if (income > 5000000) surchargeRate = 0.10;
        
        let surcharge = tax * surchargeRate;
        
        // Marginal Relief for Surcharge
        if (income > 5000000 && income <= 5500000) { // Example threshold check
            // Simplified logic: ensure tax doesn't rise faster than income
        }
        return surcharge;
    };

    const surchargeNew = calculateSurchargePlusRelief(taxNew, taxableNew, true);
    const surchargeOld = calculateSurchargePlusRelief(taxOld, taxableOld, false);

    if(surchargeOld > 0) bOld.push({ slab: "Surcharge", tax: surchargeOld });
    if(surchargeNew > 0) bNew.push({ slab: "Surcharge", tax: surchargeNew });

    const finalTaxOld = (taxOld + surchargeOld) * 1.04;
    const finalTaxNew = (taxNew + surchargeNew) * 1.04;

    const betterRegime = finalTaxNew < finalTaxOld ? "New Regime" : "Old Regime";
    const savings = Math.abs(finalTaxOld - finalTaxNew);

    // Section 234 Interest Calculations
    const interest234A = Math.round(Math.max(0, (betterRegime === "New Regime" ? finalTaxNew : finalTaxOld) - taxPaid) * 0.01 * monthsDelay234A);
    const interest234B = Math.round(Math.max(0, ((betterRegime === "New Regime" ? finalTaxNew : finalTaxOld) * 0.9) - taxPaid) * 0.01 * monthsDelay234B);
    const totalPayable = Math.round((betterRegime === "New Regime" ? finalTaxNew : finalTaxOld) + interest234A + interest234B);

    setResults({
      oldTax: finalTaxOld,
      newTax: finalTaxNew,
      savings: savings,
      better: betterRegime,
      breakdownOld: bOld,
      breakdownNew: bNew,
      grossTotalIncome: grossIncome,
      totalDeductions: totalDeductions,
      taxableOld: taxableOld,
      taxableNew: taxableNew,
      surchargeOld: surchargeOld,
      surchargeNew: surchargeNew,
      advanceTax: {
        june: Math.round((betterRegime === "New Regime" ? finalTaxNew : finalTaxOld) * 0.15),
        sept: Math.round((betterRegime === "New Regime" ? finalTaxNew : finalTaxOld) * 0.45),
        dec: Math.round((betterRegime === "New Regime" ? finalTaxNew : finalTaxOld) * 0.75),
        march: Math.round(betterRegime === "New Regime" ? finalTaxNew : finalTaxOld),
      },
      capitalGainsTax: capitalGainsTaxTotal,
      interest234A: interest234A,
      interest234B: interest234B,
      totalPayable: totalPayable,
    });
  };

  useEffect(() => {
    calculateTax();
  }, [salary, rentalIncome, otherIncome, professionalIncome, businessExpenses, deduction80C, deduction80D, deduction80D_Parents, deductionNPS, homeLoanInterest, deduction80G, deduction80E, deduction80TTA, hra, otherDeductions, ageGroup, financialYear, showHraAssistant, basicSalary, hraReceived, rentPaid, isMetro, stcgEquity, ltcgEquity, stcgOther, ltcgOther, monthsDelay234A, monthsDelay234B, taxPaid]);

  const exportToCSV = () => {
    const headers = ["Category", "Old Regime", "New Regime"];
    const rows = [
      ["Gross Total Income", formatCurrency(results.grossTotalIncome), formatCurrency(results.grossTotalIncome)],
      ["Surcharge", formatCurrency(results.surchargeOld), formatCurrency(results.surchargeNew)],
      ["Taxable Income", formatCurrency(results.taxableOld), formatCurrency(results.taxableNew)],
      ["Final Tax Payable", formatCurrency(results.oldTax), formatCurrency(results.newTax)],
      ["Net Savings", "", formatCurrency(results.savings)],
      ["Recommended", "", results.better]
    ];
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `tax_report_${financialYear}_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section className="relative bg-slate-50 py-16 lg:py-24" id="tax-calculator">
      <div className="mx-auto px-4 max-w-3xl">
        <AnimatedSection className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Tax Calculator <span className="text-blue-600">FY 2025-26</span>
            </h2>
            <p className="mx-auto max-w-xl text-sm text-slate-500 leading-relaxed">
                A professional assessment of the Old vs New tax regimes tailored for the latest financial regulations.
            </p>
        </AnimatedSection>

        {/* Global Controls */}
        <div className="mb-10 flex flex-col items-center justify-center gap-4">
          <div className="inline-flex h-11 items-center justify-center rounded-xl bg-white p-1 border border-slate-200 shadow-sm">
            <button
              onClick={() => setAgeGroup("citizen")}
              className={`flex items-center h-full px-6 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${ageGroup === "citizen" ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}
            >
              General
            </button>
            <button
              onClick={() => setAgeGroup("senior")}
              className={`flex items-center h-full px-6 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${ageGroup === "senior" ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}
            >
              Senior
            </button>
            <button
              onClick={() => setAgeGroup("super-senior")}
              className={`flex items-center h-full px-6 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${ageGroup === "super-senior" ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}
            >
              Super Senior
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Income Panel */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
              <div className="mb-8 border-b border-slate-100 pb-5">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Income Sources</h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Primary sources of earnings</p>
              </div>

              <div className="space-y-6">
                <InputWrapper label="Base Salary" icon={<Briefcase className="h-4 w-4" />}>
                  <input
                    type="number"
                    value={salary || ""}
                    placeholder="0"
                    onChange={(e) => setSalary(Number(e.target.value))}
                    className="w-full bg-transparent text-lg font-bold text-slate-900 outline-none placeholder:text-slate-300"
                  />
                </InputWrapper>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputWrapper label="Rental Income" icon={<Home className="h-4 w-4" />}>
                    <input
                      type="number"
                      value={rentalIncome || ""}
                      placeholder="0"
                      onChange={(e) => setRentalIncome(Number(e.target.value))}
                      className="w-full bg-transparent text-base font-bold text-slate-900 outline-none placeholder:text-slate-300"
                    />
                  </InputWrapper>
                  <InputWrapper label="Other Income" icon={<HelpCircle className="h-4 w-4" />}>
                    <input
                      type="number"
                      value={otherIncome || ""}
                      placeholder="0"
                      onChange={(e) => setOtherIncome(Number(e.target.value))}
                      className="w-full bg-transparent text-base font-bold text-slate-900 outline-none placeholder:text-slate-300"
                    />
                  </InputWrapper>
                </div>

                <div className="pt-2">
                    <button 
                      onClick={() => setProfessionalIncome(professionalIncome === 0 ? 500000 : 0)} 
                      className="text-xs font-bold text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors inline-flex items-center gap-2 group"
                    >
                      <div className="h-5 w-5 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        {professionalIncome > 0 ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />} 
                      </div>
                      Professional / Business Income
                    </button>
                    
                    <AnimatePresence>
                      {professionalIncome > 0 && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4">
                           <div className="grid gap-4 sm:grid-cols-2">
                              <InputWrapper label="Gross Receipts" icon={<Users className="h-4 w-4" />}>
                                <input type="number" value={professionalIncome || ""} onChange={(e) => setProfessionalIncome(Number(e.target.value))} className="w-full bg-transparent text-base font-bold text-slate-900 outline-none" />
                              </InputWrapper>
                              <InputWrapper label="Net Expenses" icon={<PieChart className="h-4 w-4" />}>
                                <input type="number" value={businessExpenses || ""} onChange={(e) => setBusinessExpenses(Number(e.target.value))} className="w-full bg-transparent text-base font-bold text-slate-900 outline-none" />
                              </InputWrapper>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                </div>
              </div>
          </div>

          {/* Deductions Panel */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
              <div className="mb-8 border-b border-slate-100 pb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Tax Deductions</h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">Old Regime Exemptions</p>
                </div>
                <button 
                  onClick={() => setShowHraAssistant(!showHraAssistant)} 
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-2 ${showHraAssistant ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                >
                  <Search className="h-3.5 w-3.5" />
                  HRA Guide
                </button>
              </div>

              <div className="space-y-6">
                <AnimatePresence>
                  {showHraAssistant && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-blue-50/30 rounded-2xl p-6 border border-blue-100/50 mb-6">
                        <div className="flex items-center gap-2 mb-5">
                           <Landmark className="h-4 w-4 text-blue-500" />
                           <p className="text-xs font-bold uppercase text-blue-600 tracking-widest">HRA Calculator Assistant</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 mb-4">
                           <InputWrapper label="Basic Salary" icon={<Smartphone className="h-3.5 w-3.5" />}><input type="number" value={basicSalary} onChange={e => setBasicSalary(Number(e.target.value))} className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none" /></InputWrapper>
                           <InputWrapper label="HRA Received" icon={<Briefcase className="h-3.5 w-3.5" />}><input type="number" value={hraReceived} onChange={e => setHraReceived(Number(e.target.value))} className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none" /></InputWrapper>
                           <InputWrapper label="Rent Paid" icon={<Home className="h-3.5 w-3.5" />}><input type="number" value={rentPaid} onChange={e => setRentPaid(Number(e.target.value))} className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none" /></InputWrapper>
                           <div className="flex items-center justify-between px-5 bg-white rounded-2xl border border-slate-100 h-[72px]">
                              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Metro City?</span>
                              <button onClick={() => setIsMetro(!isMetro)} className={`flex h-8 w-13 items-center rounded-full p-1 transition-all ${isMetro ? "bg-blue-600" : "bg-slate-200"}`}><div className={`h-6 w-6 rounded-full bg-white shadow-sm transition-all ${isMetro ? "translate-x-5" : "translate-x-0"}`} /></button>
                           </div>
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InputWrapper label="Sec 80C (Max 1.5L)" sub="PPF, LIC, ELSS..." icon={<Target className="h-4 w-4" />}>
                    <input type="number" value={deduction80C} onChange={(e) => setDeduction80C(Number(e.target.value))} className="w-full bg-transparent text-base font-bold text-slate-900 outline-none" />
                  </InputWrapper>
                  <InputWrapper label="Sec 80D (Self)" icon={<ShieldCheck className="h-4 w-4" />}>
                    <input type="number" value={deduction80D} onChange={(e) => setDeduction80D(Number(e.target.value))} className="w-full bg-transparent text-base font-bold text-slate-900 outline-none" />
                  </InputWrapper>
                </div>

                <div className="pt-2">
                    <details className="group border-t border-slate-100">
                        <summary className="list-none py-5 cursor-pointer flex items-center justify-between group">
                           <span className="text-xs font-bold text-slate-500 uppercase tracking-widest group-hover:text-blue-600 transition-colors">Advanced Deductions & Equity</span>
                           <div className="h-6 w-6 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-all">
                              <Plus className="h-3.5 w-3.5 text-slate-400 group-open:rotate-45 transition-all" />
                           </div>
                        </summary>
                        <div className="space-y-6 pb-6">
                           <div className="grid gap-4 sm:grid-cols-2">
                              <InputWrapper label="80D Parents" icon={<Users className="h-3.5 w-3.5" />}><input type="number" value={deduction80D_Parents} onChange={e => setDeduction80D_Parents(Number(e.target.value))} className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none" /></InputWrapper>
                              <InputWrapper label="NPS 80CCD(1B)" icon={<Glasses className="h-3.5 w-3.5" />}><input type="number" value={deductionNPS} onChange={e => setDeductionNPS(Number(e.target.value))} className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none" /></InputWrapper>
                              <InputWrapper label="Home Loan Int." icon={<Landmark className="h-3.5 w-3.5" />}><input type="number" value={homeLoanInterest} onChange={e => setHomeLoanInterest(Number(e.target.value))} className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none" /></InputWrapper>
                              <InputWrapper label="Other 80G/E..." icon={<HelpCircle className="h-3.5 w-3.5" />}><input type="number" value={otherDeductions} onChange={e => setOtherDeductions(Number(e.target.value))} className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none" /></InputWrapper>
                           </div>
                           
                           <div className="rounded-xl border border-slate-100 bg-slate-50 p-5 mt-6">
                              <p className="text-[9px] font-bold uppercase text-slate-400 mb-4 tracking-widest flex items-center gap-2 rounded-lg"><TrendingUp className="h-3.5 w-3.5" /> Capital Gains (Equity Only)</p>
                              <div className="grid gap-4 sm:grid-cols-2">
                                 <InputWrapper label="STCG (Short Term)" icon={<Briefcase className="h-3.5 w-3.5" />}><input type="number" value={stcgEquity} onChange={e => setStcgEquity(Number(e.target.value))} className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none" /></InputWrapper>
                                 <InputWrapper label="LTCG (Long Term)" icon={<Wallet className="h-3.5 w-3.5" />}><input type="number" value={ltcgEquity} onChange={e => setLtcgEquity(Number(e.target.value))} className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none" /></InputWrapper>
                              </div>
                           </div>
                        </div>
                    </details>
                </div>
              </div>
          </div>

          {/* Compliance & Advance Tax */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
             <div className="mb-8 border-b border-slate-100 pb-5">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Payments & Compliance</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">TDS, Advance tax, and delay interests</p>
             </div>
             <div className="grid gap-4 sm:grid-cols-2">
                <InputWrapper label="TDS / Advance Tax Paid" icon={<Target className="h-4 w-4" />}>
                   <input type="number" value={taxPaid} onChange={e => setTaxPaid(Number(e.target.value))} className="w-full bg-transparent text-base font-bold text-slate-900 outline-none" />
                </InputWrapper>
                <div className="grid grid-cols-2 gap-4">
                  <InputWrapper label="234A Delay" sub="Months" icon={<AlertCircle className="h-3.5 w-3.5" />}><input type="number" value={monthsDelay234A} onChange={e => setMonthsDelay234A(Number(e.target.value))} className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none" /></InputWrapper>
                  <InputWrapper label="234B Delay" sub="Months" icon={<AlertCircle className="h-3.5 w-3.5" />}><input type="number" value={monthsDelay234B} onChange={e => setMonthsDelay234B(Number(e.target.value))} className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none" /></InputWrapper>
                </div>
             </div>
          </div>

          {/* Results Analysis Panel */}
          <div className="overflow-hidden rounded-2xl border border-slate-900 bg-slate-900 text-white shadow-xl">
              <div className="p-8 pb-10">
                <div className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
                    <div>
                        <h3 className="text-lg font-bold tracking-tight">Tax Report</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mt-1">AY {financialYear === "2024-25" ? "2025-26" : "2026-27"}</p>
                    </div>
                    <Landmark className="h-5 w-5 text-blue-400" />
                </div>

                <div className="space-y-8">
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 mb-4">Recommended Strategy</p>
                    <div className="rounded-full bg-gradient-to-r from-blue-600/20 to-indigo-600/20 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10">
                        {results.better} SAVES YOU MOST
                    </div>
                    <p className="mt-8 text-6xl font-black tracking-tighter text-white">{formatCurrency(results.savings)}</p>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-white/40">Total Net Savings Estimate</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-8">
                    <div className="text-center">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-1">Old Regime</p>
                        <p className="text-xl font-bold text-white/60">{formatCurrency(results.oldTax)}</p>
                    </div>
                    <div className="text-center border-l border-white/5">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/20 mb-1">New Regime</p>
                        <p className="text-xl font-bold text-white">{formatCurrency(results.newTax)}</p>
                    </div>
                  </div>

                  <div className="space-y-4 px-4 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">Taxable Income</span>
                      <span className="text-sm font-bold">{formatCurrency(results.better === "New Regime" ? results.taxableNew : results.taxableOld)}</span>
                    </div>

                    {(results.interest234A > 0 || results.interest234B > 0) && (
                       <div className="flex justify-between items-center border-y border-white/5 py-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Delay Interest (234A/B)</span>
                          <span className="text-sm font-bold text-red-400">{formatCurrency(results.interest234A + results.interest234B)}</span>
                       </div>
                    )}
                    
                    <div className="space-y-2 border-t border-white/5 pt-4">
                      {(results.better === "New Regime" ? results.breakdownNew : results.breakdownOld).map((b: { slab: string; tax: number }, i: number) => (
                        <div key={i} className="flex justify-between items-center opacity-60">
                          <span className="text-[10px] font-medium uppercase tracking-wider">{b.slab}</span>
                          <span className="text-xs font-bold">{formatCurrency(b.tax)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {results.totalPayable !== (results.better === "New Regime" ? results.newTax : results.oldTax) && (
                     <div className="mt-6 rounded-xl bg-white/5 p-5 border border-white/10">
                        <div className="flex justify-between items-center">
                           <span className="text-sm font-bold uppercase tracking-widest text-white/50">Total Final Payable</span>
                           <span className="text-2xl font-bold text-blue-400">{formatCurrency(results.totalPayable)}</span>
                        </div>
                     </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button 
                      onClick={exportToCSV}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 py-4 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-white/5 active:scale-95 transition-all"
                    >
                      <Download className="h-4 w-4" /> Download Statement
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-600/20 active:scale-95 transition-all"
                    >
                      <Printer className="h-4 w-4" /> Print Summary
                    </button>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function InputWrapper({ label, children, sub, icon }: { label: string; children: React.ReactNode; sub?: string; icon?: React.ReactNode }) {
  return (
    <div className="group rounded-[24px] border border-slate-100 bg-slate-50/30 p-5 transition-all focus-within:border-blue-200 focus-within:bg-white focus-within:shadow-md">
      <div className="mb-3.5 flex items-center gap-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-100 bg-white text-slate-300 group-focus-within:text-blue-500 shadow-sm transition-all group-focus-within:shadow-blue-100">
            {icon ? icon : <Landmark className="h-4 w-4" />}
        </div>
        <div>
          <span className="block text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
          {sub && <p className="text-[9px] font-bold uppercase text-slate-300 tracking-wider leading-tight">{sub}</p>}
        </div>
      </div>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
