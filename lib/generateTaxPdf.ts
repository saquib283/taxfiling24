import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";
import type { IncomeTaxInput, IncomeTaxResult } from "./calculators/income-tax-engine";

// ── TaxFiling24 Deep Navy & Heritage Gold Print Palette ────────────
const C = {
  primary: rgb(0.039, 0.145, 0.251),      // #0A2540 Deep Navy
  primaryLight: rgb(0.11, 0.25, 0.40),
  gold: rgb(0.71, 0.54, 0.12),            // Accessible Heritage Gold Ink
  goldBar: rgb(0.831, 0.686, 0.216),      // #D4AF37 Heritage Gold
  textDark: rgb(0.06, 0.09, 0.16),        // #0F172A Slate 900
  textBody: rgb(0.28, 0.33, 0.41),        // #475569 Slate 600
  textMuted: rgb(0.39, 0.45, 0.55),       // #64748B Slate 500
  textLight: rgb(0.55, 0.60, 0.68),
  white: rgb(1, 1, 1),
  bgLight: rgb(0.973, 0.98, 0.988),       // #F8FAFC
  bgCard: rgb(0.945, 0.961, 0.976),       // #F1F5F9
  border: rgb(0.886, 0.91, 0.941),        // #E2E8F0
  borderStrong: rgb(0.72, 0.78, 0.85),
  success: rgb(0.02, 0.47, 0.34),         // Emerald 700
  successBg: rgb(0.925, 0.992, 0.961),    // Emerald 50
  successBorder: rgb(0.65, 0.88, 0.78),
  danger: rgb(0.75, 0.12, 0.22),
  dangerBg: rgb(0.996, 0.945, 0.95),
  stripeBg: rgb(0.984, 0.988, 0.994),
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_L = 44;
const MARGIN_R = 44;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

export interface TaxReportPayload {
  input: IncomeTaxInput;
  result: IncomeTaxResult;
}

function clean(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return "";
  return String(str)
    .replace(/₹/g, "Rs. ")
    .replace(/[—–]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, "|")
    .replace(/[^\x20-\x7E]/g, " ")
    .trim();
}

function formatINR(val: number): string {
  const sign = val < 0 ? "-" : "";
  const formatted = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
    Math.round(Math.abs(val))
  );
  return `${sign}Rs. ${formatted}`;
}

function ageLabel(group: string): string {
  if (group === "senior") return "Senior Citizen (60-80 Yrs)";
  if (group === "super-senior") return "Super Senior (80+ Yrs)";
  return "Individual (< 60 Yrs)";
}

function drawLine(page: PDFPage, y: number, color = C.border, thickness = 0.5) {
  page.drawLine({ start: { x: MARGIN_L, y }, end: { x: PAGE_W - MARGIN_R, y }, thickness, color });
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
  page.drawRectangle({ x, y, width: w, height: h, color: bg, borderColor: border, borderWidth: 0.75 });
}

function drawSectionHeader(page: PDFPage, title: string, y: number, fontBold: PDFFont): number {
  drawRect(page, MARGIN_L, y - 2, 3, 13, C.goldBar);
  page.drawText(clean(title.toUpperCase()), {
    x: MARGIN_L + 10,
    y,
    size: 8.5,
    font: fontBold,
    color: C.primary,
  });
  return y - 20;
}

