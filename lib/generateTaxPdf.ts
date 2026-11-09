import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";

// ── Color Palette ──────────────────────────────────────────────────
const COLORS = {
  primary: rgb(0.29, 0.33, 0.55),       // Deep indigo
  primaryLight: rgb(0.42, 0.45, 0.75),   // Lighter indigo
  accent: rgb(0.35, 0.45, 0.92),         // Bright indigo-blue
  dark: rgb(0.08, 0.09, 0.16),           // Near-black
  text: rgb(0.15, 0.16, 0.22),           // Body text
  muted: rgb(0.45, 0.47, 0.55),          // Muted gray
  light: rgb(0.65, 0.67, 0.72),          // Lighter muted
  white: rgb(1, 1, 1),
  bgLight: rgb(0.96, 0.965, 0.98),       // Light background fill
  bgAccent: rgb(0.93, 0.94, 0.98),       // Accent background fill
  border: rgb(0.85, 0.86, 0.9),          // Border lines
  success: rgb(0.13, 0.58, 0.34),        // Green
  danger: rgb(0.78, 0.17, 0.22),         // Red
  gold: rgb(0.72, 0.58, 0.18),           // Gold accent
  headerBg: rgb(0.07, 0.08, 0.14),       // Dark header background
  stripeBg: rgb(0.97, 0.975, 0.99),      // Alternating row
};

// ── Page dimensions ────────────────────────────────────────────────
const PAGE_W = 595.28;  // A4
const PAGE_H = 841.89;
const MARGIN_L = 48;
const MARGIN_R = 48;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

interface TaxReportData {
  financialYear: string;
  assessmentYear: string;
  ageGroup: string;
  salary: number;
  rentalIncome: number;
  otherIncome: number;
  professionalIncome: number;
  businessExpenses: number;
  deduction80C: number;
  deduction80D: number;
  deduction80D_Parents: number;
  deductionNPS: number;
  homeLoanInterest: number;
  hra: number;
  otherDeductions: number;
  stcgEquity: number;
  ltcgEquity: number;
  results: {
    grossTotalIncome: number;
    totalDeductions: number;
    taxableOld: number;
    taxableNew: number;
    oldTax: number;
    newTax: number;
    savings: number;
    better: string;
    surchargeOld: number;
    surchargeNew: number;
    capitalGainsTax: number;
    interest234A: number;
    interest234B: number;
    totalPayable: number;
    breakdownOld: { slab: string; tax: number }[];
    breakdownNew: { slab: string; tax: number }[];
    advanceTax: { june: number; sept: number; dec: number; march: number };
  };
}

// ── Helpers ────────────────────────────────────────────────────────
function formatINR(val: number): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(val);
  return `Rs. ${formatted}`;
}

function ageLabel(group: string): string {
  if (group === "senior") return "Senior Citizen (60-80)";
  if (group === "super-senior") return "Super Senior Citizen (80+)";
  return "Individual (Below 60)";
}

// ── Draw helpers ───────────────────────────────────────────────────
function drawLine(page: PDFPage, y: number, color = COLORS.border, thickness = 0.5) {
  page.drawLine({
    start: { x: MARGIN_L, y },
    end: { x: PAGE_W - MARGIN_R, y },
    thickness,
    color,
  });
}

function drawRect(page: PDFPage, x: number, y: number, w: number, h: number, color: ReturnType<typeof rgb>) {
  page.drawRectangle({ x, y, width: w, height: h, color });
}

function drawRoundedRect(page: PDFPage, x: number, y: number, w: number, h: number, color: ReturnType<typeof rgb>, borderColor?: ReturnType<typeof rgb>) {
  page.drawRectangle({ x, y, width: w, height: h, color, borderColor, borderWidth: borderColor ? 0.5 : 0 });
}

function textRight(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color: ReturnType<typeof rgb>) {
  const tw = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: PAGE_W - MARGIN_R - tw, y, size, font, color });
}

function textCenter(page: PDFPage, text: string, y: number, font: PDFFont, size: number, color: ReturnType<typeof rgb>) {
  const tw = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: (PAGE_W - tw) / 2, y, size, font, color });
}

