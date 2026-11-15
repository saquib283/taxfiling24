import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";

// ── Corporate Clean Color Palette (No Dark Fills) ──────────────────
const C = {
  primary: rgb(0.12, 0.22, 0.36),        // Deep Slate Navy
  primaryLight: rgb(0.24, 0.38, 0.58),   // Soft Slate
  accent: rgb(0.16, 0.44, 0.82),         // CA Professional Blue
  textDark: rgb(0.12, 0.16, 0.24),       // Near-black text
  textBody: rgb(0.26, 0.32, 0.42),       // Readable body
  textMuted: rgb(0.48, 0.54, 0.64),      // Subtle text
  textLight: rgb(0.62, 0.68, 0.76),      // Light text
  white: rgb(1, 1, 1),
  bgLight: rgb(0.97, 0.98, 0.99),        // Light table header
  bgCard: rgb(0.985, 0.99, 1),           // Light card fill
  border: rgb(0.86, 0.89, 0.93),         // Subtle border
  borderStrong: rgb(0.72, 0.78, 0.86),   // Stronger separator
  success: rgb(0.08, 0.52, 0.32),        // Emerald
  successBg: rgb(0.94, 0.98, 0.95),      // Soft emerald tint
  successBorder: rgb(0.70, 0.88, 0.76),  // Emerald border
  danger: rgb(0.78, 0.17, 0.22),
  dangerBg: rgb(0.99, 0.94, 0.94),
  stripeBg: rgb(0.985, 0.988, 0.995),    // Table alternating row
  accentBar: rgb(0.16, 0.44, 0.82),
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_L = 44;
const MARGIN_R = 44;
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

// ── Text sanitizer: Replaces non-WinAnsi characters to prevent pdf-lib crash ──
function clean(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/₹/g, "Rs. ")
    .replace(/[—–]/g, "-")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[^\x20-\x7E]/g, " ")
    .trim();
}

function formatINR(val: number): string {
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(val));
  return `Rs. ${formatted}`;
}

function ageLabel(group: string): string {
  if (group === "senior") return "Senior Citizen (60-80)";
  if (group === "super-senior") return "Super Senior (80+)";
  return "Individual (Below 60)";
}

// ── Draw helpers ───────────────────────────────────────────────────
function drawLine(page: PDFPage, y: number, color = C.border, thickness = 0.5) {
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

function drawBorderedBox(
  page: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  bg: ReturnType<typeof rgb>,
  border: ReturnType<typeof rgb>
) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: bg,
    borderColor: border,
    borderWidth: 0.75,
  });
}

function drawSectionHeader(page: PDFPage, title: string, y: number, fontBold: PDFFont): number {
  drawRect(page, MARGIN_L, y - 2, 3, 13, C.accent);
  page.drawText(clean(title.toUpperCase()), {
    x: MARGIN_L + 10,
    y,
    size: 8.5,
    font: fontBold,
    color: C.primary,
  });
  return y - 22;
}

function drawTableRow(
  page: PDFPage,
  label: string,
  val1: string,
  val2: string,
  y: number,
  font: PDFFont,
  fontBold: PDFFont,
  isHeader = false,
  isTotal = false,
  isStriped = false
): number {
  const rowH = isHeader ? 20 : 18;
  const colLabel = MARGIN_L + 8;
  const colMid = MARGIN_L + CONTENT_W * 0.55;
  const colRight = PAGE_W - MARGIN_R - 8;

  if (isHeader) {
    drawBorderedBox(page, MARGIN_L, y - 4, CONTENT_W, rowH, C.bgLight, C.border);
    page.drawText(clean(label), { x: colLabel, y: y + 2, size: 7.2, font: fontBold, color: C.primary });
    const tw1 = fontBold.widthOfTextAtSize(clean(val1), 7.2);
    page.drawText(clean(val1), { x: colMid - tw1, y: y + 2, size: 7.2, font: fontBold, color: C.primary });
    const tw2 = fontBold.widthOfTextAtSize(clean(val2), 7.2);
    page.drawText(clean(val2), { x: colRight - tw2, y: y + 2, size: 7.2, font: fontBold, color: C.primary });
    return y - rowH - 2;
  }

  if (isStriped) {
    drawRect(page, MARGIN_L, y - 4, CONTENT_W, rowH, C.stripeBg);
  }

  if (isTotal) {
    drawBorderedBox(page, MARGIN_L, y - 4, CONTENT_W, rowH, C.bgCard, C.borderStrong);
  }

  const usedFont = isTotal ? fontBold : font;
  const usedColor = isTotal ? C.primary : C.textDark;
  const fontSize = isTotal ? 8.5 : 7.8;

  page.drawText(clean(label), { x: colLabel, y: y + 2, size: fontSize, font: usedFont, color: usedColor });
  const cVal1 = clean(val1);
  const tw1 = usedFont.widthOfTextAtSize(cVal1, fontSize);
  page.drawText(cVal1, { x: colMid - tw1, y: y + 2, size: fontSize, font: usedFont, color: usedColor });

  const cVal2 = clean(val2);
  const tw2 = usedFont.widthOfTextAtSize(cVal2, fontSize);
  page.drawText(cVal2, { x: colRight - tw2, y: y + 2, size: fontSize, font: usedFont, color: usedColor });

  return y - rowH;
}

