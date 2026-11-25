import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont } from "pdf-lib";
import {
  ProposalLineItem,
  ProposalMilestone,
  numberToIndianWords,
  round2,
} from "@/lib/proposal-math";

export type { ProposalLineItem, ProposalMilestone };
export { numberToIndianWords };

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
  primary: rgb(0.09, 0.15, 0.35), // Deep Navy
  primaryLight: rgb(0.24, 0.35, 0.72),
  accent: rgb(0.25, 0.45, 0.95), // Royal Blue
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
const FOOTER_SAFE_Y = 48;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

/**
 * Standard PDF Type-1 fonts (Helvetica) only support WinAnsi encoding.
 * Passing ₹, emojis, Devanagari, or curly punctuation crashes pdf-lib with an encoding error.
 */
export function toWinAnsiSafe(input: unknown): string {
  if (input === null || input === undefined) return "";
  const str = String(input)
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/₹/g, "Rs. ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/•/g, "-")
    .replace(/…/g, "...")
    .replace(/→/g, "->")
    .replace(/←/g, "<-")
    .replace(/\u00A0/g, " ")
    .replace(/\t/g, "  ");

  let out = "";
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (
      code === 10 || // \n
      (code >= 0x20 && code <= 0x7e) ||
      (code >= 0xa0 && code <= 0xff)
    ) {
      out += str[i];
    }
  }
  return out;
}

