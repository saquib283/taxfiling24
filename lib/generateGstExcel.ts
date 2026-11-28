import ExcelJS from "exceljs";
import type { GstInvoiceInput, GstInvoiceResult } from "./calculators/gst-engine";
import { COMPOSITION_CATEGORIES } from "./calculators/gst-rules";

export interface GstExcelPayload {
  input: GstInvoiceInput;
  result: GstInvoiceResult;
}

// ── TaxFiling24 Deep Navy & Heritage Gold Excel Palette ────────────
const CLR = {
  navy: "0A2540",
  navyDark: "061829",
  navySoft: "EAF0F6",
  gold: "D4AF37",
  white: "FFFFFF",
  offWhite: "F8FAFC",
  lightGray: "F1F5F9",
  midGray: "CBD5E1",
  textDark: "0F172A",
  textMuted: "475569",
  green: "047857",
  greenBg: "ECFDF5",
  amber: "B45309",
  amberBg: "FFFBEB",
};

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
const NUM_FMT_DEC = '₹ #,##0.00';
const NUM_FMT_INT = '₹ #,##0';

function fillRow(ws: ExcelJS.Worksheet, row: number, cols: number, color: string) {
  for (let c = 1; c <= cols; c++) {
    ws.getRow(row).getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
  }
}

function addSectionHeader(ws: ExcelJS.Worksheet, title: string, row: number, cols: number): number {
  ws.mergeCells(row, 1, row, cols);
  const cell = ws.getCell(row, 1);
  cell.value = title;
  cell.font = FONT_SECTION;
  cell.border = { bottom: { style: "medium", color: { argb: CLR.gold } } };
  cell.alignment = { vertical: "middle", indent: 1 };
  fillRow(ws, row, cols, CLR.navySoft);
  ws.getRow(row).height = 24;
  return row + 1;
}

function addSpacer(ws: ExcelJS.Worksheet, row: number): number {
  ws.getRow(row).height = 8;
  return row + 1;
}

function addKVRow(
  ws: ExcelJS.Worksheet,
  label: string,
  value: number | string,
  row: number,
  cols: number,
  options?: { bold?: boolean; striped?: boolean; numFmt?: string; font?: Partial<ExcelJS.Font> }
): number {
  const r = ws.getRow(row);
  r.height = 19;
  const bg = options?.striped ? CLR.offWhite : CLR.white;

  ws.mergeCells(row, 1, row, cols - 1);
  const lc = r.getCell(1);
  lc.value = label;
  lc.font = options?.bold ? FONT_BOLD : FONT_BODY;
  lc.alignment = { vertical: "middle", indent: 1 };
  for (let c = 1; c <= cols - 1; c++) {
    r.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    r.getCell(c).border = BORDER_THIN;
  }

  const vc = r.getCell(cols);
  vc.value = value;
  if (typeof value === "number") vc.numFmt = options?.numFmt ?? NUM_FMT_DEC;
  vc.font = options?.font ?? (options?.bold ? FONT_BOLD : FONT_BODY);
  vc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
  vc.alignment = { vertical: "middle", horizontal: "right" };
  vc.border = BORDER_THIN;
  return row + 1;
}

function addTotalRow(
  ws: ExcelJS.Worksheet,
  label: string,
  value: number | string,
  row: number,
  cols: number,
  options?: { bg?: string; font?: Partial<ExcelJS.Font>; numFmt?: string }
): number {
  const r = ws.getRow(row);
  r.height = 24;
  const bg = options?.bg ?? CLR.lightGray;
  const font = options?.font ?? FONT_TOTAL;

  ws.mergeCells(row, 1, row, cols - 1);
  const lc = r.getCell(1);
  lc.value = label;
  lc.font = font;
  lc.alignment = { vertical: "middle", indent: 1 };

  const vc = r.getCell(cols);
  vc.value = value;
  if (typeof value === "number") vc.numFmt = options?.numFmt ?? NUM_FMT_DEC;
  vc.font = font;
  vc.alignment = { vertical: "middle", horizontal: "right" };

  for (let c = 1; c <= cols; c++) {
    r.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    r.getCell(c).border = BORDER_MED;
  }
  return row + 1;
}

