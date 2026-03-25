"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calculator, Search, ChevronDown, Info, ArrowRight, ArrowLeftRight,
  Package, Percent, TrendingUp, CheckCircle2, AlertCircle, Building2,
  Plus, Trash2, ShoppingCart, Tag, Receipt, Copy, Share2, Eye, Minus
} from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";

// ── GST Rates in India (Next-Gen Reforms 2025-26) ───────────────────
const GST_RATES = [0, 3, 5, 18, 40];

const HSN_PRESETS = [
  { hsn: "0101", desc: "Live Horses", rate: 0, category: "Agriculture" },
  { hsn: "1001", desc: "Wheat & Meslin", rate: 0, category: "Agriculture" },
  { hsn: "2106", desc: "Food Preparations", rate: 18, category: "Food" },
  { hsn: "2201", desc: "Water (incl. Mineral)", rate: 18, category: "Beverages" },
  { hsn: "2202", desc: "Aerated / Soft drinks", rate: 40, category: "Beverages" },
  { hsn: "2401", desc: "Tobacco products", rate: 40, category: "Tobacco" },
  { hsn: "3004", desc: "Medicaments / Medicines", rate: 5, category: "Pharma" },
  { hsn: "3401", desc: "Soap / Detergent", rate: 5, category: "FMCG" },
  { hsn: "3808", desc: "Pesticides", rate: 5, category: "Agri Inputs" },
  { hsn: "4901", desc: "Books & Printed Matter", rate: 0, category: "Education" },
  { hsn: "6101", desc: "Overcoats / Jackets", rate: 5, category: "Textiles" },
  { hsn: "7108", desc: "Gold / Silver", rate: 3, category: "Precious Metals" },
  { hsn: "8471", desc: "Laptops / Computers", rate: 18, category: "Electronics" },
  { hsn: "8517", desc: "Mobile Phones", rate: 18, category: "Electronics" },
  { hsn: "8703", desc: "Luxury Cars / SUVs", rate: 40, category: "Automobiles" },
  { hsn: "8711", desc: "Two-wheelers", rate: 18, category: "Automobiles" },
  { hsn: "2523", desc: "Cement", rate: 18, category: "Construction" },
  { hsn: "9503", desc: "Toys & Games", rate: 5, category: "Toys" },
  { hsn: "9619", desc: "Sanitary products", rate: 5, category: "Health" },
];

const SAC_PRESETS = [
  { hsn: "9954", desc: "Construction Services", rate: 18, category: "Construction" },
  { hsn: "9963", desc: "Hotel stays < ₹7,500/day", rate: 5, category: "Hospitality" },
  { hsn: "9963", desc: "Premium Hotel / Restaurant", rate: 18, category: "Hospitality" },
  { hsn: "9964", desc: "Passenger Transport (Air/Taxi)", rate: 5, category: "Transport" },
  { hsn: "9983", desc: "Gym, Salon & Yoga Services", rate: 5, category: "Leisure" },
  { hsn: "9983", desc: "IT / Software Services", rate: 18, category: "IT" },
  { hsn: "9971", desc: "Financial Services (Banking)", rate: 18, category: "Finance" },
  { hsn: "9993", desc: "CA / Professional Services", rate: 18, category: "Professional" },
];

type CalcMode = "exclusive" | "inclusive";

interface BillItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  gstRate: number;
  cessRate: number;
  discount: number; // Percentage
}

