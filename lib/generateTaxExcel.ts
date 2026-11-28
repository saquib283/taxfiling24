import ExcelJS from "exceljs";
import type { IncomeTaxInput, IncomeTaxResult } from "./calculators/income-tax-engine";

export interface TaxExcelPayload {
  input: IncomeTaxInput;
  result: IncomeTaxResult;
}

// ── TaxFiling24 Deep Navy & Heritage Gold Excel Palette ────────────
const CLR = {
  navy: "0A2540",
  navyDark: "061829",
  navySoft: "EAF0F6",
  gold: "D4AF37",
  goldInk: "8A6D14",
  white: "FFFFFF",
  offWhite: "F8FAFC",
  lightGray: "F1F5F9",
  midGray: "CBD5E1",
  textDark: "0F172A",
  textMuted: "475569",
  green: "047857",
  greenBg: "ECFDF5",
  red: "BE123C",
  redBg: "FFF1F2",
};

function ageLabel(group: string): string {
  if (group === "senior") return "Senior Citizen (60–80 Yrs)";
  if (group === "super-senior") return "Super Senior Citizen (80+ Yrs)";
  return "Individual (< 60 Yrs)";
}

const FONT_BRAND: Partial<ExcelJS.Font> = { name: "Calibri", size: 16, bold: true, color: { argb: CLR.white } };
const FONT_SECTION: Partial<ExcelJS.Font> = { name: "Calibri", size: 11, bold: true, color: { argb: CLR.navy } };
const FONT_HEADER: Partial<ExcelJS.Font> = { name: "Calibri", size: 9, bold: true, color: { argb: CLR.white } };
const FONT_BODY: Partial<ExcelJS.Font> = { name: "Calibri", size: 9.5, color: { argb: CLR.textDark } };
const FONT_MUTED: Partial<ExcelJS.Font> = { name: "Calibri", size: 9, color: { argb: CLR.textMuted } };
const FONT_BOLD: Partial<ExcelJS.Font> = { name: "Calibri", size: 9.5, bold: true, color: { argb: CLR.textDark } };
const FONT_TOTAL: Partial<ExcelJS.Font> = { name: "Calibri", size: 10, bold: true, color: { argb: CLR.navy } };
const FONT_GRAND: Partial<ExcelJS.Font> = { name: "Calibri", size: 11, bold: true, color: { argb: CLR.white } };

const BORDER_THIN: Partial<ExcelJS.Borders> = { bottom: { style: "thin", color: { argb: CLR.midGray } } };
const BORDER_MED: Partial<ExcelJS.Borders> = { bottom: { style: "medium", color: { argb: CLR.navy } } };
const NUM_FMT_INR = '₹ #,##0';

function addSectionHeader(ws: ExcelJS.Worksheet, title: string, row: number): number {
  ws.mergeCells(`A${row}:D${row}`);
  const cell = ws.getCell(`A${row}`);
  cell.value = title;
  cell.font = FONT_SECTION;
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.navySoft } };
  cell.border = { bottom: { style: "medium", color: { argb: CLR.gold } } };
  cell.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(row).height = 24;
  return row + 1;
}

function addTableHeader(ws: ExcelJS.Worksheet, cols: string[], row: number): number {
  const r = ws.getRow(row);
  r.height = 22;
  cols.forEach((text, i) => {
    const cell = r.getCell(i + 1);
    cell.value = text;
    cell.font = FONT_HEADER;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.navy } };
    cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "right", indent: i === 0 ? 1 : 0 };
  });
  return row + 1;
}

function addDataRow(
  ws: ExcelJS.Worksheet,
  label: string,
  values: (number | string | null)[],
  row: number,
  options?: { bold?: boolean; muted?: boolean; indent?: number; striped?: boolean }
): number {
  const r = ws.getRow(row);
  r.height = 19;
  const bg = options?.striped ? CLR.offWhite : CLR.white;

  const lc = r.getCell(1);
  lc.value = label;
  lc.font = options?.bold ? FONT_BOLD : options?.muted ? FONT_MUTED : FONT_BODY;
  lc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
  lc.alignment = { vertical: "middle", indent: options?.indent ?? 1 };
  lc.border = BORDER_THIN;

  values.forEach((val, i) => {
    const c = r.getCell(i + 2);
    if (val === null || val === undefined) {
      c.value = "—";
      c.font = FONT_MUTED;
    } else if (typeof val === "string") {
      c.value = val;
      c.font = options?.bold ? FONT_BOLD : FONT_BODY;
    } else {
      c.value = val;
      c.numFmt = NUM_FMT_INR;
      c.font = options?.bold ? FONT_BOLD : FONT_BODY;
    }
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    c.alignment = { vertical: "middle", horizontal: "right" };
    c.border = BORDER_THIN;
  });

  return row + 1;
}

