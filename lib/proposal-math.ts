export interface ProposalLineItem {
  id?: string;
  category?: string;
  description: string;
  details?: string;
  sacCode?: string;
  qty: number;
  unit?: string;
  rate: number;
  gstPercent: number;
  isGovFee?: boolean;
  amount: number;
}

export interface ProposalMilestone {
  title: string;
  percentage: number;
  amount: number;
  dueTrigger?: string;
}

export interface ProposalCalculationResult {
  lineItems: ProposalLineItem[];
  profSubtotal: number;
  govSubtotal: number;
  subtotal: number;
  discount: number;
  taxableProf: number;
  taxAmount: number;
  totalAmount: number;
  paymentMilestones?: ProposalMilestone[];
  amountInWords: string;
}

export function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function numberToIndianWords(num: number): string {
  if (!Number.isFinite(num) || num === 0) return "Zero Rupees Only";

  const isNegative = num < 0;
  const abs = Math.abs(num);

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const formatBelowThousand = (n: number): string => {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred";
      n %= 100;
      if (n > 0) str += " ";
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)];
      if (n % 10 > 0) str += " " + ones[n % 10];
    } else if (n > 0) {
      str += ones[n];
    }
    return str.trim();
  };

  const formatIndianInteger = (n: number): string => {
    if (n === 0) return "";
    const parts: string[] = [];

    const crore = Math.floor(n / 10000000);
    n %= 10000000;
    const lakh = Math.floor(n / 100000);
    n %= 100000;
    const thousand = Math.floor(n / 1000);
    n %= 1000;
    const remainder = n;

    if (crore > 0) {
      parts.push(
        (crore >= 1000 ? formatIndianInteger(crore) : formatBelowThousand(crore)) +
          " Crore"
      );
    }
    if (lakh > 0) parts.push(formatBelowThousand(lakh) + " Lakh");
    if (thousand > 0) parts.push(formatBelowThousand(thousand) + " Thousand");
    if (remainder > 0) parts.push(formatBelowThousand(remainder));

    return parts.join(" ").trim();
  };

  let integerPart = Math.floor(abs);
  let paise = Math.round((abs - integerPart) * 100);
  if (paise >= 100) {
    integerPart += 1;
    paise = 0;
  }

  const prefix = isNegative ? "Minus " : "";
  if (integerPart === 0 && paise === 0) return "Zero Rupees Only";
  if (integerPart === 0 && paise > 0) {
    return `${prefix}${formatBelowThousand(paise)} Paise Only`;
  }

  const rupeeWords = formatIndianInteger(integerPart);
  if (paise > 0) {
    return `${prefix}Rupees ${rupeeWords} and ${formatBelowThousand(paise)} Paise Only`;
  }
  return `${prefix}Rupees ${rupeeWords} Only`;
}

/**
 * Shared GST & discount calculator used by both server APIs and Quotation Studio UI.
 *
 * Rules (Indian GST / Rule 33 Pure Agent compliance):
 * - Pure-agent government fees (`isGovFee === true`) always attract 0% GST and are never discounted.
 * - Discount is applied solely against the professional/service subtotal and clamped to `[0, profSubtotal]`.
 * - Discount is allocated proportionally across professional line items so each item's own `gstPercent`
 *   (0%, 5%, 12%, 18%, 28%) is respected rather than overriding with a flat 18%.
 */
