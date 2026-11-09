import ExcelJS from "exceljs";

// ── Types ──────────────────────────────────────────────────────────
interface TaxExcelData {
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
  deduction80G: number;
  deduction80E: number;
  deduction80TTA: number;
  hra: number;
  otherDeductions: number;
  stcgEquity: number;
  ltcgEquity: number;
  stcgOther: number;
  ltcgOther: number;
  taxPaid: number;
  monthsDelay234A: number;
  monthsDelay234B: number;
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

// ── Color Palette ──────────────────────────────────────────────────
const CLR = {
  darkNavy: "0D0E1A",
  primary: "4A54C7",
  primaryDark: "2D3580",
  accent: "5B73EB",
  white: "FFFFFF",
  offWhite: "F7F8FC",
  lightGray: "EEF0F6",
  midGray: "D0D3DE",
  textDark: "1A1C2E",
  textMuted: "6B6F82",
  green: "0F7A3B",
  greenBg: "E8F5EE",
  red: "C42B30",
  redBg: "FDF0F0",
  gold: "B8941F",
  goldBg: "FFF9E5",
  blueBg: "EEF1FC",
};

function ageLabel(group: string): string {
  if (group === "senior") return "Senior Citizen (60-80 years)";
  if (group === "super-senior") return "Super Senior Citizen (80+ years)";
  return "Individual (Below 60 years)";
}

// ── Style Presets ──────────────────────────────────────────────────
const FONT_BRAND: Partial<ExcelJS.Font> = { name: "Calibri", size: 16, bold: true, color: { argb: CLR.white } };
const FONT_SUBTITLE: Partial<ExcelJS.Font> = { name: "Calibri", size: 9, color: { argb: "A0A8D0" } };
const FONT_SECTION: Partial<ExcelJS.Font> = { name: "Calibri", size: 11, bold: true, color: { argb: CLR.primaryDark } };
const FONT_HEADER: Partial<ExcelJS.Font> = { name: "Calibri", size: 9, bold: true, color: { argb: CLR.white } };
const FONT_BODY: Partial<ExcelJS.Font> = { name: "Calibri", size: 9.5, color: { argb: CLR.textDark } };
const FONT_BODY_MUTED: Partial<ExcelJS.Font> = { name: "Calibri", size: 9, color: { argb: CLR.textMuted } };
const FONT_BOLD: Partial<ExcelJS.Font> = { name: "Calibri", size: 9.5, bold: true, color: { argb: CLR.textDark } };
const FONT_TOTAL: Partial<ExcelJS.Font> = { name: "Calibri", size: 10, bold: true, color: { argb: CLR.primaryDark } };
const FONT_GRAND_TOTAL: Partial<ExcelJS.Font> = { name: "Calibri", size: 11, bold: true, color: { argb: CLR.white } };

const BORDER_THIN: Partial<ExcelJS.Borders> = {
  bottom: { style: "thin", color: { argb: CLR.midGray } },
};
const BORDER_BOTTOM_MEDIUM: Partial<ExcelJS.Borders> = {
  bottom: { style: "medium", color: { argb: CLR.primary } },
};

const NUM_FMT = '#,##0';
const NUM_FMT_CURRENCY = '₹ #,##0';

// ── Helper: add a section header row ───────────────────────────────
function addSectionHeader(ws: ExcelJS.Worksheet, title: string, row: number, lastCol: string): number {
  ws.mergeCells(`A${row}:${lastCol}${row}`);
  const cell = ws.getCell(`A${row}`);
  cell.value = title;
  cell.font = FONT_SECTION;
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.blueBg } };
  cell.border = { bottom: { style: "medium", color: { argb: CLR.primary } } };
  cell.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(row).height = 24;
  return row + 1;
}

// ── Helper: add a table header row ─────────────────────────────────
function addTableHeader(ws: ExcelJS.Worksheet, cols: string[], row: number): number {
  const r = ws.getRow(row);
  r.height = 22;
  cols.forEach((text, i) => {
    const cell = r.getCell(i + 1);
    cell.value = text;
    cell.font = FONT_HEADER;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.darkNavy } };
    cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "right", indent: i === 0 ? 1 : 0 };
    cell.border = { bottom: { style: "thin", color: { argb: CLR.primary } } };
  });
  return row + 1;
}

