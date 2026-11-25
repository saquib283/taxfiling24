import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { parseAndImportSpreadsheet } from "@/lib/audience-service";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const customTag = String(formData.get("customTag") || "");
    const updateIfExistsRaw = formData.get("updateIfExists");
    const updateIfExists = updateIfExistsRaw !== "false" && updateIfExistsRaw !== "0";

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "No valid file was uploaded." }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const allowedExtensions = [".xlsx", ".csv"];
    const isValidExtension = allowedExtensions.some((ext) => filename.endsWith(ext));

    if (!isValidExtension) {
      return NextResponse.json(
        {
          error:
            "Invalid file format. Please upload an Excel (.xlsx) or CSV (.csv) file.",
        },
        { status: 400 }
      );
    }

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
      filename: file.name,
      customTag: customTag.trim() || undefined,
      updateIfExists,
      defaultSource: "CSV_IMPORT",
    });

    await logActivity(
      "UPLOADED",
      "Subscriber",
      `Imported spreadsheet "${file.name}": ${result.importedCount} created, ${result.updatedCount} updated, ${result.skippedCount} skipped`,
      undefined,
      auth.user.userId
    );

    return NextResponse.json({
      success: true,
      filename: file.name,
      ...result,
      message: `Successfully processed ${result.totalRows} rows: ${result.importedCount} new contacts imported, ${result.updatedCount} updated, ${result.skippedCount} skipped.`,
    });
  } catch (error: unknown) {
    console.error("Spreadsheet import error:", error);
    const msg = error instanceof Error ? error.message : "";
    const isClientError =
      msg.includes("Could not automatically locate") ||
      msg.includes("does not contain any data") ||
      msg.includes("not supported") ||
      msg.includes("exceeding the maximum") ||
      msg.includes("exceeds the maximum") ||
      msg.includes("archive") ||
      msg.includes("Corrupted Excel") ||
      msg.includes("missing a header");
    return NextResponse.json(
      { error: isClientError ? msg : "Failed to parse and import spreadsheet." },
      { status: isClientError ? 400 : 500 }
    );
  }
}