export function calculateProposalTotals(
  rawLineItems: ProposalLineItem[],
  rawDiscount: number = 0,
  rawMilestones?: ProposalMilestone[] | null,
  options?: { strict?: boolean }
): ProposalCalculationResult {
  const strict = options?.strict ?? false;

  if (strict && (!Array.isArray(rawLineItems) || rawLineItems.length === 0)) {
    throw new Error("At least one service line item is required");
  }

  const parsedDiscount = Number(rawDiscount ?? 0);
  if (strict && (!Number.isFinite(parsedDiscount) || parsedDiscount < 0)) {
    throw new Error("Discount must be a valid non-negative number");
  }

  let profSubtotalRaw = 0;
  let govSubtotalRaw = 0;

  const normalizedItems: ProposalLineItem[] = (rawLineItems || []).map((item, idx) => {
    const qty = Number(item.qty ?? 1);
    const rate = Number(item.rate ?? 0);
    const isGovFee = Boolean(item.isGovFee);
    const gstPercent = isGovFee ? 0 : Number(item.gstPercent ?? 18);

    if (strict) {
      if (!item.description || !String(item.description).trim()) {
        throw new Error(`Line item #${idx + 1} requires a description`);
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error(`Line item #${idx + 1} quantity must be greater than 0`);
      }
      if (!Number.isFinite(rate) || rate < 0) {
        throw new Error(`Line item #${idx + 1} rate must be a non-negative number`);
      }
      if (!Number.isFinite(gstPercent) || gstPercent < 0 || gstPercent > 100) {
        throw new Error(`Line item #${idx + 1} GST percent must be between 0 and 100`);
      }
    }

    const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 1;
    const safeRate = Number.isFinite(rate) && rate >= 0 ? rate : 0;
    const safeGst =
      isGovFee || !Number.isFinite(gstPercent)
        ? 0
        : Math.min(100, Math.max(0, gstPercent));
    const lineAmount = round2(safeQty * safeRate);

    if (isGovFee) {
      govSubtotalRaw += lineAmount;
    } else {
      profSubtotalRaw += lineAmount;
    }

    return {
      ...item,
      description: String(item.description || "").trim(),
      details: item.details ? String(item.details).trim() : "",
      sacCode: item.sacCode
        ? String(item.sacCode).trim()
        : isGovFee
        ? "000000"
        : "998231",
      qty: safeQty,
      unit: item.unit ? String(item.unit).trim() : "Nos",
      rate: safeRate,
      gstPercent: safeGst,
      isGovFee,
      amount: lineAmount,
    };
  });

  const profSubtotal = round2(profSubtotalRaw);
  const govSubtotal = round2(govSubtotalRaw);
  const subtotal = round2(profSubtotal + govSubtotal);

  // Clamp discount strictly to [0, profSubtotal] so govt disbursements are never discounted
  const safeRawDiscount = Number.isFinite(parsedDiscount) && parsedDiscount > 0 ? parsedDiscount : 0;
  const discount = round2(Math.min(safeRawDiscount, profSubtotal));
  const taxableProf = round2(Math.max(0, profSubtotal - discount));

  // Allocate discount proportionally across professional items so per-item GST rates are preserved
  let rawTax = 0;
  for (const item of normalizedItems) {
    if (item.isGovFee || item.gstPercent <= 0) continue;
    const discountShare = profSubtotal > 0 ? (item.amount / profSubtotal) * discount : 0;
    const discountedLine = Math.max(0, item.amount - discountShare);
    rawTax += (discountedLine * item.gstPercent) / 100;
  }

  const taxAmount = round2(rawTax);
  const totalAmount = round2(taxableProf + govSubtotal + taxAmount);

  let normalizedMilestones: ProposalMilestone[] | undefined;
  if (Array.isArray(rawMilestones)) {
    normalizedMilestones = rawMilestones.map((m) => {
      const pct = Number(m.percentage ?? 0);
      const safePct = Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0;
      return {
        title: String(m.title || "Milestone").trim(),
        percentage: safePct,
        amount: round2(totalAmount * (safePct / 100)),
        dueTrigger: String(m.dueTrigger || "On schedule").trim(),
      };
    });
  }

  return {
    lineItems: normalizedItems,
    profSubtotal,
    govSubtotal,
    subtotal,
    discount,
    taxableProf,
    taxAmount,
    totalAmount,
    paymentMilestones: normalizedMilestones,
    amountInWords: numberToIndianWords(totalAmount),
  };
}