// ── Helper: add a data row ─────────────────────────────────────────
function addDataRow(
  ws: ExcelJS.Worksheet, label: string, values: (number | string | null)[], row: number,
  options?: { bold?: boolean; muted?: boolean; indent?: number; striped?: boolean; numFmt?: string }
): number {
  const r = ws.getRow(row);
  r.height = 19;
  const stripe = options?.striped;
  const bgColor = stripe ? CLR.offWhite : CLR.white;

  const labelCell = r.getCell(1);
  labelCell.value = label;
  labelCell.font = options?.bold ? FONT_BOLD : options?.muted ? FONT_BODY_MUTED : FONT_BODY;
  labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
  labelCell.alignment = { vertical: "middle", indent: options?.indent ?? 1 };
  labelCell.border = BORDER_THIN;

  values.forEach((val, i) => {
    const cell = r.getCell(i + 2);
    if (val === null || val === undefined) {
      cell.value = "—";
      cell.font = FONT_BODY_MUTED;
    } else if (typeof val === "string") {
      cell.value = val;
      cell.font = options?.bold ? FONT_BOLD : FONT_BODY;
    } else {
      cell.value = val;
      cell.numFmt = options?.numFmt ?? NUM_FMT_CURRENCY;
      cell.font = options?.bold ? FONT_BOLD : FONT_BODY;
    }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
    cell.alignment = { vertical: "middle", horizontal: "right" };
    cell.border = BORDER_THIN;
  });
  return row + 1;
}

// ── Helper: add a total/summary row ────────────────────────────────
function addTotalRow(
  ws: ExcelJS.Worksheet, label: string, values: (number | string | null)[], row: number,
  options?: { bg?: string; font?: Partial<ExcelJS.Font>; numFmt?: string }
): number {
  const r = ws.getRow(row);
  r.height = 24;
  const bg = options?.bg ?? CLR.lightGray;
  const font = options?.font ?? FONT_TOTAL;

  const labelCell = r.getCell(1);
  labelCell.value = label;
  labelCell.font = font;
  labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
  labelCell.alignment = { vertical: "middle", indent: 1 };
  labelCell.border = BORDER_BOTTOM_MEDIUM;

  values.forEach((val, i) => {
    const cell = r.getCell(i + 2);
    if (typeof val === "string") {
      cell.value = val;
    } else if (val !== null && val !== undefined) {
      cell.value = val;
      cell.numFmt = options?.numFmt ?? NUM_FMT_CURRENCY;
    } else {
      cell.value = "";
    }
    cell.font = font;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    cell.alignment = { vertical: "middle", horizontal: "right" };
    cell.border = BORDER_BOTTOM_MEDIUM;
  });
  return row + 1;
}

// ── Helper: spacer row ─────────────────────────────────────────────
function addSpacer(ws: ExcelJS.Worksheet, row: number): number {
  ws.getRow(row).height = 8;
  return row + 1;
}

