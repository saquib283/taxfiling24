import prisma from "@/lib/prisma";
import ExcelJS from "exceljs";

export type AudienceSource =
  | "NEWSLETTER"
  | "INQUIRY"
  | "APPOINTMENT"
  | "CSV_IMPORT"
  | "MANUAL";

export interface IngestContactParams {
  email: string;
  name?: string | null;
  phone?: string | null;
  source?: AudienceSource | string;
  tags?: string[];
  company?: string | null;
  notes?: string | null;
  updateIfExists?: boolean;
}

export interface IngestResult {
  subscriber: any;
  status: "CREATED" | "UPDATED" | "SKIPPED";
}

export interface UploadParseResult {
  totalRows: number;
  validRows: number;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  detectedColumns: {
    emailKey?: string;
    nameKey?: string;
    phoneKey?: string;
    companyKey?: string;
    tagsKey?: string;
    notesKey?: string;
  };
  samplePreview: Array<Record<string, any>>;
}

export interface AudienceMetrics {
  totalContacts: number;
  activeContacts: number;
  suppressedContacts: number;
  newsletterCount: number;
  inquiryCount: number;
  appointmentCount: number;
  importedCount: number;
  manualCount: number;
  totalTags: string[];
}

const MAX_IMPORT_ROWS = 5000;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

export function isPlaceholderEmail(email: string): boolean {
  const norm = normalizeEmail(email);
  if (
    norm === "walkin@taxfiling24.com" ||
    norm === "no-email-provided@taxfiling24.com"
  ) {
    return true;
  }
  return /^wa-\d+@taxfiling24\.com$/i.test(norm);
}

/**
 * Ingest or upsert a single contact into the unified Subscriber model.
 */
export async function ingestContact(params: IngestContactParams): Promise<IngestResult> {
  const normalized = normalizeEmail(params.email);
  if (!isValidEmail(normalized)) {
    throw new Error(`Invalid email address format: ${params.email}`);
  }

  const existing = await prisma.subscriber.findUnique({
    where: { email: normalized },
  });

  const source = params.source || "NEWSLETTER";
  const incomingTags = Array.isArray(params.tags) ? params.tags.filter(Boolean) : [];

  if (existing) {
    if (params.updateIfExists === false) {
      return { subscriber: existing, status: "SKIPPED" };
    }

    const existingTags = Array.isArray(existing.tags) ? (existing.tags as string[]) : [];
    const mergedTags = Array.from(new Set([...existingTags, ...incomingTags]));

    const updated = await prisma.subscriber.update({
      where: { id: existing.id },
      data: {
        name: params.name?.trim() || existing.name,
        phone: params.phone?.trim() || existing.phone,
        company: params.company?.trim() || existing.company,
        notes: params.notes?.trim() || existing.notes,
        tags: mergedTags,
        source: existing.source || source,
      },
    });

    return { subscriber: updated, status: "UPDATED" };
  }

  const created = await prisma.subscriber.create({
    data: {
      email: normalized,
      name: params.name?.trim() || null,
      phone: params.phone?.trim() || null,
      company: params.company?.trim() || null,
      notes: params.notes?.trim() || null,
      source,
      tags: incomingTags,
      isActive: true,
    },
  });

  return { subscriber: created, status: "CREATED" };
}

/**
 * Sync website leads from Inquiries and Appointments into the Audience Hub,
 * skipping placeholder/unroutable synthetic emails and preserving Inquiry.company.
 */
