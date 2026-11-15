"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Receipt,
  FileDown,
  FileText,
  ShieldCheck,
  Plus,
  Trash2,
  ArrowRight,
  Printer,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { generateGstReportPdf, GstReportData } from "@/lib/generateGstPdf";
import { generateGstExcel } from "@/lib/generateGstExcel";

const GST_RATES = [0, 3, 5, 12, 18, 28, 40] as const;

const HSN_PRESETS = [
  { hsn: "0101", desc: "Live Horses & Farm Animals", rate: 0, category: "Agriculture" },
  { hsn: "1001", desc: "Wheat & Food Grains", rate: 0, category: "Agriculture" },
  { hsn: "2106", desc: "Food Preparations & Edibles", rate: 18, category: "Food" },
  { hsn: "2201", desc: "Packaged Drinking Water", rate: 18, category: "Beverages" },
  { hsn: "2202", desc: "Aerated / Soft Drinks", rate: 40, category: "Beverages" },
  { hsn: "2401", desc: "Tobacco & Related Products", rate: 40, category: "Tobacco" },
  { hsn: "3004", desc: "Medicaments / Pharma Medicines", rate: 5, category: "Pharma" },
  { hsn: "3401", desc: "Soap & Hygiene Detergents", rate: 5, category: "FMCG" },
  { hsn: "3808", desc: "Pesticides & Fertilizers", rate: 5, category: "Agri Inputs" },
  { hsn: "4901", desc: "Books & Educational Material", rate: 0, category: "Education" },
  { hsn: "6101", desc: "Readymade Garments & Apparel", rate: 5, category: "Textiles" },
  { hsn: "7108", desc: "Gold / Silver Bullion & Jewellery", rate: 3, category: "Precious Metals" },
  { hsn: "8471", desc: "Laptops & Computing Equipment", rate: 18, category: "Electronics" },
  { hsn: "8517", desc: "Mobile Phones & Hardware", rate: 18, category: "Electronics" },
  { hsn: "8703", desc: "Automobiles & Motor Cars", rate: 28, category: "Automobiles" },
  { hsn: "8711", desc: "Motorcycles & Two-Wheelers", rate: 18, category: "Automobiles" },
  { hsn: "2523", desc: "Portland Cement", rate: 28, category: "Construction" },
  { hsn: "9503", desc: "Educational Toys & Games", rate: 5, category: "Toys" },
  { hsn: "9619", desc: "Sanitary & Health Hygiene Goods", rate: 5, category: "Health" },
];