// ── Section Header ─────────────────────────────────────────────────
function drawSectionHeader(page: PDFPage, title: string, y: number, fontBold: PDFFont): number {
  // Accent bar
  drawRect(page, MARGIN_L, y - 2, 3, 14, COLORS.accent);
  page.drawText(title.toUpperCase(), { x: MARGIN_L + 12, y, size: 8.5, font: fontBold, color: COLORS.primary });
  return y - 24;
}

// ── Table row ──────────────────────────────────────────────────────
function drawTableRow(
  page: PDFPage, label: string, val1: string, val2: string, y: number,
  font: PDFFont, fontBold: PDFFont, isHeader = false, isTotal = false, isStriped = false
): number {
  const rowH = isHeader ? 22 : 18;
  const colLabel = MARGIN_L + 8;
  const colMid = MARGIN_L + CONTENT_W * 0.55;
  const colRight = PAGE_W - MARGIN_R - 8;

  if (isHeader) {
    drawRect(page, MARGIN_L, y - 4, CONTENT_W, rowH, COLORS.headerBg);
    page.drawText(label, { x: colLabel, y: y + 3, size: 7, font: fontBold, color: COLORS.white });
    const tw1 = fontBold.widthOfTextAtSize(val1, 7);
    page.drawText(val1, { x: colMid - tw1, y: y + 3, size: 7, font: fontBold, color: COLORS.white });
    const tw2 = fontBold.widthOfTextAtSize(val2, 7);
    page.drawText(val2, { x: colRight - tw2, y: y + 3, size: 7, font: fontBold, color: COLORS.white });
    return y - rowH - 1;
  }

  if (isStriped) {
    drawRect(page, MARGIN_L, y - 4, CONTENT_W, rowH, COLORS.stripeBg);
  }

  if (isTotal) {
    drawRect(page, MARGIN_L, y - 4, CONTENT_W, rowH, COLORS.bgAccent);
    drawLine(page, y + rowH - 4, COLORS.primary, 1);
  }

  const usedFont = isTotal ? fontBold : font;
  const usedColor = isTotal ? COLORS.primary : COLORS.text;
  const fontSize = isTotal ? 8.5 : 8;

  page.drawText(label, { x: colLabel, y: y + 2, size: fontSize, font: usedFont, color: usedColor });
  const tw1 = usedFont.widthOfTextAtSize(val1, fontSize);
  page.drawText(val1, { x: colMid - tw1, y: y + 2, size: fontSize, font: usedFont, color: usedColor });
  const tw2 = usedFont.widthOfTextAtSize(val2, fontSize);
  page.drawText(val2, { x: colRight - tw2, y: y + 2, size: fontSize, font: usedFont, color: usedColor });

  return y - rowH;
}

// ── Key-Value row (for single-column detail) ───────────────────────
function drawKVRow(page: PDFPage, label: string, value: string, y: number, font: PDFFont, fontBold: PDFFont, isStriped = false): number {
  if (isStriped) drawRect(page, MARGIN_L, y - 4, CONTENT_W, 18, COLORS.stripeBg);
  page.drawText(label, { x: MARGIN_L + 8, y: y + 2, size: 8, font, color: COLORS.text });
  const tw = fontBold.widthOfTextAtSize(value, 8);
  page.drawText(value, { x: PAGE_W - MARGIN_R - 8 - tw, y: y + 2, size: 8, font: fontBold, color: COLORS.text });
  return y - 18;
}