function drawThreeColRow(
  page: PDFPage,
  label: string,
  val1: string,
  val2: string,
  y: number,
  font: PDFFont,
  fontBold: PDFFont,
  opts?: { isHeader?: boolean; isTotal?: boolean; isStriped?: boolean }
): number {
  const rowH = opts?.isHeader ? 20 : 18;
  const colLabel = MARGIN_L + 8;
  const colMid = MARGIN_L + CONTENT_W * 0.64;
  const colRight = PAGE_W - MARGIN_R - 8;

  if (opts?.isHeader) {
    drawBorderedBox(page, MARGIN_L, y - 4, CONTENT_W, rowH, C.primary, C.primary);
    page.drawText(clean(label), { x: colLabel, y: y + 2, size: 7.5, font: fontBold, color: C.white });
    const tw1 = fontBold.widthOfTextAtSize(clean(val1), 7.5);
    page.drawText(clean(val1), { x: colMid - tw1, y: y + 2, size: 7.5, font: fontBold, color: C.white });
    const tw2 = fontBold.widthOfTextAtSize(clean(val2), 7.5);
    page.drawText(clean(val2), { x: colRight - tw2, y: y + 2, size: 7.5, font: fontBold, color: C.white });
    return y - rowH - 1;
  }

  if (opts?.isStriped) drawRect(page, MARGIN_L, y - 4, CONTENT_W, rowH, C.stripeBg);
  if (opts?.isTotal) drawBorderedBox(page, MARGIN_L, y - 4, CONTENT_W, rowH, C.bgCard, C.borderStrong);

  const usedFont = opts?.isTotal ? fontBold : font;
  const usedColor = opts?.isTotal ? C.primary : C.textDark;
  const fontSize = opts?.isTotal ? 8.3 : 7.8;

  page.drawText(clean(label), { x: colLabel, y: y + 2, size: fontSize, font: usedFont, color: usedColor });
  const cVal1 = clean(val1);
  page.drawText(cVal1, {
    x: colMid - usedFont.widthOfTextAtSize(cVal1, fontSize),
    y: y + 2,
    size: fontSize,
    font: usedFont,
    color: usedColor,
  });
  const cVal2 = clean(val2);
  page.drawText(cVal2, {
    x: colRight - usedFont.widthOfTextAtSize(cVal2, fontSize),
    y: y + 2,
    size: fontSize,
    font: usedFont,
    color: usedColor,
  });

  return y - rowH;
}

function drawKVRow(
  page: PDFPage,
  label: string,
  value: string,
  y: number,
  font: PDFFont,
  fontBold: PDFFont,
  isStriped = false,
  valColor = C.textDark
): number {
  if (isStriped) drawRect(page, MARGIN_L, y - 4, CONTENT_W, 17, C.stripeBg);
  page.drawText(clean(label), { x: MARGIN_L + 8, y: y + 2, size: 7.8, font, color: C.textDark });
  const cleanedVal = clean(value);
  const tw = fontBold.widthOfTextAtSize(cleanedVal, 7.8);
  page.drawText(cleanedVal, { x: PAGE_W - MARGIN_R - 8 - tw, y: y + 2, size: 7.8, font: fontBold, color: valColor });
  return y - 17;
}

