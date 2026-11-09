import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source")?.trim();
    const tag = searchParams.get("tag")?.trim();
    const status = searchParams.get("status")?.toUpperCase();
    const search = searchParams.get("search")?.trim();
    const format = (searchParams.get("format") || "csv").toLowerCase();

    const where: any = {};
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
    });

    let filtered = contacts;
    if (tag) {
      filtered = contacts.filter((c) => {
        if (!c.tags || !Array.isArray(c.tags)) return false;
        return (c.tags as string[]).includes(tag);
      });
    }

    const exportRows = filtered.map((c) => ({
      Email: c.email,
      Name: c.name || "",
      Phone: c.phone || "",
      Company: c.company || "",
      Source: c.source || "NEWSLETTER",
      Tags: Array.isArray(c.tags) ? (c.tags as string[]).join(", ") : "",
      Status: c.isActive ? "Active" : "Suppressed",
      "Date Added": c.createdAt.toISOString().split("T")[0],
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audience Contacts");

    const isXlsx = format === "xlsx";
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: isXlsx ? "xlsx" : "csv",
    });

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `taxfiling24-audience-${timestamp}.${isXlsx ? "xlsx" : "csv"}`;
    const contentType = isXlsx
      ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "text/csv; charset=utf-8";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Audience export error:", error);
    return NextResponse.json({ error: "Failed to export audience." }, { status: 500 });
  }
}

