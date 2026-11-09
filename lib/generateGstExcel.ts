import ExcelJS from "exceljs";

// ── Types ──────────────────────────────────────────────────────────
interface GstItem {
  name: string;
  unitPrice: number;
  quantity: number;
  gstRate: number;
  cessRate: number;
  discount: number;
  basePrice: number;
  gst: number;
  cess: number;
  total: number;
  discountVal: number;
}

export interface GstExcelData {
  calcMode: string;
  placeOfSupply: string;
  taxScheme: string;
  isRcm: boolean;
  showMarginMode: boolean;
  margin: number;
  inputPurchases: number;
  inputGstRate: number;
  items: GstItem[];
  subTotal: number;
  totalGst: number;
  totalCess: number;
  totalDiscount: number;
  grandTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  itcAmount: number;
  netGstPayable: number;
  compositionTax: number;
  compositionRate: number;
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
  amber: "B8941F",
  amberBg: "FFF9E5",
  blueBg: "EEF1FC",
};

// ── Styles ─────────────────────────────────────────────────────────
const FONT_BRAND: Partial<ExcelJS.Font> = { name: "Calibri", size: 16, bold: true, color: { argb: CLR.white } };
const FONT_SECTION: Partial<ExcelJS.Font> = { name: "Calibri", size: 11, bold: true, color: { argb: CLR.primaryDark } };
const FONT_HEADER: Partial<ExcelJS.Font> = { name: "Calibri", size: 9, bold: true, color: { argb: CLR.white } };
const FONT_BODY: Partial<ExcelJS.Font> = { name: "Calibri", size: 9.5, color: { argb: CLR.textDark } };
const FONT_BODY_MUTED: Partial<ExcelJS.Font> = { name: "Calibri", size: 9, color: { argb: CLR.textMuted } };
const FONT_BOLD: Partial<ExcelJS.Font> = { name: "Calibri", size: 9.5, bold: true, color: { argb: CLR.textDark } };
const FONT_TOTAL: Partial<ExcelJS.Font> = { name: "Calibri", size: 10, bold: true, color: { argb: CLR.primaryDark } };
const FONT_GRAND: Partial<ExcelJS.Font> = { name: "Calibri", size: 11, bold: true, color: { argb: CLR.white } };

const BORDER_THIN: Partial<ExcelJS.Borders> = {
  bottom: { style: "thin", color: { argb: CLR.midGray } },
};
const BORDER_MED: Partial<ExcelJS.Borders> = {
  bottom: { style: "medium", color: { argb: CLR.primary } },
};

const NUM_FMT = '₹ #,##0';
const NUM_FMT_DEC = '₹ #,##0.00';
const PCT_FMT = '0"%"';

// ── Helpers ────────────────────────────────────────────────────────
function fillRow(ws: ExcelJS.Worksheet, row: number, colCount: number, color: string) {
  for (let c = 1; c <= colCount; c++) {
    ws.getRow(row).getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
  }
}

function addSectionHeader(ws: ExcelJS.Worksheet, title: string, row: number, cols: number): number {
  ws.mergeCells(row, 1, row, cols);
  const cell = ws.getCell(row, 1);
  cell.value = title;
  cell.font = FONT_SECTION;
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.blueBg } };
  cell.border = { bottom: { style: "medium", color: { argb: CLR.primary } } };
  cell.alignment = { vertical: "middle", indent: 1 };
  fillRow(ws, row, cols, CLR.blueBg);
  ws.getRow(row).height = 24;
  return row + 1;
}

function addSpacer(ws: ExcelJS.Worksheet, row: number): number {
  ws.getRow(row).height = 8;
  return row + 1;
}

function addKVRow(
  ws: ExcelJS.Worksheet, label: string, value: number | string, row: number,
  cols: number, options?: { bold?: boolean; striped?: boolean; numFmt?: string; font?: Partial<ExcelJS.Font> }
): number {
  const r = ws.getRow(row);
  r.height = 19;
  const bg = options?.striped ? CLR.offWhite : CLR.white;

  const labelCell = r.getCell(1);
  ws.mergeCells(row, 1, row, cols - 1);
  labelCell.value = label;
  labelCell.font = options?.bold ? FONT_BOLD : FONT_BODY;
  labelCell.alignment = { vertical: "middle", indent: 1 };
  for (let c = 1; c <= cols - 1; c++) {
    r.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    r.getCell(c).border = BORDER_THIN;
  }

  const valCell = r.getCell(cols);
  if (typeof value === "number") {
    valCell.value = value;
    valCell.numFmt = options?.numFmt ?? NUM_FMT;
  } else {
    valCell.value = value;
  }
  valCell.font = options?.font ?? (options?.bold ? FONT_BOLD : FONT_BODY);
  valCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
  valCell.alignment = { vertical: "middle", horizontal: "right" };
  valCell.border = BORDER_THIN;

  return row + 1;
}

