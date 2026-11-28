import {
  COMPOSITION_CATEGORIES,
  type CompositionCategory,
  type GstCalcMode,
  type GstPlaceOfSupply,
  type GstTaxScheme,
} from "./gst-rules";

export interface QuickGstInput {
  amount: number;
  gstRate: number;
  mode: GstCalcMode;
  placeOfSupply: GstPlaceOfSupply;
}

export interface QuickGstResult {
  baseAmount: number;
  totalGst: number;
  cgst: number;
  sgst: number;
  igst: number;
  grossTotal: number;
  roundedTotalSec170: number;
  roundingDiff: number;
}

export interface GstLineItemInput {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  gstRate: number;
  cessRate: number;
  discount: number;
}

export interface ComputedGstLineItem extends GstLineItemInput {
  grossLineAmount: number;
  discountVal: number;
  basePrice: number;
  gst: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total: number;
}

export interface ItcCreditInput {
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

export interface GstInvoiceInput {
  items: GstLineItemInput[];
  calcMode: GstCalcMode;
  placeOfSupply: GstPlaceOfSupply;
  taxScheme: GstTaxScheme;
  compositionCategory: CompositionCategory;
  isRcm: boolean;
  showMarginMode: boolean;
  marginPct: number;
  itc: ItcCreditInput;
}

export interface Rule88AUtilization {
  available: ItcCreditInput;
  utilized: {
    igstOnIgst: number;
    igstOnCgst: number;
    igstOnSgst: number;
    cgstOnCgst: number;
    cgstOnIgst: number;
    sgstOnSgst: number;
    sgstOnIgst: number;
    cessOnCess: number;
    totalUtilized: number;
  };
  cashPayable: {
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    totalExact: number;
    totalRoundedSec170: number;
  };
  carryForward: {
    igst: number;
    cgst: number;
    sgst: number;
    cess: number;
    total: number;
  };
}

export interface GstInvoiceResult {
  documentType: "TAX_INVOICE" | "BILL_OF_SUPPLY" | "RCM_INVOICE";
  documentLabel: string;
  effectivePlaceOfSupply: GstPlaceOfSupply;
  compositionWarning: string | null;
  items: ComputedGstLineItem[];
  subTotal: number;
  totalDiscount: number;
  totalGst: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalCess: number;
  grandTotalExact: number;
  grandTotalRoundedSec170: number;
  // Composition
  compositionRate: number;
  compositionTax: number;
  compositionCgst: number;
  compositionSgst: number;
  // Regular / RCM / Rule 88A ITC
  rule88A: Rule88AUtilization;
  supplierCashLiabilityExact: number;
  supplierCashLiabilityRounded: number;
  recipientRcmCashLiabilityExact: number;
  recipientRcmCashLiabilityRounded: number;
  // Margin analysis (exact markup profit: subTotal * m / (100 + m))
  estimatedMarginProfit: number;
}

export function round2(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

/** Section 170 CGST Act: >= 50 paise rounds up to next Rupee, < 50 paise ignored */
export function roundSec170(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 0;
  return Math.round(v);
}

const nonNeg = (v: number): number => (Number.isFinite(v) && v > 0 ? v : 0);
const clamp = (v: number, min: number, max: number): number =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : min;

export function computeQuickGst(input: QuickGstInput): QuickGstResult {
  const amount = nonNeg(input.amount);
  const gstRate = clamp(input.gstRate, 0, 100);
  const rateDecimal = gstRate / 100;

  let baseAmount = 0;
  let totalGst = 0;
  let grossTotal = 0;

  if (input.mode === "exclusive") {
    baseAmount = round2(amount);
    totalGst = round2(baseAmount * rateDecimal);
    grossTotal = round2(baseAmount + totalGst);
  } else {
    grossTotal = round2(amount);
    baseAmount = rateDecimal > 0 ? round2(grossTotal / (1 + rateDecimal)) : grossTotal;
    totalGst = round2(grossTotal - baseAmount);
  }

  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  if (input.placeOfSupply === "intra") {
    cgst = round2(totalGst / 2);
    sgst = round2(totalGst - cgst);
  } else {
    igst = totalGst;
  }

  const roundedTotalSec170 = roundSec170(grossTotal);
  const roundingDiff = round2(roundedTotalSec170 - grossTotal);

  return {
    baseAmount,
    totalGst,
    cgst,
    sgst,
    igst,
    grossTotal,
    roundedTotalSec170,
    roundingDiff,
  };
}

/**
 * Statutory Section 49 / 49A / 49B & Rule 88A ITC Utilization Engine:
 * 1. IGST ITC must be exhausted FIRST (against IGST -> then CGST -> then SGST).
 * 2. CGST ITC offsets CGST -> then remaining IGST (NEVER SGST).
 * 3. SGST ITC offsets SGST -> then remaining IGST (NEVER CGST).
 * 4. Compensation Cess ITC offsets ONLY Compensation Cess (never CGST/SGST/IGST & vice versa).
 */
export function computeRule88A(
  output: { igst: number; cgst: number; sgst: number; cess: number },
  availableRaw: ItcCreditInput
): Rule88AUtilization {
  const avail: ItcCreditInput = {
    igst: round2(nonNeg(availableRaw.igst)),
    cgst: round2(nonNeg(availableRaw.cgst)),
    sgst: round2(nonNeg(availableRaw.sgst)),
    cess: round2(nonNeg(availableRaw.cess)),
  };

  let remOutIgst = round2(nonNeg(output.igst));
  let remOutCgst = round2(nonNeg(output.cgst));
  let remOutSgst = round2(nonNeg(output.sgst));
  let remOutCess = round2(nonNeg(output.cess));

  let remItcIgst = avail.igst;
  let remItcCgst = avail.cgst;
  let remItcSgst = avail.sgst;
  let remItcCess = avail.cess;

  // Step 1: IGST ITC first (mandatory Rule 88A)
  const igstOnIgst = round2(Math.min(remItcIgst, remOutIgst));
  remItcIgst = round2(remItcIgst - igstOnIgst);
  remOutIgst = round2(remOutIgst - igstOnIgst);

  const igstOnCgst = round2(Math.min(remItcIgst, remOutCgst));
  remItcIgst = round2(remItcIgst - igstOnCgst);
  remOutCgst = round2(remOutCgst - igstOnCgst);

  const igstOnSgst = round2(Math.min(remItcIgst, remOutSgst));
  remItcIgst = round2(remItcIgst - igstOnSgst);
  remOutSgst = round2(remOutSgst - igstOnSgst);

  // Step 2: CGST ITC (CGST first, then IGST — NEVER SGST)
  const cgstOnCgst = round2(Math.min(remItcCgst, remOutCgst));
  remItcCgst = round2(remItcCgst - cgstOnCgst);
  remOutCgst = round2(remOutCgst - cgstOnCgst);

  const cgstOnIgst = round2(Math.min(remItcCgst, remOutIgst));
  remItcCgst = round2(remItcCgst - cgstOnIgst);
  remOutIgst = round2(remOutIgst - cgstOnIgst);

  // Step 3: SGST ITC (SGST first, then IGST — NEVER CGST)
  const sgstOnSgst = round2(Math.min(remItcSgst, remOutSgst));
  remItcSgst = round2(remItcSgst - sgstOnSgst);
  remOutSgst = round2(remOutSgst - sgstOnSgst);

  const sgstOnIgst = round2(Math.min(remItcSgst, remOutIgst));
  remItcSgst = round2(remItcSgst - sgstOnIgst);
  remOutIgst = round2(remOutIgst - sgstOnIgst);

  // Step 4: Compensation Cess (strictly Cess ITC <-> Cess liability only)
  const cessOnCess = round2(Math.min(remItcCess, remOutCess));
  remItcCess = round2(remItcCess - cessOnCess);
  remOutCess = round2(remOutCess - cessOnCess);

  const totalUtilized = round2(
    igstOnIgst +
      igstOnCgst +
      igstOnSgst +
      cgstOnCgst +
      cgstOnIgst +
      sgstOnSgst +
      sgstOnIgst +
      cessOnCess
  );
  const totalCashExact = round2(remOutIgst + remOutCgst + remOutSgst + remOutCess);
  const totalCarryForward = round2(remItcIgst + remItcCgst + remItcSgst + remItcCess);

  return {
    available: avail,
    utilized: {
      igstOnIgst,
      igstOnCgst,
      igstOnSgst,
      cgstOnCgst,
      cgstOnIgst,
      sgstOnSgst,
      sgstOnIgst,
      cessOnCess,
      totalUtilized,
    },
    cashPayable: {
      igst: remOutIgst,
      cgst: remOutCgst,
      sgst: remOutSgst,
      cess: remOutCess,
      totalExact: totalCashExact,
      totalRoundedSec170: roundSec170(totalCashExact),
    },
    carryForward: {
      igst: remItcIgst,
      cgst: remItcCgst,
      sgst: remItcSgst,
      cess: remItcCess,
      total: totalCarryForward,
    },
  };
}

export function computeGstInvoice(input: GstInvoiceInput): GstInvoiceResult {
  const isComposition = input.taxScheme === "composition";
  const isRcm = !isComposition && Boolean(input.isRcm);
  const marginPct = input.showMarginMode ? clamp(input.marginPct, 0, 500) : 0;

  // Section 10(2)(c) CGST Act: Composition dealers cannot make inter-state outward supplies
  const effectivePlaceOfSupply: GstPlaceOfSupply = isComposition ? "intra" : input.placeOfSupply;
  const compositionWarning =
    isComposition && input.placeOfSupply === "inter"
      ? "Section 10(2)(c) CGST Act prohibits Inter-State outward supplies under the Composition Scheme. Supply locked to Intra-State."
      : null;

  const compConfig =
    COMPOSITION_CATEGORIES[input.compositionCategory] ||
    COMPOSITION_CATEGORIES.trader_manufacturer;

  let subTotal = 0;
  let totalDiscount = 0;
  let totalGst = 0;
  let totalCess = 0;

  const items: ComputedGstLineItem[] = input.items.map((rawItem) => {
    const unitPrice = nonNeg(rawItem.unitPrice);
    const quantity = Math.max(1, Math.floor(nonNeg(rawItem.quantity) || 1));
    const discount = clamp(rawItem.discount, 0, 100);
    const gstRate = isComposition ? 0 : clamp(rawItem.gstRate, 0, 100);
    const cessRate = isComposition ? 0 : clamp(rawItem.cessRate, 0, 200);

    let grossLineAmount = unitPrice * quantity;
    if (input.showMarginMode && marginPct > 0) {
      grossLineAmount = grossLineAmount * (1 + marginPct / 100);
    }
    grossLineAmount = round2(grossLineAmount);

    // Section 15(3): on-invoice discount reduces value before tax
    const discountVal = round2(grossLineAmount * (discount / 100));
    const netAmount = round2(grossLineAmount - discountVal);

    let basePrice = 0;
    let gst = 0;
    let cess = 0;
    let total = 0;

    if (isComposition) {
      // Section 10(4): Bill of Supply — zero GST collected from recipient
      basePrice = netAmount;
      gst = 0;
      cess = 0;
      total = basePrice;
    } else if (input.calcMode === "exclusive") {
      basePrice = netAmount;
      gst = round2(basePrice * (gstRate / 100));
      cess = round2(basePrice * (cessRate / 100));
      total = round2(basePrice + gst + cess);
    } else {
      const combined = (gstRate + cessRate) / 100;
      basePrice = combined > 0 ? round2(netAmount / (1 + combined)) : netAmount;
      if (cessRate > 0) {
        gst = round2(basePrice * (gstRate / 100));
        cess = round2(Math.max(0, netAmount - basePrice - gst));
      } else {
        gst = round2(Math.max(0, netAmount - basePrice));
        cess = 0;
      }
      total = netAmount;
    }

    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    if (!isComposition) {
      if (effectivePlaceOfSupply === "intra") {
        cgst = round2(gst / 2);
        sgst = round2(gst - cgst);
      } else {
        igst = gst;
      }
    }

    subTotal = round2(subTotal + basePrice);
    totalDiscount = round2(totalDiscount + discountVal);
    totalGst = round2(totalGst + gst);
    totalCess = round2(totalCess + cess);

    return {
      ...rawItem,
      unitPrice,
      quantity,
      discount,
      gstRate,
      cessRate,
      grossLineAmount,
      discountVal,
      basePrice,
      gst,
      cgst,
      sgst,
      igst,
      cess,
      total,
    };
  });

  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  if (!isComposition) {
    if (effectivePlaceOfSupply === "intra") {
      cgst = round2(totalGst / 2);
      sgst = round2(totalGst - cgst);
    } else {
      igst = totalGst;
    }
  }

  const grandTotalExact = round2(subTotal + totalGst + totalCess);
  const grandTotalRoundedSec170 = roundSec170(grandTotalExact);

  // Composition tax is paid out-of-pocket on taxable turnover (subTotal), NEVER on GST-inclusive grandTotal!
  const compositionRate = isComposition ? compConfig.rate : 0;
  const compositionTax = isComposition ? round2(subTotal * (compositionRate / 100)) : 0;
  const compositionCgst = isComposition ? round2(compositionTax / 2) : 0;
  const compositionSgst = isComposition ? round2(compositionTax - compositionCgst) : 0;

  // Rule 88A ITC Utilization (disabled under Composition u/s 10(4) and under RCM u/s 49(4))
  const rule88A =
    isComposition || isRcm
      ? computeRule88A(
          { igst: 0, cgst: 0, sgst: 0, cess: 0 },
          { igst: 0, cgst: 0, sgst: 0, cess: 0 }
        )
      : computeRule88A({ igst, cgst, sgst, cess: totalCess }, input.itc);

  const supplierCashLiabilityExact = isComposition
    ? compositionTax
    : isRcm
      ? 0
      : rule88A.cashPayable.totalExact;
  const supplierCashLiabilityRounded = roundSec170(supplierCashLiabilityExact);

  // Under RCM (Sec 9(3)/9(4) & Sec 49(4)), recipient discharges 100% GST + Cess strictly in CASH
  const recipientRcmCashLiabilityExact = isRcm ? round2(totalGst + totalCess) : 0;
  const recipientRcmCashLiabilityRounded = roundSec170(recipientRcmCashLiabilityExact);

  // Exact markup profit: if subTotal = cost * (1 + m/100), profit = subTotal * m / (100 + m)
  const estimatedMarginProfit =
    input.showMarginMode && marginPct > 0
      ? round2(subTotal * (marginPct / (100 + marginPct)))
      : 0;

  const documentType = isComposition
    ? "BILL_OF_SUPPLY"
    : isRcm
      ? "RCM_INVOICE"
      : "TAX_INVOICE";
  const documentLabel = isComposition
    ? "Bill of Supply (Composition)"
    : isRcm
      ? "Tax Invoice (Reverse Charge)"
      : "Tax Invoice";

  return {
    documentType,
    documentLabel,
    effectivePlaceOfSupply,
    compositionWarning,
    items,
    subTotal,
    totalDiscount,
    totalGst,
    cgst,
    sgst,
    igst,
    totalCess,
    grandTotalExact,
    grandTotalRoundedSec170,
    compositionRate,
    compositionTax,
    compositionCgst,
    compositionSgst,
    rule88A,
    supplierCashLiabilityExact,
    supplierCashLiabilityRounded,
    recipientRcmCashLiabilityExact,
    recipientRcmCashLiabilityRounded,
    estimatedMarginProfit,
  };
}

