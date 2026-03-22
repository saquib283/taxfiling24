import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "inquiries";
    const format = searchParams.get("format") || "json";

    let data: any[] = [];

    switch (type) {
      case "inquiries":
        data = await prisma.inquiry.findMany({ orderBy: { createdAt: "desc" } });
        break;
      case "articles":
        data = await prisma.article.findMany({ orderBy: { createdAt: "desc" } });
        break;
      case "services":
        data = await prisma.service.findMany({ orderBy: { createdAt: "desc" } });
        break;
      case "reviews":
        data = await prisma.review.findMany({ orderBy: { createdAt: "desc" } });
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (format === "csv") {
      if (data.length === 0) return new NextResponse("No data", { status: 200 });
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(","),
        ...data.map((row: any) =>
          headers.map(h => {
            const val = String(row[h] ?? "").replace(/"/g, '""');
            return `"${val}"`;
          }).join(",")
        )
      ].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${type}_export.csv"`,
        },
      });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