function drawKVRow(
  page: PDFPage,
  label: string,
  value: string,
  y: number,
  font: PDFFont,
  fontBold: PDFFont,
  isStriped = false
): number {
  if (isStriped) drawRect(page, MARGIN_L, y - 4, CONTENT_W, 18, C.stripeBg);
  page.drawText(clean(label), { x: MARGIN_L + 8, y: y + 2, size: 8, font, color: C.textDark });
  const cleanedVal = clean(value);
  const tw = fontBold.widthOfTextAtSize(cleanedVal, 8);
  page.drawText(cleanedVal, { x: PAGE_W - MARGIN_R - 8 - tw, y: y + 2, size: 8, font: fontBold, color: C.textDark });
  return y - 18;
}

// ══════════════════════════════════════════════════════════════════════
// Main Clean Income Tax PDF Builder
// ══════════════════════════════════════════════════════════════════════
export async function generateTaxReportPdf(data: TaxReportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H;

  const drawPageFooter = (p: PDFPage, pageNum: number, total: number) => {
    drawLine(p, 36, C.border, 0.5);
    p.drawText("TaxFiling24 - Chartered Tax Practice", { x: MARGIN_L, y: 22, size: 7, font: fontBold, color: C.textMuted });
    const disclaimer = "Computer-generated tax estimation. Consult a CA before filing.";
    p.drawText(disclaimer, { x: MARGIN_L, y: 12, size: 6, font: fontItalic, color: C.textLight });

    const pgText = `Page ${pageNum} of ${total}`;
    const pgW = fontRegular.widthOfTextAtSize(pgText, 7);
    p.drawText(pgText, { x: PAGE_W - MARGIN_R - pgW, y: 22, size: 7, font: fontRegular, color: C.textMuted });
    const urlText = "www.taxfiling24.com";
    const uW = fontRegular.widthOfTextAtSize(urlText, 6.5);
    p.drawText(urlText, { x: PAGE_W - MARGIN_R - uW, y: 12, size: 6.5, font: fontRegular, color: C.accent });
  };

  const addPageIfNeeded = (needed: number) => {
    if (y - needed < 70) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - 44;
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // TOP ACCENT BRAND BAR
  // ─────────────────────────────────────────────────────────────────
  drawRect(page, 0, PAGE_H - 4, PAGE_W, 4, C.accentBar);

  // ─────────────────────────────────────────────────────────────────
  // HEADER (Pure Clean White Paper Letterhead)
  // ─────────────────────────────────────────────────────────────────
  y = PAGE_H - 38;
  page.drawText("TaxFiling24", { x: MARGIN_L, y, size: 18, font: fontBold, color: C.primary });
  const brandSub = "INCOME TAX COMPUTATION & REGIME ANALYSIS";
  page.drawText(brandSub, { x: MARGIN_L, y: y - 14, size: 8, font: fontBold, color: C.accent });

  // FY & AY on Right
  const fyText = `FY ${data.financialYear} | AY ${data.assessmentYear}`;
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const refCode = `REF-ITR-${Date.now().toString().slice(-6)}`;

  let tw = fontBold.widthOfTextAtSize(fyText, 9.5);
  page.drawText(fyText, { x: PAGE_W - MARGIN_R - tw, y, size: 9.5, font: fontBold, color: C.primary });

  const dateLine = `Generated: ${dateStr}`;
  tw = fontRegular.widthOfTextAtSize(dateLine, 7.5);
  page.drawText(dateLine, { x: PAGE_W - MARGIN_R - tw, y: y - 12, size: 7.5, font: fontRegular, color: C.textMuted });

  tw = fontRegular.widthOfTextAtSize(refCode, 7);
  page.drawText(refCode, { x: PAGE_W - MARGIN_R - tw, y: y - 22, size: 7, font: fontRegular, color: C.textLight });

  y -= 34;
  drawLine(page, y, C.border, 0.75);
  y -= 16;

  // ─────────────────────────────────────────────────────────────────
  // ASSESSMENT DETAILS STRIP (Light subtle container)
  // ─────────────────────────────────────────────────────────────────
  drawBorderedBox(page, MARGIN_L, y - 16, CONTENT_W, 26, C.bgLight, C.border);

  const detailItems = [
    { label: "Category:", value: ageLabel(data.ageGroup) },
    { label: "Status:", value: "Individual / HUF" },
    { label: "Recommended:", value: `${data.results.better} (Saves ${formatINR(data.results.savings)})` },
  ];

  let detailX = MARGIN_L + 10;
  detailItems.forEach((item) => {
    const lClean = clean(item.label);
    const vClean = clean(item.value);
    page.drawText(lClean, { x: detailX, y: y - 7, size: 7, font: fontRegular, color: C.textMuted });
    detailX += fontRegular.widthOfTextAtSize(lClean, 7) + 3;
    page.drawText(vClean, { x: detailX, y: y - 7, size: 7.2, font: fontBold, color: C.primary });
    detailX += fontBold.widthOfTextAtSize(vClean, 7.2) + 20;
  });

  y -= 34;

  // ─────────────────────────────────────────────────────────────────
  // SECTION 1: GROSS TOTAL INCOME
  // ─────────────────────────────────────────────────────────────────
  addPageIfNeeded(110);
  y = drawSectionHeader(page, "Gross Total Income Breakdown", y, fontBold);

  const incomeItems: [string, number][] = [
    ["Salary / Pension Income", data.salary],
    ["Net Rental Income (after 30% std deduction)", data.rentalIncome * 0.7],
    ["Interest & Other Income", data.otherIncome],
    ["Professional / Business Income (Net)", Math.max(0, data.professionalIncome - data.businessExpenses)],
  ];

  incomeItems.forEach(([label, val], i) => {
    addPageIfNeeded(20);
    y = drawKVRow(page, label, formatINR(val), y, fontRegular, fontBold, i % 2 === 1);
  });

  // GTI Total Bar
  addPageIfNeeded(24);
  drawBorderedBox(page, MARGIN_L, y - 4, CONTENT_W, 20, C.bgCard, C.border);
  page.drawText("Gross Total Income (GTI)", {
    x: MARGIN_L + 8,
    y: y + 2,
    size: 8,
    font: fontBold,
    color: C.primary,
  });
  const gtiStr = formatINR(data.results.grossTotalIncome);
  tw = fontBold.widthOfTextAtSize(gtiStr, 8.5);
  page.drawText(gtiStr, { x: PAGE_W - MARGIN_R - 8 - tw, y: y + 2, size: 8.5, font: fontBold, color: C.primary });
  y -= 28;

  // ─────────────────────────────────────────────────────────────────
  // SECTION 2: DEDUCTIONS (Old Regime Chapter VI-A)
  // ─────────────────────────────────────────────────────────────────
  addPageIfNeeded(110);
  y = drawSectionHeader(page, "Eligible Deductions (Old Regime)", y, fontBold);

  const deductionItems: [string, number][] = [
    ["Standard Deduction (u/s 16)", 50000],
    ["Section 80C (PPF, ELSS, EPF, LIC)", Math.min(data.deduction80C, 150000)],
    ["Section 80D - Self Health Insurance", Math.min(data.deduction80D, 25000)],
    ["Section 80D - Parents Health Insurance", Math.min(data.deduction80D_Parents, 50000)],
    ["Section 80CCD(1B) - NPS", Math.min(data.deductionNPS, 50000)],
    ["Section 24(b) - Home Loan Interest", Math.min(data.homeLoanInterest, 200000)],
    ["HRA Exemption (u/s 10)", data.hra],
    ["Other Chapter VI-A (80G, 80E, 80TTA, etc.)", data.otherDeductions],
  ];

  let hasDeductions = false;
  deductionItems.forEach(([label, val], i) => {
    if (val > 0) {
      hasDeductions = true;
      addPageIfNeeded(20);
      y = drawKVRow(page, label, formatINR(val), y, fontRegular, fontBold, i % 2 === 1);
    }
  });

  if (!hasDeductions) {
    y = drawKVRow(page, "No optional Chapter VI-A deductions claimed", formatINR(0), y, fontRegular, fontBold);
  }

  // Total Deductions Bar
  addPageIfNeeded(24);
  drawBorderedBox(page, MARGIN_L, y - 4, CONTENT_W, 20, C.bgCard, C.border);
  page.drawText("Total Deductions (Old Regime)", {
    x: MARGIN_L + 8,
    y: y + 2,
    size: 8,
    font: fontBold,
    color: C.primary,
  });
  const tdStr = formatINR(data.results.totalDeductions);
  tw = fontBold.widthOfTextAtSize(tdStr, 8.5);
  page.drawText(tdStr, { x: PAGE_W - MARGIN_R - 8 - tw, y: y + 2, size: 8.5, font: fontBold, color: C.primary });
  y -= 28;

  // ─────────────────────────────────────────────────────────────────
  // SECTION 3: REGIME COMPARISON TABLE
  // ─────────────────────────────────────────────────────────────────
  addPageIfNeeded(150);
  y = drawSectionHeader(page, "Tax Computation - Regime Comparison", y, fontBold);

  // Table header
  y = drawTableRow(page, "Particulars", "Old Regime", "New Regime", y, fontRegular, fontBold, true);

  // Base rows
  const stdDedNew = data.financialYear === "2024-25" ? 75000 : 75000;
  const compRows: [string, string, string, boolean][] = [
    ["Gross Total Income", formatINR(data.results.grossTotalIncome), formatINR(data.results.grossTotalIncome), false],
    ["Less: Total Deductions", `(${formatINR(data.results.totalDeductions)})`, `(${formatINR(stdDedNew)} Std Ded)`, true],
    ["Net Taxable Income", formatINR(data.results.taxableOld), formatINR(data.results.taxableNew), false],
  ];

  compRows.forEach(([label, v1, v2, striped]) => {
    addPageIfNeeded(20);
    y = drawTableRow(page, label, v1, v2, y, fontRegular, fontBold, false, false, striped);
  });

  // Slab Breakdown Subtitle
  y -= 4;
  page.drawText("Slab-wise Tax Computation:", { x: MARGIN_L + 8, y: y + 2, size: 7, font: fontItalic, color: C.textMuted });
  y -= 14;

  const maxSlabs = Math.max(data.results.breakdownOld?.length || 0, data.results.breakdownNew?.length || 0);
  for (let i = 0; i < maxSlabs; i++) {
    addPageIfNeeded(20);
    const oldSlab = data.results.breakdownOld?.[i];
    const newSlab = data.results.breakdownNew?.[i];
    y = drawTableRow(
      page,
      oldSlab?.slab || newSlab?.slab || "",
      oldSlab ? formatINR(oldSlab.tax) : "Rs. 0",
      newSlab ? formatINR(newSlab.tax) : "Rs. 0",
      y,
      fontRegular,
      fontBold,
      false,
      false,
      i % 2 === 1
    );
  }

  // Cess & Surcharge Rows
  addPageIfNeeded(40);
  y = drawTableRow(page, "Health & Education Cess (4%)", formatINR(data.results.oldTax - data.results.oldTax / 1.04), formatINR(data.results.newTax - data.results.newTax / 1.04), y, fontRegular, fontBold, false, false, false);

  if (data.results.surchargeOld > 0 || data.results.surchargeNew > 0) {
    addPageIfNeeded(20);
    y = drawTableRow(page, "Surcharge", formatINR(data.results.surchargeOld), formatINR(data.results.surchargeNew), y, fontRegular, fontBold, false, false, true);
  }

  if (data.results.capitalGainsTax > 0) {
    addPageIfNeeded(20);
    y = drawTableRow(page, "Capital Gains Tax (incl. in above)", formatINR(data.results.capitalGainsTax), formatINR(data.results.capitalGainsTax), y, fontRegular, fontBold, false, false, true);
  }

  // Total Tax Liability Row
  addPageIfNeeded(26);
  y -= 2;
  y = drawTableRow(page, "Total Tax Liability (incl. Cess)", formatINR(data.results.oldTax), formatINR(data.results.newTax), y, fontRegular, fontBold, false, true);

  // Recommendation & Savings Box (Clean Light Emerald Card)
  addPageIfNeeded(46);
  y -= 6;
  const savH = 34;
  drawBorderedBox(page, MARGIN_L, y - savH + 16, CONTENT_W, savH, C.successBg, C.successBorder);

  const recText = `${data.results.better} saves you ${formatINR(data.results.savings)}`;
  const recW = fontBold.widthOfTextAtSize(clean(recText), 10.5);
  page.drawText(clean(recText), { x: (PAGE_W - recW) / 2, y: y - 3, size: 10.5, font: fontBold, color: C.success });

  const subRecText = "Recommended optimal regime based on your declared deductions profile";
  const subRecW = fontRegular.widthOfTextAtSize(clean(subRecText), 7);
  page.drawText(clean(subRecText), { x: (PAGE_W - subRecW) / 2, y: y - 15, size: 7, font: fontRegular, color: C.textBody });
  y -= savH + 16;

  // ─────────────────────────────────────────────────────────────────
  // SECTION 4: ADVANCE TAX SCHEDULE
  // ─────────────────────────────────────────────────────────────────
  if (data.results.advanceTax) {
    addPageIfNeeded(110);
    y = drawSectionHeader(page, "Advance Tax Installment Schedule", y, fontBold);

    const advTax = data.results.advanceTax;
    const installments: [string, string, number][] = [
      ["15th June", "15% of Cumulative Tax Liability", advTax.june],
      ["15th September", "45% of Cumulative Tax Liability", advTax.sept],
      ["15th December", "75% of Cumulative Tax Liability", advTax.dec],
      ["15th March", "100% of Cumulative Tax Liability", advTax.march],
    ];

    drawBorderedBox(page, MARGIN_L, y - 4, CONTENT_W, 18, C.bgLight, C.border);
    page.drawText("Due Date", { x: MARGIN_L + 8, y: y + 2, size: 7, font: fontBold, color: C.primary });
    page.drawText("Description", { x: MARGIN_L + 120, y: y + 2, size: 7, font: fontBold, color: C.primary });
    const amtLbl = "Amount";
    tw = fontBold.widthOfTextAtSize(amtLbl, 7);
    page.drawText(amtLbl, { x: PAGE_W - MARGIN_R - 8 - tw, y: y + 2, size: 7, font: fontBold, color: C.primary });
    y -= 20;

    installments.forEach(([date, desc, amt], i) => {
      addPageIfNeeded(20);
      if (i % 2 === 1) drawRect(page, MARGIN_L, y - 4, CONTENT_W, 18, C.stripeBg);
      page.drawText(clean(date), { x: MARGIN_L + 8, y: y + 2, size: 7.8, font: fontBold, color: C.textDark });
      page.drawText(clean(desc), { x: MARGIN_L + 120, y: y + 2, size: 7.5, font: fontRegular, color: C.textMuted });
      const amtStr = formatINR(amt);
      tw = fontBold.widthOfTextAtSize(amtStr, 7.8);
      page.drawText(amtStr, { x: PAGE_W - MARGIN_R - 8 - tw, y: y + 2, size: 7.8, font: fontBold, color: C.textDark });
      y -= 18;
    });
  }

  // Stamp all pages with page footers
  const pages = doc.getPages();
  const totalPages = pages.length;
  pages.forEach((p, idx) => {
    drawPageFooter(p, idx + 1, totalPages);
  });

  return await doc.save();
}