export async function generateTaxReportPdf(payload: TaxReportPayload): Promise<Uint8Array> {
  const { input, result } = payload;
  const { config, oldRegime, newRegime } = result;

  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H;

  const drawPageFooter = (p: PDFPage, pageNum: number, total: number) => {
    drawLine(p, 36, C.border, 0.5);
    p.drawText("TaxFiling24 - Chartered Tax & Compliance Practice", {
      x: MARGIN_L,
      y: 22,
      size: 7,
      font: fontBold,
      color: C.primary,
    });
    p.drawText(
      clean(`Computed per ${config.actName} (${config.periodLabel}). Advisory estimate; consult a CA before filing.`),
      { x: MARGIN_L, y: 12, size: 6, font: fontItalic, color: C.textMuted }
    );
    const pgText = `Page ${pageNum} of ${total}`;
    p.drawText(pgText, {
      x: PAGE_W - MARGIN_R - fontRegular.widthOfTextAtSize(pgText, 7),
      y: 22,
      size: 7,
      font: fontRegular,
      color: C.textMuted,
    });
    const urlText = "www.taxfiling24.com";
    p.drawText(urlText, {
      x: PAGE_W - MARGIN_R - fontBold.widthOfTextAtSize(urlText, 6.5),
      y: 12,
      size: 6.5,
      font: fontBold,
      color: C.gold,
    });
  };

  const addPageIfNeeded = (needed: number) => {
    if (y - needed < 66) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      drawRect(page, 0, PAGE_H - 4, PAGE_W, 4, C.primary);
      y = PAGE_H - 40;
    }
  };

  // Top Dual Brand Bar (Navy + Gold)
  drawRect(page, 0, PAGE_H - 5, PAGE_W, 5, C.primary);
  drawRect(page, 0, PAGE_H - 7, PAGE_W, 2, C.goldBar);

  // Header
  y = PAGE_H - 36;
  page.drawText("TaxFiling24", { x: MARGIN_L, y, size: 18, font: fontBold, color: C.primary });
  page.drawText("INCOME TAX COMPUTATION & STATUTORY REGIME REPORT", {
    x: MARGIN_L,
    y: y - 14,
    size: 7.5,
    font: fontBold,
    color: C.gold,
  });

  const periodStr = clean(config.periodLabel);
  const actStr = clean(config.actName);
  const dateStr = `Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;

  page.drawText(periodStr, {
    x: PAGE_W - MARGIN_R - fontBold.widthOfTextAtSize(periodStr, 9.5),
    y,
    size: 9.5,
    font: fontBold,
    color: C.primary,
  });
  page.drawText(actStr, {
    x: PAGE_W - MARGIN_R - fontRegular.widthOfTextAtSize(actStr, 7.5),
    y: y - 12,
    size: 7.5,
    font: fontRegular,
    color: C.textBody,
  });
  page.drawText(dateStr, {
    x: PAGE_W - MARGIN_R - fontRegular.widthOfTextAtSize(dateStr, 7),
    y: y - 22,
    size: 7,
    font: fontRegular,
    color: C.textMuted,
  });

  y -= 34;
  drawLine(page, y, C.border, 0.75);
  y -= 14;

  // Assessee Details Strip
  drawBorderedBox(page, MARGIN_L, y - 16, CONTENT_W, 24, C.bgLight, C.border);
  const metaLine = clean(
    `Category: ${ageLabel(input.ageGroup)}   |   Residency: ${input.residency === "nri" ? "Non-Resident (NRI)" : "Resident Individual"}   |   Optimal: ${result.betterRegime} (Saves ${formatINR(result.savings)})`
  );
  page.drawText(metaLine, { x: MARGIN_L + 10, y: y - 7, size: 7.2, font: fontBold, color: C.primary });
  y -= 32;

  // Section 1: Gross Total Income
  addPageIfNeeded(115);
  y = drawSectionHeader(page, "1. Gross Total Income Summary", y, fontBold);

  const incomeRows: [string, number][] = [
    ["Gross Salary / Pension Income", input.salary],
    ["Net Rental Income (after 30% Sec 24(a) Std Deduction)", Math.round(input.rentalIncome * 0.7)],
    ["Interest & Other Sources Income", input.otherIncome],
    [`Business / Profession Net Income (${input.businessMode.toUpperCase()})`, result.netBusinessIncome],
    ...(input.stcgOther > 0 ? [["STCG - Non-Equity Assets (Slab Rate)", input.stcgOther] as [string, number]] : []),
    ...(input.stcgEquity > 0 ? [[`STCG - Listed Equity (${config.sections.stcgEquity} @ 20%)`, input.stcgEquity] as [string, number]] : []),
    ...(input.ltcgEquity > 0 ? [[`LTCG - Listed Equity (${config.sections.ltcgEquity} @ 12.5%)`, input.ltcgEquity] as [string, number]] : []),
    ...(input.ltcgOther > 0 ? [[`LTCG - Other Assets (${config.sections.ltcgOther})`, input.ltcgOther] as [string, number]] : []),
  ];

  incomeRows.forEach(([label, val], i) => {
    addPageIfNeeded(19);
    y = drawKVRow(page, label, formatINR(val), y, fontRegular, fontBold, i % 2 === 1);
  });

  addPageIfNeeded(24);
  drawBorderedBox(page, MARGIN_L, y - 4, CONTENT_W, 20, C.bgCard, C.borderStrong);
  page.drawText("Gross Total Income (GTI)", { x: MARGIN_L + 8, y: y + 2, size: 8.2, font: fontBold, color: C.primary });
  const gtiStr = formatINR(result.grossTotalIncome);
  page.drawText(gtiStr, {
    x: PAGE_W - MARGIN_R - 8 - fontBold.widthOfTextAtSize(gtiStr, 8.4),
    y: y + 2,
    size: 8.4,
    font: fontBold,
    color: C.primary,
  });
  y -= 28;

  // Section 2: Side-by-Side Regime Comparison
  addPageIfNeeded(180);
  y = drawSectionHeader(page, "2. Side-by-Side Regime Tax Comparison", y, fontBold);
  y = drawThreeColRow(page, "Particulars", "Old Regime", `New Regime (${config.sections.newRegime})`, y, fontRegular, fontBold, { isHeader: true });

  const compRows: [string, string, string][] = [
    ["Gross Total Income", formatINR(oldRegime.grossIncome), formatINR(newRegime.grossIncome)],
    ["Less: Total Eligible Deductions", `(${formatINR(oldRegime.totalDeductions)})`, `(${formatINR(newRegime.totalDeductions)})`],
    ["Net Taxable Income (Rounded u/s 288A)", formatINR(oldRegime.totalTaxableIncome), formatINR(newRegime.totalTaxableIncome)],
    ["Normal Slab Tax (Before Rebate)", formatINR(oldRegime.slabTaxBeforeRebate), formatINR(newRegime.slabTaxBeforeRebate)],
    [`Less: Rebate & Marginal Relief (${config.sections.rebate})`, `(${formatINR(oldRegime.rebate87A + oldRegime.rebateMarginalRelief)})`, `(${formatINR(newRegime.rebate87A + newRegime.rebateMarginalRelief)})`],
    ...(oldRegime.totalSpecialCgTax > 0 || newRegime.totalSpecialCgTax > 0
      ? [["Special-Rate Capital Gains Tax", formatINR(oldRegime.totalSpecialCgTax), formatINR(newRegime.totalSpecialCgTax)] as [string, string, string]]
      : []),
    ...(oldRegime.surcharge > 0 || newRegime.surcharge > 0
      ? [["Surcharge (after Marginal Relief & 15% CG Cap)", formatINR(oldRegime.surcharge), formatINR(newRegime.surcharge)] as [string, string, string]]
      : []),
    ["Health & Education Cess (4%)", formatINR(oldRegime.cess), formatINR(newRegime.cess)],
    ["Effective Tax Rate (%)", `${oldRegime.effectiveTaxRatePct.toFixed(1)}%`, `${newRegime.effectiveTaxRatePct.toFixed(1)}%`],
  ];

  compRows.forEach(([lbl, v1, v2], idx) => {
    addPageIfNeeded(20);
    y = drawThreeColRow(page, lbl, v1, v2, y, fontRegular, fontBold, { isStriped: idx % 2 === 1 });
  });

  addPageIfNeeded(24);
  y = drawThreeColRow(page, "Total Tax Liability (Rounded u/s 288B)", formatINR(oldRegime.totalTax), formatINR(newRegime.totalTax), y, fontRegular, fontBold, { isTotal: true });
  y -= 8;

  // Optimal Recommendation Banner
  addPageIfNeeded(44);
  drawBorderedBox(page, MARGIN_L, y - 22, CONTENT_W, 30, C.successBg, C.successBorder);
  const recHeadline = clean(
    result.savings > 0
      ? `${result.betterRegime} is Optimal - Saves ${formatINR(result.savings)} annually`
      : `Both Regimes Result in Equal Tax Liability (${formatINR(result.activeTax)})`
  );
  page.drawText(recHeadline, {
    x: (PAGE_W - fontBold.widthOfTextAtSize(recHeadline, 9.5)) / 2,
    y: y - 10,
    size: 9.5,
    font: fontBold,
    color: C.success,
  });
  y -= 38;

  // Section 3: Separate Slab Breakdowns (Zero Label Corruption!)
  addPageIfNeeded(120);
  y = drawSectionHeader(page, "3. New Regime Slab Breakdown", y, fontBold);
  newRegime.breakdown.forEach((row, i) => {
    addPageIfNeeded(18);
    y = drawKVRow(page, row.slab, formatINR(row.tax), y, fontRegular, fontBold, i % 2 === 1);
  });
  y -= 10;

  addPageIfNeeded(110);
  y = drawSectionHeader(page, "4. Old Regime Slab Breakdown", y, fontBold);
  oldRegime.breakdown.forEach((row, i) => {
    addPageIfNeeded(18);
    y = drawKVRow(page, row.slab, formatINR(row.tax), y, fontRegular, fontBold, i % 2 === 1);
  });
  y -= 10;

  // Section 5: Deductions Applied (Old Regime)
  const activeOldDeds = result.deductionBreakdownOld.filter((d) => d.allowed > 0);
  if (activeOldDeds.length > 0) {
    addPageIfNeeded(90);
    y = drawSectionHeader(page, "5. Claimed Deductions (Old Regime)", y, fontBold);
    activeOldDeds.forEach((d, i) => {
      addPageIfNeeded(18);
      y = drawKVRow(page, `${d.label} (${d.section})`, formatINR(d.allowed), y, fontRegular, fontBold, i % 2 === 1);
    });
    y -= 10;
  }

  // Section 6: Prepaid Tax, Interest & Final Balance / Refund
  addPageIfNeeded(110);
  y = drawSectionHeader(page, `6. Net Tax Payable / Refund (${result.betterRegime})`, y, fontBold);
  y = drawKVRow(page, `Assessed Tax Liability (${result.betterRegime})`, formatINR(result.activeTax), y, fontRegular, fontBold, false);
  if (result.interest234A > 0) {
    y = drawKVRow(page, `Late Return Interest (${config.sections.interest234A} @ 1%/mo)`, formatINR(result.interest234A), y, fontRegular, fontBold, true, C.danger);
  }
  if (result.interest234B > 0) {
    y = drawKVRow(page, `Advance Tax Shortfall Interest (${config.sections.interest234B} @ 1%/mo)`, formatINR(result.interest234B), y, fontRegular, fontBold, false, C.danger);
  }
  if (result.lateFee234F > 0) {
    y = drawKVRow(page, `Late Filing Fee (${config.sections.lateFee234F})`, formatINR(result.lateFee234F), y, fontRegular, fontBold, true, C.danger);
  }
  if (result.taxPaid > 0) {
    y = drawKVRow(page, "Less: TDS / Advance Tax Already Paid", `(${formatINR(result.taxPaid)})`, y, fontRegular, fontBold, false, C.success);
  }

  addPageIfNeeded(26);
  const isRefund = result.refundDue > 0;
  drawBorderedBox(page, MARGIN_L, y - 6, CONTENT_W, 22, isRefund ? C.successBg : C.bgCard, isRefund ? C.successBorder : C.borderStrong);
  const finalLabel = isRefund ? "Income Tax Refund Due" : "Final Self-Assessment Tax Payable";
  const finalVal = formatINR(isRefund ? result.refundDue : result.netPayable);
  page.drawText(finalLabel, { x: MARGIN_L + 8, y: y + 1, size: 8.5, font: fontBold, color: isRefund ? C.success : C.primary });
  page.drawText(finalVal, {
    x: PAGE_W - MARGIN_R - 8 - fontBold.widthOfTextAtSize(finalVal, 9),
    y: y + 1,
    size: 9,
    font: fontBold,
    color: isRefund ? C.success : C.primary,
  });
  y -= 30;

  // Section 7: Advance Tax Schedule
  addPageIfNeeded(100);
  y = drawSectionHeader(page, "7. Advance Tax Installment Schedule", y, fontBold);
  if (!result.advanceTax.applicable) {
    page.drawText(clean(result.advanceTax.exemptReason || "Advance Tax Not Applicable."), {
      x: MARGIN_L + 8,
      y,
      size: 7.8,
      font: fontItalic,
      color: C.textBody,
    });
  } else {
    result.advanceTax.installments.forEach((inst, i) => {
      addPageIfNeeded(18);
      y = drawKVRow(
        page,
        `${inst.dueDate} (${inst.percentageLabel})`,
        formatINR(inst.cumulativeAmount),
        y,
        fontRegular,
        fontBold,
        i % 2 === 1
      );
    });
  }

  const pages = doc.getPages();
  pages.forEach((p, idx) => drawPageFooter(p, idx + 1, pages.length));

  return await doc.save();
}
