"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, Search, ChevronDown, Info, ArrowRight, ArrowLeftRight,
  Package, Percent, TrendingUp, CheckCircle2, AlertCircle, Building2
} from "lucide-react";

// ── GST Rates in India (as of 2025) ──────────────────────────────
const GST_RATES = [0, 0.1, 0.25, 1.5, 3, 5, 6, 12, 18, 28];

// Popular HSN codes with their GST rates
const HSN_PRESETS = [
  { hsn: "0101", desc: "Live Horses", rate: 0, category: "Agriculture" },
  { hsn: "1001", desc: "Wheat & Meslin", rate: 0, category: "Agriculture" },
  { hsn: "2106", desc: "Food Preparations", rate: 18, category: "Food" },
  { hsn: "2201", desc: "Water (incl. Mineral)", rate: 18, category: "Beverages" },
  { hsn: "2202", desc: "Aerated / Soft drinks", rate: 28, category: "Beverages" },
  { hsn: "2401", desc: "Tobacco leaves", rate: 5, category: "Tobacco" },
  { hsn: "3004", desc: "Medicaments / Medicines", rate: 12, category: "Pharma" },
  { hsn: "3401", desc: "Soap / Detergent", rate: 18, category: "FMCG" },
  { hsn: "3808", desc: "Pesticides", rate: 18, category: "Agri Inputs" },
  { hsn: "4901", desc: "Books & Printed Matter", rate: 0, category: "Education" },
  { hsn: "6101", desc: "Overcoats / Jackets (>1000)", rate: 12, category: "Textiles" },
  { hsn: "6109", desc: "T-Shirts / Vests", rate: 5, category: "Textiles" },
  { hsn: "7108", desc: "Gold / Silver", rate: 3, category: "Precious Metals" },
  { hsn: "7113", desc: "Jewellery", rate: 3, category: "Jewellery" },
  { hsn: "8471", desc: "Laptops / Computers", rate: 18, category: "Electronics" },
  { hsn: "8517", desc: "Mobile Phones", rate: 18, category: "Electronics" },
  { hsn: "8703", desc: "Passenger Vehicles", rate: 28, category: "Automobiles" },
  { hsn: "8706", desc: "EV (Electric Vehicles)", rate: 5, category: "Automobiles" },
  { hsn: "9503", desc: "Toys, Games & Sports goods", rate: 12, category: "Toys" },
  { hsn: "9619", desc: "Sanitary products", rate: 12, category: "Health" },
];

// SAC Codes for Services
const SAC_PRESETS = [
  { hsn: "9954", desc: "Construction Services", rate: 18, category: "Construction" },
  { hsn: "9963", desc: "Restaurant / Hotel Services", rate: 5, category: "Hospitality" },
  { hsn: "9964", desc: "Passenger Transport", rate: 5, category: "Transport" },
  { hsn: "9965", desc: "Freight / Cargo Transport", rate: 18, category: "Logistics" },
  { hsn: "9971", desc: "Financial Services (Banking)", rate: 18, category: "Finance" },
  { hsn: "9972", desc: "Real Estate Services", rate: 18, category: "Real Estate" },
  { hsn: "9983", desc: "IT / Software Services", rate: 18, category: "IT" },
  { hsn: "9984", desc: "Telecommunications", rate: 18, category: "Telecom" },
  { hsn: "9985", desc: "Advertising Services", rate: 18, category: "Media" },
  { hsn: "9993", desc: "CA / Legal Services", rate: 18, category: "Professional" },
];

type CalcMode = "exclusive" | "inclusive"; // Tax-exclusive (add tax) vs inclusive (extract tax)

