import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";

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

export interface ProposalPdfData {
  proposalNumber: string;
  title: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  clientCompany?: string | null;
  clientGstin?: string | null;
  clientPan?: string | null;
  clientAddress?: string | null;
  placeOfSupply?: string | null;
  taxType?: "IGST" | "CGST_SGST" | string;
  paymentMilestones?: ProposalMilestone[] | null;
  validUntil: Date | string;
  createdAt?: Date | string;
  lineItems: ProposalLineItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string | null;
  terms?: string | null;
}

const COLORS = {
  primary: rgb(0.09, 0.15, 0.35),       // Deep Navy
  primaryLight: rgb(0.24, 0.35, 0.72),
  accent: rgb(0.25, 0.45, 0.95),        // Royal Blue
  dark: rgb(0.07, 0.09, 0.15),
  text: rgb(0.15, 0.18, 0.25),
  muted: rgb(0.42, 0.46, 0.54),
  light: rgb(0.68, 0.72, 0.78),
  white: rgb(1, 1, 1),
  bgLight: rgb(0.97, 0.98, 0.99),
  border: rgb(0.86, 0.88, 0.92),
  success: rgb(0.12, 0.62, 0.38),
  headerBg: rgb(0.06, 0.09, 0.18),
  rowStripe: rgb(0.98, 0.985, 0.995),
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_L = 40;
const MARGIN_R = 40;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

function formatInr(val: number): string {
  return "INR " + (val || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(d: Date | string | undefined): string {
  if (!d) return "N/A";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function numberToIndianWords(num: number): string {
  if (!num || num === 0) return "Zero Rupees Only";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatChunk = (n: number): string => {
    let str = "";
    if (n > 99) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + " " + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str.trim();
  };

  const integerPart = Math.floor(num);
  let n = integerPart;
  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  const lakh = Math.floor(n / 100000);
  n %= 100000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  const remainder = n;

  let res = "";
  if (crore > 0) res += formatChunk(crore) + " Crore ";
  if (lakh > 0) res += formatChunk(lakh) + " Lakh ";
  if (thousand > 0) res += formatChunk(thousand) + " Thousand ";
  if (remainder > 0) res += formatChunk(remainder);

  return "Rupees " + res.trim() + " Only";
}

export async function generateProposalPdf(data: ProposalPdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H;

  // 1. Header Banner
  const headerHeight = 84;
  page.drawRectangle({
    x: 0,
    y: y - headerHeight,
    width: PAGE_W,
    height: headerHeight,
    color: COLORS.headerBg,
  });

  page.drawText("TaxFiling24", {
    x: MARGIN_L,
    y: y - 36,
    size: 20,
    font: fontBold,
    color: COLORS.white,
  });

  page.drawText("Chartered Tax, Corporate Legal & Statutory Advisory Services", {
    x: MARGIN_L,
    y: y - 54,
    size: 9,
    font: fontRegular,
    color: COLORS.light,
  });

  page.drawText("www.taxfiling24.com  |  support@taxfiling24.com  |  GSTIN: 07AABCT2424P1Z4", {
    x: MARGIN_L,
    y: y - 68,
    size: 8,
    font: fontRegular,
    color: COLORS.muted,
  });

  // Quotation Badge
  const badgeText = "FORMAL FEE QUOTATION";
  const badgeW = fontBold.widthOfTextAtSize(badgeText, 10) + 16;
  page.drawRectangle({
    x: PAGE_W - MARGIN_R - badgeW,
    y: y - 44,
    width: badgeW,
    height: 22,
    color: COLORS.accent,
  });

  page.drawText(badgeText, {
    x: PAGE_W - MARGIN_R - badgeW + 8,
    y: y - 38,
    size: 10,
    font: fontBold,
    color: COLORS.white,
  });

  page.drawText(data.proposalNumber, {
    x: PAGE_W - MARGIN_R - fontBold.widthOfTextAtSize(data.proposalNumber, 11),
    y: y - 64,
    size: 11,
    font: fontBold,
    color: COLORS.white,
  });

  y -= headerHeight + 20;

  // 2. Client & Meta Info Grid
  const metaBoxH = 86;
  page.drawRectangle({
    x: MARGIN_L,
    y: y - metaBoxH,
    width: CONTENT_W,
    height: metaBoxH,
    color: COLORS.bgLight,
    borderColor: COLORS.border,
    borderWidth: 1,
  });

  // Left: Client Billing Info
  page.drawText("BILLED TO / ENGAGEMENT CLIENT:", {
    x: MARGIN_L + 14,
    y: y - 18,
    size: 8,
    font: fontBold,
    color: COLORS.accent,
  });

  page.drawText(data.clientName || "Valued Client", {
    x: MARGIN_L + 14,
    y: y - 32,
    size: 12,
    font: fontBold,
    color: COLORS.dark,
  });

  const clientCompany = data.clientCompany ? `${data.clientCompany}` : "";
  page.drawText(clientCompany || data.clientEmail || "", {
    x: MARGIN_L + 14,
    y: y - 46,
    size: 8.5,
    font: fontRegular,
    color: COLORS.muted,
  });

  const taxDetails = [
    data.clientGstin ? `GSTIN: ${data.clientGstin}` : "",
    data.clientPan ? `PAN: ${data.clientPan}` : "",
    data.placeOfSupply ? `POS: ${data.placeOfSupply}` : "",
  ].filter(Boolean).join("  |  ");

  page.drawText(taxDetails || `Email: ${data.clientEmail || "N/A"}`, {
    x: MARGIN_L + 14,
    y: y - 60,
    size: 8,
    font: fontRegular,
    color: COLORS.muted,
  });

  if (data.clientPhone) {
    page.drawText(`Phone: ${data.clientPhone}`, {
      x: MARGIN_L + 14,
      y: y - 74,
      size: 8,
      font: fontRegular,
      color: COLORS.muted,
    });
  }

  // Right: Dates & Quotation Details
  const rightX = MARGIN_L + CONTENT_W - 190;
  page.drawText("QUOTATION PARTICULARS:", {
    x: rightX,
    y: y - 18,
    size: 8,
    font: fontBold,
    color: COLORS.accent,
  });

  page.drawText(`Date Issued: ${formatDate(data.createdAt || new Date())}`, {
    x: rightX,
    y: y - 32,
    size: 8.5,
    font: fontRegular,
    color: COLORS.text,
  });

  page.drawText(`Valid Until: ${formatDate(data.validUntil)}`, {
    x: rightX,
    y: y - 46,
    size: 8.5,
    font: fontBold,
    color: COLORS.dark,
  });

  const taxModeLabel = data.taxType === "CGST_SGST" ? "Intra-State (CGST 9% + SGST 9%)" : "Inter-State (IGST 18%)";
  page.drawText(`Tax Regime: ${taxModeLabel}`, {
    x: rightX,
    y: y - 60,
    size: 7.5,
    font: fontRegular,
    color: COLORS.muted,
  });

  page.drawText(`Currency: INR (Rs.)`, {
    x: rightX,
    y: y - 74,
    size: 8,
    font: fontBold,
    color: COLORS.primary,
  });

  y -= metaBoxH + 18;

  // 3. Subject Title
  page.drawText("SERVICE SCOPE & ENGAGEMENT SUBJECT", {
    x: MARGIN_L,
    y: y,
    size: 9,
    font: fontBold,
    color: COLORS.primary,
  });

  y -= 14;
  page.drawText(data.title, {
    x: MARGIN_L,
    y: y,
    size: 11.5,
    font: fontBold,
    color: COLORS.dark,
  });

  y -= 18;

  // 4. Line Items Table
  // Columns: # (20), Description (245), SAC (55), Qty/Unit (45), Rate (75), Total (75)
  const colX = {
    num: MARGIN_L + 6,
    desc: MARGIN_L + 26,
    sac: MARGIN_L + 270,
    qty: MARGIN_L + 325,
    rate: MARGIN_L + 375,
    amount: MARGIN_L + CONTENT_W - 10,
  };

  const tableHeaderH = 22;
  page.drawRectangle({
    x: MARGIN_L,
    y: y - tableHeaderH,
    width: CONTENT_W,
    height: tableHeaderH,
    color: COLORS.primary,
  });

  page.drawText("#", { x: colX.num, y: y - 15, size: 8, font: fontBold, color: COLORS.white });
  page.drawText("Deliverable Description", { x: colX.desc, y: y - 15, size: 8, font: fontBold, color: COLORS.white });
  page.drawText("SAC Code", { x: colX.sac, y: y - 15, size: 8, font: fontBold, color: COLORS.white });
  page.drawText("Qty", { x: colX.qty, y: y - 15, size: 8, font: fontBold, color: COLORS.white });
  page.drawText("Rate (INR)", { x: colX.rate, y: y - 15, size: 8, font: fontBold, color: COLORS.white });
  const amtHeader = "Amount (INR)";
  const amtHw = fontBold.widthOfTextAtSize(amtHeader, 8);
  page.drawText(amtHeader, { x: colX.amount - amtHw, y: y - 15, size: 8, font: fontBold, color: COLORS.white });

  y -= tableHeaderH;

  // Rows
  const rowH = 24;
  const items = data.lineItems && data.lineItems.length > 0 ? data.lineItems : [];

  items.forEach((item, idx) => {
    const isStripe = idx % 2 === 1;
    if (isStripe) {
      page.drawRectangle({
        x: MARGIN_L,
        y: y - rowH,
        width: CONTENT_W,
        height: rowH,
        color: COLORS.rowStripe,
      });
    }

    page.drawLine({
      start: { x: MARGIN_L, y: y - rowH },
      end: { x: MARGIN_L + CONTENT_W, y: y - rowH },
      thickness: 0.5,
      color: COLORS.border,
    });

    page.drawText(String(idx + 1), {
      x: colX.num,
      y: y - 16,
      size: 7.5,
      font: fontRegular,
      color: COLORS.muted,
    });

    const isGov = item.isGovFee;
    const tag = isGov ? " [Govt Pure Agent]" : "";
    const desc = (item.description + tag).length > 46 ? (item.description + tag).substring(0, 44) + "..." : item.description + tag;
    page.drawText(desc, {
      x: colX.desc,
      y: y - 16,
      size: 8,
      font: fontBold,
      color: isGov ? COLORS.accent : COLORS.text,
    });

    page.drawText(item.sacCode || (isGov ? "000000" : "998231"), {
      x: colX.sac,
      y: y - 16,
      size: 7.5,
      font: fontRegular,
      color: COLORS.muted,
    });

    page.drawText(`${item.qty || 1} ${item.unit || "Nos"}`, {
      x: colX.qty,
      y: y - 16,
      size: 8,
      font: fontRegular,
      color: COLORS.text,
    });

    const rateStr = (item.rate || 0).toLocaleString("en-IN");
    page.drawText(rateStr, {
      x: colX.rate,
      y: y - 16,
      size: 8,
      font: fontRegular,
      color: COLORS.text,
    });

    const amtStr = (item.amount || (item.qty * item.rate)).toLocaleString("en-IN", { minimumFractionDigits: 2 });
    const amtW = fontBold.widthOfTextAtSize(amtStr, 8);
    page.drawText(amtStr, {
      x: colX.amount - amtW,
      y: y - 16,
      size: 8,
      font: fontBold,
      color: COLORS.dark,
    });

    y -= rowH;
  });

  y -= 10;

  // 5. Totals Box (Right Aligned)
  const totalsBoxW = 230;
  const totalsBoxX = MARGIN_L + CONTENT_W - totalsBoxW;
  const isCgst = data.taxType === "CGST_SGST";
  const totalsBoxH = isCgst ? 104 : 92;

  page.drawRectangle({
    x: totalsBoxX,
    y: y - totalsBoxH,
    width: totalsBoxW,
    height: totalsBoxH,
    color: COLORS.bgLight,
    borderColor: COLORS.border,
    borderWidth: 1,
  });

  let ty = y - 16;
  const drawTotalLine = (label: string, val: string, isGrand: boolean = false) => {
    page.drawText(label, {
      x: totalsBoxX + 10,
      y: ty,
      size: isGrand ? 9.5 : 8,
      font: isGrand ? fontBold : fontRegular,
      color: isGrand ? COLORS.primary : COLORS.muted,
    });
    const vw = (isGrand ? fontBold : fontRegular).widthOfTextAtSize(val, isGrand ? 10.5 : 8);
    page.drawText(val, {
      x: totalsBoxX + totalsBoxW - 10 - vw,
      y: ty,
      size: isGrand ? 10.5 : 8,
      font: isGrand ? fontBold : fontRegular,
      color: isGrand ? COLORS.accent : COLORS.dark,
    });
    ty -= isGrand ? 18 : 15;
  };

  drawTotalLine("Taxable Value / Subtotal:", formatInr(data.subtotal));
  if (data.discount > 0) {
    drawTotalLine("Discount Applied:", "-" + formatInr(data.discount));
  }

  if (isCgst) {
    const halfTax = Math.round((data.taxAmount / 2) * 100) / 100;
    drawTotalLine("CGST (9%):", formatInr(halfTax));
    drawTotalLine("SGST (9%):", formatInr(halfTax));
  } else {
    drawTotalLine("IGST (18% Integrated):", formatInr(data.taxAmount));
  }

  page.drawLine({
    start: { x: totalsBoxX + 10, y: ty + 4 },
    end: { x: totalsBoxX + totalsBoxW - 10, y: ty + 4 },
    thickness: 1,
    color: COLORS.accent,
  });

  drawTotalLine("Grand Total:", formatInr(data.totalAmount), true);

  // Left of totals box: Bank Details & Amount in Words
  const bankBoxW = CONTENT_W - totalsBoxW - 14;
  page.drawRectangle({
    x: MARGIN_L,
    y: y - totalsBoxH,
    width: bankBoxW,
    height: totalsBoxH,
    color: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
  });

  page.drawText("BANK & REMITTANCE DETAILS", {
    x: MARGIN_L + 10,
    y: y - 16,
    size: 7.5,
    font: fontBold,
    color: COLORS.accent,
  });

  page.drawText("Account Name: TaxFiling24 Advisory Services\nBank: HDFC Bank Ltd.  |  Account No: 50200088921134\nIFSC Code: HDFC0001202  |  Branch: New Delhi\nUPI VPA: taxfiling24@hdfcbank", {
    x: MARGIN_L + 10,
    y: y - 28,
    size: 7,
    font: fontRegular,
    color: COLORS.muted,
    lineHeight: 10,
  });

  // Amount in Words below bank info
  const words = numberToIndianWords(data.totalAmount);
  page.drawText("AMOUNT IN WORDS:", {
    x: MARGIN_L + 10,
    y: y - 72,
    size: 7,
    font: fontBold,
    color: COLORS.dark,
  });

  page.drawText(words, {
    x: MARGIN_L + 10,
    y: y - 84,
    size: 7.5,
    font: fontOblique,
    color: COLORS.primary,
  });

  y -= totalsBoxH + 18;

  // 6. Payment Milestones (If provided)
  if (data.paymentMilestones && data.paymentMilestones.length > 0) {
    page.drawText("PAYMENT MILESTONE SCHEDULE", {
      x: MARGIN_L,
      y: y,
      size: 8.5,
      font: fontBold,
      color: COLORS.primary,
    });
    y -= 12;

    const msText = data.paymentMilestones
      .map((m, i) => `${i + 1}. ${m.title} (${m.percentage}% = ${formatInr(m.amount)}) - ${m.dueTrigger || "On schedule"}`)
      .join("  |  ");

    page.drawText(msText.substring(0, 110), {
      x: MARGIN_L,
      y: y,
      size: 7.5,
      font: fontRegular,
      color: COLORS.muted,
    });
    y -= 16;
  }

  // 7. Terms & Conditions
  page.drawText("TERMS OF ENGAGEMENT & PROFESSIONAL POLICIES", {
    x: MARGIN_L,
    y: y,
    size: 8.5,
    font: fontBold,
    color: COLORS.primary,
  });

  y -= 12;

  const defaultTerms =
    data.terms ||
    "1. Validity: This quotation is valid for 15 days from the date of issuance.\n" +
    "2. Scope: Any government statutory filing fees, MCA stamp duty, or ROC penalties incurred outside standard scope will be billed at actuals.\n" +
    "3. Mobilization: Service delivery commences immediately upon receipt of 50% advance mobilization fee.\n" +
    "4. Client Responsibilities: Client must furnish complete KYC documents, bank statements, and relevant certificates within 7 working days.";

  page.drawText(defaultTerms, {
    x: MARGIN_L,
    y: y,
    size: 7,
    font: fontRegular,
    color: COLORS.muted,
    lineHeight: 10,
  });

  // Footer
  const footerY = 24;
  page.drawLine({
    start: { x: MARGIN_L, y: footerY + 10 },
    end: { x: MARGIN_L + CONTENT_W, y: footerY + 10 },
    thickness: 0.5,
    color: COLORS.border,
  });

  page.drawText("TaxFiling24 Corporate Advisory | New Delhi, India | Authorized Signature Not Required (Computer Generated Quotation)", {
    x: MARGIN_L,
    y: footerY,
    size: 7,
    font: fontRegular,
    color: COLORS.light,
  });

  return await doc.save();
}
