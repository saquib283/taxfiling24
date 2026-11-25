import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

function neutralizeFormula(value: string): string {
  const cleaned = value.replace(/[\r\n]+/g, " ");
  if (/^\s*[=+\-@|\t\r\n]/.test(cleaned)) {
    return `'${cleaned}`;
  }
  return cleaned;
}

function escapeCsvCell(value: string): string {
  const safe = neutralizeFormula(value);
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source")?.trim();
    const tag = searchParams.get("tag")?.trim();
    const status = searchParams.get("status")?.toUpperCase();
    const search = searchParams.get("search")?.trim();
    const format = (searchParams.get("format") || "csv").toLowerCase();

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
        { phone: { contains: search } },
        { company: { contains: search } },
      ];
    }
    if (source && source !== "ALL") {
      where.source = source;
    }
    if (status === "ACTIVE") {
      where.isActive = true;
    } else if (status === "SUPPRESSED") {
      where.isActive = false;
    }

    const contacts = await prisma.subscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 25000,
    });

    const filtered = tag
      ? contacts.filter((c) => Array.isArray(c.tags) && (c.tags as string[]).includes(tag))
      : contacts;

    const rows = filtered.map((c) => ({
      email: neutralizeFormula(c.email),
      name: neutralizeFormula(c.name || ""),
      phone: neutralizeFormula(c.phone || ""),
      company: neutralizeFormula(c.company || ""),
      source: neutralizeFormula(c.source || "NEWSLETTER"),
      tags: neutralizeFormula(Array.isArray(c.tags) ? (c.tags as string[]).join(", ") : ""),
      status: c.isActive ? "Active" : "Suppressed",
      dateAdded: c.createdAt.toISOString().split("T")[0],
    }));

    const timestamp = new Date().toISOString().split("T")[0];
    const isXlsx = format === "xlsx";
    const filename = `taxfiling24-audience-${timestamp}.${isXlsx ? "xlsx" : "csv"}`;

    await logActivity(
      "EXPORTED",
      "Subscriber",
      `Exported ${rows.length} audience contacts (${isXlsx ? "XLSX" : "CSV"})`,
      undefined,
      auth.user.userId
    );

    if (isXlsx) {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Audience Contacts");
      sheet.columns = [
        { header: "Email", key: "email", width: 32 },
        { header: "Name", key: "name", width: 24 },
        { header: "Phone", key: "phone", width: 18 },
        { header: "Company", key: "company", width: 24 },
        { header: "Source", key: "source", width: 16 },
        { header: "Tags", key: "tags", width: 24 },
        { header: "Status", key: "status", width: 12 },
        { header: "Date Added", key: "dateAdded", width: 14 },
      ];
      sheet.getRow(1).font = { bold: true };
      for (const row of rows) {
        sheet.addRow(row);
      }

      const arrayBuffer = await workbook.xlsx.writeBuffer();
      return new NextResponse(Buffer.from(arrayBuffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const headers = [
      "Email",
      "Name",
      "Phone",
      "Company",
      "Source",
      "Tags",
      "Status",
      "Date Added",
    ];
    const csvLines = [
      headers.map(escapeCsvCell).join(","),
      ...rows.map((r) =>
        [r.email, r.name, r.phone, r.company, r.source, r.tags, r.status, r.dateAdded]
          .map(escapeCsvCell)
          .join(",")
      ),
    ];

    return new NextResponse(csvLines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Audience export error:", error);
    return NextResponse.json({ error: "Failed to export audience." }, { status: 500 });
  }
}