export async function syncWebsiteLeads(): Promise<{
  totalInquiries: number;
  totalAppointments: number;
  syncedInquiries: number;
  syncedAppointments: number;
  totalSynced: number;
}> {
  const [inquiries, appointments] = await Promise.all([
    prisma.inquiry.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        company: true,
        service: true,
        createdAt: true,
      },
    }),
    prisma.appointment.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        service: true,
        createdAt: true,
      },
    }),
  ]);

  let syncedInquiries = 0;
  for (const inq of inquiries) {
    if (inq.email && isValidEmail(inq.email) && !isPlaceholderEmail(inq.email)) {
      const res = await ingestContact({
        email: inq.email,
        name: inq.name,
        phone: inq.phone,
        company: inq.company,
        source: "INQUIRY",
        tags: inq.service ? [inq.service] : ["Contact Inquiry"],
        updateIfExists: true,
      });
      if (res.status === "CREATED" || res.status === "UPDATED") {
        syncedInquiries++;
      }
    }
  }

  let syncedAppointments = 0;
  for (const app of appointments) {
    if (app.email && isValidEmail(app.email) && !isPlaceholderEmail(app.email)) {
      const res = await ingestContact({
        email: app.email,
        name: app.name,
        phone: app.phone,
        source: "APPOINTMENT",
        tags: app.service ? [app.service] : ["CA Consultation Booking"],
        updateIfExists: true,
      });
      if (res.status === "CREATED" || res.status === "UPDATED") {
        syncedAppointments++;
      }
    }
  }

  return {
    totalInquiries: inquiries.length,
    totalAppointments: appointments.length,
    syncedInquiries,
    syncedAppointments,
    totalSynced: syncedInquiries + syncedAppointments,
  };
}

/**
 * RFC-4180 compliant CSV parser handling quoted fields, escaped quotes, and CRLF/LF newlines.
 */
function parseCsvText(csvText: string): Array<Record<string, string>> {
  const clean = csvText.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      currentRow.push(currentField);
      currentField = "";
    } else if (ch === "\r" && next === "\n") {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      i++;
    } else if (ch === "\n" || ch === "\r") {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
    } else {
      currentField += ch;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  const nonEmptyRows = rows.filter((r) => r.some((cell) => cell.trim() !== ""));
  if (nonEmptyRows.length < 2) return [];

  const headers = nonEmptyRows[0].map((h, idx) => h.trim() || `Column_${idx + 1}`);
  const records: Array<Record<string, string>> = [];

  for (let i = 1; i < nonEmptyRows.length; i++) {
    const row = nonEmptyRows[i];
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header] = (row[idx] ?? "").trim();
    });
    records.push(obj);
  }

  return records;
}

function cellValueToString(val: ExcelJS.CellValue): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
    return String(val).trim();
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === "object") {
    if ("text" in val && typeof val.text === "string") return val.text.trim();
    if ("richText" in val && Array.isArray(val.richText)) {
      return val.richText.map((rt) => rt.text).join("").trim();
    }
    if ("result" in val && val.result !== undefined && val.result !== null) {
      return String(val.result).trim();
    }
  }
  return String(val).trim();
}

const MAX_XLSX_ENTRIES = 250;
const MAX_XLSX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024; // 50 MB zip-bomb cap

function validateZipArchiveBounds(buffer: Buffer): void {
  // Locate End of Central Directory (EOCD) signature 0x06054b50 from tail
  const minPos = Math.max(0, buffer.length - 65557);
  let eocdPos = -1;
  for (let i = buffer.length - 22; i >= minPos; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdPos = i;
      break;
    }
  }
  if (eocdPos === -1) {
    throw new Error("Invalid Excel (.xlsx) archive structure.");
  }

  const totalEntries = buffer.readUInt16LE(eocdPos + 10);
  const cdOffset = buffer.readUInt32LE(eocdPos + 16);
  if (totalEntries > MAX_XLSX_ENTRIES) {
    throw new Error("Excel archive contains too many internal entries and was rejected for safety.");
  }

  let offset = cdOffset;
  let totalUncompressed = 0;
  for (let idx = 0; idx < totalEntries; idx++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("Corrupted Excel (.xlsx) archive structure.");
    }
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);

    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_XLSX_UNCOMPRESSED_BYTES) {
      throw new Error("Excel file exceeds maximum safe uncompressed size (50MB).");
    }
    offset += 46 + nameLen + extraLen + commentLen;
  }
}