export default function GSTCalculator() {
  const [calcMode, setCalcMode] = useState<CalcMode>("exclusive");
  const [showMarginMode, setShowMarginMode] = useState(false);
  const [margin, setMargin] = useState<number>(20);
  const [hsnSearch, setHsnSearch] = useState("");
  const [showHsnPanel, setShowHsnPanel] = useState(false);
  const [activeTab, setActiveTab] = useState<"goods" | "services">("goods");
  const [placeOfSupply, setPlaceOfSupply] = useState<"intra" | "inter">("intra");
  const [isRcm, setIsRcm] = useState(false);
  const [taxScheme, setTaxScheme] = useState<"regular" | "composition">("regular");
  const [inputPurchases, setInputPurchases] = useState<number>(0);
  const [inputGstRate, setInputGstRate] = useState<number>(18);

  // Multi-item support
  const [items, setItems] = useState<BillItem[]>([]);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem("gst_items");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load items", e);
      }
    } else {
        setItems([{ id: "1", name: "Standard Product", unitPrice: 1000, quantity: 1, gstRate: 18, cessRate: 0, discount: 0 }]);
    }
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem("gst_items", JSON.stringify(items));
    }
  }, [items]);

  const [newItem, setNewItem] = useState<BillItem>({
    id: "",
    name: "",
    unitPrice: 0,
    quantity: 1,
    gstRate: 18,
    cessRate: 0,
    discount: 0
  });

  const addItem = () => {
    if (newItem.unitPrice <= 0) return;
    setItems([...items, { ...newItem, id: Date.now().toString(), name: newItem.name || `Item ${items.length + 1}` }]);
    setNewItem({ id: "", name: "", unitPrice: 0, quantity: 1, gstRate: 18, cessRate: 0, discount: 0 });
    setHsnSearch("");
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof BillItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

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
    let subTotal = 0;
    let totalGst = 0;
    let totalCess = 0;
    let totalDiscount = 0;
    
    const itemBreakdown = items.map(item => {
      let price = item.unitPrice * item.quantity;
      if (showMarginMode) {
        price = price * (1 + margin / 100);
      }

      // Apply per-item discount
      const discountVal = price * (item.discount / 100);
      const discountedPrice = price - discountVal;
      totalDiscount += discountVal;

      let basePrice = 0, gst = 0, cess = 0;
      if (calcMode === "exclusive") {
        basePrice = discountedPrice;
        gst = basePrice * (item.gstRate / 100);
        cess = basePrice * (item.cessRate / 100);
      } else {
        const combinedRate = (item.gstRate + item.cessRate) / 100;
        basePrice = discountedPrice / (1 + combinedRate);
        gst = basePrice * (item.gstRate / 100);
        cess = basePrice * (item.cessRate / 100);
      }

      subTotal += basePrice;
      totalGst += gst;
      totalCess += cess;

      return { ...item, basePrice, gst, cess, discountVal, total: basePrice + gst + cess };
    });

    const grandTotal = subTotal + totalGst + totalCess;

    // ITC Logic
    const itcAmount = inputPurchases * (inputGstRate / 100);
    const netGstPayable = Math.max(0, totalGst - itcAmount);

    // Composition Logic
    const compositionRate = activeTab === "goods" ? 1 : 6; // Simplified: 1% goods, 6% services
    const compositionTax = grandTotal * (compositionRate / 100);

    return {
      items: itemBreakdown,
      subTotal,
      totalGst,
      totalCess,
      totalDiscount,
      grandTotal,
      cgst: totalGst / 2,
      sgst: totalGst / 2,
      igst: totalGst,
      itcAmount,
      netGstPayable,
      compositionTax,
      compositionRate
    };
  }, [items, calcMode, showMarginMode, margin, inputPurchases, inputGstRate, activeTab]);

  const exportToCSV = () => {
    const headers = ["Item", "Unit Price", "Quantity", "Discount %", "GST %", "Base Total", "Tax Amount", "Grand Total"];
    const rows = results.items.map(i => [
      i.name,
      i.unitPrice,
      i.quantity,
      i.discount,
      i.gstRate,
      i.basePrice.toFixed(2),
      i.gst.toFixed(2),
      i.total.toFixed(2)
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `gst_calculation_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fmt = (v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

  return (
    <section className="bg-transparent pt-12 pb-20 lg:pt-16 lg:pb-28" id="gst-calculator">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimatedSection className="mb-16 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-6 py-2 text-sm font-bold tracking-wider text-emerald-600 uppercase">
            <Calculator className="h-4 w-4" />
            Advanced GST Engine
          </span>
          <h2 className="mb-5 text-4xl font-extrabold text-[var(--fg)] sm:text-5xl">
            Professional GST <span className="text-emerald-600">Planner</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[var(--fg-muted)]">
            Create itemized tax invoices, compare inclusive/exclusive rates, and calculate margins with the most advanced GST tool in India.
          </p>
        </AnimatedSection>

        {/* Mode Switcher */}
        <div className="mb-12 flex flex-wrap justify-center gap-4">
           <div className="inline-flex rounded-2xl bg-gray-100 p-1.5 shadow-inner">
            <button
              onClick={() => setCalcMode("exclusive")}
              className={`flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold transition-all ${calcMode === "exclusive" ? "bg-white text-emerald-600 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Plus className="h-4 w-4" />
              Tax Exclusive
            </button>
            <button
              onClick={() => setCalcMode("inclusive")}
              className={`flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-bold transition-all ${calcMode === "inclusive" ? "bg-white text-emerald-600 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
            >
              <ArrowLeftRight className="h-4 w-4" />
              Tax Inclusive
            </button>
          </div>

          <button
            onClick={() => setShowMarginMode(!showMarginMode)}
            className={`flex items-center gap-2 rounded-2xl px-8 py-3 text-sm font-bold transition-all border-2 ${showMarginMode ? "bg-emerald-600 border-emerald-600 text-white shadow-lg" : "bg-white border-gray-200 text-gray-500 hover:border-emerald-300"}`}
          >
            <TrendingUp className="h-4 w-4" />
            Margin Mode
          </button>

          <div className="inline-flex rounded-2xl bg-amber-50 p-1.5 border border-amber-200">
            <button
                onClick={() => setTaxScheme("regular")}
                className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${taxScheme === "regular" ? "bg-amber-500 text-white shadow-md" : "text-amber-600/50"}`}
            >
                <Building2 className="h-3.5 w-3.5" />
                Regular
            </button>
            <button
                onClick={() => setTaxScheme("composition")}
                className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${taxScheme === "composition" ? "bg-amber-500 text-white shadow-md" : "text-amber-600/50"}`}
            >
                <Tag className="h-3.5 w-3.5" />
                Composition
            </button>
          </div>
        </div>

        <div className="grid gap-12 lg:gap-16 lg:grid-cols-12 max-w-7xl mx-auto">
          {/* ── Left Panel: Inputs ── */}
          <div className="lg:col-span-7">
            <div className="space-y-8">
              {/* Item Entry Panel */}
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-white p-8 shadow-[var(--shadow-md)]">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-[var(--fg)]">
                        <ShoppingCart className="h-5 w-5 text-emerald-600" />
                        Quick Add Item
                    </h3>
                    <div className="flex rounded-lg bg-gray-100 p-1">
                        {(["goods", "services"] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${activeTab === t ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400"}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-6">
                  {/* Search / HSN */}
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                        <Search className="h-5 w-5" />
                    </div>
                    <input
                      type="text"
                      placeholder={`Search ${activeTab === "goods" ? "HSN" : "SAC"}, product, or rate...`}
                      value={hsnSearch}
                      onChange={e => { setHsnSearch(e.target.value); setShowHsnPanel(true); }}
                      onFocus={() => setShowHsnPanel(true)}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-100 rounded-2xl bg-gray-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all font-medium"
                    />
                    
                    <AnimatePresence>
                      {showHsnPanel && hsnSearch && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl"
                        >
                          {filtered.map((item) => (
                            <button
                              key={item.hsn}
                              onClick={() => {
                                setNewItem({ ...newItem, name: item.desc, gstRate: item.rate });
                                setGstRateManually(item.rate);
                                setHsnSearch(item.desc);
                                setShowHsnPanel(false);
                              }}
                              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left hover:bg-emerald-50 transition-colors"
                            >
                              <div>
                                <span className="text-[10px] font-black text-gray-400 font-mono tracking-widest">{item.hsn}</span>
                                <p className="text-sm font-bold text-gray-700">{item.desc}</p>
                              </div>
                              <span className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">{item.rate}%</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-5">
                    <div className="sm:col-span-2 rounded-2xl border-2 border-gray-50 bg-gray-50/50 p-4 focus-within:border-emerald-500/30 focus-within:bg-white transition-all">
                        <label className="mb-2 block text-[10px] font-black uppercase text-gray-400 tracking-widest">Unit Price</label>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-400">₹</span>
                            <input
                                type="number"
                                value={newItem.unitPrice || ""}
                                placeholder="0.00"
                                onChange={e => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                                className="w-full bg-transparent font-black text-emerald-600 outline-none"
                            />
                        </div>
                    </div>
                    <div className="rounded-2xl border-2 border-gray-50 bg-gray-50/50 p-4 focus-within:border-emerald-500/30 focus-within:bg-white transition-all">
                        <label className="mb-2 block text-[10px] font-black uppercase text-gray-400 tracking-widest">Qty</label>
                        <input
                            type="number"
                            value={newItem.quantity}
                            onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                            className="w-full bg-transparent font-black text-gray-700 outline-none"
                        />
                    </div>
                    <div className="rounded-2xl border-2 border-gray-50 bg-gray-50/50 p-4 focus-within:border-emerald-500/30 focus-within:bg-white transition-all">
                        <label className="mb-2 block text-[10px] font-black uppercase text-gray-400 tracking-widest">GST %</label>
                        <select
                            value={newItem.gstRate}
                            onChange={e => setNewItem({ ...newItem, gstRate: Number(e.target.value) })}
                            className="w-full bg-transparent font-black text-gray-700 outline-none cursor-pointer"
                        >
                            {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                        </select>
                    </div>
                    <div className="rounded-2xl border-2 border-gray-50 bg-gray-50/50 p-4 focus-within:border-emerald-500/30 focus-within:bg-white transition-all">
                        <label className="mb-2 block text-[10px] font-black uppercase text-gray-400 tracking-widest">Disc %</label>
                        <input
                            type="number"
                            value={newItem.discount || ""}
                            placeholder="0"
                            onChange={e => setNewItem({ ...newItem, discount: Number(e.target.value) })}
                            className="w-full bg-transparent font-black text-red-500 outline-none"
                        />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={addItem}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--fg)] py-4 font-black tracking-widest text-white uppercase shadow-lg transition-all hover:bg-emerald-600"
                  >
                    <Plus className="h-5 w-5" />
                    Add to Bill List
                  </motion.button>
                </div>
              </div>

              {/* Bill List */}
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-white overflow-hidden shadow-[var(--shadow-md)]">
                <div className="bg-gray-50 px-8 py-4 border-b border-[var(--border)] flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Current Items ({items.length})</h3>
                    <Receipt className="h-4 w-4 text-gray-300" />
                </div>
                <div className="divide-y divide-gray-100">
                    <AnimatePresence mode="popLayout">
                        {items.map((item) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={item.id}
                                className="group p-6 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{item.name}</p>
                                            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{item.gstRate}% GST {item.cessRate > 0 && `+ ${item.cessRate}% Cess`}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="h-8 w-8 rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pl-12">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Unit Price</p>
                                        <p className="font-black text-gray-700">{fmt(item.unitPrice)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Quantity</p>
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => updateItem(item.id, "quantity", Math.max(1, item.quantity - 1))} className="text-gray-400 hover:text-emerald-500"><Minus className="h-3 w-3" /></button>
                                            <span className="font-black text-gray-700">{item.quantity}</span>
                                            <button onClick={() => updateItem(item.id, "quantity", item.quantity + 1)} className="text-gray-400 hover:text-emerald-500"><Plus className="h-3 w-3" /></button>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Base Total</p>
                                        <p className="font-black text-emerald-600">{fmt(item.unitPrice * item.quantity)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Tax Amount</p>
                                        <p className="font-black text-gray-700">{fmt((item.unitPrice * item.quantity) * (item.gstRate / 100))}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {items.length === 0 && (
                        <div className="p-12 text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-200">
                                <Receipt className="h-8 w-8" />
                            </div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No items added to the bill</p>
                        </div>
                    )}
                </div>
              </div>

              {/* Pro Settings */}
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-white p-6 shadow-sm">
                    <h4 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        <Building2 className="h-4 w-4" />
                        Place of Supply
                    </h4>
                    <div className="flex rounded-xl bg-gray-100 p-1">
                        <button
                            onClick={() => setPlaceOfSupply("intra")}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${placeOfSupply === "intra" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400"}`}
                        >
                            Intra-State
                        </button>
                        <button
                            onClick={() => setPlaceOfSupply("inter")}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${placeOfSupply === "inter" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-400"}`}
                        >
                            Inter-State
                        </button>
                    </div>
                </div>

                <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-white p-6 shadow-sm">
                    <h4 className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        <AlertCircle className="h-4 w-4" />
                        Reverse Charge (RCM)
                    </h4>
                    <button
                        onClick={() => setIsRcm(!isRcm)}
                        className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-all ${isRcm ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-100 bg-gray-50 text-gray-400"}`}
                    >
                        <span className="text-xs font-black uppercase tracking-widest">{isRcm ? "Active" : "Disabled"}</span>
                        <div className={`h-5 w-10 rounded-full p-1 transition-all ${isRcm ? "bg-emerald-500" : "bg-gray-300"}`}>
                            <div className={`h-3 w-3 rounded-full bg-white transition-all ${isRcm ? "translate-x-5" : ""}`}></div>
                        </div>
                    </button>
                </div>
              </div>

              {/* Margin Settings */}
              {showMarginMode && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="rounded-[var(--radius-xl)] border-2 border-emerald-500/20 bg-emerald-50/30 p-8 shadow-sm"
                >
                    <h4 className="mb-6 flex items-center gap-2 font-black uppercase tracking-[0.2em] text-emerald-700">
                        <TrendingUp className="h-5 w-5" />
                        Margin Controls
                    </h4>
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                        <div className="flex-1">
                            <div className="mb-2 flex justify-between">
                                <label className="text-xs font-bold text-emerald-600">PROFIT MARGIN ON COST</label>
                                <span className="font-black text-emerald-700 text-xl">{margin}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="200"
                                step="1"
                                value={margin}
                                onChange={e => setMargin(Number(e.target.value))}
                                className="h-2 w-full appearance-none rounded-lg bg-emerald-200 accent-emerald-600"
                            />
                        </div>
                        <div className="rounded-2xl bg-white p-4 shadow-sm border border-emerald-100 flex-none sm:w-48 text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Margin Multiplier</p>
                            <p className="text-2xl font-black text-emerald-600">x{(1 + margin/100).toFixed(2)}</p>
                        </div>
                    </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* ── Right Panel: Results ── */}
          <div className="lg:col-span-5">
            <div className="sticky top-28 space-y-8">
              <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--fg)] p-10 text-white shadow-[var(--shadow-xl)] relative overflow-hidden">
                {/* Visual Decoration */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500 opacity-10 blur-[80px]"></div>
                <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-blue-600 opacity-10 blur-[80px]"></div>

                <div className="relative z-10">
                  <div className="mb-10 flex items-center justify-between border-b border-white/5 pb-8">
                    <div>
                        <h3 className="text-3xl font-black">Calculation</h3>
                        <p className="text-sm text-white/50">{calcMode === "exclusive" ? "Tax Exclusive Mode" : "Tax Inclusive Mode"}</p>
                    </div>
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                        <Percent className="h-7 w-7" />
                    </div>
                  </div>

                  <div className="grid gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-white/40 font-bold uppercase tracking-widest text-xs">
                            <span>{taxScheme === "regular" ? "Total Output Tax" : "Estimated Turnover"}</span>
                            <span>{fmt(taxScheme === "regular" ? results.totalGst : results.grandTotal)}</span>
                        </div>
                        {taxScheme === "regular" && results.itcAmount > 0 && (
                            <div className="flex items-center justify-between text-emerald-400 font-bold uppercase tracking-widest text-xs">
                                <span>Input Tax Credit (ITC)</span>
                                <span>- {fmt(results.itcAmount)}</span>
                            </div>
                        )}
                        {taxScheme === "composition" && (
                            <div className="flex items-center justify-between text-amber-400 font-bold uppercase tracking-widest text-xs">
                                <span>Composition Tax ({results.compositionRate}%)</span>
                                <span>{fmt(results.compositionTax)}</span>
                            </div>
                        )}
                    </div>

                    <div className="relative mt-2">
                       <div className="absolute inset-0 rounded-[2.5rem] bg-emerald-600 blur-lg opacity-40"></div>
                       <div className="relative rounded-[2.5rem] bg-emerald-600 p-8 text-center border border-white/10 shadow-inner">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-2">
                           {taxScheme === "regular" ? "Net GST Cash Payable" : "Total Tax Liability"}
                        </p>
                        <p className="text-5xl font-black tracking-tight">
                            {fmt(taxScheme === "regular" ? results.netGstPayable : results.compositionTax)}
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/80">
                            {taxScheme === "regular" ? `${items.length} Packages Mapped` : "Composition Scheme"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tax Breakdown */}
                  <div className="mt-12 space-y-6">
                     <h4 className="flex items-center gap-3 text-xs font-black text-white/40 uppercase tracking-[0.2em]">
                      <span className="h-[1px] flex-1 bg-white/10"></span>
                      {taxScheme === "regular" ? "GST Breakdown" : "Scheme Breakdown"}
                      <span className="h-[1px] flex-1 bg-white/10"></span>
                    </h4>
                    <div className="grid gap-4">
                        {taxScheme === "regular" ? (
                            placeOfSupply === "intra" ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-3xl bg-white/5 p-5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <p className="text-[10px] font-black text-white/40 uppercase mb-1">Central Tax</p>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white/60 font-bold">CGST:</span>
                                            <span className="font-black text-emerald-400">{fmt(results.cgst)}</span>
                                        </div>
                                    </div>
                                    <div className="rounded-3xl bg-white/5 p-5 border border-white/5 hover:bg-white/10 transition-colors">
                                        <p className="text-[10px] font-black text-white/40 uppercase mb-1">State Tax</p>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white/60 font-bold">SGST:</span>
                                            <span className="font-black text-emerald-400">{fmt(results.sgst)}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-3xl bg-white/5 p-10 border border-white/5 hover:bg-white/10 transition-colors text-center">
                                    <p className="text-[10px] font-black text-white/40 uppercase mb-2">Integrated Tax</p>
                                    <div className="flex justify-center items-baseline gap-2">
                                        <span className="text-white/60 font-bold text-lg">IGST:</span>
                                        <span className="text-3xl font-black text-blue-400">{fmt(results.igst)}</span>
                                    </div>
                                </div>
                            )
                        ) : (
                           <div className="rounded-3xl bg-amber-500/10 p-6 border border-amber-500/20 text-center">
                                <p className="text-xs font-bold text-amber-400 mb-2">Composition Scheme</p>
                                <p className="text-sm text-white/60 leading-relaxed">
                                    Output Tax is calculated at <strong>{results.compositionRate}%</strong> of aggregate turnover. 
                                    Input Tax Credit is not applicable.
                                </p>
                           </div>
                        )}
                    </div>
                  </div>

                  <div className="mt-10 grid grid-cols-2 gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={exportToCSV}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 py-5 text-sm font-black text-white uppercase tracking-widest transition-all hover:bg-white/20"
                    >
                      <Receipt className="h-4 w-4" />
                      Export
                    </motion.button>
                     <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => window.print()}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-5 text-sm font-black text-white uppercase tracking-widest transition-all hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
                    >
                      <Share2 className="h-4 w-4" />
                      Print Bill
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* ITC Input Panel */}
              {taxScheme === "regular" && (
                <div className="rounded-[var(--radius-xl)] border-2 border-emerald-500/10 bg-emerald-50/20 p-8 shadow-sm">
                    <div className="mb-6 flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-emerald-800">
                            <ShoppingCart className="h-4 w-4" />
                            Input Tax Credit (ITC)
                        </h4>
                        <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{inputGstRate}% Purchase Rate</span>
                    </div>
                    <div className="space-y-4">
                        <div className="group rounded-2xl bg-white p-4 border border-emerald-100 shadow-sm focus-within:border-emerald-500 transition-all">
                            <label className="mb-1 block text-[10px] font-bold text-gray-400 uppercase">Total Purchases (Excl. Tax)</label>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-600">₹</span>
                                <input
                                    type="number"
                                    value={inputPurchases || ""}
                                    placeholder="0.00"
                                    onChange={e => setInputPurchases(Number(e.target.value))}
                                    className="w-full bg-transparent font-black text-emerald-700 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between px-2">
                            <span className="text-xs font-bold text-gray-400 uppercase">Available Credit:</span>
                            <span className="font-black text-emerald-600">+{fmt(results.itcAmount)}</span>
                        </div>
                    </div>
                </div>
              )}

              {/* Summary Note */}
              <div className="rounded-[var(--radius-xl)] border-2 border-emerald-500/10 bg-white p-8 shadow-sm">
                <h4 className="mb-4 flex items-center gap-2 font-bold text-[var(--fg)]">
                  <Info className="h-5 w-5 text-emerald-600" />
                   {taxScheme === "regular" ? "ITC Optimization" : "Composition Rules"}
                </h4>
                <div className="text-xs text-[var(--fg-muted)] space-y-4">
                  {taxScheme === "regular" ? (
                    <p className="leading-relaxed">
                        Input Tax Credit (ITC) allows you to reduce the tax you have already paid on inputs (purchases) from your output tax liability.
                        Current Offset: <strong>{fmt(results.itcAmount)}</strong>.
                    </p>
                  ) : (
                    <p className="leading-relaxed">
                        Dealers under the composition scheme pay a flat tax of <strong>{results.compositionRate}%</strong> on their total turnover. 
                        <strong>Note:</strong> ITC cannot be claimed, and GST cannot be collected from customers.
                    </p>
                  )}
                  <ul className="space-y-3">
                    <li className="flex gap-3">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>Calculations reflect 2025 GST compliance standards.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function setGstRateManually(rate: number) {
    // This helper is used to keep consistency in the UI if needed
}