function addTotalRow(
  ws: ExcelJS.Worksheet, label: string, value: number | string, row: number, cols: number,
  options?: { bg?: string; font?: Partial<ExcelJS.Font> }
): number {
  const r = ws.getRow(row);
  r.height = 24;
  const bg = options?.bg ?? CLR.lightGray;
  const font = options?.font ?? FONT_TOTAL;

  ws.mergeCells(row, 1, row, cols - 1);
  const labelCell = r.getCell(1);
  labelCell.value = label;
  labelCell.font = font;
  labelCell.alignment = { vertical: "middle", indent: 1 };

  const valCell = r.getCell(cols);
  if (typeof value === "number") {
    valCell.value = value;
    valCell.numFmt = NUM_FMT;
  } else {
    valCell.value = value;
  }
  valCell.font = font;
  valCell.alignment = { vertical: "middle", horizontal: "right" };

  for (let c = 1; c <= cols; c++) {
    r.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
    r.getCell(c).border = BORDER_MED;
  }
  return row + 1;
}

// ══════════════════════════════════════════════════════════════════════
// Main Export
// ══════════════════════════════════════════════════════════════════════
export async function generateGstExcel(data: GstExcelData): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "TaxFiling24";
  wb.created = new Date();

  // ─── Sheet 1: Invoice Summary ────────────────────────────────────
  const ws = wb.addWorksheet("GST Invoice", {
    properties: { defaultRowHeight: 18 },
    pageSetup: { paperSize: 9, orientation: "portrait", fitToPage: true },
    views: [{ showGridLines: false }],
  });

  // Column widths (8 columns for line items)
  ws.getColumn(1).width = 28;  // Description
  ws.getColumn(2).width = 14;  // Unit Price
  ws.getColumn(3).width = 8;   // Qty
  ws.getColumn(4).width = 9;   // Discount %
  ws.getColumn(5).width = 9;   // GST %
  ws.getColumn(6).width = 9;   // Cess %
  ws.getColumn(7).width = 14;  // Tax Amount
  ws.getColumn(8).width = 15;  // Line Total

  const COLS = 8;
  let row = 1;

  // ═══════════════════════════════════════════════════════════════════
  // BRANDED HEADER (3 rows)
  // ═══════════════════════════════════════════════════════════════════
  ws.mergeCells(row, 1, row + 2, COLS);
  const headerCell = ws.getCell(row, 1);
  headerCell.value = "TaxFiling24";
  headerCell.font = FONT_BRAND;
  headerCell.alignment = { vertical: "middle", horizontal: "left", indent: 2 };
  for (let r = row; r <= row + 2; r++) fillRow(ws, r, COLS, CLR.darkNavy);
  ws.getRow(row).height = 18;
  ws.getRow(row + 1).height = 18;
  ws.getRow(row + 2).height = 18;
  row += 3;

  // Sub-header
  const infoRow = ws.getRow(row);
  infoRow.height = 22;
  const infos = [
    "GST Invoice Computation Report",
    `Mode: ${data.calcMode === "exclusive" ? "Exclusive" : "Inclusive"}`,
    `Supply: ${data.placeOfSupply === "intra" ? "Intra-State" : "Inter-State"}`,
    `Scheme: ${data.taxScheme === "regular" ? "Regular" : "Composition"}`,
    "", "", "",
    new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
  ];
  infos.forEach((text, i) => {
    const cell = infoRow.getCell(i + 1);
    cell.value = text;
    cell.font = { name: "Calibri", size: i === 0 ? 9 : 8.5, bold: i === 0, color: { argb: "C0C8F0" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1A1D30" } };
    cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "center", indent: i === 0 ? 2 : 0 };
  });
  row++;

  // Config strip
  row = addSpacer(ws, row);
  const cfgRow = ws.getRow(row);
  cfgRow.height = 20;
  const cfgTexts = [
    data.isRcm ? "Reverse Charge: Applicable" : "Reverse Charge: N/A",
    data.showMarginMode ? `Margin Mode: ${data.margin}%` : "",
    data.itcAmount > 0 ? "ITC: Claimed" : "ITC: Not Claimed",
    "", "", "", "", "",
  ];
  cfgTexts.forEach((text, i) => {
    const cell = cfgRow.getCell(i + 1);
    cell.value = text;
    cell.font = { name: "Calibri", size: 8, color: { argb: CLR.textMuted } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.lightGray } };
    cell.alignment = { vertical: "middle", indent: i === 0 ? 1 : 0 };
    cell.border = BORDER_THIN;
  });
  row++;
  row = addSpacer(ws, row);

  // ═══════════════════════════════════════════════════════════════════
  // SECTION 1: LINE ITEMS TABLE
  // ═══════════════════════════════════════════════════════════════════
  row = addSectionHeader(ws, "A. Invoice Line Items", row, COLS);

  // Table header
  const tableHeaders = ["Description", "Unit Price", "Qty", "Disc %", "GST %", "Cess %", "Tax Amount", "Line Total"];
  const thRow = ws.getRow(row);
  thRow.height = 22;
  tableHeaders.forEach((text, i) => {
    const cell = thRow.getCell(i + 1);
    cell.value = text;
    cell.font = FONT_HEADER;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.darkNavy } };
    cell.alignment = { vertical: "middle", horizontal: i === 0 ? "left" : "right", indent: i === 0 ? 1 : 0 };
    cell.border = { bottom: { style: "thin", color: { argb: CLR.primary } } };
  });
  row++;

  // Item rows
  data.items.forEach((item, idx) => {
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
      const cell = r.getCell(i + 1);
      cell.value = val;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } };
      cell.border = BORDER_THIN;

      if (i === 0) {
        cell.font = FONT_BODY;
        cell.alignment = { vertical: "middle", indent: 1 };
      } else if (i === 3 || i === 4 || i === 5) {
        cell.numFmt = '0"%"';
        cell.font = FONT_BODY_MUTED;
        cell.alignment = { vertical: "middle", horizontal: "right" };
      } else if (i === 2) {
        cell.font = FONT_BODY;
        cell.alignment = { vertical: "middle", horizontal: "right" };
      } else {
        cell.numFmt = NUM_FMT_DEC;
        cell.font = i === 7 ? FONT_BOLD : FONT_BODY;
        cell.alignment = { vertical: "middle", horizontal: "right" };
      }
    });
    row++;
  });

  // Subtotal
  const subR = ws.getRow(row);
  subR.height = 24;
  ws.mergeCells(row, 1, row, 6);
  const subLabel = subR.getCell(1);
  subLabel.value = `Subtotal (${data.items.length} line items)`;
  subLabel.font = FONT_TOTAL;
  subLabel.alignment = { vertical: "middle", indent: 1 };
  for (let c = 1; c <= 6; c++) {
    subR.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.lightGray } };
    subR.getCell(c).border = BORDER_MED;
  }
  // Tax subtotal
  const taxSubCell = subR.getCell(7);
  taxSubCell.value = data.totalGst + data.totalCess;
  taxSubCell.numFmt = NUM_FMT;
  taxSubCell.font = FONT_TOTAL;
  taxSubCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.lightGray } };
  taxSubCell.alignment = { vertical: "middle", horizontal: "right" };
  taxSubCell.border = BORDER_MED;
  // Grand subtotal
  const grandSubCell = subR.getCell(8);
  grandSubCell.value = data.grandTotal;
  grandSubCell.numFmt = NUM_FMT;
  grandSubCell.font = FONT_TOTAL;
  grandSubCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.lightGray } };
  grandSubCell.alignment = { vertical: "middle", horizontal: "right" };
  grandSubCell.border = BORDER_MED;
  row++;
  row = addSpacer(ws, row);

  // ═══════════════════════════════════════════════════════════════════
  // SECTION 2: TAX BREAKDOWN (uses 8-col merged layout)
  // ═══════════════════════════════════════════════════════════════════
  row = addSectionHeader(ws, "B. GST Tax Breakdown", row, COLS);

  row = addKVRow(ws, "Taxable Value (Base Amount)", data.subTotal, row, COLS);

  if (data.totalDiscount > 0) {
    row = addKVRow(ws, "Less: Total Discounts Applied", -data.totalDiscount, row, COLS, { striped: true });
  }

  if (data.placeOfSupply === "intra") {
    row = addKVRow(ws, "Central GST (CGST) — 50% of Total GST", data.cgst, row, COLS, { numFmt: NUM_FMT_DEC });
    row = addKVRow(ws, "State GST (SGST / UTGST) — 50% of Total GST", data.sgst, row, COLS, { striped: true, numFmt: NUM_FMT_DEC });
  } else {
    row = addKVRow(ws, "Integrated GST (IGST) — 100% of Total GST", data.igst, row, COLS, { numFmt: NUM_FMT_DEC });
  }

  if (data.totalCess > 0) {
    row = addKVRow(ws, "Compensation Cess (on applicable items)", data.totalCess, row, COLS, { striped: true, numFmt: NUM_FMT_DEC });
  }

  row = addTotalRow(ws, "Total GST Collected on Invoice", data.totalGst + data.totalCess, row, COLS);
  row = addSpacer(ws, row);

  // ═══════════════════════════════════════════════════════════════════
  // SECTION 3: ITC & NET PAYABLE
  // ═══════════════════════════════════════════════════════════════════
  row = addSectionHeader(ws, "C. Input Tax Credit (ITC) & Net GST Liability", row, COLS);

  if (data.itcAmount > 0) {
    row = addKVRow(ws, "Total Purchases (for ITC computation)", data.inputPurchases, row, COLS);
    row = addKVRow(ws, `Input GST Rate Applied`, `${data.inputGstRate}%`, row, COLS, { striped: true });
    row = addKVRow(ws, "Eligible ITC Amount", data.itcAmount, row, COLS, { numFmt: NUM_FMT_DEC, font: { name: "Calibri", size: 9.5, bold: true, color: { argb: CLR.green } } });
  } else {
    row = addKVRow(ws, "Input Tax Credit (ITC)", "No ITC Claimed", row, COLS);
  }

  if (data.isRcm) {
    row = addKVRow(ws, "Reverse Charge Mechanism (RCM)", "Applicable — Tax liability on recipient", row, COLS, { striped: true });
  }

  if (data.taxScheme === "composition") {
    row = addKVRow(ws, `Composition Scheme Tax Rate`, `${data.compositionRate}%`, row, COLS, { striped: true });
    row = addKVRow(ws, "Composition Tax Payable", data.compositionTax, row, COLS, { bold: true, numFmt: NUM_FMT_DEC });
  }

  const netPayable = data.taxScheme === "composition" ? data.compositionTax : (data.isRcm ? 0 : data.netGstPayable);
  row = addTotalRow(ws, "Net GST Payable (Cash Liability)", netPayable, row, COLS, {
    bg: CLR.primary,
    font: FONT_GRAND,
  });
  row = addSpacer(ws, row);

  // ═══════════════════════════════════════════════════════════════════
  // SECTION 4: GRAND TOTAL HIGHLIGHT
  // ═══════════════════════════════════════════════════════════════════
  ws.mergeCells(row, 1, row, COLS);
  const gtCell = ws.getCell(row, 1);
  gtCell.value = `Grand Total Invoice Value: ₹ ${data.grandTotal.toLocaleString("en-IN")}  |  Net GST Liability: ₹ ${netPayable.toLocaleString("en-IN")}`;
  gtCell.font = FONT_GRAND;
  gtCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.primary } };
  gtCell.alignment = { vertical: "middle", horizontal: "center" };
  fillRow(ws, row, COLS, CLR.primary);
  ws.getRow(row).height = 30;
  row++;
  row = addSpacer(ws, row);

  // ═══════════════════════════════════════════════════════════════════
  // SECTION 5: MARGIN ANALYSIS (if enabled)
  // ═══════════════════════════════════════════════════════════════════
  if (data.showMarginMode) {
    row = addSectionHeader(ws, "D. Margin / Profit Analysis", row, COLS);
    row = addKVRow(ws, "Expected Margin Percentage", `${data.margin}%`, row, COLS);
    row = addKVRow(ws, "Estimated Margin Profit", data.subTotal * (data.margin / 100), row, COLS, { striped: true, bold: true });
    row = addKVRow(ws, "Revenue After Tax & Margin", data.grandTotal, row, COLS);
    row = addSpacer(ws, row);
  }

  // ═══════════════════════════════════════════════════════════════════
  // FOOTER
  // ═══════════════════════════════════════════════════════════════════
  ws.mergeCells(row, 1, row, COLS);
  const discCell = ws.getCell(row, 1);
  discCell.value = "Disclaimer: This is a computer-generated GST computation estimate for informational purposes only. It does not constitute a valid tax invoice. Consult a qualified GST practitioner for compliance.";
  discCell.font = { name: "Calibri", size: 7.5, italic: true, color: { argb: CLR.textMuted } };
  discCell.alignment = { vertical: "middle", wrapText: true, indent: 1 };
  ws.getRow(row).height = 24;
  row++;

  ws.mergeCells(row, 1, row, COLS);
  const footerCell = ws.getCell(row, 1);
  footerCell.value = `Generated by TaxFiling24  •  www.taxfiling24.com  •  ${new Date().toLocaleString("en-IN")}`;
  footerCell.font = { name: "Calibri", size: 7.5, color: { argb: "9CA0B8" } };
  footerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CLR.darkNavy } };
  footerCell.alignment = { vertical: "middle", horizontal: "center" };
  fillRow(ws, row, COLS, CLR.darkNavy);
  ws.getRow(row).height = 22;

  // Print setup
  ws.pageSetup.printArea = `A1:H${row}`;
  ws.pageSetup.margins = { left: 0.4, right: 0.4, top: 0.3, bottom: 0.3, header: 0.15, footer: 0.15 };

  const buffer = await wb.xlsx.writeBuffer();
  return buffer as ArrayBuffer;
}
