"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calculator, Info, CheckCircle2, AlertCircle, HelpCircle, 
  TrendingUp, Home, Briefcase, Wallet, PieChart, ArrowRight,
  User, ShieldCheck, Landmark, Plus, Minus
} from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { fadeUp } from "@/lib/animations";

type AgeGroup = "citizen" | "senior" | "super-senior";
type TabType = "standard" | "expert";

export default function TaxCalculator() {
  // UI State
  const [activeTab, setActiveTab] = useState<TabType>("standard");
  const [ageGroup, setAgeGroup] = useState<AgeGroup>("citizen");

  // Income Sources
  const [salary, setSalary] = useState<number>(1200000);
  const [rentalIncome, setRentalIncome] = useState<number>(0);
  const [otherIncome, setOtherIncome] = useState<number>(0);
  const [professionalIncome, setProfessionalIncome] = useState<number>(0);
  const [businessExpenses, setBusinessExpenses] = useState<number>(0);

  // Deductions (Old Regime)
  const [deduction80C, setDeduction80C] = useState<number>(150000);
  const [deduction80D, setDeduction80D] = useState<number>(25000);
  const [deduction80D_Parents, setDeduction80D_Parents] = useState<number>(0);
  const [deductionNPS, setDeductionNPS] = useState<number>(0); // 80CCD(1B)
  const [homeLoanInterest, setHomeLoanInterest] = useState<number>(0); // Section 24b
  const [hra, setHra] = useState<number>(0);
  const [otherDeductions, setOtherDeductions] = useState<number>(0);

  // Results
  const [results, setResults] = useState({
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
    surchargeNew: 0
  });

  const calculateTax = () => {
    // Old regime standard deduction remains 50k
    const standardDeductionOld = 50000;
    // New regime standard deduction increased to 75k in FY 2025-26 Budget
    const standardDeductionNew = 75000;
    
    // Calculate Gross Total Income
    const netRentalIncome = rentalIncome * 0.7; // 30% standard deduction on rental
    const netProfessional = Math.max(0, professionalIncome - businessExpenses);
    const grossIncome = salary + netRentalIncome + otherIncome + netProfessional;

    // --- NEW REGIME CALCULATION (FY 2025-26) ---
    // Budget 2024 (July) / 2025 Slabs
    // Standard Deduction: 75,000
    // Rebate 87A: Up to 7,000,000 (taxable) tax is zero.
    let taxableNew = Math.max(0, grossIncome - standardDeductionNew - Math.min(deductionNPS, 50000)); // NPS 80CCD(2) allowed in new regime if employer contrib, for simplicity allowing standard employee 80CCD(1b) to be excluded from new regime deduction pool unless specific. Reverting to base: Only SD is allowed. Let's keep it pure New Regime.
    taxableNew = Math.max(0, grossIncome - standardDeductionNew);
    
    let taxNew = 0;
    let bNew = [];

    // Rebate 87A under New Regime (Up to 7 Lakhs taxable income, tax is zero)
    if (taxableNew <= 700000) {
      taxNew = 0;
      bNew.push({ slab: "Rebate u/s 87A", tax: 0 });
    } else {
      // Latest FY 2025-26 Slabs:
      // 0-3L: 0%
      // 3-7L: 5%
      // 7-10L: 10%
      // 10-12L: 15%
      // 12-15L: 20%
      // >15L: 30%
      const slabsNew = [
        { limit: 300000, rate: 0, label: "0-3 Lakhs" },
        { limit: 400000, rate: 0.05, label: "3-7 Lakhs" },
        { limit: 300000, rate: 0.10, label: "7-10 Lakhs" },
        { limit: 200000, rate: 0.15, label: "10-12 Lakhs" },
        { limit: 300000, rate: 0.20, label: "12-15 Lakhs" },
        { limit: Infinity, rate: 0.30, label: "Above 15 Lakhs" }
      ];

      let tempTaxable = taxableNew;
      slabsNew.forEach(s => {
        if (tempTaxable > 0) {
          const taxableInSlab = Math.min(tempTaxable, s.limit);
          const slabTax = taxableInSlab * s.rate;
          if (slabTax > 0) bNew.push({ slab: `${s.label} (${s.rate * 100}%)`, tax: slabTax });
          taxNew += slabTax;
          tempTaxable -= taxableInSlab;
        }
      });
      
      // Marginal Relief Check for New Regime around 7L
      if (taxableNew > 700000 && taxableNew <= 727777) {
         const taxWithoutRelief = taxNew;
         const incomeAbove7L = taxableNew - 700000;
         if (taxWithoutRelief > incomeAbove7L) {
             const relief = taxWithoutRelief - incomeAbove7L;
             taxNew = taxNew - relief;
             bNew.push({ slab: "Marginal Relief", tax: -relief });
         }
      }
    }

    // --- OLD REGIME CALCULATION ---
    // Slabs based on age
    let basicExemption = 250000;
    if (ageGroup === "senior") basicExemption = 300000;
    if (ageGroup === "super-senior") basicExemption = 500000;

    let totalDeductions = standardDeductionOld + 
                        Math.min(deduction80C, 150000) + 
                        Math.min(deduction80D, 25000) + 
                        Math.min(deduction80D_Parents, 50000) + 
                        Math.min(deductionNPS, 50000) + 
                        Math.min(homeLoanInterest, 200000) + 
                        hra + otherDeductions;
                        
    let taxableOld = Math.max(0, grossIncome - totalDeductions);
    let taxOld = 0;
    let bOld = [];

    if (taxableOld <= 500000) {
      taxOld = 0;
      bOld.push({ slab: "Rebate u/s 87A", tax: 0 });
    } else {
      // Slab Logic (Standard Citizen under 60)
      if (ageGroup === "citizen") {
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
        if (taxableOld > 250000) {
          const t = (Math.min(taxableOld, 500000) - 250000) * 0.05;
          taxOld += t;
          bOld.push({ slab: "2.5-5 Lakhs (5%)", tax: t });
        }
      } else if (ageGroup === "senior") {
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
        if (taxableOld > 300000) {
          const t = (Math.min(taxableOld, 500000) - 300000) * 0.05;
          taxOld += t;
          bOld.push({ slab: "3-5 Lakhs (5%)", tax: t });
        }
      } else { // Super Senior
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
      }
    }

    // Compute Surcharge
    const calculateSurcharge = (tax: number, taxable: number, isNew: boolean) => {
      let surcharge = 0;
      if (taxable > 50000000) surcharge = tax * 0.25; // Note: New regime surcharge capped at 25% instead of 37%
      else if (taxable > 20000000) surcharge = tax * 0.25;
      else if (taxable > 10000000) surcharge = tax * 0.15;
      else if (taxable > 5000000) surcharge = tax * 0.10;
      
      // Marginal relief for surcharge is skipped for simplicity here, but rates are applied.
      return surcharge;
    };

    let surchargeOld = calculateSurcharge(taxOld, taxableOld, false);
    
    // New regime caps surcharge at 25% for income > 2Cr
    let surchargeNew = 0;
    if (taxableNew > 20000000) surchargeNew = taxNew * 0.25;
    else if (taxableNew > 10000000) surchargeNew = taxNew * 0.15;
    else if (taxableNew > 5000000) surchargeNew = taxNew * 0.10;

    if(surchargeOld > 0) bOld.push({ slab: "Surcharge", tax: surchargeOld });
    if(surchargeNew > 0) bNew.push({ slab: "Surcharge", tax: surchargeNew });

    taxOld += surchargeOld;
    taxNew += surchargeNew;

    // Cess 4%
    taxOld = taxOld * 1.04;
    taxNew = taxNew * 1.04;

    setResults({
      oldTax: Math.round(taxOld),
      newTax: Math.round(taxNew),
      savings: Math.abs(Math.round(taxOld - taxNew)),
      better: taxNew < taxOld ? "New Regime" : "Old Regime",
      breakdownOld: bOld,
      breakdownNew: bNew,
      grossTotalIncome: grossIncome,
      totalDeductions: totalDeductions,
      taxableOld,
      taxableNew,
      surchargeOld: 0, // Simplified for now
      surchargeNew: 0
    });
  };

  useEffect(() => {
    calculateTax();
  }, [salary, rentalIncome, otherIncome, professionalIncome, businessExpenses, deduction80C, deduction80D, deduction80D_Parents, deductionNPS, homeLoanInterest, hra, otherDeductions, ageGroup]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <section id="calculator" className="bg-white py-20 lg:py-28">
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

        {/* Tab Switcher */}
        <div className="mb-12 flex justify-center">
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
        </div>

        <div className="grid gap-12 lg:grid-cols-12">
          {/* Inputs Panel */}
          <div className="lg:col-span-7">
            <div className="space-y-8">
              {/* Age Group Selector */}
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-md)]">
                <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-[var(--fg)]">
                  <ShieldCheck className="h-5 w-5 text-[var(--primary)]" />
                  Taxpayer Profile
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {[
                    { id: "citizen", label: "Normal", desc: "Under 60 years" },
                    { id: "senior", label: "Senior", desc: "60 - 80 years" },
                    { id: "super-senior", label: "Super Senior", desc: "80+ years" }
                  ].map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setAgeGroup(group.id as AgeGroup)}
                      className={`flex flex-col rounded-2xl border-2 p-4 text-left transition-all ${ageGroup === group.id ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border)] hover:border-[var(--primary)]/30"}`}
                    >
                      <span className={`font-bold ${ageGroup === group.id ? "text-[var(--primary)]" : "text-[var(--fg)]"}`}>{group.label}</span>
                      <span className="text-xs text-[var(--fg-muted)]">{group.desc}</span>
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
                  <div>
                    <div className="mb-2 flex justify-between">
                      <label className="text-sm font-bold text-[var(--fg-muted)] uppercase italic">Salary (Annual)</label>
                      <span className="font-bold text-[var(--primary)]">{formatCurrency(salary)}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10000000"
                      step="50000"
                      value={salary}
                      onChange={(e) => setSalary(Number(e.target.value))}
                      className="h-2 w-full appearance-none rounded-lg bg-[var(--bg-muted)] transition-all accent-[var(--primary)]"
                    />
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
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="sm:col-span-2 grid gap-6 sm:grid-cols-2 border-t border-[var(--border)] pt-6"
                        >
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
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="sm:col-span-2 grid gap-6 sm:grid-cols-2"
                        >
                          <InputWrapper label="Home Loan Int. (Section 24)">
                            <input
                              type="number"
                              value={homeLoanInterest}
                              onChange={(e) => setHomeLoanInterest(Number(e.target.value))}
                              className="w-full bg-transparent font-bold outline-none"
                            />
                          </InputWrapper>
                          <InputWrapper label="HRA / Rent Allowance">
                            <input
                              type="number"
                              value={hra}
                              onChange={(e) => setHra(Number(e.target.value))}
                              className="w-full bg-transparent font-bold outline-none"
                            />
                          </InputWrapper>
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
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--fg)] p-8 text-white shadow-[var(--shadow-xl)]">
                <div className="mb-8 flex items-center justify-between">
                  <h3 className="text-2xl font-bold">Summary</h3>
                  <div className="rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider">FY 2024-25</div>
                </div>

                <div className="grid gap-6">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <span className="text-white/60">Gross Total Income</span>
                    <span className="text-xl font-bold">{formatCurrency(results.grossTotalIncome)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={`rounded-3xl border p-5 transition-all ${results.better === "Old Regime" ? "border-[var(--success)] bg-[var(--success)]/10" : "border-white/10 bg-white/5"}`}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Old Regime</p>
                      <p className="text-xl font-black">{formatCurrency(results.oldTax)}</p>
                      {results.better === "Old Regime" && <span className="mt-2 inline-block text-[10px] font-bold text-[var(--success)] uppercase">Save More</span>}
                    </div>
                    <div className={`rounded-3xl border p-5 transition-all ${results.better === "New Regime" ? "border-[var(--success)] bg-[var(--success)]/10" : "border-white/10 bg-white/5"}`}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">New Regime</p>
                      <p className="text-xl font-black">{formatCurrency(results.newTax)}</p>
                      {results.better === "New Regime" && <span className="mt-2 inline-block text-[10px] font-bold text-[var(--success)] uppercase">Save More</span>}
                    </div>
                  </div>

                  <div className="mt-4 rounded-3xl bg-[var(--gradient-primary)] p-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-1">Annual Savings with {results.better}</p>
                    <p className="text-4xl font-black">{formatCurrency(results.savings)}</p>
                  </div>
                </div>

                {/* Tax Breakdown */}
                <div className="mt-8 space-y-4">
                   <h4 className="flex items-center gap-2 text-sm font-bold text-white/60 uppercase">
                    <PieChart className="h-4 w-4" />
                    Verdict Breakdown
                  </h4>
                  <div className="space-y-2">
                    {(results.better === "New Regime" ? results.breakdownNew : results.breakdownOld).map((b, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-white/40">{b.slab}</span>
                        <span className="font-medium">{formatCurrency(b.tax)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-white/10 pt-2 text-sm font-bold">
                      <span className="text-white/60">Health & Education Cess (4%)</span>
                      <span>{formatCurrency((results.better === "New Regime" ? results.newTax : results.oldTax) * 0.04 / 1.04)}</span>
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 font-bold text-[var(--fg)] transition-all hover:bg-[var(--accent-soft)]"
                >
                  Expert Personal Consultation
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
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
    <div className="group rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)]/30 p-4 transition-all focus-within:border-[var(--primary)] focus-within:bg-white focus-within:shadow-sm">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[var(--fg-muted)] uppercase tracking-tight">
        {icon}
        {label}
      </div>
      {children}
      {sub && <p className="mt-1 text-[10px] text-[var(--fg-soft)]">{sub}</p>}
    </div>
  );
}
