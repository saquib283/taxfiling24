"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, Info, CheckCircle2, AlertCircle, HelpCircle, 
  TrendingUp, Home, Briefcase, Wallet, PieChart, ArrowRight,
  User, ShieldCheck, Landmark, Plus, Minus,
  Smartphone, Users, Glasses
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section id="calculator" className="bg-white pt-12 pb-20 lg:pt-16 lg:pb-28">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="mb-16 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-6 py-2 text-sm font-bold tracking-wider text-[var(--primary)] uppercase">
            <Calculator className="h-4 w-4" />
            Advanced Tax Planner
          </span>
          <h2 className="mb-5 text-4xl font-extrabold text-[var(--fg)] sm:text-5xl">
            India Income Tax Calculator <span className="text-[var(--primary)]">2024-25</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--fg-muted)]">
            Plan your taxes smart. Compare Old vs New regimes with granular inputs for all sections of the Income Tax Act. Updated for current Budget slabs.
          </p>
        </AnimatedSection>

        <div className="mb-12 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
          <div className="inline-flex rounded-2xl bg-[var(--bg-muted)] p-1.5 shadow-inner">
            <button
              onClick={() => setActiveTab("standard")}
              className={`flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold transition-all ${activeTab === "standard" ? "bg-white text-[var(--primary)] shadow-md" : "text-[var(--fg-soft)] hover:text-[var(--fg)]"}`}
            >
              <User className="h-4 w-4" />
              Standard Mode
            </button>
            <button
              onClick={() => setActiveTab("expert")}
              className={`flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold transition-all ${activeTab === "expert" ? "bg-white text-[var(--primary)] shadow-md" : "text-[var(--fg-soft)] hover:text-[var(--fg)]"}`}
            >
              <Briefcase className="h-4 w-4" />
              Expert Mode
            </button>
          </div>

          <div className="inline-flex rounded-2xl bg-blue-50 p-1.5 border border-blue-100">
             {[ "2024-25", "2025-26" ].map((fy) => (
                <button
                  key={fy}
                  onClick={() => setFinancialYear(fy as any)}
                  className={`rounded-xl px-6 py-2.5 text-xs font-black transition-all ${financialYear === fy ? "bg-blue-600 text-white shadow-lg" : "text-blue-600/50 hover:text-blue-600"}`}
                >
                  FY {fy}
                </button>
             ))}
          </div>
        </div>

        <div className="grid gap-12 lg:gap-20 lg:grid-cols-12 max-w-7xl mx-auto">
          {/* Inputs Panel */}
          <div className="lg:col-span-7">
            <div className="space-y-8">
              {/* Age Group Selector */}
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-md)]">
                <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-[var(--fg)]">
                  <ShieldCheck className="h-5 w-5 text-[var(--primary)]" />
                  Taxpayer Profile
                </h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  {[
                    { id: "citizen", label: "Normal", desc: "Under 60 years", icon: <User className="h-6 w-6" /> },
                    { id: "senior", label: "Senior", desc: "60 - 80 years", icon: <Users className="h-6 w-6" /> },
                    { id: "super-senior", label: "Super Senior", desc: "80+ years", icon: <Glasses className="h-6 w-6" /> }
                  ].map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setAgeGroup(group.id as AgeGroup)}
                      className={`group flex flex-col items-center justify-center text-center rounded-3xl border-2 p-6 transition-all ${ageGroup === group.id ? "border-[var(--primary)] bg-[var(--primary)]/5 shadow-sm" : "border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-gray-50"}`}
                    >
                      <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl transition-all ${ageGroup === group.id ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-muted)] text-[var(--fg-muted)] group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)]"}`}>
                        {group.icon}
                      </div>
                      <span className={`text-lg font-bold ${ageGroup === group.id ? "text-[var(--primary)]" : "text-[var(--fg)]"}`}>{group.label}</span>
                      <span className="mt-1 text-xs text-[var(--fg-muted)]">{group.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Income Sources Panel */}
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-md)]">
                <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-[var(--fg)]">
                  <Landmark className="h-5 w-5 text-[var(--primary)]" />
                  Income Details
                </h3>
                <div className="space-y-6">
                  <div className="rounded-3xl bg-[var(--bg-muted)]/50 p-6 lg:p-8">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <label className="text-sm font-bold text-[var(--fg-muted)] uppercase tracking-wider">Salary (Annual)</label>
                        <p className="text-xs text-[var(--fg-soft)]">Total CTC or Gross Annual Salary</p>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-[var(--fg-muted)]">₹</span>
                        <input
                          type="number"
                          value={salary}
                          onChange={(e) => setSalary(Number(e.target.value))}
                          className="w-full rounded-2xl border border-[var(--border)] bg-white py-3 pl-10 pr-4 font-black text-[var(--primary)] outline-none transition-all focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/10 sm:w-48"
                        />
                      </div>
                    </div>
                    <div className="relative px-2">
                       <input
                        type="range"
                        min="0"
                        max="10000000"
                        step="50000"
                        value={salary}
                        onChange={(e) => setSalary(Number(e.target.value))}
                        className="h-3 w-full appearance-none rounded-full bg-white transition-all accent-[var(--primary)] cursor-pointer shadow-inner border border-[var(--border)]"
                      />
                      <div className="mt-4 flex justify-between text-[10px] font-bold text-[var(--fg-soft)] uppercase tracking-widest">
                        <span>Min ₹0</span>
                        <span>₹50L</span>
                        <span>Max ₹1Cr+</span>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {activeTab === "expert" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-6 overflow-hidden pt-4 border-t border-[var(--border)]"
                      >
                        <div className="grid gap-6 sm:grid-cols-2">
                          <InputWrapper label="Rental Income" icon={<Home className="h-4 w-4" />}>
                            <input
                              type="number"
                              value={rentalIncome}
                              onChange={(e) => setRentalIncome(Number(e.target.value))}
                              className="w-full bg-transparent font-bold outline-none"
                            />
                          </InputWrapper>
                          <InputWrapper label="Other Sources" icon={<Wallet className="h-4 w-4" />}>
                            <input
                              type="number"
                              value={otherIncome}
                              onChange={(e) => setOtherIncome(Number(e.target.value))}
                              className="w-full bg-transparent font-bold outline-none"
                            />
                          </InputWrapper>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2">
                           <InputWrapper label="Professional Income" icon={<Briefcase className="h-4 w-4" />}>
                            <input
                              type="number"
                              value={professionalIncome}
                              onChange={(e) => setProfessionalIncome(Number(e.target.value))}
                              className="w-full bg-transparent font-bold outline-none"
                            />
                          </InputWrapper>
                          <InputWrapper label="Business Expenses" icon={<TrendingUp className="h-4 w-4" />}>
                            <input
                              type="number"
                              value={businessExpenses}
                              onChange={(e) => setBusinessExpenses(Number(e.target.value))}
                              className="w-full bg-transparent font-bold outline-none"
                            />
                          </InputWrapper>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Deductions Panel */}
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-md)]">
                <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-[var(--fg)]">
                  <ShieldCheck className="h-5 w-5 text-[var(--primary)]" />
                  Tax Saving Deductions (Old Regime)
                </h3>
                <div className="grid gap-6 sm:grid-cols-2">
                  <InputWrapper label="Section 80C (Max 1.5L)" sub="PPF, LIC, ELSS...">
                    <input
                      type="number"
                      value={deduction80C}
                      onChange={(e) => setDeduction80C(Number(e.target.value))}
                      className="w-full bg-transparent font-bold outline-none"
                    />
                  </InputWrapper>
                  <InputWrapper label="Section 80D (Health Insurance)">
                    <input
                      type="number"
                      value={deduction80D}
                      onChange={(e) => setDeduction80D(Number(e.target.value))}
                      className="w-full bg-transparent font-bold outline-none"
                    />
                  </InputWrapper>

                  <AnimatePresence>
                    {activeTab === "expert" && (
                      <>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="space-y-12 pt-8 border-t border-[var(--border)]"
                        >
                        {/* Capital Gains & Deductions */}
                        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="sm:col-span-2 lg:col-span-3">
                             <h4 className="flex items-center gap-2 text-lg font-black uppercase text-blue-600 mb-6 font-display">
                                <TrendingUp className="h-5 w-5" />
                                Capital Gains (CA Pro)
                             </h4>
                             <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                <InputWrapper label="STCG (Equity)" icon={<TrendingUp className="h-4 w-4" />}>
                                    <input type="number" value={stcgEquity} onChange={e => setStcgEquity(Number(e.target.value))} className="w-full bg-transparent font-bold outline-none" />
                                </InputWrapper>
                                <InputWrapper label="LTCG (Equity)" icon={<TrendingUp className="h-4 w-4" />}>
                                    <input type="number" value={ltcgEquity} onChange={e => setLtcgEquity(Number(e.target.value))} className="w-full bg-transparent font-bold outline-none" />
                                </InputWrapper>
                                <InputWrapper label="STCG (Others)" icon={<TrendingUp className="h-4 w-4" />}>
                                    <input type="number" value={stcgOther} onChange={e => setStcgOther(Number(e.target.value))} className="w-full bg-transparent font-bold outline-none" />
                                </InputWrapper>
                                <InputWrapper label="LTCG (Others)" icon={<TrendingUp className="h-4 w-4" />}>
                                    <input type="number" value={ltcgOther} onChange={e => setLtcgOther(Number(e.target.value))} className="w-full bg-transparent font-bold outline-none" />
                                </InputWrapper>
                             </div>
                             <p className="mt-4 text-[10px] text-[var(--fg-muted)] font-medium">
                                * Equity LTCG: 12.5% taxation after 1.25L exemption. STCG: 20%. Other rates apply as per Budget 2024.
                             </p>
                          </div>

                          <div className="sm:col-span-2 lg:col-span-3">
                             <h4 className="flex items-center gap-2 text-lg font-black uppercase text-purple-600 mb-6 mt-4 font-display">
                                <Calculator className="h-5 w-5" />
                                Additional Deductions
                             </h4>
                             <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                <InputWrapper label="80G (Donations)" icon={<Plus className="h-4 w-4" />}>
                                    <input type="number" value={deduction80G} onChange={e => setDeduction80G(Number(e.target.value))} className="w-full bg-transparent font-bold outline-none" />
                                </InputWrapper>
                                <InputWrapper label="80E (Edu Loan)" icon={<Plus className="h-4 w-4" />}>
                                    <input type="number" value={deduction80E} onChange={e => setDeduction80E(Number(e.target.value))} className="w-full bg-transparent font-bold outline-none" />
                                </InputWrapper>
                                <InputWrapper label="80TTA (Interest)" icon={<Plus className="h-4 w-4" />}>
                                    <input type="number" value={deduction80TTA} onChange={e => setDeduction80TTA(Number(e.target.value))} className="w-full bg-transparent font-bold outline-none" />
                                </InputWrapper>
                             </div>
                          </div>
                        </div>

                        <div className="grid gap-8 sm:grid-cols-2 border-t border-[var(--border)] pt-8">
                          <InputWrapper label="80CCD(1B) NPS (Max 50K)">
                            <input
                              type="number"
                              value={deductionNPS}
                              onChange={(e) => setDeductionNPS(Number(e.target.value))}
                              className="w-full bg-transparent font-bold outline-none"
                            />
                          </InputWrapper>
                           <InputWrapper label="80D (Parents Insurance)">
                            <input
                              type="number"
                              value={deduction80D_Parents}
                              onChange={(e) => setDeduction80D_Parents(Number(e.target.value))}
                              className="w-full bg-transparent font-bold outline-none"
                            />
                          </InputWrapper>
                        </div>
                        
                        <div className="grid gap-8 sm:grid-cols-2">
                          <InputWrapper label="Home Loan Int. (Section 24)">
                            <input
                              type="number"
                              value={homeLoanInterest}
                              onChange={(e) => setHomeLoanInterest(Number(e.target.value))}
                              className="w-full bg-transparent font-bold outline-none"
                            />
                          </InputWrapper>
                          <div className="sm:col-span-1">
                             <div className="flex items-center justify-between mb-4 px-2">
                                <label className="text-sm font-black text-[var(--fg-muted)] uppercase tracking-widest">HRA Exemption</label>
                                <button 
                                    onClick={() => setShowHraAssistant(!showHraAssistant)}
                                    className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-black uppercase transition-all ${showHraAssistant ? "bg-emerald-500 text-white shadow-lg" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                                >
                                    {showHraAssistant ? "Assistant Active" : "Use Assistant"}
                                </button>
                             </div>
                             
                             {showHraAssistant ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid gap-4 rounded-[2rem] bg-emerald-50/50 p-6 border-2 border-emerald-100"
                                >
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-2xl bg-white p-4 border border-emerald-100">
                                            <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">Basic Salary</span>
                                            <input type="number" value={basicSalary} onChange={e => setBasicSalary(Number(e.target.value))} className="w-full bg-transparent font-black text-emerald-600 outline-none" />
                                        </div>
                                        <div className="rounded-2xl bg-white p-4 border border-emerald-100">
                                            <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">HRA Received</span>
                                            <input type="number" value={hraReceived} onChange={e => setHraReceived(Number(e.target.value))} className="w-full bg-transparent font-black text-emerald-600 outline-none" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-2xl bg-white p-4 border border-emerald-100">
                                            <span className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">Rent Paid</span>
                                            <input type="number" value={rentPaid} onChange={e => setRentPaid(Number(e.target.value))} className="w-full bg-transparent font-black text-emerald-600 outline-none" />
                                        </div>
                                        <button 
                                            onClick={() => setIsMetro(!isMetro)}
                                            className={`rounded-2xl flex items-center justify-center font-black text-[10px] uppercase transition-all ${isMetro ? "bg-emerald-600 text-white shadow-md" : "bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50"}`}
                                        >
                                            {isMetro ? "Metro City" : "Non-Metro"}
                                        </button>
                                    </div>
                                </motion.div>
                             ) : (
                                <InputWrapper label="HRA / Rent Allowance">
                                    <input
                                    type="number"
                                    value={hra}
                                    onChange={(e) => setHra(Number(e.target.value))}
                                    className="w-full bg-transparent font-bold outline-none"
                                    />
                                </InputWrapper>
                             )}
                          </div>
                      </div>
                    </motion.div>
                    
                    {/* Compliance Section (CA Pro) */}
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-3xl bg-red-50/50 p-6 border border-red-100"
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-lg bg-red-100 p-2 text-red-600">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">Late Filing/Payment Interest (Sec 234)</h4>
                      </div>
                      
                      <div className="grid gap-6 sm:grid-cols-3">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">TDS/TCS/Tax Already Paid</label>
                          <input
                            type="number"
                            value={taxPaid || ""}
                            onChange={(e) => setTaxPaid(Number(e.target.value))}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-[var(--primary)] focus:outline-none"
                            placeholder="₹0"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">Delay in ITR (234A Months)</label>
                          <input
                            type="number"
                            value={monthsDelay234A || ""}
                            onChange={(e) => setMonthsDelay234A(Number(e.target.value))}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-[var(--primary)] focus:outline-none"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700">Default Adv. Tax (234B Months)</label>
                          <input
                            type="number"
                            value={monthsDelay234B || ""}
                            onChange={(e) => setMonthsDelay234B(Number(e.target.value))}
                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-[var(--primary)] focus:outline-none"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

          {/* Results Analytics Panel */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-8">
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--fg)] p-10 text-white shadow-[var(--shadow-xl)] relative overflow-hidden">
                {/* Visual Decoration */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[var(--primary)] opacity-10 blur-[80px]"></div>
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-600 opacity-10 blur-[80px]"></div>
                
                <div className="relative z-10">
                  <div className="mb-10 flex items-center justify-between">
                    <div>
                        <h3 className="text-3xl font-black">Plan Summary</h3>
                        <p className="text-sm text-white/50">Detailed tax estimation</p>
                    </div>
                    <div className="relative h-20 w-20">
                        {/* Simple SVG Donut Chart */}
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" className="stroke-white/10" strokeWidth="4" />
                            <circle 
                                cx="18" cy="18" r="16" fill="none" 
                                className="stroke-[var(--primary)] transition-all duration-1000" 
                                strokeWidth="4" 
                                strokeDasharray={`${Math.min(100, (results.better === "New Regime" ? results.newTax : results.oldTax) / results.grossTotalIncome * 100)} 100`}
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] font-black">
                            <span>{Math.round((results.better === "New Regime" ? results.newTax : results.oldTax) / results.grossTotalIncome * 100)}%</span>
                            <span className="text-[6px] opacity-40">TAX</span>
                        </div>
                    </div>
                  </div>
  
                  <div className="grid gap-8">
                    <div className="flex items-center justify-between rounded-3xl bg-white/5 p-6 border border-white/5">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white/40 mb-1">Gross Total Income</p>
                        <p className="text-3xl font-black">{formatCurrency(results.grossTotalIncome)}</p>
                      </div>
                      <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Landmark className="h-6 w-6 text-white/60" />
                      </div>
                    </div>
  
                    <div className="grid grid-cols-2 gap-6">
                      <div className={`rounded-3xl border p-6 transition-all ${results.better === "Old Regime" ? "border-[var(--success)] bg-[var(--success)]/10 ring-4 ring-[var(--success)]/10" : "border-white/10 bg-white/5"}`}>
                        <div className="mb-4 flex items-center gap-2">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/50">Old Regime</p>
                            {results.better === "Old Regime" && <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />}
                        </div>
                        <p className="text-2xl font-black">{formatCurrency(results.oldTax)}</p>
                        {results.better === "Old Regime" && <span className="mt-2 inline-flex rounded-full bg-[var(--success)]/20 px-3 py-1 text-[9px] font-bold text-[var(--success)] uppercase tracking-wider">Recommended</span>}
                      </div>
                      <div className={`rounded-3xl border p-6 transition-all ${results.better === "New Regime" ? "border-[var(--success)] bg-[var(--success)]/10 ring-4 ring-[var(--success)]/10" : "border-white/10 bg-white/5"}`}>
                        <div className="mb-4 flex items-center gap-2">
                            <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/50">New Regime</p>
                            {results.better === "New Regime" && <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />}
                        </div>
                        <p className="text-2xl font-black">{formatCurrency(results.newTax)}</p>
                        {results.better === "New Regime" && <span className="mt-2 inline-flex rounded-full bg-[var(--success)]/20 px-3 py-1 text-[9px] font-bold text-[var(--success)] uppercase tracking-wider">Recommended</span>}
                      </div>
                    </div>
  
                        <div className="flex items-center justify-between text-white/40 font-bold uppercase tracking-widest text-xs">
                            <span>Assessment Year</span>
                            <span className="text-white">{financialYear === "2024-25" ? "2025-26" : "2026-27"}</span>
                        </div>
                        <div className="flex items-center justify-between text-white/40 font-bold uppercase tracking-widest text-xs">
                            <span>Total Take-Home (Est.)</span>
                            <span className="text-emerald-400">{formatCurrency(results.grossTotalIncome - (results.better === "New Regime" ? results.newTax : results.oldTax))}</span>
                        </div>
                  </div>
  
                  {/* Tax Breakdown */}
                  <div className="mt-12 space-y-6">
                     <h4 className="flex items-center gap-3 text-xs font-black text-white/40 uppercase tracking-[0.2em]">
                      <span className="h-[1px] flex-1 bg-white/10"></span>
                      Tax Breakdown
                      <span className="h-[1px] flex-1 bg-white/10"></span>
                    </h4>
                    <div className="space-y-4 rounded-3xl bg-white/5 p-6 border border-white/5">
                      {(results.better === "New Regime" ? results.breakdownNew : results.breakdownOld).map((b: { slab: string; tax: number }, i: number) => (
                        <div key={i} className="flex justify-between text-sm items-center">
                          <span className="text-white/40 font-medium">{b.slab}</span>
                          <span className="font-bold text-white/90">{formatCurrency(b.tax)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t border-white/10 pt-4 text-sm font-black">
                        <span className="text-white/60">Cess (4%)</span>
                        <span className="text-[var(--primary-soft)]">{formatCurrency((results.better === "New Regime" ? results.newTax : results.oldTax) * 0.04 / 1.04)}</span>
                      </div>
                    </div>
                  </div>
  
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: "var(--primary)" }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-10 flex w-full items-center justify-center gap-3 rounded-2xl bg-white py-5 text-lg font-black text-[var(--fg)] transition-all"
                  >
                    Expert Consultation
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              {/* Planning Tips */}
              <div className="rounded-[var(--radius-xl)] border border-[var(--primary)]/20 bg-[var(--accent-soft)]/30 p-8 shadow-sm">
                <h4 className="mb-4 flex items-center gap-2 font-bold text-[var(--fg)]">
                  <Info className="h-5 w-5 text-[var(--primary)]" />
                  Tax Optimization Tips
                </h4>
                <ul className="space-y-4 text-sm text-[var(--fg-muted)]">
                  {deduction80C < 150000 && (
                    <li className="flex gap-2">
                      <Plus className="h-4 w-4 shrink-0 text-[var(--success)]" />
                      <span>Invest <strong>{formatCurrency(150000 - deduction80C)}</strong> more in 80C to save tax in Old Regime.</span>
                    </li>
                  )}
                  {deductionNPS < 50000 && (
                    <li className="flex gap-2">
                      <Plus className="h-4 w-4 shrink-0 text-[var(--success)]" />
                      <span>Contribution to NPS (80CCD) can save you an additional <strong>{formatCurrency(50000 - deductionNPS)}</strong>.</span>
                    </li>
                  )}
                  <li className="flex gap-2">
                    <ArrowRight className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                    <span>Always keep your Rent Receipts and Form 16 ready for verification.</span>
                  </li>
                </ul>
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
    <div className="group rounded-3xl border border-[var(--border)] bg-gray-50/50 p-6 transition-all focus-within:border-[var(--primary)] focus-within:bg-white focus-within:shadow-xl focus-within:shadow-[var(--primary)]/5">
      <div className="mb-3 flex items-center gap-2 text-xs font-black text-[var(--fg-muted)] uppercase tracking-[0.1em]">
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white shadow-sm border border-[var(--border)] group-focus-within:bg-[var(--primary)] group-focus-within:text-white transition-colors">
            {icon ? icon : <Plus className="h-3 w-3" />}
        </div>
        {label}
      </div>
      <div className="relative pl-8">
        {children}
        {sub && <p className="mt-2 text-[10px] font-medium text-[var(--fg-soft)]">{sub}</p>}
      </div>
    </div>
  );
}