function addTotalRow(
  ws: ExcelJS.Worksheet,
  label: string,
  values: (number | string | null)[],
  row: number,
  options?: { bg?: string; font?: Partial<ExcelJS.Font> }
): number {
  const r = ws.getRow(row);
  r.height = 24;
  const bg = options?.bg ?? CLR.lightGray;
  const font = options?.font ?? FONT_TOTAL;

  const lc = r.getCell(1);
  lc.value = label;
  lc.font = font;
  lc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
  lc.alignment = { vertical: "middle", indent: 1 };
  lc.border = BORDER_MED;

  values.forEach((val, i) => {
    const c = r.getCell(i + 2);
    if (typeof val === "number") {
      c.value = val;
      c.numFmt = NUM_FMT_INR;
    } else {
      c.value = val ?? "";
    }
    c.font = font;
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    c.alignment = { vertical: "middle", horizontal: "right" };
    c.border = BORDER_MED;
  });

  return row + 1;
}

function addSpacer(ws: ExcelJS.Worksheet, row: number): number {
  ws.getRow(row).height = 8;
  return row + 1;
}

export async function generateTaxExcel(payload: TaxExcelPayload): Promise<ArrayBuffer> {
  const { input, result } = payload;
  const { config, oldRegime, newRegime } = result;

  const wb = new ExcelJS.Workbook();
  wb.creator = "TaxFiling24";
  wb.created = new Date();

  const ws = wb.addWorksheet("Tax Computation", {
    properties: { defaultColWidth: 18, defaultRowHeight: 18 },
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    views: [{ showGridLines: false }],
  });

  ws.getColumn(1).width = 46;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).width = 20;
  ws.getColumn(4).width = 22;

  let row = 1;

  // Branded Navy Header
  ws.mergeCells(`A${row}:D${row + 2}`);
  const headerCell = ws.getCell(`A${row}`);
  headerCell.value = "TaxFiling24 — Income Tax Computation Statement";
  headerCell.font = FONT_BRAND;
  headerCell.alignment = { vertical: "middle", horizontal: "left", indent: 2 };
  for (let r = row; r <= row + 2; r++) {
    ws.getRow(r).height = 17;
    for (let c = 1; c <= 4; c++) {
      ws.getRow(r).getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.navy } };
    }
  }
  row += 3;

  // Sub-header strip
  const infoRow = ws.getRow(row);
  infoRow.height = 22;
  [
    config.actName,
    config.periodLabel,
    input.residency === "nri" ? "Non-Resident (NRI)" : "Resident Individual",
    new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  ].forEach((text, i) => {
    const cell = infoRow.getCell(i + 1);
    cell.value = text;
    cell.font = { name: "Calibri", size: 9, bold: i === 0, color: { argb: CLR.gold } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.navyDark } };
    cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "center", indent: i === 0 ? 2 : 0 };
  });
  row++;

  row = addSpacer(ws, row);
  const dRow = ws.getRow(row);
  dRow.height = 20;
  [
    `Assessee: ${ageLabel(input.ageGroup)}`,
    `Optimal: ${result.betterRegime}`,
    `Annual Savings: ₹${result.savings.toLocaleString("en-IN")}`,
    "",
  ].forEach((text, i) => {
    const cell = dRow.getCell(i + 1);
    cell.value = text;
    cell.font = { name: "Calibri", size: 8.5, bold: i === 1, color: { argb: CLR.textMuted } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.lightGray } };
    cell.alignment = { vertical: "middle", indent: i === 0 ? 1 : 0 };
    cell.border = BORDER_THIN;
  });
  row++;
  row = addSpacer(ws, row);

  // Section A: Gross Total Income
  row = addSectionHeader(ws, "A. Gross Total Income", row);
  row = addTableHeader(ws, ["Income Head", "Amount (₹)", "Statutory Reference", ""], row);
  row = addDataRow(ws, "Income from Salary / Pension", [input.salary, "Gross Salary", null], row);
  row = addDataRow(ws, "Income from House Property (Net of 30% Sec 24(a))", [Math.round(input.rentalIncome * 0.7), "Sec 24(a)", null], row, { striped: true });
  row = addDataRow(ws, "Income from Other Sources", [input.otherIncome, "Interest / Dividends", null], row);
  row = addDataRow(ws, `Profits from Business / Profession (${input.businessMode.toUpperCase()})`, [result.netBusinessIncome, input.businessMode === "regular" ? "Regular Books" : "Presumptive", null], row, { striped: true });

  if (input.stcgOther > 0) row = addDataRow(ws, "STCG — Non-Equity Assets", [input.stcgOther, "Normal Slab Rate", null], row);
  if (input.stcgEquity > 0) row = addDataRow(ws, "STCG — Listed Equity / Equity MF", [input.stcgEquity, `${config.sections.stcgEquity} @ 20%`, null], row, { striped: true });
  if (input.ltcgEquity > 0) row = addDataRow(ws, "LTCG — Listed Equity / Equity MF", [input.ltcgEquity, `${config.sections.ltcgEquity} @ 12.5% (>₹1.25L)`, null], row);
  if (input.ltcgOther > 0) row = addDataRow(ws, "LTCG — Other Capital Assets", [input.ltcgOther, `${config.sections.ltcgOther} @ ${input.ltcgOtherUseIndexation ? "20% indexed" : "12.5%"}`, null], row, { striped: true });

  row = addTotalRow(ws, "Gross Total Income (A)", [result.grossTotalIncome, null, null], row);
  row = addSpacer(ws, row);

  // Section B: Old Regime Deductions
  row = addSectionHeader(ws, "B. Eligible Deductions — Old Regime", row);
  row = addTableHeader(ws, ["Deduction / Exemption", "Claimed (₹)", "Statutory Limit", "Allowed (₹)"], row);
  result.deductionBreakdownOld.forEach((d, idx) => {
    row = addDataRow(ws, `${d.label} (${d.section})`, [d.claimed, d.limit, d.allowed], row, { striped: idx % 2 === 1 });
  });
  row = addTotalRow(ws, "Total Deductions — Old Regime", [null, null, oldRegime.totalDeductions], row);
  row = addSpacer(ws, row);

  // Section C: Regime Comparison
  row = addSectionHeader(ws, "C. Tax Computation — Old Regime vs. New Regime", row);
  row = addTableHeader(ws, ["Particulars", "Old Regime (₹)", "New Regime (₹)", "Difference (₹)"], row);
  row = addDataRow(ws, "Gross Total Income", [oldRegime.grossIncome, newRegime.grossIncome, 0], row);
  row = addDataRow(ws, "Less: Total Eligible Deductions", [oldRegime.totalDeductions, newRegime.totalDeductions, oldRegime.totalDeductions - newRegime.totalDeductions], row, { striped: true });
  row = addDataRow(ws, "Net Taxable Income (Rounded u/s 288A)", [oldRegime.totalTaxableIncome, newRegime.totalTaxableIncome, oldRegime.totalTaxableIncome - newRegime.totalTaxableIncome], row, { bold: true });
  row = addDataRow(ws, "Slab Tax (Before Rebate)", [oldRegime.slabTaxBeforeRebate, newRegime.slabTaxBeforeRebate, oldRegime.slabTaxBeforeRebate - newRegime.slabTaxBeforeRebate], row, { striped: true });
  row = addDataRow(ws, `Less: Rebate & Marginal Relief (${config.sections.rebate})`, [-(oldRegime.rebate87A + oldRegime.rebateMarginalRelief), -(newRegime.rebate87A + newRegime.rebateMarginalRelief), null], row);

  if (oldRegime.totalSpecialCgTax > 0 || newRegime.totalSpecialCgTax > 0) {
    row = addDataRow(ws, "Special-Rate Capital Gains Tax", [oldRegime.totalSpecialCgTax, newRegime.totalSpecialCgTax, oldRegime.totalSpecialCgTax - newRegime.totalSpecialCgTax], row, { striped: true });
  }
  if (oldRegime.surcharge > 0 || newRegime.surcharge > 0) {
    row = addDataRow(ws, "Surcharge (after Marginal Relief & 15% CG Cap)", [oldRegime.surcharge, newRegime.surcharge, oldRegime.surcharge - newRegime.surcharge], row);
  }
  row = addDataRow(ws, "Health & Education Cess (4%)", [oldRegime.cess, newRegime.cess, oldRegime.cess - newRegime.cess], row, { striped: true });
  row = addDataRow(ws, "Effective Tax Rate", [`${oldRegime.effectiveTaxRatePct.toFixed(1)}%`, `${newRegime.effectiveTaxRatePct.toFixed(1)}%`, null], row);
  row = addTotalRow(ws, "Total Tax Liability (Rounded u/s 288B)", [oldRegime.totalTax, newRegime.totalTax, oldRegime.totalTax - newRegime.totalTax], row);
  row = addSpacer(ws, row);

  // Separate Slab Breakdowns
  row = addSectionHeader(ws, "D. Detailed Slab Breakdowns", row);
  row = addDataRow(ws, `New Regime (${config.sections.newRegime})`, [null, null, null], row, { bold: true, muted: true });
  newRegime.breakdown.forEach((b, i) => {
    row = addDataRow(ws, `  ${b.slab}`, [null, b.tax, null], row, { indent: 2, striped: i % 2 === 1 });
  });
  row = addDataRow(ws, "Old Regime", [null, null, null], row, { bold: true, muted: true });
  oldRegime.breakdown.forEach((b, i) => {
    row = addDataRow(ws, `  ${b.slab}`, [b.tax, null, null], row, { indent: 2, striped: i % 2 === 1 });
  });
  row = addSpacer(ws, row);

  // Recommendation Highlight
  ws.mergeCells(`A${row}:D${row}`);
  const recCell = ws.getCell(`A${row}`);
  recCell.value =
    result.savings > 0
      ? `${result.betterRegime} is Optimal — Estimated Annual Tax Savings: ₹${result.savings.toLocaleString("en-IN")}`
      : `Both Regimes Result in Equal Tax Liability (₹${result.activeTax.toLocaleString("en-IN")})`;
  recCell.font = FONT_GRAND;
  recCell.alignment = { vertical: "middle", horizontal: "center" };
  for (let c = 1; c <= 4; c++) {
    ws.getRow(row).getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.green } };
  }
  ws.getRow(row).height = 28;
  row++;
  row = addSpacer(ws, row);

  // Section E: Prepaid Tax, Interest & Refund / Payable
  row = addSectionHeader(ws, `E. Compliance, Prepaid Tax & Final Balance (${result.betterRegime})`, row);
  row = addTableHeader(ws, ["Particulars", "Amount (₹)", "Remarks", ""], row);
  row = addDataRow(ws, `Assessed Tax Liability (${result.betterRegime})`, [result.activeTax, "Incl. Surcharge & Cess", null], row);
  if (result.interest234A > 0) row = addDataRow(ws, `Interest (${config.sections.interest234A})`, [result.interest234A, `${input.monthsDelay234A} mo @ 1%/mo`, null], row, { striped: true });
  if (result.interest234B > 0) row = addDataRow(ws, `Interest (${config.sections.interest234B})`, [result.interest234B, `${input.monthsDelay234B} mo @ 1%/mo`, null], row);
  if (result.lateFee234F > 0) row = addDataRow(ws, `Late Filing Fee (${config.sections.lateFee234F})`, [result.lateFee234F, "Late return statutory fee", null], row, { striped: true });
  row = addDataRow(ws, "Less: TDS / Advance Tax Already Paid", [-result.taxPaid, "Prepaid tax credit", null], row);

  if (result.refundDue > 0) {
    row = addTotalRow(ws, "Income Tax Refund Due", [result.refundDue, "Excess prepaid tax", null], row, {
      bg: CLR.greenBg,
      font: { ...FONT_TOTAL, color: { argb: CLR.green } },
    });
  } else {
    row = addTotalRow(ws, "Final Self-Assessment Tax Payable", [result.netPayable, "Rounded u/s 288B", null], row, {
      bg: result.netPayable > 0 ? CLR.redBg : CLR.greenBg,
      font: { ...FONT_TOTAL, color: { argb: result.netPayable > 0 ? CLR.red : CLR.green } },
    });
  }
  row = addSpacer(ws, row);

  // Section F: Advance Tax Schedule
  row = addSectionHeader(ws, "F. Advance Tax Installment Schedule", row);
  if (!result.advanceTax.applicable) {
    row = addDataRow(ws, result.advanceTax.exemptReason || "Advance Tax Not Applicable", [0, "Exempt", null], row);
  } else {
    row = addTableHeader(ws, ["Due Date", "Cumulative Amount (₹)", "Statutory Milestone", ""], row);
    result.advanceTax.installments.forEach((inst, i) => {
      row = addDataRow(ws, inst.dueDate, [inst.cumulativeAmount, inst.percentageLabel, null], row, { striped: i % 2 === 1 });
    });
  }
  row = addSpacer(ws, row);

  // Footer
  ws.mergeCells(`A${row}:D${row}`);
  const discCell = ws.getCell(`A${row}`);
  discCell.value = `Disclaimer: Computer-generated computation per ${config.actName} (${config.periodLabel}). Consult a qualified Chartered Accountant before filing.`;
  discCell.font = { name: "Calibri", size: 7.5, italic: true, color: { argb: CLR.textMuted } };
  discCell.alignment = { vertical: "middle", wrapText: true, indent: 1 };
  ws.getRow(row).height = 24;
  row++;

  ws.mergeCells(`A${row}:D${row}`);
  const fCell = ws.getCell(`A${row}`);
  fCell.value = `Generated by TaxFiling24  •  www.taxfiling24.com  •  ${new Date().toLocaleString("en-IN")}`;
  fCell.font = { name: "Calibri", size: 8, color: { argb: CLR.gold } };
  fCell.alignment = { vertical: "middle", horizontal: "center" };
  for (let c = 1; c <= 4; c++) {
    ws.getRow(row).getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.navy } };
  }
  ws.getRow(row).height = 22;

  ws.pageSetup.printArea = `A1:D${row}`;
  ws.pageSetup.margins = { left: 0.4, right: 0.4, top: 0.3, bottom: 0.3, header: 0.15, footer: 0.15 };

  const buffer = await wb.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}