// ══════════════════════════════════════════════════════════════════════
// Main Export Function
// ══════════════════════════════════════════════════════════════════════
export async function generateTaxExcel(data: TaxExcelData): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "TaxFiling24";
  wb.created = new Date();

  const ws = wb.addWorksheet("Tax Computation", {
    properties: { defaultColWidth: 18, defaultRowHeight: 18 },
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    views: [{ showGridLines: false }],
  });

  // Column widths
  ws.getColumn(1).width = 42;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).width = 20;
  ws.getColumn(4).width = 20;

  let row = 1;

  // ═══════════════════════════════════════════════════════════════════
  // BRANDED HEADER
  // ═══════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${row}:D${row + 2}`);
  const headerCell = ws.getCell(`A${row}`);
  headerCell.value = "TaxFiling24";
  headerCell.font = FONT_BRAND;
  headerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.darkNavy } };
  headerCell.alignment = { vertical: "middle", horizontal: "left", indent: 2 };
  ws.getRow(row).height = 18;
  ws.getRow(row + 1).height = 18;
  ws.getRow(row + 2).height = 18;
  // Fill remaining header rows
  for (let r = row; r <= row + 2; r++) {
    for (let c = 1; c <= 4; c++) {
      const cell = ws.getRow(r).getCell(c);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.darkNavy } };
    }
  }
  row += 3;

  // Sub-header bar with report info
  const infoRow = ws.getRow(row);
  infoRow.height = 22;
  const infoItems = [
    `Income Tax Computation Statement`,
    `FY ${data.financialYear}`,
    `AY ${data.assessmentYear}`,
    new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  ];
  infoItems.forEach((text, i) => {
    const cell = infoRow.getCell(i + 1);
    cell.value = text;
    cell.font = { name: "Calibri", size: i === 0 ? 9 : 9, bold: i === 0, color: { argb: "C0C8F0" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1A1D30" } };
    cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "center", indent: i === 0 ? 2 : 0 };
  });
  row++;

  // Assessor details strip
  row = addSpacer(ws, row);
  const detailRow = ws.getRow(row);
  detailRow.height = 22;
  const details = [
    `Assessee Category: ${ageLabel(data.ageGroup)}`,
    `Status: Individual / HUF`,
    `Recommended: ${data.results.better}`,
    "",
  ];
  details.forEach((text, i) => {
    const cell = detailRow.getCell(i + 1);
    cell.value = text;
    cell.font = { name: "Calibri", size: 8.5, color: { argb: CLR.textMuted } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.lightGray } };
    cell.alignment = { vertical: "middle", indent: i === 0 ? 1 : 0 };
    cell.border = BORDER_THIN;
  });
  row++;
  row = addSpacer(ws, row);

  // ═══════════════════════════════════════════════════════════════════
  // SECTION 1: INCOME DETAILS
  // ═══════════════════════════════════════════════════════════════════
  row = addSectionHeader(ws, "A. Gross Total Income", row, "D");
  row = addTableHeader(ws, ["Particulars", "Amount (₹)", "Section / Remarks", ""], row);

  const netRental = data.rentalIncome * 0.7;
  const netBiz = Math.max(0, data.professionalIncome - data.businessExpenses);

  row = addDataRow(ws, "Income from Salary / Pension", [data.salary, "Sec 17(1)", null], row);
  row = addDataRow(ws, "Income from House Property (Net of 30% Std Ded)", [netRental, "Sec 24", null], row, { striped: true });
  row = addDataRow(ws, "Income from Other Sources (Interest, Dividends)", [data.otherIncome, "Sec 56", null], row);
  row = addDataRow(ws, "Profits from Business / Profession (Net)", [netBiz, "Sec 44AD/44ADA", null], row, { striped: true });

  if (data.stcgEquity > 0 || data.ltcgEquity > 0 || data.stcgOther > 0 || data.ltcgOther > 0) {
    row = addDataRow(ws, "Short Term Capital Gains — Equity (Listed)", [data.stcgEquity, "Sec 111A @20%", null], row);
    row = addDataRow(ws, "Long Term Capital Gains — Equity (Listed)", [data.ltcgEquity, "Sec 112A @12.5%", null], row, { striped: true });
    row = addDataRow(ws, "Short Term Capital Gains — Other Assets", [data.stcgOther, "Sec 111 @15%", null], row);
    row = addDataRow(ws, "Long Term Capital Gains — Other Assets", [data.ltcgOther, "Sec 112 @20%", null], row, { striped: true });
  }

  row = addTotalRow(ws, "Gross Total Income (A)", [data.results.grossTotalIncome, null, null], row);
  row = addSpacer(ws, row);

  // ═══════════════════════════════════════════════════════════════════
  // SECTION 2: DEDUCTIONS UNDER OLD REGIME
  // ═══════════════════════════════════════════════════════════════════
  row = addSectionHeader(ws, "B. Deductions (Applicable under Old Regime Only)", row, "D");
  row = addTableHeader(ws, ["Deduction", "Claimed (₹)", "Max Limit (₹)", "Allowed (₹)"], row);

  const deductions: [string, number, number | string, number][] = [
    ["Standard Deduction u/s 16(ia)", 50000, "50,000", 50000],
    ["Section 80C — PPF / EPF / ELSS / LIC / NSC", data.deduction80C, "1,50,000", Math.min(data.deduction80C, 150000)],
    ["Section 80D — Health Insurance (Self & Family)", data.deduction80D, "25,000", Math.min(data.deduction80D, 25000)],
    ["Section 80D — Health Insurance (Parents)", data.deduction80D_Parents, "50,000", Math.min(data.deduction80D_Parents, 50000)],
    ["Section 80CCD(1B) — NPS Contribution", data.deductionNPS, "50,000", Math.min(data.deductionNPS, 50000)],
    ["Section 24(b) — Home Loan Interest", data.homeLoanInterest, "2,00,000", Math.min(data.homeLoanInterest, 200000)],
    ["Section 80G — Charitable Donations", data.deduction80G, "As applicable", data.deduction80G],
    ["Section 80E — Education Loan Interest", data.deduction80E, "No limit", data.deduction80E],
    ["Section 80TTA — Savings Interest", data.deduction80TTA, "10,000", Math.min(data.deduction80TTA, 10000)],
    ["HRA Exemption u/s 10(13A)", data.hra, "Computed", data.hra],
    ["Other Deductions", data.otherDeductions, "As applicable", data.otherDeductions],
  ];

  deductions.forEach(([label, claimed, limit, allowed], i) => {
    row = addDataRow(ws, label, [claimed, typeof limit === "string" ? limit : limit, allowed], row, {
      striped: i % 2 === 1,
      numFmt: typeof limit === "string" ? undefined : NUM_FMT_CURRENCY,
    });
  });

  row = addTotalRow(ws, "Total Deductions (B)", [data.results.totalDeductions, null, data.results.totalDeductions], row);
  row = addSpacer(ws, row);

  // ═══════════════════════════════════════════════════════════════════
  // SECTION 3: TAX COMPUTATION — SIDE BY SIDE
  // ═══════════════════════════════════════════════════════════════════
  row = addSectionHeader(ws, "C. Tax Computation — Old Regime vs New Regime", row, "D");
  row = addTableHeader(ws, ["Particulars", "Old Regime (₹)", "New Regime (₹)", "Difference (₹)"], row);

  row = addDataRow(ws, "Gross Total Income", [data.results.grossTotalIncome, data.results.grossTotalIncome, 0], row);
  row = addDataRow(ws, "Less: Total Deductions", [data.results.totalDeductions, 75000, data.results.totalDeductions - 75000], row, { striped: true });
  row = addDataRow(ws, "Net Taxable Income", [data.results.taxableOld, data.results.taxableNew, data.results.taxableOld - data.results.taxableNew], row, { bold: true });

  row = addSpacer(ws, row);

  // Slab Breakdown — OLD
  row = addDataRow(ws, "Slab-wise Tax — Old Regime", [null, null, null], row, { bold: true, muted: true });
  data.results.breakdownOld.forEach((b, i) => {
    row = addDataRow(ws, `    ${b.slab}`, [b.tax, null, null], row, { indent: 3, striped: i % 2 === 1 });
  });

  // Slab Breakdown — NEW
  row = addDataRow(ws, "Slab-wise Tax — New Regime", [null, null, null], row, { bold: true, muted: true });
  data.results.breakdownNew.forEach((b, i) => {
    row = addDataRow(ws, `    ${b.slab}`, [null, b.tax, null], row, { indent: 3, striped: i % 2 === 1 });
  });

  row = addSpacer(ws, row);

  const taxBeforeCessOld = data.results.oldTax / 1.04;
  const taxBeforeCessNew = data.results.newTax / 1.04;
  const cessOld = data.results.oldTax - taxBeforeCessOld;
  const cessNew = data.results.newTax - taxBeforeCessNew;

  row = addDataRow(ws, "Tax Before Cess", [taxBeforeCessOld, taxBeforeCessNew, taxBeforeCessOld - taxBeforeCessNew], row);

  if (data.results.surchargeOld > 0 || data.results.surchargeNew > 0) {
    row = addDataRow(ws, "Surcharge", [data.results.surchargeOld, data.results.surchargeNew, data.results.surchargeOld - data.results.surchargeNew], row, { striped: true });
  }

  row = addDataRow(ws, "Health & Education Cess (4%)", [cessOld, cessNew, cessOld - cessNew], row, { striped: true });

  if (data.results.capitalGainsTax > 0) {
    row = addDataRow(ws, "Capital Gains Tax (included above)", [data.results.capitalGainsTax, data.results.capitalGainsTax, 0], row);
  }

  row = addTotalRow(ws, "Total Tax Liability (incl. Cess)", [data.results.oldTax, data.results.newTax, data.results.oldTax - data.results.newTax], row);
  row = addSpacer(ws, row);

  // ═══════════════════════════════════════════════════════════════════
  // RECOMMENDATION BOX
  // ═══════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${row}:D${row}`);
  const recCell = ws.getCell(`A${row}`);
  const betterIsNew = data.results.better === "New Regime";
  recCell.value = `✦  ${data.results.better} is Optimal  —  You save ₹ ${data.results.savings.toLocaleString("en-IN")}  ✦`;
  recCell.font = FONT_GRAND_TOTAL;
  recCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: betterIsNew ? CLR.primary : CLR.green } };
  recCell.alignment = { vertical: "middle", horizontal: "center" };
  for (let c = 1; c <= 4; c++) {
    ws.getRow(row).getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: betterIsNew ? CLR.primary : CLR.green } };
  }
  ws.getRow(row).height = 30;
  row++;
  row = addSpacer(ws, row);

  // ═══════════════════════════════════════════════════════════════════
  // SECTION 4: COMPLIANCE & INTEREST
  // ═══════════════════════════════════════════════════════════════════
  if (data.taxPaid > 0 || data.results.interest234A > 0 || data.results.interest234B > 0) {
    row = addSectionHeader(ws, "D. TDS / Advance Tax & Interest on Default", row, "D");
    row = addTableHeader(ws, ["Particulars", "Amount (₹)", "Remarks", ""], row);

    row = addDataRow(ws, "TDS / Advance Tax Already Paid", [data.taxPaid, "Credit claimed", null], row);
    row = addDataRow(ws, "Balance Tax Payable / (Refundable)", [Math.max(0, (betterIsNew ? data.results.newTax : data.results.oldTax) - data.taxPaid), null, null], row, { striped: true, bold: true });

    if (data.results.interest234A > 0) {
      row = addDataRow(ws, `Interest u/s 234A — Filing Delay (${data.monthsDelay234A} months)`, [data.results.interest234A, "@ 1% per month", null], row);
    }
    if (data.results.interest234B > 0) {
      row = addDataRow(ws, `Interest u/s 234B — Advance Tax Shortfall (${data.monthsDelay234B} months)`, [data.results.interest234B, "@ 1% per month", null], row, { striped: true });
    }

    row = addTotalRow(ws, "Net Tax + Interest Payable", [data.results.totalPayable, null, null], row, { bg: CLR.redBg, font: { ...FONT_TOTAL, color: { argb: CLR.red } } });
    row = addSpacer(ws, row);
  }

  // ═══════════════════════════════════════════════════════════════════
  // SECTION 5: ADVANCE TAX SCHEDULE
  // ═══════════════════════════════════════════════════════════════════
  row = addSectionHeader(ws, "E. Advance Tax Installment Schedule", row, "D");
  row = addTableHeader(ws, ["Due Date", "Cumulative %", "Amount Payable (₹)", ""], row);

  const advTax = data.results.advanceTax;
  const schedule: [string, string, number][] = [
    ["On or before 15th June", "15% of estimated tax", advTax.june],
    ["On or before 15th September", "45% of estimated tax", advTax.sept],
    ["On or before 15th December", "75% of estimated tax", advTax.dec],
    ["On or before 15th March", "100% of estimated tax", advTax.march],
  ];

  schedule.forEach(([date, desc, amt], i) => {
    row = addDataRow(ws, date, [amt, desc, null], row, { striped: i % 2 === 1 });
  });

  row = addSpacer(ws, row);

  // ═══════════════════════════════════════════════════════════════════
  // FOOTER / DISCLAIMER
  // ═══════════════════════════════════════════════════════════════════
  ws.mergeCells(`A${row}:D${row}`);
  const discCell = ws.getCell(`A${row}`);
  discCell.value = "Disclaimer: This is a computer-generated estimate for informational purposes only. Consult a qualified Chartered Accountant for professional tax advice.";
  discCell.font = { name: "Calibri", size: 7.5, italic: true, color: { argb: CLR.textMuted } };
  discCell.alignment = { vertical: "middle", wrapText: true, indent: 1 };
  ws.getRow(row).height = 24;
  row++;

  ws.mergeCells(`A${row}:D${row}`);
  const footerCell = ws.getCell(`A${row}`);
  footerCell.value = `Generated by TaxFiling24  •  www.taxfiling24.com  •  ${new Date().toLocaleString("en-IN")}`;
  footerCell.font = { name: "Calibri", size: 7.5, color: { argb: "9CA0B8" } };
  footerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.darkNavy } };
  footerCell.alignment = { vertical: "middle", horizontal: "center" };
  for (let c = 1; c <= 4; c++) {
    ws.getRow(row).getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.darkNavy } };
  }
  ws.getRow(row).height = 22;

  // ═══════════════════════════════════════════════════════════════════
  // Print Setup
  // ═══════════════════════════════════════════════════════════════════
  ws.pageSetup.printArea = `A1:D${row}`;
  ws.pageSetup.margins = { left: 0.4, right: 0.4, top: 0.3, bottom: 0.3, header: 0.15, footer: 0.15 };

  const buffer = await wb.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}
