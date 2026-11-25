import { NextResponse } from "next/server";
import crypto from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join, extname, basename } from "path";
import { existsSync } from "fs";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
};

function matchesMagicBytes(buffer: Buffer, mime: string): boolean {
  if (buffer.length < 4) return false;
  switch (mime) {
    case "image/jpeg":
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/png":
      return (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    case "image/gif":
      return buffer.subarray(0, 4).toString("ascii") === "GIF8";
    case "image/webp":
      return (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
        buffer.subarray(8, 12).toString("ascii") === "WEBP"
      );
    case "application/pdf":
      return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
    case "application/msword":
    case "application/vnd.ms-excel":
      return (
        buffer[0] === 0xd0 &&
        buffer[1] === 0xcf &&
        buffer[2] === 0x11 &&
        buffer[3] === 0xe0
      );
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return buffer[0] === 0x50 && buffer[1] === 0x4b && (buffer[2] === 0x03 || buffer[2] === 0x05);
    default:
      return false;
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const data = await request.formData();
    const rawFile = data.get("file");

    if (!(rawFile instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const file = rawFile;

    if (file.size <= 0) {
      return NextResponse.json({ error: "Uploaded file is empty." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
    }

    const validExtensions = ALLOWED_MIME_TYPES[file.type];
    if (!validExtensions) {
      return NextResponse.json({ error: `File type '${file.type}' is not allowed.` }, { status: 400 });
    }

    const rawExt = extname(file.name);
    const originalExt = rawExt.toLowerCase();
    if (!validExtensions.includes(originalExt)) {
      return NextResponse.json({ error: "File extension does not match its content type." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!matchesMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "File contents do not match the declared file type." },
        { status: 400 }
      );
    }

    const uniqueSuffix = `${Date.now()}-${crypto.randomUUID()}`;
    const sanitizedBase = basename(file.name, rawExt)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 50) || "file";
    const filename = `${uniqueSuffix}-${sanitizedBase}${originalExt}`;

    // Store outside public/ and serve via /api/uploads/[filename] so uploads work in Next.js production mode
    const uploadDir = join(process.cwd(), "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, filename);
    await writeFile(filePath, buffer);

    await logActivity(
      "UPLOADED",
      "Media",
      `Uploaded file ${filename} (${file.type}, ${Math.round(file.size / 1024)} KB)`,
      undefined,
      auth.user.userId
    );

    return NextResponse.json({
      url: `/api/uploads/${filename}`,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
