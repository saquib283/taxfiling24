import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { parseAndImportSpreadsheet } from "@/lib/audience-service";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const customTag = (formData.get("customTag") as string) || "";
    const updateIfExistsRaw = formData.get("updateIfExists");
    const updateIfExists = updateIfExistsRaw !== "false" && updateIfExistsRaw !== "0";

    if (!file) {
      return NextResponse.json({ error: "No file was uploaded." }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const allowedExtensions = [".xlsx", ".xls", ".csv"];
    const isValidExtension = allowedExtensions.some((ext) => filename.endsWith(ext));

    if (!isValidExtension) {
      return NextResponse.json(
        { error: "Invalid file format. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file." },
        { status: 400 }
      );
    }

    // Limit file size to 15MB
    const maxSizeBytes = 15 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: "File size exceeds the 15MB limit. Please upload a smaller file." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await parseAndImportSpreadsheet(buffer, {
      customTag: customTag.trim() || undefined,
      updateIfExists,
      defaultSource: "CSV_IMPORT",
    });

    return NextResponse.json({
      success: true,
      filename: file.name,
      ...result,
      message: `Successfully processed ${result.totalRows} rows: ${result.importedCount} new contacts imported, ${result.updatedCount} updated, ${result.skippedCount} skipped.`,
    });
  } catch (error: any) {
    console.error("Spreadsheet import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse and import spreadsheet." },
      { status: 500 }
    );
  }
}

