import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";
import type { GstInvoiceInput, GstInvoiceResult } from "./calculators/gst-engine";
import { COMPOSITION_CATEGORIES } from "./calculators/gst-rules";

export interface GstReportPayload {
  input: GstInvoiceInput;
  result: GstInvoiceResult;
}

// ── TaxFiling24 Deep Navy & Heritage Gold Print Palette ────────────
const C = {
  primary: rgb(0.039, 0.145, 0.251),      // #0A2540 Deep Navy
  gold: rgb(0.71, 0.54, 0.12),            // Accessible Heritage Gold Ink
  goldBar: rgb(0.831, 0.686, 0.216),      // #D4AF37 Heritage Gold
  textDark: rgb(0.06, 0.09, 0.16),
  textBody: rgb(0.28, 0.33, 0.41),
  textMuted: rgb(0.39, 0.45, 0.55),
  white: rgb(1, 1, 1),
  bgLight: rgb(0.973, 0.98, 0.988),
  bgCard: rgb(0.945, 0.961, 0.976),
  border: rgb(0.886, 0.91, 0.941),
  borderStrong: rgb(0.72, 0.78, 0.85),
  success: rgb(0.02, 0.47, 0.34),
  successBg: rgb(0.925, 0.992, 0.961),
  successBorder: rgb(0.65, 0.88, 0.78),
  amber: rgb(0.68, 0.42, 0.05),
  amberBg: rgb(1, 0.98, 0.92),
  amberBorder: rgb(0.93, 0.80, 0.48),
  stripeBg: rgb(0.984, 0.988, 0.994),
};

const PW = 595.28;
const PH = 841.89;
const ML = 44;
const MR = 44;
const CW = PW - ML - MR;

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

function fmtDec(val: number): string {
  const sign = val < 0 ? "-" : "";
  const f = new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Math.abs(val)
  );
  return `${sign}Rs. ${f}`;
}

function fmtRound(val: number): string {
  const f = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(Math.abs(val)));
  return `Rs. ${f}`;
}

function drawLine(p: PDFPage, y: number, color = C.border, t = 0.5) {
  p.drawLine({ start: { x: ML, y }, end: { x: PW - MR, y }, thickness: t, color });
}

function drawRect(p: PDFPage, x: number, y: number, w: number, h: number, c: ReturnType<typeof rgb>) {
  p.drawRectangle({ x, y, width: w, height: h, color: c });
}

function drawBox(
  p: PDFPage,
  x: number,
  y: number,
  w: number,
  h: number,
  bg: ReturnType<typeof rgb>,
  border: ReturnType<typeof rgb>
) {
  p.drawRectangle({ x, y, width: w, height: h, color: bg, borderColor: border, borderWidth: 0.75 });
}

function sectionHeader(p: PDFPage, title: string, y: number, fb: PDFFont): number {
  drawRect(p, ML, y - 2, 3, 13, C.goldBar);
  p.drawText(clean(title.toUpperCase()), { x: ML + 10, y, size: 8.5, font: fb, color: C.primary });
  return y - 20;
}

function kvRow(
  p: PDFPage,
  label: string,
  value: string,
  y: number,
  fr: PDFFont,
  fb: PDFFont,
  striped = false,
  valColor = C.textDark
): number {
  if (striped) drawRect(p, ML, y - 4, CW, 17, C.stripeBg);
  p.drawText(clean(label), { x: ML + 8, y: y + 2, size: 7.8, font: fr, color: C.textDark });
  const cVal = clean(value);
  p.drawText(cVal, { x: PW - MR - 8 - fb.widthOfTextAtSize(cVal, 7.8), y: y + 2, size: 7.8, font: fb, color: valColor });
  return y - 17;
}