async function parseXlsxBuffer(buffer: Buffer): Promise<Array<Record<string, string>>> {
  validateZipArchiveBounds(buffer);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error("The uploaded Excel workbook contains no readable worksheets.");
  }

  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = cellValueToString(cell.value) || `Column_${colNumber}`;
  });

  if (headers.filter(Boolean).length === 0) {
    throw new Error("The uploaded Excel file is missing a header row.");
  }

  const records: Array<Record<string, string>> = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, string> = {};
    let hasAnyValue = false;
    headers.forEach((header, colNumber) => {
      if (!header) return;
      const value = cellValueToString(row.getCell(colNumber).value);
      obj[header] = value;
      if (value) hasAnyValue = true;
    });
    if (hasAnyValue) {
      records.push(obj);
    }
  });

  return records;
}

/**
 * Parses an uploaded Excel (.xlsx) or CSV (.csv) buffer safely via ExcelJS / RFC4180 CSV parser
 * and ingests contacts into the database in bounded concurrent batches.
 */
export async function parseAndImportSpreadsheet(
  buffer: Buffer,
  options: {
    filename?: string;
    customTag?: string;
    updateIfExists?: boolean;
    defaultSource?: AudienceSource;
  } = {}
): Promise<UploadParseResult> {
  const filename = (options.filename || "").toLowerCase();
  const isZipMagic =
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04;
  const isOleMagic =
    buffer.length >= 4 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0;

  if (isOleMagic || (filename.endsWith(".xls") && !isZipMagic)) {
    throw new Error(
      "Legacy binary .xls files are not supported for security reasons. Please save the file as .xlsx or .csv and upload again."
    );
  }

  let rawRows: Array<Record<string, string>>;
  if (isZipMagic || filename.endsWith(".xlsx")) {
    rawRows = await parseXlsxBuffer(buffer);
  } else {
    rawRows = parseCsvText(buffer.toString("utf8"));
  }

  if (rawRows.length === 0) {
    throw new Error("The uploaded file does not contain any data rows.");
  }

  if (rawRows.length > MAX_IMPORT_ROWS) {
    throw new Error(
      `Upload contains ${rawRows.length} rows, exceeding the maximum of ${MAX_IMPORT_ROWS} rows per import. Please split the file into smaller batches.`
    );
  }

  const firstRow = rawRows[0];
  const headers = Object.keys(firstRow);

  const findKey = (patterns: RegExp[]): string | undefined => {
    return headers.find((h) =>
      patterns.some((pattern) => pattern.test(h.trim().toLowerCase()))
    );
  };

  const emailKey = findKey([
    /^e-?mail(\s*address)?$/i,
    /\be-?mail\b/i,
    /contact\s*e-?mail/i,
  ]);
  const nameKey = findKey([
    /^full\s*name$/i,
    /^name$/i,
    /\bclient\s*name\b/i,
    /\bcontact\s*name\b/i,
    /\bcustomer(\s*name)?\b/i,
    /^first\s*name$/i,
  ]);
  const phoneKey = findKey([
    /^phone(\s*no\.?|\s*number)?$/i,
    /^mobile(\s*no\.?|\s*number)?$/i,
    /\bcontact\s*no\.?\b/i,
    /\bwhatsapp\b/i,
    /\btel(ephone)?\b/i,
  ]);
  const companyKey = findKey([
    /^company(\s*name)?$/i,
    /\bbusiness(\s*name)?\b/i,
    /\borganization\b/i,
    /\bfirm\b/i,
  ]);
  const tagsKey = findKey([
    /^tags?$/i,
    /\bcategory\b/i,
    /\bservice\b/i,
    /\bsegment\b/i,
    /\bgroup\b/i,
  ]);
  const notesKey = findKey([/^notes?$/i, /\bremarks?\b/i, /\bcomments?\b/i]);

  if (!emailKey) {
    throw new Error(
      `Could not automatically locate an 'Email' column in the uploaded file. Available columns: ${headers.join(", ")}`
    );
  }

  const result: UploadParseResult = {
    totalRows: rawRows.length,
    validRows: 0,
    importedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errors: [],
    detectedColumns: { emailKey, nameKey, phoneKey, companyKey, tagsKey, notesKey },
    samplePreview: rawRows.slice(0, 5),
  };

  const customTag = options.customTag?.trim();
  const updateIfExists = options.updateIfExists !== false;
  const defaultSource = options.defaultSource || "CSV_IMPORT";

  // Deduplicate rows by normalized email while preserving order and process in chunks of 20
  const validTasks: Array<{ rowNum: number; row: Record<string, string>; params: IngestContactParams }> = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rawEmail = String(row[emailKey] || "").trim();

    if (!rawEmail) {
      result.skippedCount++;
      continue;
    }

    if (!isValidEmail(rawEmail) || isPlaceholderEmail(rawEmail)) {
      result.errors.push({
        row: i + 2,
        error: `Invalid email address format: "${rawEmail}"`,
        data: row,
      });
      result.skippedCount++;
      continue;
    }

    result.validRows++;

    const rawName = nameKey ? String(row[nameKey] || "").trim() : null;
    const rawPhone = phoneKey ? String(row[phoneKey] || "").trim() : null;
    const rawCompany = companyKey ? String(row[companyKey] || "").trim() : null;
    const rawNotes = notesKey ? String(row[notesKey] || "").trim() : null;

    const rowTags: string[] = [];
    if (tagsKey && row[tagsKey]) {
      const splitTags = String(row[tagsKey])
        .split(/[,;|]/)
        .map((t) => t.trim())
        .filter(Boolean);
      rowTags.push(...splitTags);
    }
    if (customTag) {
      rowTags.push(customTag);
    }

    validTasks.push({
      rowNum: i + 2,
      row,
      params: {
        email: rawEmail,
        name: rawName,
        phone: rawPhone,
        company: rawCompany,
        notes: rawNotes,
        source: defaultSource,
        tags: rowTags,
        updateIfExists,
      },
    });
  }

  const batchSize = 20;
  for (let start = 0; start < validTasks.length; start += batchSize) {
    const chunk = validTasks.slice(start, start + batchSize);
    await Promise.all(
      chunk.map(async (task) => {
        try {
          const ingestRes = await ingestContact(task.params);
          if (ingestRes.status === "CREATED") {
            result.importedCount++;
          } else if (ingestRes.status === "UPDATED") {
            result.updatedCount++;
          } else {
            result.skippedCount++;
          }
        } catch (err: any) {
          result.errors.push({
            row: task.rowNum,
            error: err?.message || "Failed to save contact.",
            data: task.row,
          });
          result.skippedCount++;
        }
      })
    );
  }

  return result;
}

