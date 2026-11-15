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
  amber: rgb(0.72, 0.52, 0.12),
  amberBg: rgb(0.99, 0.97, 0.92),
  stripeBg: rgb(0.985, 0.988, 0.995),    // Table alternating row
  accentBar: rgb(0.16, 0.44, 0.82),
};

const PW = 595.28;
const PH = 841.89;
const ML = 44;
const MR = 44;
const CW = PW - ML - MR;

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

export interface GstReportData {
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

function fmt(val: number): string {
  const f = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(val));
  return `Rs. ${f}`;
}

function fmtDec(val: number): string {
  const f = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(val);
  return `Rs. ${f}`;
}

// ── Drawing primitives ─────────────────────────────────────────────
function drawLine(p: PDFPage, y: number, color = C.border, t = 0.5) {
  p.drawLine({ start: { x: ML, y }, end: { x: PW - MR, y }, thickness: t, color });
}

function drawRect(p: PDFPage, x: number, y: number, w: number, h: number, c: ReturnType<typeof rgb>) {
  p.drawRectangle({ x, y, width: w, height: h, color: c });
}

function drawBorderedBox(
  p: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  bg: ReturnType<typeof rgb>,
  border: ReturnType<typeof rgb>
) {
  p.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: bg,
    borderColor: border,
    borderWidth: 0.75,
  });
}

function sectionHeader(p: PDFPage, title: string, y: number, fb: PDFFont): number {
  drawRect(p, ML, y - 2, 3, 13, C.accent);
  p.drawText(clean(title.toUpperCase()), { x: ML + 10, y, size: 8.5, font: fb, color: C.primary });
  return y - 22;
}

function kvRow(
  p: PDFPage,
  label: string,
  value: string,
  y: number,
  fr: PDFFont,
  fb: PDFFont,
  striped = false,
  highlight = false
): number {
  if (striped) drawRect(p, ML, y - 4, CW, 18, C.stripeBg);
  const color = highlight ? C.success : C.textBody;
  p.drawText(clean(label), { x: ML + 8, y: y + 2, size: 8, font: fr, color: C.textDark });
  const cleanedVal = clean(value);
  const tw = fb.widthOfTextAtSize(cleanedVal, 8);
  p.drawText(cleanedVal, { x: PW - MR - 8 - tw, y: y + 2, size: 8, font: fb, color });
  return y - 18;
}