export async function generateGstReportPdf(payload: GstReportPayload): Promise<Uint8Array> {
  const { input, result } = payload;
  const isComposition = result.documentType === "BILL_OF_SUPPLY";
  const isRcm = result.documentType === "RCM_INVOICE";

  const doc = await PDFDocument.create();
  const fr = await doc.embedFont(StandardFonts.Helvetica);
  const fb = await doc.embedFont(StandardFonts.HelveticaBold);
  const fi = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page = doc.addPage([PW, PH]);
  let y = PH;

  const drawPageFooter = (p: PDFPage, pageNum: number, total: number) => {
    drawLine(p, 36, C.border, 0.5);
    p.drawText("TaxFiling24 - Chartered GST & Compliance Practice", {
      x: ML,
      y: 22,
      size: 7,
      font: fb,
      color: C.primary,
    });
    p.drawText(
      "Computer-generated GST 2.0 computation summary (CGST/IGST Act). Not a statutory tax invoice.",
      { x: ML, y: 12, size: 6, font: fi, color: C.textMuted }
    );
    const pgText = `Page ${pageNum} of ${total}`;
    p.drawText(pgText, { x: PW - MR - fr.widthOfTextAtSize(pgText, 7), y: 22, size: 7, font: fr, color: C.textMuted });
    const urlText = "www.taxfiling24.com";
    p.drawText(urlText, { x: PW - MR - fb.widthOfTextAtSize(urlText, 6.5), y: 12, size: 6.5, font: fb, color: C.gold });
  };

  const addPageIfNeeded = (needed: number) => {
    if (y - needed < 66) {
      page = doc.addPage([PW, PH]);
      drawRect(page, 0, PH - 4, PW, 4, C.primary);
      y = PH - 40;
    }
  };

  // Top Navy + Gold Brand Bar
  drawRect(page, 0, PH - 5, PW, 5, C.primary);
  drawRect(page, 0, PH - 7, PW, 2, C.goldBar);

  // Header
  y = PH - 36;
  page.drawText("TaxFiling24", { x: ML, y, size: 18, font: fb, color: C.primary });
  page.drawText(clean(`${result.documentLabel.toUpperCase()} - GST 2.0 SUMMARY`), {
    x: ML,
    y: y - 14,
    size: 7.5,
    font: fb,
    color: C.gold,
  });

  const dateStr = `Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;
  const docBadge = isComposition ? "BILL OF SUPPLY" : isRcm ? "RCM COMPUTATION" : "TAX COMPUTATION";
  page.drawText(docBadge, { x: PW - MR - fb.widthOfTextAtSize(docBadge, 9.5), y, size: 9.5, font: fb, color: C.primary });
  page.drawText(dateStr, { x: PW - MR - fr.widthOfTextAtSize(dateStr, 7.5), y: y - 12, size: 7.5, font: fr, color: C.textMuted });

  y -= 32;
  drawLine(page, y, C.border, 0.75);
  y -= 14;

  // Config Strip
  drawBox(page, ML, y - 16, CW, 24, C.bgLight, C.border);
  const cfgLine = clean(
    `Pricing: ${input.calcMode === "exclusive" ? "Exclusive (+GST)" : "Inclusive"}   |   Supply: ${result.effectivePlaceOfSupply === "intra" ? "Intra-State (CGST+SGST)" : "Inter-State (IGST)"}   |   Scheme: ${isComposition ? COMPOSITION_CATEGORIES[input.compositionCategory].label : "Regular"}   |   RCM: ${isRcm ? "Yes (100% Cash by Recipient)" : "No"}`
  );
  page.drawText(cfgLine, { x: ML + 8, y: y - 7, size: 6.7, font: fb, color: C.primary });
  y -= 32;

  // Section 1: Line Items Table
  y = sectionHeader(page, isComposition ? "1. Bill of Supply Line Items (Sec 10(4) - No Tax Collected)" : "1. Invoice Line Items", y, fb);
  const cols = [ML + 6, ML + 165, ML + 230, ML + 265, ML + 310, ML + 360, ML + 425, PW - MR - 6];
  const headers = ["Description", "Unit Price", "Qty", "Disc", "GST", "Cess", "Tax Amt", "Total"];

  drawBox(page, ML, y - 4, CW, 18, C.primary, C.primary);
  headers.forEach((h, i) => {
    const xPos = i === headers.length - 1 ? cols[i] - fb.widthOfTextAtSize(h, 6.8) : cols[i];
    page.drawText(h, { x: xPos, y: y + 2, size: 6.8, font: fb, color: C.white });
  });
  y -= 20;

  result.items.forEach((item, idx) => {
    addPageIfNeeded(20);
    if (idx % 2 === 1) drawRect(page, ML, y - 4, CW, 18, C.stripeBg);
    const name = item.name.length > 26 ? `${item.name.slice(0, 26)}...` : item.name;
    page.drawText(clean(name), { x: cols[0], y: y + 2, size: 7.2, font: fr, color: C.textDark });
    page.drawText(fmtDec(item.unitPrice), { x: cols[1], y: y + 2, size: 7.2, font: fr, color: C.textDark });
    page.drawText(String(item.quantity), { x: cols[2], y: y + 2, size: 7.2, font: fr, color: C.textDark });
    page.drawText(`${item.discount}%`, { x: cols[3], y: y + 2, size: 7.2, font: fr, color: C.textDark });
    page.drawText(`${item.gstRate}%`, { x: cols[4], y: y + 2, size: 7.2, font: fr, color: C.textDark });
    page.drawText(`${item.cessRate}%`, { x: cols[5], y: y + 2, size: 7.2, font: fr, color: C.textDark });
    page.drawText(fmtDec(item.gst + item.cess), { x: cols[6], y: y + 2, size: 7.2, font: fb, color: C.textDark });
    const totStr = fmtDec(item.total);
    page.drawText(totStr, { x: PW - MR - 6 - fb.widthOfTextAtSize(totStr, 7.2), y: y + 2, size: 7.2, font: fb, color: C.textDark });
    y -= 18;
  });

  addPageIfNeeded(24);
  drawBox(page, ML, y - 4, CW, 20, C.bgCard, C.borderStrong);
  page.drawText(`Net Taxable Turnover (${result.items.length} item${result.items.length === 1 ? "" : "s"})`, {
    x: ML + 8,
    y: y + 2,
    size: 8,
    font: fb,
    color: C.primary,
  });
  const stStr = fmtDec(result.subTotal);
  page.drawText(stStr, { x: PW - MR - 8 - fb.widthOfTextAtSize(stStr, 8.2), y: y + 2, size: 8.2, font: fb, color: C.primary });
  y -= 28;

  // Section 2: Tax Breakdown
  addPageIfNeeded(130);
  y = sectionHeader(page, "2. Statutory GST & Invoice Breakdown", y, fb);
  y = kvRow(page, "Net Taxable Value (Base)", fmtDec(result.subTotal), y, fr, fb);
  if (result.totalDiscount > 0) {
    y = kvRow(page, "Total Pre-Supply Discount (Sec 15(3))", `(-) ${fmtDec(result.totalDiscount)}`, y, fr, fb, true, C.success);
  }
  if (isComposition) {
    y = kvRow(page, "GST Collected on Bill of Supply (Sec 10(4))", fmtDec(0), y, fr, fb);
  } else if (result.effectivePlaceOfSupply === "intra") {
    y = kvRow(page, "Central GST (CGST - 50%)", fmtDec(result.cgst), y, fr, fb);
    y = kvRow(page, "State / UT GST (SGST / UTGST - 50%)", fmtDec(result.sgst), y, fr, fb, true);
  } else {
    y = kvRow(page, "Integrated GST (IGST - 100%)", fmtDec(result.igst), y, fr, fb);
  }
  if (result.totalCess > 0) {
    y = kvRow(page, "Compensation Cess", fmtDec(result.totalCess), y, fr, fb, true, C.amber);
  }

  addPageIfNeeded(26);
  y -= 3;
  drawBox(page, ML, y - 4, CW, 22, C.bgCard, C.borderStrong);
  page.drawText(isComposition ? "Bill of Supply Total (Payable by Buyer)" : "Grand Total Invoice Amount (Exact)", {
    x: ML + 8,
    y: y + 3,
    size: 8.3,
    font: fb,
    color: C.primary,
  });
  const gtStr = fmtDec(result.grandTotalExact);
  page.drawText(gtStr, { x: PW - MR - 8 - fb.widthOfTextAtSize(gtStr, 9), y: y + 2, size: 9, font: fb, color: C.primary });
  y -= 28;

  // Section 3: Settlement / Rule 88A ITC / Composition / RCM
  addPageIfNeeded(125);
  y = sectionHeader(page, "3. Cash Liability & Electronic Credit Ledger (Sec 49 / Rule 88A)", y, fb);

  if (isComposition) {
    const compInfo = COMPOSITION_CATEGORIES[input.compositionCategory];
    y = kvRow(page, `Composition Levy (${compInfo.rate}% on Turnover - ${compInfo.section})`, fmtDec(result.compositionTax), y, fr, fb);
    y = kvRow(page, `CGST (${compInfo.cgstRate}%) + SGST (${compInfo.sgstRate}%) Out-of-Pocket`, `${fmtDec(result.compositionCgst)} + ${fmtDec(result.compositionSgst)}`, y, fr, fb, true);
    y = kvRow(page, "Input Tax Credit (ITC)", "Not Permitted u/s 10(4)", y, fr, fb);
  } else if (isRcm) {
    y = kvRow(page, "Supplier Output GST Cash Liability", fmtDec(0), y, fr, fb);
    y = kvRow(page, "Recipient Mandatory RCM Cash Liability (Sec 9(3) & 49(4))", fmtDec(result.recipientRcmCashLiabilityExact), y, fr, fb, true, C.amber);
    y = kvRow(page, "ITC Utilization on RCM Output", "Prohibited u/s 49(4) - 100% Cash Required", y, fr, fb);
  } else {
    const u = result.rule88A;
    y = kvRow(page, "Total ITC Offset Applied (Rule 88A Order)", `(-) ${fmtDec(u.utilized.totalUtilized)}`, y, fr, fb, false, C.success);
    if (u.cashPayable.igst > 0) y = kvRow(page, "Net IGST Cash Payable", fmtDec(u.cashPayable.igst), y, fr, fb, true);
    if (u.cashPayable.cgst > 0) y = kvRow(page, "Net CGST Cash Payable", fmtDec(u.cashPayable.cgst), y, fr, fb);
    if (u.cashPayable.sgst > 0) y = kvRow(page, "Net SGST Cash Payable", fmtDec(u.cashPayable.sgst), y, fr, fb, true);
    if (u.cashPayable.cess > 0) y = kvRow(page, "Compensation Cess Cash Payable (Separate Head)", fmtDec(u.cashPayable.cess), y, fr, fb, false, C.amber);
    if (u.carryForward.total > 0) {
      y = kvRow(
        page,
        `Unutilized ITC Carry-Forward (IGST ${fmtDec(u.carryForward.igst)}, CGST ${fmtDec(u.carryForward.cgst)}, SGST ${fmtDec(u.carryForward.sgst)})`,
        fmtDec(u.carryForward.total),
        y,
        fr,
        fb,
        true,
        C.success
      );
    }
  }

  // Final Cash Callout Box
  addPageIfNeeded(44);
  y -= 4;
  const finalCashExact = isRcm ? result.recipientRcmCashLiabilityExact : result.supplierCashLiabilityExact;
  const finalCashRounded = isRcm ? result.recipientRcmCashLiabilityRounded : result.supplierCashLiabilityRounded;
  drawBox(page, ML, y - 24, CW, 34, isRcm ? C.amberBg : C.successBg, isRcm ? C.amberBorder : C.successBorder);
  const headline = clean(
    isRcm
      ? `Recipient Mandatory Cash Liability (Sec 170): ${fmtRound(finalCashRounded)} (Exact: ${fmtDec(finalCashExact)})`
      : `Net Cash GST Payable (Sec 170 Rounded): ${fmtRound(finalCashRounded)} (Exact: ${fmtDec(finalCashExact)})`
  );
  page.drawText(headline, {
    x: (PW - fb.widthOfTextAtSize(headline, 9)) / 2,
    y: y - 10,
    size: 9,
    font: fb,
    color: isRcm ? C.amber : C.success,
  });
  y -= 40;

  // Optional Margin Analysis (Exact Markup Profit Formula)
  if (input.showMarginMode && input.marginPct > 0) {
    addPageIfNeeded(65);
    y = sectionHeader(page, "4. Markup & Profit Margin Analysis", y, fb);
    y = kvRow(page, "Applied Markup Percentage", `${input.marginPct}%`, y, fr, fb);
    y = kvRow(page, "Estimated Profit Margin (Exact Markup Formula)", fmtDec(result.estimatedMarginProfit), y, fr, fb, true, C.success);
  }

  const pages = doc.getPages();
  pages.forEach((p, idx) => drawPageFooter(p, idx + 1, pages.length));

  return await doc.save();
}