const SAC_PRESETS = [
  { hsn: "9954", desc: "Construction & Commercial Works", rate: 18, category: "Construction" },
  { hsn: "9963", desc: "Hotel Accommodation < ₹7,500/day", rate: 5, category: "Hospitality" },
  { hsn: "9963", desc: "Luxury Hotel & Fine Dining", rate: 18, category: "Hospitality" },
  { hsn: "9964", desc: "Passenger Transport Services", rate: 5, category: "Transport" },
  { hsn: "9983", desc: "Fitness, Salon & Wellness", rate: 5, category: "Leisure" },
  { hsn: "9983", desc: "Software, Cloud & IT Services", rate: 18, category: "IT" },
  { hsn: "9971", desc: "Banking & Financial Services", rate: 18, category: "Finance" },
  { hsn: "9993", desc: "CA, Legal & Advisory Services", rate: 18, category: "Professional" },
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
  // Navigation: Quick Calculator vs Invoice Builder
  const [calculatorView, setCalculatorView] = useState<"quick" | "invoice">("quick");

  // --- QUICK CALCULATOR STATE ---
  const [quickAmount, setQuickAmount] = useState<number>(10000);
  const [quickRate, setQuickRate] = useState<number>(18);
  const [quickMode, setQuickMode] = useState<CalcMode>("exclusive");
  const [quickSupply, setQuickSupply] = useState<"intra" | "inter">("intra");

  // --- INVOICE BUILDER STATE ---
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

  // Exports
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("gst_items");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          return;
        }
      } catch (e) {
        console.error("Failed to load saved GST items", e);
      }
    }
    setItems([
      {
        cessRate: 0,
        discount: 0,
        gstRate: 18,
        id: "1",
        name: "Professional Financial Advisory",
        quantity: 1,
        unitPrice: 15000,
      },
    ]);
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem("gst_items", JSON.stringify(items));
    }
  }, [items]);

  const [newItem, setNewItem] = useState<BillItem>({
    cessRate: 0,
    discount: 0,
    gstRate: 18,
    id: "",
    name: "",
    quantity: 1,
    unitPrice: 0,
  });

  const addItem = () => {
    if (newItem.unitPrice <= 0) return;
    setItems([
      ...items,
      {
        ...newItem,
        id: Date.now().toString(),
        name: newItem.name || `Line Item ${items.length + 1}`,
      },
    ]);
    setNewItem({
      cessRate: 0,
      discount: 0,
      gstRate: 18,
      id: "",
      name: "",
      quantity: 1,
      unitPrice: 0,
    });
    setHsnSearch("");
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  // Preset Lookups
  const goodsPresets =
    content?.goodsPresets
      ?.filter((item) => item.isVisible !== false && item.hsn && item.desc && item.category)
      .map((item) => ({
        category: item.category || "",
        desc: item.desc || "",
        hsn: item.hsn || "",
        rate: Number(item.rate || 0),
      })) || HSN_PRESETS;

  const servicePresets =
    content?.servicePresets
      ?.filter((item) => item.isVisible !== false && item.hsn && item.desc && item.category)
      .map((item) => ({
        category: item.category || "",
        desc: item.desc || "",
        hsn: item.hsn || "",
        rate: Number(item.rate || 0),
      })) || SAC_PRESETS;

  const presets = activeTab === "goods" ? goodsPresets : servicePresets;

  const filteredPresets = useMemo(
    () =>
      presets.filter(
        (h) =>
          h.desc.toLowerCase().includes(hsnSearch.toLowerCase()) ||
          h.hsn.includes(hsnSearch) ||
          h.category.toLowerCase().includes(hsnSearch.toLowerCase())
      ),
    [hsnSearch, presets]
  );

  // Quick Computation
  const quickResults = useMemo(() => {
    const rateDecimal = quickRate / 100;
    let base = 0;
    let tax = 0;
    let total = 0;

    if (quickMode === "exclusive") {
      base = quickAmount;
      tax = base * rateDecimal;
      total = base + tax;
    } else {
      total = quickAmount;
      base = total / (1 + rateDecimal);
      tax = total - base;
    }

    const cgst = quickSupply === "intra" ? tax / 2 : 0;
    const sgst = quickSupply === "intra" ? tax / 2 : 0;
    const igst = quickSupply === "inter" ? tax : 0;

    return { base, cgst, igst, sgst, tax, total };
  }, [quickAmount, quickMode, quickRate, quickSupply]);

  // Invoice Computation
  const results = useMemo(() => {
    let subTotal = 0;
    let totalGst = 0;
    let totalCess = 0;
    let totalDiscount = 0;

    const itemBreakdown = items.map((item) => {
      let price = item.unitPrice * item.quantity;
      if (showMarginMode) {
        price = price * (1 + margin / 100);
      }
      const discountVal = price * (item.discount / 100);
      const discountedPrice = price - discountVal;
      totalDiscount += discountVal;

      let basePrice = 0;
      let gst = 0;
      let cess = 0;

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

      return { ...item, basePrice, cess, discountVal, gst, total: basePrice + gst + cess };
    });

    const grandTotal = subTotal + totalGst + totalCess;
    const itcAmount = inputPurchases * (inputGstRate / 100);
    const netGstPayable = Math.max(0, totalGst - itcAmount);
    const compositionRate = activeTab === "goods" ? 1 : 6;
    const compositionTax = grandTotal * (compositionRate / 100);

    return {
      cgst: totalGst / 2,
      compositionRate,
      compositionTax,
      grandTotal,
      igst: totalGst,
      itcAmount,
      items: itemBreakdown,
      netGstPayable,
      sgst: totalGst / 2,
      subTotal,
      totalCess,
      totalDiscount,
      totalGst,
    };
  }, [items, calcMode, showMarginMode, margin, inputPurchases, inputGstRate, activeTab]);

  const getExportData = (): GstReportData => {
    // If in quick view or no line items, synthesize single calculation row
    if (calculatorView === "quick" || items.length === 0) {
      return {
        calcMode: quickMode,
        cgst: quickResults.cgst,
        compositionRate: 0,
        compositionTax: 0,
        grandTotal: quickResults.total,
        igst: quickResults.igst,
        inputGstRate: 0,
        inputPurchases: 0,
        isRcm: false,
        itcAmount: 0,
        items: [
          {
            basePrice: quickResults.base,
            cess: 0,
            cessRate: 0,
            discount: 0,
            discountVal: 0,
            gst: quickResults.tax,
            gstRate: quickRate,
            name: `Taxable Supply (${quickRate}% GST)`,
            quantity: 1,
            total: quickResults.total,
            unitPrice: quickMode === "exclusive" ? quickAmount : quickResults.base,
          },
        ],
        margin: 0,
        netGstPayable: quickResults.tax,
        placeOfSupply: quickSupply,
        sgst: quickResults.sgst,
        showMarginMode: false,
        subTotal: quickResults.base,
        taxScheme: "regular",
        totalCess: 0,
        totalDiscount: 0,
        totalGst: quickResults.tax,
      };
    }

    return {
      calcMode,
      cgst: results.cgst,
      compositionRate: results.compositionRate,
      compositionTax: results.compositionTax,
      grandTotal: results.grandTotal,
      igst: results.igst,
      inputGstRate,
      inputPurchases,
      isRcm,
      itcAmount: results.itcAmount,
      items: results.items,
      margin,
      netGstPayable: results.netGstPayable,
      placeOfSupply,
      sgst: results.sgst,
      showMarginMode,
      subTotal: results.subTotal,
      taxScheme,
      totalCess: results.totalCess,
      totalDiscount: results.totalDiscount,
      totalGst: results.totalGst,
    };
  };

  const downloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdfBytes = await generateGstReportPdf(getExportData());
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TaxFiling24_GST_Invoice_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      // Defer revoking so browser streams the file reliably
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 4000);
    } catch (err) {
      console.error("GST PDF generation failed:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const downloadExcel = async () => {
    setIsGeneratingExcel(true);
    try {
      const buffer = await generateGstExcel(getExportData());
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
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 4000);
    } catch (err) {
      console.error("GST Excel generation failed:", err);
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-IN", {
      currency: "INR",
      maximumFractionDigits: 0,
      style: "currency",
    }).format(v);

  const heroCopy = content?.hero || {};

  return (
    <section className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-slate-800 transition">
          Home
        </Link>
        <span>/</span>
        <Link href="/tools" className="hover:text-slate-800 transition">
          Tools
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">GST Calculator</span>
      </nav>

      {/* Hero Header (Light, Clean, CA Authority) */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Indian GST Act &amp; HSN Slabs Compliant
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            {heroCopy.titlePrefix || "GST &"}{" "}
            <span className="text-indigo-600">{heroCopy.titleHighlight || "Invoicing Calculator"}</span>
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
            {heroCopy.description ||
              "Calculate GST liability in inclusive and exclusive modes, divide CGST/SGST/IGST, search HSN/SAC codes, and build multi-item tax invoices with Input Tax Credit (ITC) offset."}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setCalculatorView("quick")}
            className={`px-4 py-2 rounded-lg transition cursor-pointer ${
              calculatorView === "quick"
                ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Instant Calculator
          </button>
          <button
            type="button"
            onClick={() => setCalculatorView("invoice")}
            className={`px-4 py-2 rounded-lg transition cursor-pointer ${
              calculatorView === "invoice"
                ? "bg-white text-slate-900 font-bold shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Invoice &amp; Itemized Builder
          </button>
        </div>
      </div>

      {/* VIEW 1: INSTANT QUICK GST CALCULATOR (Light, Clean, Crisp) */}
      {calculatorView === "quick" && (
        <div className="pt-8 max-w-4xl mx-auto space-y-8">
          {/* Main Quick Box */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
            {/* Amount input */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Enter Base or Total Amount (₹)
                </label>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setQuickMode("exclusive")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer border ${
                      quickMode === "exclusive"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Add GST (Exclusive)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickMode("inclusive")}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer border ${
                      quickMode === "inclusive"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Remove GST (Inclusive)
                  </button>
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  value={quickAmount || ""}
                  onChange={(e) => setQuickAmount(Number(e.target.value))}
                  placeholder="10,000"
                  className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3.5 text-2xl sm:text-3xl font-extrabold text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition"
                />
              </div>

              {/* Amount Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-3">
                <span className="text-xs text-slate-500 font-medium mr-1">Presets:</span>
                {[1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setQuickAmount(amt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                      quickAmount === amt
                        ? "bg-indigo-50 text-indigo-700 border-indigo-300 shadow-2xs font-bold"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    ₹{amt.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>

            {/* GST Rate Selectors */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                Select Applicable GST Tax Slab
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {GST_RATES.map((rate) => {
                  const labels: Record<number, string> = {
                    0: "Exempt",
                    3: "Gold/Silver",
                    5: "Essentials",
                    12: "Standard",
                    18: "General",
                    28: "Luxury",
                    40: "Sin Goods",
                  };
                  const isSelected = quickRate === rate;
                  return (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setQuickRate(rate)}
                      className={`p-3 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/30"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
                      }`}
                    >
                      <span
                        className={`text-lg font-black tracking-tight ${
                          isSelected ? "text-indigo-900" : "text-slate-900"
                        }`}
                      >
                        {rate}%
                      </span>
                      <span
                        className={`text-[10px] truncate max-w-[85px] mt-0.5 font-medium ${
                          isSelected ? "text-indigo-700 font-semibold" : "text-slate-500"
                        }`}
                      >
                        {labels[rate] || "GST"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Supply Location */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-900 block">Supply Transaction Type</span>
                <span className="text-slate-600">
                  Determines whether CGST + SGST (Intra-state) or IGST (Inter-state) applies
                </span>
              </div>
              <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200 font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setQuickSupply("intra")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    quickSupply === "intra"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  Intra-State (CGST + SGST)
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSupply("inter")}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    quickSupply === "inter"
                      ? "bg-indigo-600 text-white shadow-2xs"
                      : "text-slate-700 hover:text-slate-900"
                  }`}
                >
                  Inter-State (IGST)
                </button>
              </div>
            </div>
          </div>

          {/* Quick Result Highlight Card (Clean Light Studio Card) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-200 text-center sm:text-left">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  {quickMode === "exclusive" ? "Grand Total (Post-GST)" : "Net Base Amount (Pre-GST)"}
                </span>
                <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 mt-1 tracking-tight">
                  {fmt(quickMode === "exclusive" ? quickResults.total : quickResults.base)}
                </div>
              </div>

              <div className="sm:text-right">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Total Tax Component ({quickRate}%)
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 mt-1">
                  +{fmt(quickResults.tax)}
                </div>
              </div>
            </div>

            {/* Split Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-600 font-medium block">Net Base Price</span>
                <span className="text-base font-bold text-slate-900 mt-1 block">
                  {fmt(quickResults.base)}
                </span>
              </div>

              {quickSupply === "intra" ? (
                <>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-600 font-medium block">
                      CGST ({quickRate / 2}%)
                    </span>
                    <span className="text-base font-bold text-indigo-700 mt-1 block">
                      {fmt(quickResults.cgst)}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-600 font-medium block">
                      SGST ({quickRate / 2}%)
                    </span>
                    <span className="text-base font-bold text-indigo-700 mt-1 block">
                      {fmt(quickResults.sgst)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 col-span-2">
                  <span className="text-xs text-slate-600 font-medium block">
                    IGST ({quickRate}%)
                  </span>
                  <span className="text-base font-bold text-indigo-700 mt-1 block">
                    {fmt(quickResults.igst)}
                  </span>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200">
                <span className="text-xs text-emerald-800 font-medium block">Total Payable</span>
                <span className="text-base font-bold text-emerald-900 mt-1 block">
                  {fmt(quickResults.total)}
                </span>
              </div>
            </div>

            {/* Quick Actions & PDF Download */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  {isGeneratingPdf ? "Generating PDF..." : "Download Calculation (PDF)"}
                </button>
                <button
                  type="button"
                  onClick={downloadExcel}
                  disabled={isGeneratingExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {isGeneratingExcel ? "Exporting..." : "Excel"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setNewItem({
                    cessRate: 0,
                    discount: 0,
                    gstRate: quickRate,
                    id: Date.now().toString(),
                    name: `Item (${quickRate}% GST)`,
                    quantity: 1,
                    unitPrice: Math.round(quickResults.base),
                  });
                  setCalculatorView("invoice");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                <span>Add to Multi-Item Invoice Builder</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MULTI-ITEM INVOICE & HSN BUILDER (Clean Light Studio) */}
      {calculatorView === "invoice" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6">
          {/* Left Column: Invoice Form & Items */}
          <div className="lg:col-span-7 space-y-6">
            {/* Item Entry Form */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Add Invoice Line Item</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Lookup official HSN/SAC codes or key in manual products
                  </p>
                </div>
                <div className="inline-flex p-1 rounded-lg bg-slate-100 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab("goods")}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      activeTab === "goods"
                        ? "bg-white text-slate-900 shadow-2xs font-bold"
                        : "text-slate-600"
                    }`}
                  >
                    Goods (HSN)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("services")}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      activeTab === "services"
                        ? "bg-white text-slate-900 shadow-2xs font-bold"
                        : "text-slate-600"
                    }`}
                  >
                    Services (SAC)
                  </button>
                </div>
              </div>

              {/* HSN Auto-complete search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    activeTab === "goods"
                      ? "Search goods HSN code or description (e.g. 8471, Mobile, Cement)..."
                      : "Search services SAC code or category (e.g. 9983, Software, CA, Hotel)..."
                  }
                  value={hsnSearch}
                  onChange={(e) => {
                    setHsnSearch(e.target.value);
                    setShowHsnPanel(true);
                  }}
                  onFocus={() => setShowHsnPanel(true)}
                  className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
                />

                {showHsnPanel && hsnSearch && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
                    {filteredPresets.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 text-center">
                        No presets found matching &quot;{hsnSearch}&quot;
                      </div>
                    ) : (
                      filteredPresets.map((item) => (
                        <button
                          key={`${item.hsn}-${item.desc}`}
                          type="button"
                          onClick={() => {
                            setNewItem({
                              ...newItem,
                              gstRate: item.rate,
                              name: `${item.desc} (HSN ${item.hsn})`,
                            });
                            setHsnSearch(item.desc);
                            setShowHsnPanel(false);
                          }}
                          className="w-full p-2.5 rounded-lg text-left hover:bg-slate-50 transition flex items-center justify-between text-xs cursor-pointer"
                        >
                          <div>
                            <span className="font-semibold text-slate-900">{item.desc}</span>
                            <span className="ml-2 font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {item.hsn}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200/60">
                            {item.rate}% GST
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Line item inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Item Description / Title *
                  </label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g. IT Consultation Services"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={newItem.unitPrice || ""}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: Number(e.target.value) })}
                    placeholder="1,000"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm font-semibold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">GST Rate</label>
                  <select
                    value={newItem.gstRate}
                    onChange={(e) => setNewItem({ ...newItem, gstRate: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-2.5 py-2 outline-none focus:border-indigo-500 bg-white font-semibold"
                  >
                    {GST_RATES.map((r) => (
                      <option key={r} value={r}>
                        {r}%
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Discount %</label>
                  <input
                    type="number"
                    value={newItem.discount || ""}
                    onChange={(e) => setNewItem({ ...newItem, discount: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Cess %</label>
                  <input
                    type="number"
                    value={newItem.cessRate || ""}
                    onChange={(e) => setNewItem({ ...newItem, cessRate: Number(e.target.value) })}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={addItem}
                  disabled={newItem.unitPrice <= 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <Plus className="h-4 w-4" />
                  Add to Invoice
                </button>
              </div>
            </div>

            {/* Invoice Line Items Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Invoice Entries ({items.length})
                </h3>
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setItems([])}
                    className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No items added yet. Use the form above to add goods or services.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <th className="py-2.5 px-4">Item</th>
                        <th className="py-2.5 px-3 text-right">Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">GST %</th>
                        <th className="py-2.5 px-4 text-right">Total</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4 font-semibold text-slate-900 truncate max-w-[200px]">
                            {item.name}
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600">{item.quantity}</td>
                          <td className="py-3 px-3 text-right text-slate-600">
                            {fmt(item.unitPrice)}
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-emerald-800">
                            {item.gstRate}%
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900">
                            {fmt(item.total)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition"
                              title="Remove item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Compliance Overrides & ITC Offset */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Tax Scheme &amp; Input Tax Credit (ITC)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Taxation Regime Scheme
                  </label>
                  <select
                    value={taxScheme}
                    onChange={(e) => setTaxScheme(e.target.value as "regular" | "composition")}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-800"
                  >
                    <option value="regular">Regular Scheme (Standard Rates)</option>
                    <option value="composition">Composition Scheme (1% Goods, 6% Services)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Supply Location
                  </label>
                  <select
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(e.target.value as "intra" | "inter")}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-white text-slate-800"
                  >
                    <option value="intra">Intra-State (CGST 50% + SGST 50%)</option>
                    <option value="inter">Inter-State (IGST 100%)</option>
                  </select>
                </div>
              </div>

              {/* ITC Purchase offset */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Total Purchases (For ITC Claim)
                  </label>
                  <input
                    type="number"
                    value={inputPurchases || ""}
                    onChange={(e) => setInputPurchases(Number(e.target.value))}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Input Purchase GST Rate %
                  </label>
                  <input
                    type="number"
                    value={inputGstRate}
                    onChange={(e) => setInputGstRate(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Invoice Summary Studio (Clean Light Card) */}
          <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-6">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-medium text-slate-500 block">Invoice Type</span>
                  <span className="text-sm font-bold text-slate-900">
                    {placeOfSupply === "intra" ? "Intra-State (CGST/SGST)" : "Inter-State (IGST)"}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                  <Receipt className="h-3.5 w-3.5" />
                  Tax Invoice
                </div>
              </div>

              {/* Total Payable Headline */}
              <div className="text-center py-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Grand Total Invoice Amount
                </span>
                <div className="text-4xl font-extrabold text-slate-900 mt-1 tracking-tight">
                  {fmt(results.grandTotal)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Inclusive of all taxes &amp; cess
                </p>
              </div>

              {/* Breakdown Grid */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Net Taxable Value</span>
                  <span className="font-semibold text-slate-900">{fmt(results.subTotal)}</span>
                </div>

                {results.totalDiscount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>Total Discount Allowed</span>
                    <span className="font-semibold">-{fmt(results.totalDiscount)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-600">
                  <span>Total GST Levied</span>
                  <span className="font-semibold text-slate-900">{fmt(results.totalGst)}</span>
                </div>

                {placeOfSupply === "intra" ? (
                  <>
                    <div className="flex justify-between items-center text-slate-500 pl-3">
                      <span>• Central GST (CGST)</span>
                      <span>{fmt(results.cgst)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-500 pl-3">
                      <span>• State GST (SGST)</span>
                      <span>{fmt(results.sgst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center text-slate-500 pl-3">
                    <span>• Integrated GST (IGST)</span>
                    <span>{fmt(results.igst)}</span>
                  </div>
                )}

                {results.totalCess > 0 && (
                  <div className="flex justify-between items-center text-amber-700">
                    <span>Compensation Cess</span>
                    <span>{fmt(results.totalCess)}</span>
                  </div>
                )}

                {results.itcAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-700 pt-1">
                    <span>ITC Purchase Credit Offset</span>
                    <span className="font-bold">-{fmt(results.itcAmount)}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex justify-between items-center mt-2">
                  <span className="font-bold text-emerald-900">Net GST Payable (Cash)</span>
                  <span className="text-xl font-black text-emerald-800">
                    {fmt(taxScheme === "composition" ? results.compositionTax : (isRcm ? 0 : results.netGstPayable))}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={downloadExcel}
                  disabled={isGeneratingExcel}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {isGeneratingExcel ? "Generating..." : "Export Excel"}
                </button>

                <button
                  type="button"
                  onClick={downloadPdf}
                  disabled={isGeneratingPdf}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  {isGeneratingPdf ? "Generating..." : "Download Invoice"}
                </button>
              </div>
            </div>

            {/* GST Filing Support Callout */}
            <div className="rounded-2xl border border-slate-200 bg-emerald-50/60 p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Monthly GST Return Filing (GSTR-1 &amp; 3B)
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Avoid late filing penalties u/s Section 47. Get our CA team to reconcile your 2B ITC and submit error-free returns.
                  </p>
                </div>
              </div>
              <Link
                href="/services/taxation-gst-compliance-management"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 pt-1"
              >
                <span>Explore GST Management Services</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