// ══════════════════════════════════════════════════════════════════════
// Main Clean PDF Builder
// ══════════════════════════════════════════════════════════════════════
export async function generateGstReportPdf(data: GstReportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fr = await doc.embedFont(StandardFonts.Helvetica);
  const fb = await doc.embedFont(StandardFonts.HelveticaBold);
  const fi = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page = doc.addPage([PW, PH]);
  let y = PH;

  const drawPageFooter = (p: PDFPage, pageNum: number, total: number) => {
    drawLine(p, 36, C.border, 0.5);
    p.drawText("TaxFiling24 - Chartered Tax Advisory", { x: ML, y: 22, size: 7, font: fb, color: C.textMuted });
    const disclaimer = "Computer-generated GST computation summary. Not a tax invoice.";
    p.drawText(disclaimer, { x: ML, y: 12, size: 6, font: fi, color: C.textLight });

    const pgText = `Page ${pageNum} of ${total}`;
    const pgW = fr.widthOfTextAtSize(pgText, 7);
    p.drawText(pgText, { x: PW - MR - pgW, y: 22, size: 7, font: fr, color: C.textMuted });
    const urlText = "www.taxfiling24.com";
    const uW = fr.widthOfTextAtSize(urlText, 6.5);
    p.drawText(urlText, { x: PW - MR - uW, y: 12, size: 6.5, font: fr, color: C.accent });
  };

  const addPageIfNeeded = (needed: number) => {
    if (y - needed < 70) {
      page = doc.addPage([PW, PH]);
      y = PH - 44;
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // TOP ACCENT BRAND BAR
  // ─────────────────────────────────────────────────────────────────
  drawRect(page, 0, PH - 4, PW, 4, C.accentBar);

  // ─────────────────────────────────────────────────────────────────
  // HEADER (Pure Clean White Paper Letterhead)
  // ─────────────────────────────────────────────────────────────────
  y = PH - 38;
  page.drawText("TaxFiling24", { x: ML, y, size: 18, font: fb, color: C.primary });
  const brandSub = "GST & TAX COMPLIANCE REPORT";
  page.drawText(brandSub, { x: ML, y: y - 14, size: 8, font: fb, color: C.accent });

  // Date & Report Badge on Right
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const refCode = `REF-GST-${Date.now().toString().slice(-6)}`;
  
  const rightTopText = "COMPUTATION SUMMARY";
  let tw = fb.widthOfTextAtSize(rightTopText, 9);
  page.drawText(rightTopText, { x: PW - MR - tw, y, size: 9, font: fb, color: C.primary });

  const dateLine = `Generated: ${dateStr}`;
  tw = fr.widthOfTextAtSize(dateLine, 7.5);
  page.drawText(dateLine, { x: PW - MR - tw, y: y - 12, size: 7.5, font: fr, color: C.textMuted });

  tw = fr.widthOfTextAtSize(refCode, 7);
  page.drawText(refCode, { x: PW - MR - tw, y: y - 22, size: 7, font: fr, color: C.textLight });

  y -= 34;
  drawLine(page, y, C.border, 0.75);
  y -= 16;

  // ─────────────────────────────────────────────────────────────────
  // CONFIGURATION BAR (Light subtle container)
  // ─────────────────────────────────────────────────────────────────
  drawBorderedBox(page, ML, y - 16, CW, 26, C.bgLight, C.border);
  
  const tags = [
    `Mode: ${data.calcMode === "exclusive" ? "Exclusive (Tax Added)" : "Inclusive (Tax Deducted)"}`,
    `Supply: ${data.placeOfSupply === "intra" ? "Intra-State (CGST + SGST)" : "Inter-State (IGST)"}`,
    `Scheme: ${data.taxScheme === "composition" ? "Composition" : "Regular"}`,
    data.isRcm ? "RCM: Yes" : "",
  ].filter(Boolean);

  let curX = ML + 10;
  tags.forEach((tag) => {
    const cleanTag = clean(tag);
    page.drawText(cleanTag, { x: curX, y: y - 7, size: 7, font: fb, color: C.primary });
    curX += fb.widthOfTextAtSize(cleanTag, 7) + 16;
  });

  y -= 34;

  // ─────────────────────────────────────────────────────────────────
  // SECTION 1: LINE ITEMS TABLE
  // ─────────────────────────────────────────────────────────────────
  y = sectionHeader(page, "Invoice Line Items", y, fb);

  const cols = [ML + 6, ML + 160, ML + 215, ML + 270, ML + 330, ML + 390, PW - MR - 6];
  const headers = ["Description", "Unit Price", "Qty", "Disc %", "GST %", "Tax Amt", "Line Total"];

  // Table header: light fill with subtle borders
  drawBorderedBox(page, ML, y - 4, CW, 18, C.bgLight, C.border);
  headers.forEach((h, i) => {
    const xPos = i === headers.length - 1 ? cols[i] - fb.widthOfTextAtSize(h, 6.8) : cols[i];
    page.drawText(h, { x: xPos, y: y + 2, size: 6.8, font: fb, color: C.primary });
  });
  y -= 20;

  // Table rows
  const renderItems = data.items && data.items.length > 0 ? data.items : [];
  if (renderItems.length === 0) {
    drawRect(page, ML, y - 4, CW, 18, C.stripeBg);
    page.drawText("Quick computation item", { x: cols[0], y: y + 2, size: 7.5, font: fr, color: C.textDark });
    page.drawText(fmt(data.subTotal), { x: cols[1], y: y + 2, size: 7.5, font: fr, color: C.textDark });
    page.drawText("1", { x: cols[2], y: y + 2, size: 7.5, font: fr, color: C.textDark });
    page.drawText("0%", { x: cols[3], y: y + 2, size: 7.5, font: fr, color: C.textDark });
    const effectiveRate = data.subTotal > 0 ? Math.round((data.totalGst / data.subTotal) * 100) : 18;
    page.drawText(`${effectiveRate}%`, { x: cols[4], y: y + 2, size: 7.5, font: fr, color: C.textDark });
    page.drawText(fmtDec(data.totalGst), { x: cols[5], y: y + 2, size: 7.5, font: fb, color: C.textDark });
    const totW = fb.widthOfTextAtSize(fmtDec(data.grandTotal), 7.5);
    page.drawText(fmtDec(data.grandTotal), { x: PW - MR - 6 - totW, y: y + 2, size: 7.5, font: fb, color: C.textDark });
    y -= 18;
  } else {
    renderItems.forEach((item, idx) => {
      addPageIfNeeded(20);
      if (idx % 2 === 1) drawRect(page, ML, y - 4, CW, 18, C.stripeBg);

      const rawName = item.name || `Item ${idx + 1}`;
      const name = rawName.length > 24 ? rawName.substring(0, 24) + "..." : rawName;
      page.drawText(clean(name), { x: cols[0], y: y + 2, size: 7.5, font: fr, color: C.textDark });
      page.drawText(fmt(item.unitPrice), { x: cols[1], y: y + 2, size: 7.5, font: fr, color: C.textDark });
      page.drawText(String(item.quantity), { x: cols[2], y: y + 2, size: 7.5, font: fr, color: C.textDark });
      page.drawText(`${item.discount}%`, { x: cols[3], y: y + 2, size: 7.5, font: fr, color: C.textDark });
      page.drawText(`${item.gstRate}%`, { x: cols[4], y: y + 2, size: 7.5, font: fr, color: C.textDark });
      page.drawText(fmtDec(item.gst + item.cess), { x: cols[5], y: y + 2, size: 7.5, font: fb, color: C.textDark });

      const totStr = fmtDec(item.total);
      const totW = fb.widthOfTextAtSize(totStr, 7.5);
      page.drawText(totStr, { x: PW - MR - 6 - totW, y: y + 2, size: 7.5, font: fb, color: C.textDark });
      y -= 18;
    });
  }

  // Subtotal strip
  addPageIfNeeded(24);
  drawBorderedBox(page, ML, y - 4, CW, 20, C.bgCard, C.border);
  page.drawText(`Taxable Subtotal (${renderItems.length || 1} items)`, {
    x: ML + 8,
    y: y + 2,
    size: 8,
    font: fb,
    color: C.primary,
  });
  const stStr = fmt(data.subTotal);
  tw = fb.widthOfTextAtSize(stStr, 8.5);
  page.drawText(stStr, { x: PW - MR - 8 - tw, y: y + 2, size: 8.5, font: fb, color: C.primary });
  y -= 28;

  // ─────────────────────────────────────────────────────────────────
  // SECTION 2: TAX COMPUTATION BREAKDOWN
  // ─────────────────────────────────────────────────────────────────
  addPageIfNeeded(110);
  y = sectionHeader(page, "Tax Computation Breakdown", y, fb);

  y = kvRow(page, "Net Taxable Base Value", fmt(data.subTotal), y, fr, fb);

  if (data.totalDiscount > 0) {
    y = kvRow(page, "Total Discount Allowed", `(-) ${fmt(data.totalDiscount)}`, y, fr, fb, true);
  }

  if (data.placeOfSupply === "intra") {
    y = kvRow(page, "Central GST (CGST) - 50%", fmtDec(data.cgst), y, fr, fb);
    y = kvRow(page, "State GST (SGST / UTGST) - 50%", fmtDec(data.sgst), y, fr, fb, true);
  } else {
    y = kvRow(page, "Integrated GST (IGST) - 100%", fmtDec(data.igst), y, fr, fb);
  }

  if (data.totalCess > 0) {
    y = kvRow(page, "Compensation Cess", fmtDec(data.totalCess), y, fr, fb, true);
  }

  y = kvRow(page, "Total GST Levy", fmt(data.totalGst), y, fr, fb);

  // Grand total highlight (Clean bordered card)
  y -= 4;
  drawBorderedBox(page, ML, y - 4, CW, 22, C.bgLight, C.borderStrong);
  page.drawText("Grand Total Invoice Amount (Taxable + Taxes)", {
    x: ML + 8,
    y: y + 3,
    size: 8.5,
    font: fb,
    color: C.primary,
  });
  const gtStr = fmt(data.grandTotal);
  tw = fb.widthOfTextAtSize(gtStr, 9.5);
  page.drawText(gtStr, { x: PW - MR - 8 - tw, y: y + 2, size: 9.5, font: fb, color: C.primary });
  y -= 30;

  // ─────────────────────────────────────────────────────────────────
  // SECTION 3: ITC OFFSET & NET CASH PAYABLE
  // ─────────────────────────────────────────────────────────────────
  addPageIfNeeded(95);
  y = sectionHeader(page, "Input Tax Credit (ITC) & Net Liability", y, fb);

  if (data.itcAmount > 0) {
    y = kvRow(page, "Purchases Claimed for ITC", fmt(data.inputPurchases), y, fr, fb);
    y = kvRow(page, `Input Tax Credit Rate (${data.inputGstRate}%)`, fmtDec(data.itcAmount), y, fr, fb, true);
    y = kvRow(page, "Eligible ITC Credit Offset", `(-) ${fmt(data.itcAmount)}`, y, fr, fb, false, true);
  } else {
    y = kvRow(page, "Input Tax Credit (ITC)", "No ITC claimed / Standard", y, fr, fb);
  }

  if (data.isRcm) {
    y = kvRow(page, "Reverse Charge Mechanism (RCM)", "Applicable - Tax paid by recipient", y, fr, fb, true);
  }

  if (data.taxScheme === "composition") {
    y = kvRow(page, `Composition Scheme Rate (${data.compositionRate}%)`, fmtDec(data.compositionTax), y, fr, fb, true);
  }

  // Net payable callout card (Clean light emerald box)
  y -= 4;
  const netPayable = data.taxScheme === "composition" ? data.compositionTax : (data.isRcm ? 0 : data.netGstPayable);
  const npH = 34;
  drawBorderedBox(page, ML, y - npH + 16, CW, npH, C.successBg, C.successBorder);

  const npLabel = `Net GST Payable (Cash Liability): ${fmt(netPayable)}`;
  const npW = fb.widthOfTextAtSize(npLabel, 10.5);
  page.drawText(npLabel, { x: (PW - npW) / 2, y: y - 3, size: 10.5, font: fb, color: C.success });

  const npSub = data.taxScheme === "composition" ? "Under GST Composition Scheme" : (data.itcAmount > 0 ? "Adjusted After ITC Offset" : "Standard Cash Liability");
  const npSubW = fr.widthOfTextAtSize(npSub, 7);
  page.drawText(npSub, { x: (PW - npSubW) / 2, y: y - 15, size: 7, font: fr, color: C.textBody });
  y -= npH + 16;

  // ─────────────────────────────────────────────────────────────────
  // SECTION 4: MARGIN ANALYSIS (If enabled)
  // ─────────────────────────────────────────────────────────────────
  if (data.showMarginMode) {
    addPageIfNeeded(70);
    y = sectionHeader(page, "Margin & Profit Analysis", y, fb);
    y = kvRow(page, "Target Profit Margin", `${data.margin}%`, y, fr, fb);
    y = kvRow(page, "Estimated Margin Profit", fmt(data.subTotal * (data.margin / 100)), y, fr, fb, true);
    y = kvRow(page, "Realized Total Revenue", fmt(data.grandTotal), y, fr, fb);
    y -= 10;
  }

  // Stamp all pages with page footers
  const pages = doc.getPages();
  const totalPages = pages.length;
  pages.forEach((p, idx) => {
    drawPageFooter(p, idx + 1, totalPages);
  });

  return await doc.save();
}
