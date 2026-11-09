import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

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

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
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

    // Merge existing tags with incoming tags without duplicates
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
        // Keep source as primary or append tag if source was different
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
 * Sync website leads from Inquiries and Appointments into the Audience Hub.
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
    if (inq.email && isValidEmail(inq.email)) {
      const res = await ingestContact({
        email: inq.email,
        name: inq.name,
        phone: inq.phone,
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
    if (app.email && isValidEmail(app.email)) {
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
 * Parses an uploaded Excel (.xlsx, .xls) or CSV buffer and ingests contacts into the database.
 */
export async function parseAndImportSpreadsheet(
  buffer: Buffer,
  options: {
    customTag?: string;
    updateIfExists?: boolean;
    defaultSource?: AudienceSource;
  } = {}
): Promise<UploadParseResult> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("The uploaded spreadsheet contains no readable sheets.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows: Array<Record<string, any>> = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
  });

  if (rawRows.length === 0) {
    throw new Error("The uploaded file does not contain any data rows.");
  }

  // Inspect headers to detect email, name, phone, company, tags
  const firstRow = rawRows[0];
  const headers = Object.keys(firstRow);

  const findKey = (patterns: RegExp[]): string | undefined => {
    return headers.find((h) =>
      patterns.some((pattern) => pattern.test(h.trim().toLowerCase()))
    );
  };

  const emailKey = findKey([
    /^e?-?mail(\s*address)?$/i,
    /email/i,
    /mail/i,
    /contact\s*email/i,
  ]);
  const nameKey = findKey([
    /^full\s*name$/i,
    /^name$/i,
    /client\s*name/i,
    /contact\s*name/i,
    /customer/i,
    /first\s*name/i,
  ]);
  const phoneKey = findKey([
    /^phone(\s*number)?$/i,
    /^mobile(\s*number)?$/i,
    /contact\s*no/i,
    /whatsapp/i,
    /tel/i,
  ]);
  const companyKey = findKey([
    /^company(\s*name)?$/i,
    /business/i,
    /organization/i,
    /firm/i,
  ]);
  const tagsKey = findKey([
    /^tags?$/i,
    /category/i,
    /service/i,
    /segment/i,
    /group/i,
  ]);

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
    detectedColumns: { emailKey, nameKey, phoneKey, companyKey, tagsKey },
    samplePreview: rawRows.slice(0, 5),
  };

  const customTag = options.customTag?.trim();
  const updateIfExists = options.updateIfExists !== false;
  const defaultSource = options.defaultSource || "CSV_IMPORT";

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rawEmail = String(row[emailKey] || "").trim();

    if (!rawEmail) {
      result.skippedCount++;
      continue;
    }

    if (!isValidEmail(rawEmail)) {
      result.errors.push({
        row: i + 2, // 1-indexed header + 1
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

    try {
      const ingestRes = await ingestContact({
        email: rawEmail,
        name: rawName,
        phone: rawPhone,
        company: rawCompany,
        source: defaultSource,
        tags: rowTags,
        updateIfExists,
      });

      if (ingestRes.status === "CREATED") {
        result.importedCount++;
      } else if (ingestRes.status === "UPDATED") {
        result.updatedCount++;
      } else {
        result.skippedCount++;
      }
    } catch (err: any) {
      result.errors.push({
        row: i + 2,
        error: err.message || "Failed to save contact.",
        data: row,
      });
      result.skippedCount++;
    }
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