// ══════════════════════════════════════════════════════════════════════
// Main PDF Generation
// ══════════════════════════════════════════════════════════════════════
export async function generateTaxReportPdf(data: TaxReportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H;

  const addPageIfNeeded = (needed: number) => {
    if (y - needed < 50) {
      // Draw footer bar on bottom of current page before flipping
      drawRect(page, 0, 0, PAGE_W, 28, COLORS.headerBg);
      page.drawText("Generated by TaxFiling24", { x: MARGIN_L, y: 10, size: 7, font: fontRegular, color: rgb(0.5, 0.55, 0.7) });
      const urlText = "www.taxfiling24.com";
      const uTw = fontRegular.widthOfTextAtSize(urlText, 7);
      page.drawText(urlText, { x: PAGE_W - MARGIN_R - uTw, y: 10, size: 7, font: fontRegular, color: rgb(0.5, 0.55, 0.7) });

      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - 40;
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // HEADER BANNER
  // ═══════════════════════════════════════════════════════════════════
  const headerH = 88;
  drawRect(page, 0, PAGE_H - headerH, PAGE_W, headerH, COLORS.headerBg);
  // Subtle accent stripe at bottom of header
  drawRect(page, 0, PAGE_H - headerH, PAGE_W, 3, COLORS.accent);

  // Brand name
  page.drawText("TaxFiling24", { x: MARGIN_L, y: PAGE_H - 36, size: 18, font: fontBold, color: COLORS.white });
  page.drawText("Income Tax Computation Report", { x: MARGIN_L, y: PAGE_H - 54, size: 10, font: fontRegular, color: rgb(0.65, 0.7, 0.85) });

  // Right side: FY + AY + Date
  const fyText = `FY ${data.financialYear}`;
  const ayText = `AY ${data.assessmentYear}`;
  const dateText = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  let tw = fontBold.widthOfTextAtSize(fyText, 12);
  page.drawText(fyText, { x: PAGE_W - MARGIN_R - tw, y: PAGE_H - 34, size: 12, font: fontBold, color: COLORS.white });
  tw = fontRegular.widthOfTextAtSize(ayText, 8);
  page.drawText(ayText, { x: PAGE_W - MARGIN_R - tw, y: PAGE_H - 48, size: 8, font: fontRegular, color: rgb(0.55, 0.6, 0.75) });
  tw = fontRegular.widthOfTextAtSize(dateText, 7);
  page.drawText(dateText, { x: PAGE_W - MARGIN_R - tw, y: PAGE_H - 62, size: 7, font: fontRegular, color: rgb(0.45, 0.5, 0.65) });

  y = PAGE_H - headerH - 18;

  // ═══════════════════════════════════════════════════════════════════
  // ASSESSMENT DETAILS STRIP
  // ═══════════════════════════════════════════════════════════════════
  drawRect(page, MARGIN_L, y - 12, CONTENT_W, 28, COLORS.bgLight);
  drawLine(page, y - 12, COLORS.border, 0.5);

  const detailItems = [
    { label: "Category:", value: ageLabel(data.ageGroup) },
    { label: "Status:", value: "Individual / HUF" },
    { label: "Regime:", value: `${data.results.better} (Recommended)` },
  ];

  let detailX = MARGIN_L + 10;
  detailItems.forEach((item) => {
    page.drawText(item.label, { x: detailX, y: y - 3, size: 6.5, font: fontRegular, color: COLORS.muted });
    detailX += fontRegular.widthOfTextAtSize(item.label, 6.5) + 3;
    page.drawText(item.value, { x: detailX, y: y - 3, size: 7, font: fontBold, color: COLORS.text });
    detailX += fontBold.widthOfTextAtSize(item.value, 7) + 24;
  });

  y -= 42;

  // ═══════════════════════════════════════════════════════════════════
  // SECTION 1: GROSS TOTAL INCOME
  // ═══════════════════════════════════════════════════════════════════
  addPageIfNeeded(120);
  y = drawSectionHeader(page, "Gross Total Income", y, fontBold);

  const incomeItems: [string, number][] = [
    ["Salary / Pension Income", data.salary],
    ["Net Rental Income (after 30% std deduction)", data.rentalIncome * 0.7],
    ["Interest / Other Income", data.otherIncome],
    ["Professional / Business Income (Net)", Math.max(0, data.professionalIncome - data.businessExpenses)],
  ];

  incomeItems.forEach(([label, val], i) => {
    addPageIfNeeded(20);
    y = drawKVRow(page, label, formatINR(val), y, fontRegular, fontBold, i % 2 === 1);
  });

  // GTI total bar
  addPageIfNeeded(30);
  drawRect(page, MARGIN_L, y - 4, CONTENT_W, 22, COLORS.bgAccent);
  page.drawText("Gross Total Income", { x: MARGIN_L + 8, y: y + 3, size: 9, font: fontBold, color: COLORS.primary });
  const gtiStr = formatINR(data.results.grossTotalIncome);
  tw = fontBold.widthOfTextAtSize(gtiStr, 10);
  page.drawText(gtiStr, { x: PAGE_W - MARGIN_R - 8 - tw, y: y + 2, size: 10, font: fontBold, color: COLORS.primary });
  y -= 32;

  // ═══════════════════════════════════════════════════════════════════
  // SECTION 2: DEDUCTIONS (Old Regime)
  // ═══════════════════════════════════════════════════════════════════
  addPageIfNeeded(120);
  y = drawSectionHeader(page, "Deductions Under Old Regime", y, fontBold);

  const deductionItems: [string, number][] = [
    ["Standard Deduction (u/s 16)", 50000],
    ["Section 80C (PPF, ELSS, EPF, LIC)", Math.min(data.deduction80C, 150000)],
    ["Section 80D — Self Health Insurance", Math.min(data.deduction80D, 25000)],
    ["Section 80D — Parents Health Insurance", Math.min(data.deduction80D_Parents, 50000)],
    ["Section 80CCD(1B) — NPS", Math.min(data.deductionNPS, 50000)],
    ["Section 24(b) — Home Loan Interest", Math.min(data.homeLoanInterest, 200000)],
    ["HRA Exemption (u/s 10)", data.hra],
    ["Other Deductions (80G, 80E, 80TTA, etc.)", data.otherDeductions],
  ];

  deductionItems.forEach(([label, val], i) => {
    if (val > 0) {
      addPageIfNeeded(20);
      y = drawKVRow(page, label, formatINR(val), y, fontRegular, fontBold, i % 2 === 1);
    }
  });

  // Total deductions bar
  addPageIfNeeded(30);
  drawRect(page, MARGIN_L, y - 4, CONTENT_W, 22, COLORS.bgAccent);
  page.drawText("Total Deductions", { x: MARGIN_L + 8, y: y + 3, size: 9, font: fontBold, color: COLORS.primary });
  const tdStr = formatINR(data.results.totalDeductions);
  tw = fontBold.widthOfTextAtSize(tdStr, 10);
  page.drawText(tdStr, { x: PAGE_W - MARGIN_R - 8 - tw, y: y + 2, size: 10, font: fontBold, color: COLORS.primary });
  y -= 32;

  // ═══════════════════════════════════════════════════════════════════
  // SECTION 3: REGIME COMPARISON TABLE
  // ═══════════════════════════════════════════════════════════════════
  addPageIfNeeded(160);
  y = drawSectionHeader(page, "Tax Computation — Regime Comparison", y, fontBold);

  // Table header
  y = drawTableRow(page, "Particulars", "Old Regime", "New Regime", y, fontRegular, fontBold, true);

  // Table rows
  const compRows: [string, string, string, boolean][] = [
    ["Gross Total Income", formatINR(data.results.grossTotalIncome), formatINR(data.results.grossTotalIncome), false],
    ["Less: Total Deductions", `(${formatINR(data.results.totalDeductions)})`, `(${formatINR(75000)} Std Ded)`, true],
    ["Net Taxable Income", formatINR(data.results.taxableOld), formatINR(data.results.taxableNew), false],
  ];

  compRows.forEach(([label, v1, v2, striped], _i) => {
    addPageIfNeeded(20);
    y = drawTableRow(page, label, v1, v2, y, fontRegular, fontBold, false, false, striped);
  });

  // Separator
  drawLine(page, y + 16, COLORS.border, 0.3);

  // Slab-wise breakdown header
  y -= 4;
  page.drawText("Slab-wise Tax Computation", { x: MARGIN_L + 8, y: y + 2, size: 7, font: fontItalic, color: COLORS.muted });
  y -= 14;

  // Old regime slabs
  const maxSlabs = Math.max(data.results.breakdownOld.length, data.results.breakdownNew.length);
  for (let i = 0; i < maxSlabs; i++) {
    addPageIfNeeded(20);
    const oldSlab = data.results.breakdownOld[i];
    const newSlab = data.results.breakdownNew[i];
    y = drawTableRow(
      page,
      oldSlab?.slab || newSlab?.slab || "",
      oldSlab ? formatINR(oldSlab.tax) : "—",
      newSlab ? formatINR(newSlab.tax) : "—",
      y, fontRegular, fontBold, false, false, i % 2 === 1
    );
  }

  // Subtotals
  addPageIfNeeded(50);
  y -= 2;
  y = drawTableRow(page, "Tax Before Cess", formatINR(data.results.oldTax / 1.04), formatINR(data.results.newTax / 1.04), y, fontRegular, fontBold, false, false, false);
  y = drawTableRow(page, "Health & Education Cess (4%)", formatINR(data.results.oldTax - data.results.oldTax / 1.04), formatINR(data.results.newTax - data.results.newTax / 1.04), y, fontRegular, fontBold, false, false, true);

  if (data.results.surchargeOld > 0 || data.results.surchargeNew > 0) {
    addPageIfNeeded(20);
    y = drawTableRow(page, "Surcharge", formatINR(data.results.surchargeOld), formatINR(data.results.surchargeNew), y, fontRegular, fontBold, false, false, false);
  }

  if (data.results.capitalGainsTax > 0) {
    addPageIfNeeded(20);
    y = drawTableRow(page, "Capital Gains Tax (incl. in above)", formatINR(data.results.capitalGainsTax), formatINR(data.results.capitalGainsTax), y, fontRegular, fontBold, false, false, true);
  }

  // Total row
  addPageIfNeeded(30);
  y -= 2;
  y = drawTableRow(page, "Total Tax Liability (incl. Cess)", formatINR(data.results.oldTax), formatINR(data.results.newTax), y, fontRegular, fontBold, false, true);

  // Savings highlight box
  addPageIfNeeded(50);
  y -= 8;
  const savingsH = 34;
  drawRect(page, MARGIN_L, y - savingsH + 16, CONTENT_W, savingsH, COLORS.primary);
  const recText = `${data.results.better} saves you ${formatINR(data.results.savings)}`;
  const recW = fontBold.widthOfTextAtSize(recText, 11);
  page.drawText(recText, { x: (PAGE_W - recW) / 2, y: y - 4, size: 11, font: fontBold, color: COLORS.white });
  const subRecText = "Recommended regime based on your income and deduction profile";
  const subRecW = fontRegular.widthOfTextAtSize(subRecText, 7);
  page.drawText(subRecText, { x: (PAGE_W - subRecW) / 2, y: y - 16, size: 7, font: fontRegular, color: rgb(0.78, 0.82, 0.95) });
  y -= savingsH + 14;

  // ═══════════════════════════════════════════════════════════════════
  // SECTION 4: COMPLIANCE & INTEREST (if applicable)
  // ═══════════════════════════════════════════════════════════════════
  if (data.results.interest234A > 0 || data.results.interest234B > 0) {
    addPageIfNeeded(110);
    y = drawSectionHeader(page, "Interest on Delayed Payment (Sec 234)", y, fontBold);

    if (data.results.interest234A > 0) {
      addPageIfNeeded(20);
      y = drawKVRow(page, "Interest u/s 234A — Return Filing Delay", formatINR(data.results.interest234A), y, fontRegular, fontBold);
    }
    if (data.results.interest234B > 0) {
      addPageIfNeeded(20);
      y = drawKVRow(page, "Interest u/s 234B — Advance Tax Shortfall", formatINR(data.results.interest234B), y, fontRegular, fontBold, true);
    }

    // Total payable
    addPageIfNeeded(30);
    drawRect(page, MARGIN_L, y - 4, CONTENT_W, 22, COLORS.bgAccent);
    page.drawText("Total Tax + Interest Payable", { x: MARGIN_L + 8, y: y + 3, size: 9, font: fontBold, color: COLORS.danger });
    const tpStr = formatINR(data.results.totalPayable);
    tw = fontBold.widthOfTextAtSize(tpStr, 10);
    page.drawText(tpStr, { x: PAGE_W - MARGIN_R - 8 - tw, y: y + 2, size: 10, font: fontBold, color: COLORS.danger });
    y -= 32;
  }

  // ═══════════════════════════════════════════════════════════════════
  // SECTION 5: ADVANCE TAX SCHEDULE
  // ═══════════════════════════════════════════════════════════════════
  addPageIfNeeded(130);
  y = drawSectionHeader(page, "Advance Tax Installment Schedule", y, fontBold);

  const advTax = data.results.advanceTax;
  const installments: [string, string, number][] = [
    ["15th June", "15% of Total Tax", advTax.june],
    ["15th September", "45% of Total Tax (Cumulative)", advTax.sept],
    ["15th December", "75% of Total Tax (Cumulative)", advTax.dec],
    ["15th March", "100% of Total Tax (Cumulative)", advTax.march],
  ];

  // Header
  drawRect(page, MARGIN_L, y - 4, CONTENT_W, 20, COLORS.headerBg);
  page.drawText("Due Date", { x: MARGIN_L + 8, y: y + 2, size: 7, font: fontBold, color: COLORS.white });
  page.drawText("Description", { x: MARGIN_L + 130, y: y + 2, size: 7, font: fontBold, color: COLORS.white });
  const amtLabel = "Amount";
  tw = fontBold.widthOfTextAtSize(amtLabel, 7);
  page.drawText(amtLabel, { x: PAGE_W - MARGIN_R - 8 - tw, y: y + 2, size: 7, font: fontBold, color: COLORS.white });
  y -= 22;

  installments.forEach(([date, desc, amt], i) => {
    addPageIfNeeded(20);
    if (i % 2 === 1) drawRect(page, MARGIN_L, y - 4, CONTENT_W, 18, COLORS.stripeBg);
    page.drawText(date, { x: MARGIN_L + 8, y: y + 2, size: 8, font: fontBold, color: COLORS.text });
    page.drawText(desc, { x: MARGIN_L + 130, y: y + 2, size: 7.5, font: fontRegular, color: COLORS.muted });
    const amtStr = formatINR(amt);
    tw = fontBold.widthOfTextAtSize(amtStr, 8);
    page.drawText(amtStr, { x: PAGE_W - MARGIN_R - 8 - tw, y: y + 2, size: 8, font: fontBold, color: COLORS.text });
    y -= 18;
  });

  y -= 12;

  // ═══════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════
  addPageIfNeeded(80);
  drawLine(page, y, COLORS.border, 0.5);
  y -= 14;
  page.drawText("Disclaimer:", { x: MARGIN_L, y, size: 6.5, font: fontBold, color: COLORS.muted });
  y -= 11;
  page.drawText(
    "This is a computer-generated estimate for informational purposes only. Actual tax liability may differ based on your complete",
    { x: MARGIN_L, y, size: 6, font: fontItalic, color: COLORS.light }
  );
  y -= 9;
  page.drawText(
    "financial details and applicable tax laws. Please consult a qualified Chartered Accountant for professional tax advice.",
    { x: MARGIN_L, y, size: 6, font: fontItalic, color: COLORS.light }
  );
  y -= 18;

  // Draw footer bar on active page
  drawRect(page, 0, 0, PAGE_W, 28, COLORS.headerBg);
  page.drawText("Generated by TaxFiling24", { x: MARGIN_L, y: 10, size: 7, font: fontRegular, color: rgb(0.5, 0.55, 0.7) });
  const urlText = "www.taxfiling24.com";
  tw = fontRegular.widthOfTextAtSize(urlText, 7);
  page.drawText(urlText, { x: PAGE_W - MARGIN_R - tw, y: 10, size: 7, font: fontRegular, color: rgb(0.5, 0.55, 0.7) });

  // Add page numbers across all pages
  const pages = doc.getPages();
  const totalPages = pages.length;
  pages.forEach((p, idx) => {
    const pgText = `Page ${idx + 1} of ${totalPages}`;
    const pgW = fontRegular.widthOfTextAtSize(pgText, 6.5);
    p.drawText(pgText, { x: (PAGE_W - pgW) / 2, y: 10, size: 6.5, font: fontRegular, color: rgb(0.4, 0.45, 0.6) });
  });

  return await doc.save();
}