function wrapText(
  rawText: string,
  font: PDFFont,
  size: number,
  maxWidth: number
): string[] {
  const safe = toWinAnsiSafe(rawText);
  if (!safe) return [];

  const paragraphs = safe.split("\n");
  const lines: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      lines.push("");
      continue;
    }

    const words = trimmed.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = "";
        }
        // Handle single oversized token (long URL/code)
        if (font.widthOfTextAtSize(word, size) > maxWidth) {
          let chunk = "";
          for (const ch of word) {
            if (font.widthOfTextAtSize(chunk + ch, size) <= maxWidth) {
              chunk += ch;
            } else {
              if (chunk) lines.push(chunk);
              chunk = ch;
            }
          }
          currentLine = chunk;
        } else {
          currentLine = word;
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

function formatInr(val: number): string {
  const num = Number.isFinite(val) ? val : 0;
  return (
    "INR " +
    num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function formatDate(d: Date | string | undefined): string {
  if (!d) return "N/A";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "N/A";
  return toWinAnsiSafe(
    date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    })
  );
}

export async function generateProposalPdf(
  data: ProposalPdfData
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await doc.embedFont(StandardFonts.HelveticaOblique);

  const pages: PDFPage[] = [];
  let page = doc.addPage([PAGE_W, PAGE_H]);
  pages.push(page);
  let y = PAGE_H;

  const drawSafe = (
    targetPage: PDFPage,
    text: string,
    opts: {
      x: number;
      y: number;
      size: number;
      font: PDFFont;
      color: ReturnType<typeof rgb>;
    }
  ) => {
    const clean = toWinAnsiSafe(text);
    if (!clean) return;
    targetPage.drawText(clean, opts);
  };

  const widthSafe = (text: string, font: PDFFont, size: number) =>
    font.widthOfTextAtSize(toWinAnsiSafe(text), size);

  const startNewPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    pages.push(page);

    // Compact continuation header
    page.drawRectangle({
      x: 0,
      y: PAGE_H - 34,
      width: PAGE_W,
      height: 34,
      color: COLORS.headerBg,
    });
    drawSafe(page, "TaxFiling24  |  Formal Fee Quotation (Continued)", {
      x: MARGIN_L,
      y: PAGE_H - 21,
      size: 8.5,
      font: fontBold,
      color: COLORS.white,
    });
    const refText = toWinAnsiSafe(data.proposalNumber || "");
    drawSafe(page, refText, {
      x: PAGE_W - MARGIN_R - widthSafe(refText, fontBold, 8.5),
      y: PAGE_H - 21,
      size: 8.5,
      font: fontBold,
      color: COLORS.light,
    });

    y = PAGE_H - 52;
  };

  const ensureSpace = (neededHeight: number) => {
    if (y - neededHeight < FOOTER_SAFE_Y) {
      startNewPage();
      return true;
    }
    return false;
  };

  // 1. Header Banner (Page 1)
  const headerHeight = 84;
  page.drawRectangle({
    x: 0,
    y: y - headerHeight,
    width: PAGE_W,
    height: headerHeight,
    color: COLORS.headerBg,
  });

  drawSafe(page, "TaxFiling24", {
    x: MARGIN_L,
    y: y - 36,
    size: 20,
    font: fontBold,
    color: COLORS.white,
  });

  drawSafe(page, "Chartered Tax, Corporate Legal & Statutory Advisory Services", {
    x: MARGIN_L,
    y: y - 54,
    size: 9,
    font: fontRegular,
    color: COLORS.light,
  });

  drawSafe(
    page,
    "www.taxfiling24.com  |  support@taxfiling24.com  |  GSTIN: 07AABCT2424P1Z4",
    {
      x: MARGIN_L,
      y: y - 68,
      size: 8,
      font: fontRegular,
      color: COLORS.muted,
    }
  );

  // Quotation Badge
  const badgeText = "FORMAL FEE QUOTATION";
  const badgeW = widthSafe(badgeText, fontBold, 10) + 16;
  page.drawRectangle({
    x: PAGE_W - MARGIN_R - badgeW,
    y: y - 44,
    width: badgeW,
    height: 22,
    color: COLORS.accent,
  });

  drawSafe(page, badgeText, {
    x: PAGE_W - MARGIN_R - badgeW + 8,
    y: y - 38,
    size: 10,
    font: fontBold,
    color: COLORS.white,
  });

  const propNumSafe = toWinAnsiSafe(data.proposalNumber || "DRAFT");
  drawSafe(page, propNumSafe, {
    x: PAGE_W - MARGIN_R - widthSafe(propNumSafe, fontBold, 11),
    y: y - 64,
    size: 11,
    font: fontBold,
    color: COLORS.white,
  });

  y -= headerHeight + 20;

  // 2. Client & Meta Info Grid (Dynamic height for address & details)
  const leftColMaxW = CONTENT_W - 216;
  const clientNameLines = wrapText(
    data.clientName || "Valued Client",
    fontBold,
    11.5,
    leftColMaxW
  );
  const clientInfoLines: string[] = [];
  if (data.clientCompany) {
    clientInfoLines.push(...wrapText(data.clientCompany, fontRegular, 8.5, leftColMaxW));
  }
  if (data.clientAddress) {
    clientInfoLines.push(...wrapText(data.clientAddress, fontRegular, 8, leftColMaxW));
  }
  const taxDetails = [
    data.clientGstin ? `GSTIN: ${data.clientGstin}` : "",
    data.clientPan ? `PAN: ${data.clientPan}` : "",
    data.placeOfSupply ? `POS: ${data.placeOfSupply}` : "",
  ]
    .filter(Boolean)
    .join("  |  ");
  if (taxDetails) {
    clientInfoLines.push(...wrapText(taxDetails, fontRegular, 8, leftColMaxW));
  }
  const contactLine = [
    data.clientEmail ? `Email: ${data.clientEmail}` : "",
    data.clientPhone ? `Phone: ${data.clientPhone}` : "",
  ]
    .filter(Boolean)
    .join("  |  ");
  if (contactLine) {
    clientInfoLines.push(...wrapText(contactLine, fontRegular, 8, leftColMaxW));
  }

  const leftContentH = 26 + clientNameLines.length * 14 + clientInfoLines.length * 12 + 12;
  const metaBoxH = Math.max(92, leftContentH);

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
  drawSafe(page, "BILLED TO / ENGAGEMENT CLIENT:", {
    x: MARGIN_L + 14,
    y: y - 18,
    size: 8,
    font: fontBold,
    color: COLORS.accent,
  });

  let leftY = y - 32;
  for (const line of clientNameLines) {
    drawSafe(page, line, {
      x: MARGIN_L + 14,
      y: leftY,
      size: 11.5,
      font: fontBold,
      color: COLORS.dark,
    });
    leftY -= 14;
  }
  for (const line of clientInfoLines) {
    drawSafe(page, line, {
      x: MARGIN_L + 14,
      y: leftY,
      size: 8,
      font: fontRegular,
      color: COLORS.muted,
    });
    leftY -= 12;
  }

  // Right: Dates & Quotation Details
  const rightX = MARGIN_L + CONTENT_W - 190;
  drawSafe(page, "QUOTATION PARTICULARS:", {
    x: rightX,
    y: y - 18,
    size: 8,
    font: fontBold,
    color: COLORS.accent,
  });

  drawSafe(page, `Date Issued: ${formatDate(data.createdAt || new Date())}`, {
    x: rightX,
    y: y - 32,
    size: 8.5,
    font: fontRegular,
    color: COLORS.text,
  });

  drawSafe(page, `Valid Until: ${formatDate(data.validUntil)}`, {
    x: rightX,
    y: y - 46,
    size: 8.5,
    font: fontBold,
    color: COLORS.dark,
  });

  const taxModeLabel =
    data.taxType === "CGST_SGST"
      ? "Intra-State (CGST + SGST)"
      : "Inter-State (IGST)";
  drawSafe(page, `Tax Regime: ${taxModeLabel}`, {
    x: rightX,
    y: y - 60,
    size: 8,
    font: fontRegular,
    color: COLORS.muted,
  });

  drawSafe(page, "Currency: INR (Rs.)", {
    x: rightX,
    y: y - 74,
    size: 8,
    font: fontBold,
    color: COLORS.primary,
  });

  y -= metaBoxH + 18;

  // 3. Subject Title (Wrapped)
  drawSafe(page, "SERVICE SCOPE & ENGAGEMENT SUBJECT", {
    x: MARGIN_L,
    y,
    size: 9,
    font: fontBold,
    color: COLORS.primary,
  });
  y -= 14;

  const titleLines = wrapText(data.title || "Professional Fee Quotation", fontBold, 11.5, CONTENT_W);
  for (const line of titleLines) {
    ensureSpace(16);
    drawSafe(page, line, {
      x: MARGIN_L,
      y,
      size: 11.5,
      font: fontBold,
      color: COLORS.dark,
    });
    y -= 15;
  }
  y -= 6;

  // 4. Line Items Table (Dynamic row wrapping + multi-page support)
  const colX = {
    num: MARGIN_L + 6,
    desc: MARGIN_L + 24,
    sac: MARGIN_L + 264,
    qty: MARGIN_L + 318,
    rate: MARGIN_L + 370,
    amount: MARGIN_L + CONTENT_W - 10,
  };
  const descMaxW = colX.sac - colX.desc - 10;
  const tableHeaderH = 22;

  const drawTableHeader = () => {
    page.drawRectangle({
      x: MARGIN_L,
      y: y - tableHeaderH,
      width: CONTENT_W,
      height: tableHeaderH,
      color: COLORS.primary,
    });

    drawSafe(page, "#", { x: colX.num, y: y - 15, size: 8, font: fontBold, color: COLORS.white });
    drawSafe(page, "Deliverable Description", {
      x: colX.desc,
      y: y - 15,
      size: 8,
      font: fontBold,
      color: COLORS.white,
    });
    drawSafe(page, "SAC / GST", {
      x: colX.sac,
      y: y - 15,
      size: 8,
      font: fontBold,
      color: COLORS.white,
    });
    drawSafe(page, "Qty", { x: colX.qty, y: y - 15, size: 8, font: fontBold, color: COLORS.white });
    drawSafe(page, "Rate (INR)", {
      x: colX.rate,
      y: y - 15,
      size: 8,
      font: fontBold,
      color: COLORS.white,
    });
    const amtHeader = "Amount (INR)";
    drawSafe(page, amtHeader, {
      x: colX.amount - widthSafe(amtHeader, fontBold, 8),
      y: y - 15,
      size: 8,
      font: fontBold,
      color: COLORS.white,
    });

    y -= tableHeaderH;
  };

  ensureSpace(tableHeaderH + 28);
  drawTableHeader();

  const items = Array.isArray(data.lineItems) ? data.lineItems : [];

  items.forEach((item, idx) => {
    const isGov = Boolean(item.isGovFee);
    const tag = isGov ? " [Govt Pure Agent]" : "";
    const descLines = wrapText(
      `${item.description || "Deliverable"}${tag}`,
      fontBold,
      8,
      descMaxW
    );
    const detailLines = item.details
      ? wrapText(item.details, fontRegular, 7, descMaxW)
      : [];

    const textHeight = descLines.length * 10.5 + detailLines.length * 9.5;
    const rowH = Math.max(24, textHeight + 12);

    if (ensureSpace(rowH)) {
      drawTableHeader();
    }

    if (idx % 2 === 1) {
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

    drawSafe(page, String(idx + 1), {
      x: colX.num,
      y: y - 14,
      size: 7.5,
      font: fontRegular,
      color: COLORS.muted,
    });

    let dy = y - 13;
    for (const line of descLines) {
      drawSafe(page, line, {
        x: colX.desc,
        y: dy,
        size: 8,
        font: fontBold,
        color: isGov ? COLORS.accent : COLORS.text,
      });
      dy -= 10.5;
    }
    for (const line of detailLines) {
      drawSafe(page, line, {
        x: colX.desc,
        y: dy,
        size: 7,
        font: fontRegular,
        color: COLORS.muted,
      });
      dy -= 9.5;
    }

    const sacStr = item.sacCode || (isGov ? "000000" : "998231");
    const gstPct = isGov ? 0 : Number(item.gstPercent ?? 18);
    drawSafe(page, `${sacStr} (${gstPct}%)`, {
      x: colX.sac,
      y: y - 14,
      size: 7.2,
      font: fontRegular,
      color: COLORS.muted,
    });

    drawSafe(page, `${item.qty || 1} ${item.unit || "Nos"}`, {
      x: colX.qty,
      y: y - 14,
      size: 7.8,
      font: fontRegular,
      color: COLORS.text,
    });

    const rateStr = (Number(item.rate) || 0).toLocaleString("en-IN");
    drawSafe(page, rateStr, {
      x: colX.rate,
      y: y - 14,
      size: 8,
      font: fontRegular,
      color: COLORS.text,
    });

    const lineTotal = round2(
      item.amount !== undefined && Number.isFinite(Number(item.amount))
        ? Number(item.amount)
        : (Number(item.qty) || 1) * (Number(item.rate) || 0)
    );
    const amtStr = lineTotal.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    drawSafe(page, amtStr, {
      x: colX.amount - widthSafe(amtStr, fontBold, 8),
      y: y - 14,
      size: 8,
      font: fontBold,
      color: COLORS.dark,
    });

    y -= rowH;
  });

  y -= 12;

  // 5. Totals & Bank Details Side-by-Side Box (No Divider Overlap, Wrapped Words)
  const totalsBoxW = 232;
  const totalsBoxX = MARGIN_L + CONTENT_W - totalsBoxW;
  const bankBoxW = CONTENT_W - totalsBoxW - 14;
  const isCgst = data.taxType === "CGST_SGST";

  const words = numberToIndianWords(data.totalAmount);
  const wordLines = wrapText(words, fontOblique, 7.5, bankBoxW - 20);
  const bankBoxNeededH = 74 + Math.max(1, wordLines.length) * 10 + 10;

  const totalLineCount =
    1 + // Subtotal
    (data.discount > 0 ? 1 : 0) +
    (isCgst ? 2 : 1); // CGST+SGST or IGST
  const totalsNeededH = 18 + totalLineCount * 15 + 14 + 24;
  const boxH = Math.max(totalsNeededH, bankBoxNeededH, 104);

  ensureSpace(boxH + 16);

  // Totals box
  page.drawRectangle({
    x: totalsBoxX,
    y: y - boxH,
    width: totalsBoxW,
    height: boxH,
    color: COLORS.bgLight,
    borderColor: COLORS.border,
    borderWidth: 1,
  });

  let ty = y - 18;
  const drawTotalLine = (label: string, val: string, isGrand: boolean = false) => {
    const labelSize = isGrand ? 9.5 : 8;
    const valSize = isGrand ? 10.5 : 8;
    const f = isGrand ? fontBold : fontRegular;
    drawSafe(page, label, {
      x: totalsBoxX + 10,
      y: ty,
      size: labelSize,
      font: f,
      color: isGrand ? COLORS.primary : COLORS.muted,
    });
    const vw = widthSafe(val, f, valSize);
    drawSafe(page, val, {
      x: totalsBoxX + totalsBoxW - 10 - vw,
      y: ty,
      size: valSize,
      font: f,
      color: isGrand ? COLORS.accent : COLORS.dark,
    });
    ty -= isGrand ? 18 : 15;
  };

  drawTotalLine("Subtotal:", formatInr(data.subtotal));
  if (data.discount > 0) {
    drawTotalLine("Discount Applied:", "-" + formatInr(data.discount));
  }

  if (isCgst) {
    const halfTax = round2((Number(data.taxAmount) || 0) / 2);
    const otherHalf = round2((Number(data.taxAmount) || 0) - halfTax);
    drawTotalLine("CGST:", formatInr(halfTax));
    drawTotalLine("SGST:", formatInr(otherHalf));
  } else {
    drawTotalLine("IGST (Integrated GST):", formatInr(data.taxAmount));
  }

  // Divider clearly separated above Grand Total
  const dividerY = ty + 6;
  page.drawLine({
    start: { x: totalsBoxX + 10, y: dividerY },
    end: { x: totalsBoxX + totalsBoxW - 10, y: dividerY },
    thickness: 1,
    color: COLORS.accent,
  });
  ty = dividerY - 14;

  drawTotalLine("Grand Total:", formatInr(data.totalAmount), true);

  // Bank Details & Amount in Words box
  page.drawRectangle({
    x: MARGIN_L,
    y: y - boxH,
    width: bankBoxW,
    height: boxH,
    color: COLORS.white,
    borderColor: COLORS.border,
    borderWidth: 1,
  });

  drawSafe(page, "BANK & REMITTANCE DETAILS", {
    x: MARGIN_L + 10,
    y: y - 16,
    size: 7.5,
    font: fontBold,
    color: COLORS.accent,
  });

  const bankLines = [
    "Account Name: TaxFiling24 Advisory Services",
    "Bank: HDFC Bank Ltd.  |  Account No: 50200088921134",
    "IFSC Code: HDFC0001202  |  Branch: New Delhi",
    "UPI VPA: taxfiling24@hdfcbank",
  ];
  let by = y - 28;
  for (const bl of bankLines) {
    drawSafe(page, bl, {
      x: MARGIN_L + 10,
      y: by,
      size: 7,
      font: fontRegular,
      color: COLORS.muted,
    });
    by -= 10;
  }

  by -= 4;
  drawSafe(page, "AMOUNT IN WORDS:", {
    x: MARGIN_L + 10,
    y: by,
    size: 7,
    font: fontBold,
    color: COLORS.dark,
  });
  by -= 11;

  for (const wl of wordLines) {
    drawSafe(page, wl, {
      x: MARGIN_L + 10,
      y: by,
      size: 7.5,
      font: fontOblique,
      color: COLORS.primary,
    });
    by -= 10;
  }

  y -= boxH + 16;

  // 6. Payment Milestones (Full wrapped list — no 110-char truncation)
  if (data.paymentMilestones && data.paymentMilestones.length > 0) {
    ensureSpace(28);
    drawSafe(page, "PAYMENT MILESTONE SCHEDULE", {
      x: MARGIN_L,
      y,
      size: 8.5,
      font: fontBold,
      color: COLORS.primary,
    });
    y -= 13;

    data.paymentMilestones.forEach((m, i) => {
      const pct = Number(m.percentage || 0);
      const computedAmt =
        m.amount && Number(m.amount) > 0
          ? Number(m.amount)
          : round2((Number(data.totalAmount) || 0) * (pct / 100));
      const msText = `${i + 1}. ${m.title || "Milestone"} (${pct}% = ${formatInr(
        computedAmt
      )}) - ${m.dueTrigger || "On schedule"}`;
      const wrappedMs = wrapText(msText, fontRegular, 7.5, CONTENT_W);
      ensureSpace(wrappedMs.length * 10.5 + 4);
      for (const line of wrappedMs) {
        drawSafe(page, line, {
          x: MARGIN_L,
          y,
          size: 7.5,
          font: fontRegular,
          color: COLORS.text,
        });
        y -= 10.5;
      }
    });
    y -= 8;
  }

  // 7. Special Notes (If provided)
  if (data.notes && data.notes.trim()) {
    const noteLines = wrapText(data.notes.trim(), fontRegular, 7.5, CONTENT_W);
    ensureSpace(24);
    drawSafe(page, "ENGAGEMENT NOTES", {
      x: MARGIN_L,
      y,
      size: 8.5,
      font: fontBold,
      color: COLORS.primary,
    });
    y -= 12;
    for (const line of noteLines) {
      ensureSpace(11);
      drawSafe(page, line, {
        x: MARGIN_L,
        y,
        size: 7.5,
        font: fontRegular,
        color: COLORS.muted,
      });
      y -= 10.5;
    }
    y -= 8;
  }

  // 8. Terms & Conditions (Wrapped with pagination)
  const termsText =
    data.terms ||
    "1. Validity: This quotation is valid for 15 days from the date of issuance.\n" +
      "2. Scope: Any government statutory filing fees, MCA stamp duty, or ROC penalties incurred outside standard scope will be billed at actuals.\n" +
      "3. Mobilization: Service delivery commences immediately upon receipt of 50% advance mobilization fee.\n" +
      "4. Client Responsibilities: Client must furnish complete KYC documents, bank statements, and relevant certificates within 7 working days.";

  const termLines = wrapText(termsText, fontRegular, 7.2, CONTENT_W);
  ensureSpace(24);
  drawSafe(page, "TERMS OF ENGAGEMENT & PROFESSIONAL POLICIES", {
    x: MARGIN_L,
    y,
    size: 8.5,
    font: fontBold,
    color: COLORS.primary,
  });
  y -= 12;

  for (const line of termLines) {
    ensureSpace(11);
    if (line) {
      drawSafe(page, line, {
        x: MARGIN_L,
        y,
        size: 7.2,
        font: fontRegular,
        color: COLORS.muted,
      });
    }
    y -= 10;
  }

  // Footer across all pages with Page X of Y
  const totalPages = pages.length;
  pages.forEach((p, idx) => {
    const footerY = 22;
    p.drawLine({
      start: { x: MARGIN_L, y: footerY + 11 },
      end: { x: MARGIN_L + CONTENT_W, y: footerY + 11 },
      thickness: 0.5,
      color: COLORS.border,
    });

    drawSafe(
      p,
      "TaxFiling24 Corporate Advisory | New Delhi, India | Computer Generated Quotation",
      {
        x: MARGIN_L,
        y: footerY,
        size: 7,
        font: fontRegular,
        color: COLORS.light,
      }
    );

    const pageLabel = `Page ${idx + 1} of ${totalPages}`;
    drawSafe(p, pageLabel, {
      x: MARGIN_L + CONTENT_W - widthSafe(pageLabel, fontRegular, 7),
      y: footerY,
      size: 7,
      font: fontRegular,
      color: COLORS.light,
    });
  });

  return await doc.save();
}