export async function generateGstExcel(payload: GstExcelPayload): Promise<ArrayBuffer> {
  const { input, result } = payload;
  const isComposition = result.documentType === "BILL_OF_SUPPLY";
  const isRcm = result.documentType === "RCM_INVOICE";

  const wb = new ExcelJS.Workbook();
  wb.creator = "TaxFiling24";
  wb.created = new Date();

  const ws = wb.addWorksheet(isComposition ? "Bill of Supply" : "GST Computation", {
    properties: { defaultRowHeight: 18 },
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    views: [{ showGridLines: false }],
  });

  ws.getColumn(1).width = 30;
  ws.getColumn(2).width = 14;
  ws.getColumn(3).width = 7;
  ws.getColumn(4).width = 9;
  ws.getColumn(5).width = 9;
  ws.getColumn(6).width = 9;
  ws.getColumn(7).width = 14;
  ws.getColumn(8).width = 16;

  const COLS = 8;
  let row = 1;

  // Branded Navy Header
  ws.mergeCells(row, 1, row + 2, COLS);
  const hCell = ws.getCell(row, 1);
  hCell.value = `TaxFiling24 — ${result.documentLabel}`;
  hCell.font = FONT_BRAND;
  hCell.alignment = { vertical: "middle", horizontal: "left", indent: 2 };
  for (let r = row; r <= row + 2; r++) {
    ws.getRow(r).height = 17;
    fillRow(ws, r, COLS, CLR.navy);
  }
  row += 3;

  const infoRow = ws.getRow(row);
  infoRow.height = 22;
  [
    "GST 2.0 Computation",
    `Mode: ${input.calcMode === "exclusive" ? "Exclusive" : "Inclusive"}`,
    `Supply: ${result.effectivePlaceOfSupply === "intra" ? "Intra-State" : "Inter-State"}`,
    `Scheme: ${isComposition ? "Composition" : "Regular"}`,
    "",
    "",
    isRcm ? "RCM: Yes" : "RCM: No",
    new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  ].forEach((text, i) => {
    const c = infoRow.getCell(i + 1);
    c.value = text;
    c.font = { name: "Calibri", size: 8.5, bold: i === 0, color: { argb: CLR.gold } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.navyDark } };
    c.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "center", indent: i === 0 ? 2 : 0 };
  });
  row++;
  row = addSpacer(ws, row);

  // Section A: Line Items
  row = addSectionHeader(ws, "A. Line Items Breakdown", row, COLS);
  const th = ws.getRow(row);
  th.height = 22;
  ["Description", "Unit Price", "Qty", "Disc %", "GST %", "Cess %", "Tax Amount", "Line Total"].forEach((t, i) => {
    const c = th.getCell(i + 1);
    c.value = t;
    c.font = FONT_HEADER;
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.navy } };
    c.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "right", indent: i === 0 ? 1 : 0 };
  });
  row++;

  result.items.forEach((item, idx) => {
    const r = ws.getRow(row);
    r.height = 20;
    const bg = idx % 2 === 1 ? CLR.offWhite : CLR.white;
    const vals: (string | number)[] = [
      item.name,
      item.unitPrice,
      item.quantity,
      item.discount,
      item.gstRate,
      item.cessRate,
      item.gst + item.cess,
      item.total,
    ];
    vals.forEach((val, i) => {
      const c = r.getCell(i + 1);
      c.value = val;
      c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      c.border = BORDER_THIN;
      if (i === 0) {
        c.font = FONT_BODY;
        c.alignment = { vertical: "middle", indent: 1 };
      } else if (i === 3 || i === 4 || i === 5) {
        c.numFmt = '0.##"%"';
        c.font = FONT_MUTED;
        c.alignment = { vertical: "middle", horizontal: "right" };
      } else if (i === 2) {
        c.font = FONT_BODY;
        c.alignment = { vertical: "middle", horizontal: "right" };
      } else {
        c.numFmt = NUM_FMT_DEC;
        c.font = i === 7 ? FONT_BOLD : FONT_BODY;
        c.alignment = { vertical: "middle", horizontal: "right" };
      }
    });
    row++;
  });

  // Subtotal row with matching 2-decimal formatting
  const subR = ws.getRow(row);
  subR.height = 24;
  ws.mergeCells(row, 1, row, 6);
  subR.getCell(1).value = `Subtotal (${result.items.length} line items)`;
  subR.getCell(1).font = FONT_TOTAL;
  subR.getCell(1).alignment = { vertical: "middle", indent: 1 };
  for (let c = 1; c <= 6; c++) {
    subR.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.lightGray } };
    subR.getCell(c).border = BORDER_MED;
  }
  subR.getCell(7).value = result.totalGst + result.totalCess;
  subR.getCell(7).numFmt = NUM_FMT_DEC;
  subR.getCell(7).font = FONT_TOTAL;
  subR.getCell(7).fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.lightGray } };
  subR.getCell(7).alignment = { vertical: "middle", horizontal: "right" };
  subR.getCell(7).border = BORDER_MED;

  subR.getCell(8).value = result.grandTotalExact;
  subR.getCell(8).numFmt = NUM_FMT_DEC;
  subR.getCell(8).font = FONT_TOTAL;
  subR.getCell(8).fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.lightGray } };
  subR.getCell(8).alignment = { vertical: "middle", horizontal: "right" };
  subR.getCell(8).border = BORDER_MED;
  row++;
  row = addSpacer(ws, row);

  // Section B: Tax Breakdown
  row = addSectionHeader(ws, "B. GST Tax Breakdown", row, COLS);
  row = addKVRow(ws, "Taxable Value (Base Turnover)", result.subTotal, row, COLS);
  if (result.totalDiscount > 0) {
    row = addKVRow(ws, "Pre-Supply Discount Allowed (Sec 15(3))", -result.totalDiscount, row, COLS, { striped: true });
  }
  if (!isComposition) {
    if (result.effectivePlaceOfSupply === "intra") {
      row = addKVRow(ws, "Central GST (CGST — 50%)", result.cgst, row, COLS);
      row = addKVRow(ws, "State / UT GST (SGST — 50%)", result.sgst, row, COLS, { striped: true });
    } else {
      row = addKVRow(ws, "Integrated GST (IGST — 100%)", result.igst, row, COLS);
    }
    if (result.totalCess > 0) {
      row = addKVRow(ws, "Compensation Cess", result.totalCess, row, COLS, { striped: true });
    }
  }
  row = addTotalRow(ws, isComposition ? "Bill of Supply Total (Sec 10(4))" : "Grand Total Invoice Amount (Exact)", result.grandTotalExact, row, COLS);
  row = addSpacer(ws, row);

  // Section C: Rule 88A / Composition / RCM Cash Settlement
  row = addSectionHeader(ws, "C. Net Cash Liability & ITC Ledger (Sec 49 / Rule 88A)", row, COLS);
  if (isComposition) {
    const comp = COMPOSITION_CATEGORIES[input.compositionCategory];
    row = addKVRow(ws, `Composition Rate (${comp.section})`, `${comp.rate}% (${comp.cgstRate}% CGST + ${comp.sgstRate}% SGST)`, row, COLS);
    row = addKVRow(ws, "Composition Tax Payable Out-of-Pocket (Exact)", result.compositionTax, row, COLS, { striped: true, bold: true });
  } else if (isRcm) {
    row = addKVRow(ws, "Supplier Output Tax Liability", 0, row, COLS);
    row = addKVRow(ws, "Recipient Mandatory RCM Cash Liability (Sec 49(4))", result.recipientRcmCashLiabilityExact, row, COLS, { striped: true, bold: true });
  } else {
    const u = result.rule88A;
    row = addKVRow(ws, "Total ITC Offset Utilized (Rule 88A Order)", -u.utilized.totalUtilized, row, COLS, { font: { ...FONT_BOLD, color: { argb: CLR.green } } });
    if (u.cashPayable.igst > 0) row = addKVRow(ws, "Cash IGST Payable", u.cashPayable.igst, row, COLS, { striped: true });
    if (u.cashPayable.cgst > 0) row = addKVRow(ws, "Cash CGST Payable", u.cashPayable.cgst, row, COLS);
    if (u.cashPayable.sgst > 0) row = addKVRow(ws, "Cash SGST Payable", u.cashPayable.sgst, row, COLS, { striped: true });
    if (u.cashPayable.cess > 0) row = addKVRow(ws, "Cash Compensation Cess Payable (Separate Head)", u.cashPayable.cess, row, COLS);
    if (u.carryForward.total > 0) {
      row = addKVRow(ws, "Unutilized Electronic Credit Ledger Carry-Forward", u.carryForward.total, row, COLS, {
        striped: true,
        font: { ...FONT_BOLD, color: { argb: CLR.green } },
      });
    }
  }

  const finalCashRounded = isRcm ? result.recipientRcmCashLiabilityRounded : result.supplierCashLiabilityRounded;
  row = addTotalRow(
    ws,
    isRcm ? "Recipient Mandatory Cash Payable (Sec 170 Rounded)" : "Net Cash GST Payable (Sec 170 Rounded)",
    finalCashRounded,
    row,
    COLS,
    { bg: CLR.navy, font: FONT_GRAND, numFmt: NUM_FMT_INT }
  );
  row = addSpacer(ws, row);

  if (input.showMarginMode && input.marginPct > 0) {
    row = addSectionHeader(ws, "D. Markup & Profit Analysis", row, COLS);
    row = addKVRow(ws, "Applied Markup %", `${input.marginPct}%`, row, COLS);
    row = addKVRow(ws, "Estimated Margin Profit (Exact Markup Formula)", result.estimatedMarginProfit, row, COLS, { striped: true, bold: true });
    row = addSpacer(ws, row);
  }

  // Footer
  ws.mergeCells(row, 1, row, COLS);
  ws.getCell(row, 1).value = "Disclaimer: Computer-generated GST 2.0 estimate per CGST/IGST Act. Not a statutory tax invoice.";
  ws.getCell(row, 1).font = { name: "Calibri", size: 7.5, italic: true, color: { argb: CLR.textMuted } };
  ws.getCell(row, 1).alignment = { vertical: "middle", indent: 1 };
  ws.getRow(row).height = 22;
  row++;

  ws.mergeCells(row, 1, row, COLS);
  const fc = ws.getCell(row, 1);
  fc.value = `Generated by TaxFiling24  •  www.taxfiling24.com  •  ${new Date().toLocaleString("en-IN")}`;
  fc.font = { name: "Calibri", size: 8, color: { argb: CLR.gold } };
  fc.alignment = { vertical: "middle", horizontal: "center" };
  fillRow(ws, row, COLS, CLR.navy);
  ws.getRow(row).height = 22;

  ws.pageSetup.printArea = `A1:H${row}`;
  ws.pageSetup.margins = { left: 0.4, right: 0.4, top: 0.3, bottom: 0.3, header: 0.15, footer: 0.15 };

  const buffer = await wb.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}
