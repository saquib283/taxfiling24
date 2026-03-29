"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Package, Percent, TrendingUp, Building2,
  Plus, Trash2, ShoppingCart, Tag, Receipt,
  Download, Printer, Target, ShieldCheck, IndianRupee
} from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";

function InputWrapper({ label, children, icon }: { label: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="group rounded-xl border border-slate-200 bg-slate-50/30 p-5 transition-all focus-within:border-blue-600 focus-within:bg-white focus-within:shadow-sm">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-100 bg-white text-slate-400 group-focus-within:text-blue-600 shadow-sm">
            {icon ? icon : <Percent className="h-3.5 w-3.5" />}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      </div>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

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
  discount: number;
}

export default function GSTCalculator({
  content,
}: {
  content?: {
    hero?: {
      titlePrefix?: string;
      titleHighlight?: string;
      description?: string;
    };
    controls?: {
      exclusiveLabel?: string;
      inclusiveLabel?: string;
      marginLabel?: string;
      regularLabel?: string;
      compositionLabel?: string;
    };
    entry?: {
      panelTitle?: string;
      panelSubtitle?: string;
      goodsLabel?: string;
      servicesLabel?: string;
      searchPlaceholderGoods?: string;
      searchPlaceholderServices?: string;
      noPresetResultsText?: string;
      unitPriceLabel?: string;
      quantityLabel?: string;
      gstRateLabel?: string;
      discountLabel?: string;
      cessLabel?: string;
      addItemLabel?: string;
      messagePlaceholder?: string;
    };
    compliance?: {
      placeOfSupplyTitle?: string;
      intraLabel?: string;
      interLabel?: string;
      reverseChargeTitle?: string;
      reverseChargeDescription?: string;
      itcTitle?: string;
      itcSubtitle?: string;
      totalPurchasesLabel?: string;
      inputGstLabel?: string;
    };
    entries?: {
      title?: string;
      itemCountSuffix?: string;
      emptyStateText?: string;
      descriptionColumn?: string;
      quantityColumn?: string;
      totalColumn?: string;
    };
    summary?: {
      panelTitle?: string;
      panelSubtitle?: string;
      totalPayableLabel?: string;
      totalPayableDescription?: string;
      taxableBaseLabel?: string;
      discountsLabel?: string;
      cgstLabel?: string;
      sgstLabel?: string;
      igstLabel?: string;
      cessBreakdownLabel?: string;
      itcOffsetLabel?: string;
      netGstLabel?: string;
      standardDescription?: string;
      creditDescription?: string;
      compositionDescription?: string;
      exportLabel?: string;
      printLabel?: string;
      marginAnalysisTitle?: string;
      expectedMarginLabel?: string;
      estimatedProfitLabel?: string;
    };
    goodsPresets?: Array<{ hsn?: string; desc?: string; rate?: string; category?: string; isVisible?: boolean }>;
    servicePresets?: Array<{ hsn?: string; desc?: string; rate?: string; category?: string; isVisible?: boolean }>;
  };
}) {
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
  const [items, setItems] = useState<BillItem[]>([]);

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

  const heroCopy = content?.hero || {};
  const controlsCopy = content?.controls || {};
  const entryCopy = content?.entry || {};
  const complianceCopy = content?.compliance || {};
  const entriesCopy = content?.entries || {};
  const summaryCopy = content?.summary || {};
  const goodsPresets =
    content?.goodsPresets
      ?.filter((item) => item.isVisible !== false && item.hsn && item.desc && item.category)
      .map((item) => ({
        hsn: item.hsn || "",
        desc: item.desc || "",
        rate: Number(item.rate || 0),
        category: item.category || "",
      })) || HSN_PRESETS;
  const servicePresets =
    content?.servicePresets
      ?.filter((item) => item.isVisible !== false && item.hsn && item.desc && item.category)
      .map((item) => ({
        hsn: item.hsn || "",
        desc: item.desc || "",
        rate: Number(item.rate || 0),
        category: item.category || "",
      })) || SAC_PRESETS;

  const presets = activeTab === "goods" ? goodsPresets : servicePresets;
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
    const itcAmount = inputPurchases * (inputGstRate / 100);
    const netGstPayable = Math.max(0, totalGst - itcAmount);
    const compositionRate = activeTab === "goods" ? 1 : 6;
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
      i.name, i.unitPrice, i.quantity, i.discount, i.gstRate,
      i.basePrice.toFixed(2), i.gst.toFixed(2), i.total.toFixed(2)
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
    <section className="relative bg-slate-50 py-16 lg:py-24" id="gst-calculator">
      <div className="mx-auto px-4 max-w-3xl">
        <AnimatedSection className="mb-12 text-center">
            <h2 className="mb-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {heroCopy.titlePrefix || "GST &"} <span className="text-blue-600">{heroCopy.titleHighlight || "Invoicing"}</span>
            </h2>
            <p className="mx-auto max-w-xl text-sm text-slate-500 leading-relaxed">
                {heroCopy.description ||
                  "Professional itemized billing and tax calculations compliant with the latest GST regulations."}
            </p>
        </AnimatedSection>

        {/* Action Bar */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-4">
           <div className="inline-flex h-10 items-center justify-center rounded-lg bg-white p-1 border border-slate-200 shadow-sm">
            <button 
              onClick={() => setCalcMode("exclusive")} 
              className={`flex items-center h-full px-5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${calcMode === "exclusive" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"}`}
            >
              {controlsCopy.exclusiveLabel || "Exclusive"}
            </button>
            <button 
              onClick={() => setCalcMode("inclusive")} 
              className={`flex items-center h-full px-5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${calcMode === "inclusive" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"}`}
            >
              {controlsCopy.inclusiveLabel || "Inclusive"}
            </button>
          </div>

          <button 
            onClick={() => setShowMarginMode(!showMarginMode)} 
            className={`flex h-10 items-center gap-2 rounded-lg px-4 text-[10px] font-bold uppercase tracking-wider transition-all border shadow-sm ${showMarginMode ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}`}
          >
            <TrendingUp className="h-3.5 w-3.5" /> {controlsCopy.marginLabel || "Margin"}
          </button>

          <div className="inline-flex h-10 items-center justify-center rounded-lg bg-white p-1 border border-slate-200 shadow-sm">
            <button 
              onClick={() => setTaxScheme("regular")} 
              className={`flex items-center h-full px-4 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${taxScheme === "regular" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"}`}
            >
              {controlsCopy.regularLabel || "Regular"}
            </button>
            <button 
              onClick={() => setTaxScheme("composition")} 
              className={`flex items-center h-full px-4 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${taxScheme === "composition" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"}`}
            >
              {controlsCopy.compositionLabel || "Composition"}
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Item Entry Section */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-slate-300"
          >
              <div className="mb-8 border-b border-slate-100 pb-5 flex items-center justify-between">
                  <div>
                      <h3 className="text-lg font-bold text-slate-900 tracking-tight">{entryCopy.panelTitle || "Add Item"}</h3>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">{entryCopy.panelSubtitle || "Goods or Services entry"}</p>
                  </div>
                  <div className="flex h-10 rounded-xl bg-slate-100 p-1">
                      {(["goods", "services"] as const).map(t => (
                          <button key={t} onClick={() => setActiveTab(t)} className={`px-5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${activeTab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>{t === "goods" ? (entryCopy.goodsLabel || "goods") : (entryCopy.servicesLabel || "services")}</button>
                      ))}
                  </div>
              </div>

              <div className="space-y-6">
                <div className="relative group/search">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/search:text-blue-500 transition-colors">
                      <Search className="h-5 w-5" />
                  </div>
                  <input
                    type="text"
                    placeholder={activeTab === "goods" ? (entryCopy.searchPlaceholderGoods || "Search HSN presets...") : (entryCopy.searchPlaceholderServices || "Search SAC presets...")}
                    value={hsnSearch}
                    onChange={e => { setHsnSearch(e.target.value); setShowHsnPanel(true); }}
                    onFocus={() => setShowHsnPanel(true)}
                    className="w-full pl-12 pr-4 py-4 border border-slate-100 rounded-2xl bg-slate-50/50 focus:bg-white focus:border-blue-200 focus:outline-none transition-all text-sm font-semibold shadow-inner"
                  />
                  <AnimatePresence>
                    {showHsnPanel && hsnSearch && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute left-0 right-0 top-full z-10 mt-3 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95">
                        {filtered.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-slate-500">{entryCopy.noPresetResultsText || "No matching presets found"}</div>
                        ) : filtered.map((item) => (
                          <button key={`${item.hsn}-${item.desc}`} onClick={() => { setNewItem({ ...newItem, name: item.desc, gstRate: item.rate }); setHsnSearch(item.desc); setShowHsnPanel(false); }} className="flex w-full items-center justify-between rounded-xl px-5 py-4 text-left hover:bg-slate-50 transition-colors group/item">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.hsn} • {item.category}</span>
                              <p className="text-sm font-bold text-slate-700 group-hover/item:text-blue-600 transition-colors">{item.desc}</p>
                            </div>
                            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-600 border border-blue-100">{item.rate}% GST</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                   <InputWrapper label={entryCopy.unitPriceLabel || "Unit Price"} icon={<IndianRupee className="h-5 w-5 text-blue-500" />}>
                      <input type="number" value={newItem.unitPrice || ""} placeholder="0.00" onChange={e => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })} className="w-full bg-transparent text-xl font-bold text-slate-900 outline-none placeholder:text-slate-300" />
                   </InputWrapper>
                   <div className="grid grid-cols-2 gap-4">
                      <InputWrapper label={entryCopy.quantityLabel || "Qty"} icon={<Package className="h-4 w-4 text-slate-400" />}><input type="number" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: Number(e.target.value) })} className="w-full bg-transparent text-lg font-bold text-slate-900 outline-none" /></InputWrapper>
                      <InputWrapper label={entryCopy.gstRateLabel || "GST %"} icon={<Percent className="h-4 w-4 text-slate-400" />}>
                          <select value={newItem.gstRate} onChange={e => setNewItem({ ...newItem, gstRate: Number(e.target.value) })} className="w-full bg-transparent text-lg font-bold text-slate-900 outline-none cursor-pointer appearance-none">
                              {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                          </select>
                      </InputWrapper>
                   </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  <div className="grid grid-cols-2 gap-4 flex-1 w-full">
                       <InputWrapper label={entryCopy.discountLabel || "Discount %"} icon={<Tag className="h-4 w-4 text-emerald-500" />}><input type="number" value={newItem.discount || ""} placeholder="0" onChange={e => setNewItem({ ...newItem, discount: Number(e.target.value) })} className="w-full bg-transparent text-lg font-bold text-slate-900 outline-none" /></InputWrapper>
                       <InputWrapper label={entryCopy.cessLabel || "Cess %"} icon={<ShieldCheck className="h-4 w-4 text-amber-500" />}><input type="number" value={newItem.cessRate || ""} placeholder="0" onChange={e => setNewItem({ ...newItem, cessRate: Number(e.target.value) })} className="w-full bg-transparent text-lg font-bold text-slate-900 outline-none" /></InputWrapper>
                  </div>
                  <button onClick={addItem} className="flex h-[72px] w-full sm:w-44 items-center justify-center gap-2 rounded-[24px] bg-slate-900 text-sm font-bold uppercase tracking-wider text-white shadow-xl hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all">
                      <Plus className="h-4 w-4" /> {entryCopy.addItemLabel || "Add Item"}
                  </button>
                </div>
              </div>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2">
              <motion.div whileHover={{ y: -2 }} className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
                  <h4 className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400"><Building2 className="h-4 w-4 text-blue-500" /> {complianceCopy.placeOfSupplyTitle || "Place of Supply"}</h4>
                  <div className="flex rounded-xl bg-slate-50 p-1 border border-slate-100">
                      <button onClick={() => setPlaceOfSupply("intra")} className={`flex-1 rounded-lg py-3 text-[10px] font-bold uppercase tracking-wider transition-all ${placeOfSupply === "intra" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-400"}`}>{complianceCopy.intraLabel || "Intra-State"}</button>
                      <button onClick={() => setPlaceOfSupply("inter")} className={`flex-1 rounded-lg py-3 text-[10px] font-bold uppercase tracking-wider transition-all ${placeOfSupply === "inter" ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-400"}`}>{complianceCopy.interLabel || "Inter-State"}</button>
                  </div>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm flex items-center justify-between transition-all hover:shadow-md hover:border-slate-300">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{complianceCopy.reverseChargeTitle || "Reverse Charge"}</h4>
                    <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">{complianceCopy.reverseChargeDescription || "Tax paid by recipient"}</p>
                  </div>
                  <button onClick={() => setIsRcm(!isRcm)} className={`flex h-8 w-13 items-center rounded-full p-1 transition-all ${isRcm ? "bg-blue-600" : "bg-slate-200"}`}><div className={`h-6 w-6 rounded-full bg-white shadow-sm transition-all ${isRcm ? "translate-x-5" : "translate-x-0"}`} /></button>
              </motion.div>
          </div>

          {/* ITC Input Section */}
          <motion.div whileHover={{ y: -2 }} className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm transition-all hover:shadow-md hover:border-slate-300">
              <details className="group">
                  <summary className="list-none cursor-pointer flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 tracking-tight">{complianceCopy.itcTitle || "Purchase Inputs (ITC)"}</h3>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">{complianceCopy.itcSubtitle || "Offset your tax liability"}</p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-open:bg-blue-50 transition-colors">
                      <Plus className="h-4 w-4 text-slate-400 group-open:rotate-45 transition-all" />
                    </div>
                  </summary>
                  <div className="grid gap-6 sm:grid-cols-2 pt-8 animate-in fade-in slide-in-from-top-2">
                      <InputWrapper label={complianceCopy.totalPurchasesLabel || "Total Purchases"} icon={<ShoppingCart className="h-4 w-4 text-blue-500" />}><input type="number" value={inputPurchases || ""} placeholder="0.00" onChange={e => setInputPurchases(Number(e.target.value))} className="w-full bg-transparent text-xl font-bold text-slate-900 outline-none" /></InputWrapper>
                      <InputWrapper label={complianceCopy.inputGstLabel || "Input GST %"} icon={<Percent className="h-4 w-4 text-slate-400" />}><input type="number" value={inputGstRate} onChange={e => setInputGstRate(Number(e.target.value))} className="w-full bg-transparent text-xl font-bold text-slate-900 outline-none" /></InputWrapper>
                  </div>
              </details>
          </motion.div>

          {/* Item List Section */}
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-8 flex items-center justify-between border-b border-slate-100 pb-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{entriesCopy.title || "Transaction Entries"}</h3>
                <span className="rounded-full bg-slate-50 px-3.5 py-1.5 text-[10px] font-bold text-slate-500 border border-slate-200">{items.length} {entriesCopy.itemCountSuffix || "Items"}</span>
              </div>

              <div className="space-y-4">
                {items.length === 0 ? (
                  <div className="py-16 text-center bg-slate-50/50 rounded-[24px] border border-dashed border-slate-200">
                      <Package className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-300">{entriesCopy.emptyStateText || "No items added yet"}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 overflow-hidden rounded-[24px] border border-slate-100 shadow-sm">
                    <div className="bg-slate-50/80 px-6 py-3.5 flex text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                       <span className="flex-1">{entriesCopy.descriptionColumn || "Description"}</span>
                       <span className="w-20 text-right">{entriesCopy.quantityColumn || "Qty/Rate"}</span>
                       <span className="w-24 text-right">{entriesCopy.totalColumn || "Total Net"}</span>
                       <span className="w-10"></span>
                    </div>
                    {items.map((item) => (
                      <div key={item.id} className="group px-6 py-5 flex items-center bg-white hover:bg-slate-50/50 transition-all">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate uppercase tracking-tight">{item.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">{item.gstRate}% Tax {item.cessRate > 0 && `| ${item.cessRate}% Cess`} | {item.discount}% Disc</p>
                        </div>
                        <div className="w-20 text-right">
                            <p className="text-xs font-bold text-slate-500">{item.quantity} × {fmt(item.unitPrice)}</p>
                        </div>
                        <div className="w-24 text-right">
                            <p className="text-sm font-bold text-slate-900">{fmt(results.items.find(i => i.id === item.id)?.total || 0)}</p>
                        </div>
                        <div className="w-10 flex justify-end">
                            <button onClick={() => removeItem(item.id)} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
          </div>

          {/* Invoice Summary Report */}
          <div className="overflow-hidden rounded-[40px] border border-slate-900 bg-slate-900 text-white shadow-2xl">
              <div className="p-10">
                <div className="mb-10 flex items-center justify-between border-b border-white/10 pb-8">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight">{summaryCopy.panelTitle || "Invoice Summary"}</h3>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mt-1.5">{summaryCopy.panelSubtitle || "Live Computation"}</p>
                    </div>
                    <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                        <Receipt className="h-6 w-6 text-blue-400" />
                    </div>
                </div>
                
                <div className="space-y-10">
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/20 mb-4">{summaryCopy.totalPayableLabel || "Total Amount Payable"}</p>
                    <p className="text-6xl font-black tracking-tighter text-white">{fmt(results.grandTotal)}</p>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-white/30">{summaryCopy.totalPayableDescription || "Inclusive of all taxes & cess"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 border-y border-white/5 py-10">
                    <div className="text-center group cursor-default">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-400/50 mb-3 group-hover:text-blue-400 transition-colors">
                          {placeOfSupply === "intra" ? "CGST + SGST (50/50)" : "IGST (100%)"}
                        </p>
                        <p className="text-3xl font-bold text-blue-400">{fmt(results.totalGst)}</p>
                    </div>
                    <div className="text-center border-l border-white/5 group cursor-default">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/20 mb-3 group-hover:text-white/40 transition-colors">{summaryCopy.taxableBaseLabel || "Net Taxable Base"}</p>
                        <p className="text-3xl font-bold text-white">{fmt(results.subTotal)}</p>
                    </div>
                  </div>

                  <div className="space-y-5 px-6">
                    <div className="flex justify-between items-center opacity-30 hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold uppercase tracking-widest">{summaryCopy.discountsLabel || "Discounts Applied"}</span>
                      <span className="text-sm font-black text-red-400">-{fmt(results.totalDiscount)}</span>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-white/5">
                        {placeOfSupply === "intra" ? (
                          <>
                            <div className="flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
                              <span className="text-[11px] font-bold uppercase tracking-widest">{summaryCopy.cgstLabel || "CGST Breakdown"}</span>
                              <span className="text-sm font-bold">{fmt(results.cgst)}</span>
                            </div>
                            <div className="flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
                              <span className="text-[11px] font-bold uppercase tracking-widest">{summaryCopy.sgstLabel || "SGST Breakdown"}</span>
                              <span className="text-sm font-bold">{fmt(results.sgst)}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
                            <span className="text-[11px] font-bold uppercase tracking-widest">{summaryCopy.igstLabel || "Integrated GST (IGST)"}</span>
                            <span className="text-sm font-bold">{fmt(results.igst)}</span>
                          </div>
                        )}
                        {results.totalCess > 0 && (
                          <div className="flex justify-between items-center opacity-50 hover:opacity-100 transition-opacity">
                            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-500">{summaryCopy.cessBreakdownLabel || "Compensation Cess"}</span>
                            <span className="text-sm font-bold text-amber-400">{fmt(results.totalCess)}</span>
                          </div>
                        )}
                        {results.itcAmount > 0 && (
                          <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex justify-between items-center bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">{summaryCopy.itcOffsetLabel || "ITC Claimed Offset"}</span>
                            <span className="text-lg font-black text-emerald-400">-{fmt(results.itcAmount)}</span>
                          </motion.div>
                        )}
                    </div>
                  </div>

                  <div className="mt-6 rounded-[24px] bg-white/[0.03] p-8 border border-white/10 shadow-inner">
                      <div className="flex justify-between items-center">
                         <div>
                            <span className="text-xs font-bold uppercase tracking-widest text-white/30">{summaryCopy.netGstLabel || "Net GST Cash Payable"}</span>
                            <p className="text-[9px] font-bold text-white/10 mt-1 uppercase tracking-wider">{taxScheme === "composition" ? (summaryCopy.compositionDescription || "Composition Scheme Rate") : (results.itcAmount > 0 ? (summaryCopy.creditDescription || "Utilizing Input Credits") : (summaryCopy.standardDescription || "Standard Liability"))}</p>
                         </div>
                         <span className="text-4xl font-black text-white">{fmt(taxScheme === "composition" ? results.compositionTax : (isRcm ? 0 : results.netGstPayable))}</span>
                      </div>
                  </div>

                  {showMarginMode && (
                    <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="rounded-[24px] bg-emerald-500/5 p-8 border border-emerald-500/10 mt-8">
                       <div className="mb-6 flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400/50">{summaryCopy.marginAnalysisTitle || "Profit Margin Analysis"}</span>
                          <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                             <Target className="h-4 w-4 text-emerald-400" />
                          </div>
                       </div>
                       <div className="flex items-center gap-10">
                          <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase text-white/20 mb-2 tracking-widest">{summaryCopy.expectedMarginLabel || "Expected Margin %"}</p>
                            <input type="number" value={margin} onChange={e => setMargin(Number(e.target.value))} className="w-full bg-transparent text-3xl font-black text-white outline-none border-b border-white/5 pb-2 focus:border-emerald-500/50 transition-colors" />
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase text-white/20 mb-2 tracking-widest">{summaryCopy.estimatedProfitLabel || "Estimated Profit"}</p>
                            <p className="text-3xl font-black text-emerald-400">{fmt(results.subTotal * (margin / 100))}</p>
                          </div>
                       </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-2 gap-4 pt-6">
                    <button onClick={exportToCSV} className="flex items-center justify-center gap-2 rounded-[20px] border border-white/10 py-4 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-white/5 active:scale-95 transition-all">
                      <Download className="h-4 w-4" /> {summaryCopy.exportLabel || "Export Data"}
                    </button>
                    <button onClick={() => window.print()} className="flex items-center justify-center gap-2 rounded-[20px] bg-blue-600 py-4 text-[11px] font-bold uppercase tracking-wider text-white hover:bg-blue-500 hover:shadow-xl hover:shadow-blue-600/20 active:scale-95 transition-all">
                      <Printer className="h-4 w-4" /> {summaryCopy.printLabel || "Print Invoice"}
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
