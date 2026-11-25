import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

function serializeValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return String(value);
}

function sanitizeCsvCell(value: unknown): string {
  let str = serializeValue(value).replace(/[\r\n]+/g, " ");
  // Neutralize CSV/Excel formula injection (including leading whitespace and pipe)
  if (/^\s*[=+\-@|\t\r\n]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "inquiries";
    const format = (searchParams.get("format") || "json").toLowerCase();

    let data: Record<string, unknown>[] = [];
    const MAX_EXPORT_ROWS = 10000;

    switch (type) {
      case "inquiries":
        data = await prisma.inquiry.findMany({
          orderBy: { createdAt: "desc" },
          take: MAX_EXPORT_ROWS,
        });
        break;
      case "articles":
        data = await prisma.article.findMany({
          orderBy: { createdAt: "desc" },
          take: MAX_EXPORT_ROWS,
        });
        break;
      case "services":
        data = await prisma.service.findMany({
          orderBy: { createdAt: "desc" },
          take: MAX_EXPORT_ROWS,
        });
        break;
      case "reviews":
        data = await prisma.review.findMany({
          orderBy: { createdAt: "desc" },
          take: MAX_EXPORT_ROWS,
        });
        break;
      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    await logActivity(
      "EXPORTED",
      type === "inquiries"
        ? "Inquiry"
        : type === "articles"
          ? "Article"
          : type === "services"
            ? "Service"
            : "Review",
      `Exported ${data.length} ${type} records (${format.toUpperCase()})`,
      undefined,
      auth.user.userId
    );

    if (format === "csv") {
      if (data.length === 0) {
        return new NextResponse("No data", {
          status: 200,
          headers: { "Cache-Control": "no-store" },
        });
      }
      const headers = Object.keys(data[0]);
      const csv = [
        headers.map((h) => sanitizeCsvCell(h)).join(","),
        ...data.map((row) => headers.map((h) => sanitizeCsvCell(row[h])).join(",")),
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${type}_export.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Data export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