/**
 * Returns aggregated audience metrics and statistics.
 */
export async function getAudienceMetrics(): Promise<AudienceMetrics> {
  const [
    totalContacts,
    activeContacts,
    suppressedContacts,
    newsletterCount,
    inquiryCount,
    appointmentCount,
    importedCount,
    manualCount,
    subscribersWithTags,
  ] = await Promise.all([
    prisma.subscriber.count(),
    prisma.subscriber.count({ where: { isActive: true } }),
    prisma.subscriber.count({ where: { isActive: false } }),
    prisma.subscriber.count({ where: { source: "NEWSLETTER" } }),
    prisma.subscriber.count({ where: { source: "INQUIRY" } }),
    prisma.subscriber.count({ where: { source: "APPOINTMENT" } }),
    prisma.subscriber.count({ where: { source: "CSV_IMPORT" } }),
    prisma.subscriber.count({ where: { source: "MANUAL" } }),
    prisma.subscriber.findMany({
      where: { tags: { not: null as any } },
      select: { tags: true },
    }),
  ]);

  const uniqueTags = new Set<string>();
  for (const s of subscribersWithTags) {
    if (Array.isArray(s.tags)) {
      for (const tag of s.tags as string[]) {
        if (tag && typeof tag === "string") uniqueTags.add(tag);
      }
    }
  }

  return {
    totalContacts,
    activeContacts,
    suppressedContacts,
    newsletterCount,
    inquiryCount,
    appointmentCount,
    importedCount,
    manualCount,
    totalTags: Array.from(uniqueTags).sort(),
  };
}