export default function GSTCalculator() {
  const [amount, setAmount] = useState<number>(10000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [calcMode, setCalcMode] = useState<CalcMode>("exclusive");
  const [hsnSearch, setHsnSearch] = useState("");
  const [selectedHsn, setSelectedHsn] = useState<typeof HSN_PRESETS[0] | null>(null);
  const [showHsnPanel, setShowHsnPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<"goods" | "services">("goods");

  const presets = activeTab === "goods" ? HSN_PRESETS : SAC_PRESETS;

  const filtered = useMemo(() =>
    presets.filter(h =>
      h.desc.toLowerCase().includes(hsnSearch.toLowerCase()) ||
      h.hsn.includes(hsnSearch) ||
      h.category.toLowerCase().includes(hsnSearch.toLowerCase())
    ),
    [hsnSearch, presets]
  );

  const results = useMemo(() => {
    const rate = gstRate / 100;
    let baseAmount = 0, gstAmount = 0, totalAmount = 0;
    let cgst = 0, sgst = 0, igst = 0;

    if (calcMode === "exclusive") {
      baseAmount = amount;
      gstAmount = amount * rate;
      totalAmount = amount + gstAmount;
    } else {
      totalAmount = amount;
      baseAmount = amount / (1 + rate);
      gstAmount = amount - baseAmount;
    }

    // Intra-state: CGST + SGST; Inter-state: IGST
    cgst = gstAmount / 2;
    sgst = gstAmount / 2;
    igst = gstAmount;

    return {
      baseAmount: Math.round(baseAmount * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      cgst: Math.round(cgst * 100) / 100,
      sgst: Math.round(sgst * 100) / 100,
      igst: Math.round(igst * 100) / 100,
      effectiveRate: rate * 100,
    };
  }, [amount, gstRate, calcMode]);

  const fmt = (v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(v);

  return (
    <section className="bg-white py-16 lg:py-24" id="gst-calculator">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-6 py-2 text-sm font-bold tracking-wider text-emerald-700 uppercase border border-emerald-200/60">
            <Calculator className="h-4 w-4" />
            GST Calculator 2025
          </span>
          <h2 className="text-4xl font-extrabold text-slate-900 sm:text-5xl mb-4">
            Goods & Services Tax <span className="text-emerald-600">Calculator</span>
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-lg">
            Calculate GST for any product or service. Supports all GST rates applicable in India. Lookup HSN / SAC codes instantly.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-12 max-w-6xl mx-auto">
          {/* ── Left Panel: Inputs ── */}
          <div className="lg:col-span-7 space-y-6">
            {/* HSN / SAC Lookup */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-emerald-600" />
                HSN / SAC Code Lookup
              </h3>

              {/* Goods / Services tabs */}
              <div className="flex rounded-xl bg-slate-100 p-1 mb-4">
                {(["goods", "services"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => { setActiveTab(t); setSelectedHsn(null); setHsnSearch(""); }}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all capitalize ${activeTab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === "goods" ? "HSN" : "SAC"} code, product, or category...`}
                  value={hsnSearch}
                  onChange={e => { setHsnSearch(e.target.value); setShowHsnPanel(true); }}
                  onFocus={() => setShowHsnPanel(true)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all bg-slate-50"
                />
              </div>

              {/* HSN Results */}
              <AnimatePresence>
                {showHsnPanel && (hsnSearch || !selectedHsn) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg"
                  >
                    {filtered.slice(0, 8).map((item) => (
                      <button
                        key={item.hsn}
                        onClick={() => {
                          setSelectedHsn(item);
                          setGstRate(item.rate);
                          setHsnSearch(item.desc);
                          setShowHsnPanel(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50 transition-colors text-left border-b border-slate-100 last:border-0"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-400 font-mono">{item.hsn}</span>
                          <p className="text-sm font-medium text-slate-700">{item.desc}</p>
                          <span className="text-[10px] text-slate-400">{item.category}</span>
                        </div>
                        <span className={`shrink-0 ml-4 px-3 py-1 rounded-full text-xs font-bold ${item.rate === 0 ? "bg-blue-50 text-blue-600" : item.rate <= 5 ? "bg-green-50 text-green-600" : item.rate <= 12 ? "bg-amber-50 text-amber-600" : item.rate <= 18 ? "bg-orange-50 text-orange-600" : "bg-red-50 text-red-600"}`}>
                          {item.rate}%
                        </span>
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <div className="px-4 py-6 text-center text-sm text-slate-400">No results found. Enter GST rate manually below.</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Amount & Rate */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Percent className="h-5 w-5 text-emerald-600" />
                  Calculation Settings
                </h3>
                {/* Toggle Exclusive / Inclusive */}
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1">
                  <button
                    onClick={() => setCalcMode("exclusive")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${calcMode === "exclusive" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}
                    title="Add GST on top of base price"
                  >
                    + GST
                  </button>
                  <ArrowLeftRight className="h-3 w-3 text-slate-300" />
                  <button
                    onClick={() => setCalcMode("inclusive")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${calcMode === "inclusive" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400"}`}
                    title="Extract GST from total price"
                  >
                    Incl. GST
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                {/* Amount Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {calcMode === "exclusive" ? "Base Amount (₹)" : "Total Price incl. GST (₹)"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-4 border border-slate-200 rounded-xl text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all bg-slate-50"
                    />
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={10000000}
                    step={100}
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full mt-3 accent-emerald-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>₹100</span><span>₹1 Cr</span>
                  </div>
                </div>

                {/* GST Rate Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">GST Rate</label>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {GST_RATES.map(r => (
                      <button
                        key={r}
                        onClick={() => setGstRate(r)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${gstRate === r ? "bg-emerald-600 text-white border-emerald-600 shadow" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300"}`}
                      >
                        {r}%
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Current rate: <strong className="text-emerald-600">{gstRate}%</strong> (Tap a rate or pick via HSN lookup above)</p>
                </div>
              </div>
            </div>

            {/* GST Rate Guide */}
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6">
              <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-emerald-600" /> GST Rate Reference Guide
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                {[
                  { rate: "0%", desc: "Essential food, books, education", color: "bg-blue-50 text-blue-700 border-blue-100" },
                  { rate: "5%", desc: "Basic necessities, EVs, transport", color: "bg-green-50 text-green-700 border-green-100" },
                  { rate: "12%", desc: "Processed food, textiles, pharma input", color: "bg-lime-50 text-lime-700 border-lime-100" },
                  { rate: "18%", desc: "Most services, electronics, IT", color: "bg-amber-50 text-amber-700 border-amber-100" },
                  { rate: "28%", desc: "Luxury, tobacco, aerated drinks, cars", color: "bg-red-50 text-red-700 border-red-100" },
                  { rate: "3%", desc: "Gold, silver, precious stones", color: "bg-yellow-50 text-yellow-700 border-yellow-100" },
                ].map(g => (
                  <div key={g.rate} className={`p-3 rounded-xl border ${g.color}`}>
                    <div className="text-base font-black mb-1">{g.rate}</div>
                    <div className="text-[10px] leading-tight">{g.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Panel: Results ── */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-6">
              {/* Main Result Card */}
              <div className="rounded-2xl bg-slate-900 p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">GST Breakdown</h3>
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-full">
                    {gstRate}% GST
                  </span>
                </div>

                {selectedHsn && (
                  <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-white/40 font-mono mb-1">{activeTab === "goods" ? "HSN" : "SAC"}: {selectedHsn.hsn}</p>
                    <p className="font-medium text-sm">{selectedHsn.desc}</p>
                    <p className="text-xs text-white/40">{selectedHsn.category}</p>
                  </div>
                )}

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-white/60 text-sm">Base Amount</span>
                    <span className="font-bold text-lg">{fmt(results.baseAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/10">
                    <span className="text-white/60 text-sm">GST Amount ({gstRate}%)</span>
                    <span className="font-bold text-lg text-emerald-400">{fmt(results.gstAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 bg-white/5 rounded-xl px-4">
                    <span className="font-bold text-sm">Total Amount</span>
                    <span className="font-black text-2xl">{fmt(results.totalAmount)}</span>
                  </div>
                </div>

                {/* Intra vs Inter state */}
                <div>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest mb-3">GST Split</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                      <p className="text-[10px] text-white/40 font-bold uppercase mb-1">Intra-State</p>
                      <p className="text-xs text-white/60 mb-2">(CGST + SGST)</p>
                      <p className="text-sm font-bold text-emerald-300">CGST: {fmt(results.cgst)}</p>
                      <p className="text-sm font-bold text-emerald-300">SGST: {fmt(results.sgst)}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                      <p className="text-[10px] text-white/40 font-bold uppercase mb-1">Inter-State</p>
                      <p className="text-xs text-white/60 mb-2">(IGST)</p>
                      <p className="text-xl font-black text-blue-300">{fmt(results.igst)}</p>
                    </div>
                  </div>

                  <p className="text-[10px] text-white/30 text-center">
                    CGST & SGST apply for intra-state; IGST for inter-state transactions
                  </p>
                </div>
              </div>

              {/* Composition Scheme Note */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4" /> GST Registration Threshold
                </h4>
                <ul className="text-xs text-amber-700 space-y-1.5">
                  <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" /> Mandatory registration if turnover exceeds <strong>₹40L</strong> (goods) or <strong>₹20L</strong> (services)</li>
                  <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" /> Special category states: <strong>₹20L</strong> (goods) / <strong>₹10L</strong> (services)</li>
                  <li className="flex gap-2"><CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-600" /> Composition Scheme available for turnover up to <strong>₹1.5 Cr</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
