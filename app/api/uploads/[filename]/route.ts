import { NextResponse } from "next/server";
import { readFile, realpath, stat } from "fs/promises";
import { existsSync } from "fs";
import { extname, join, sep } from "path";
import { verifyAdmin } from "@/lib/auth";

const EXT_MIME_MAP: Record<string, { mime: string; inline: boolean }> = {
  ".jpg": { mime: "image/jpeg", inline: true },
  ".jpeg": { mime: "image/jpeg", inline: true },
  ".png": { mime: "image/png", inline: true },
  ".gif": { mime: "image/gif", inline: true },
  ".webp": { mime: "image/webp", inline: true },
  ".pdf": { mime: "application/pdf", inline: false },
  ".doc": { mime: "application/msword", inline: false },
  ".docx": {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    inline: false,
  },
  ".xls": { mime: "application/vnd.ms-excel", inline: false },
  ".xlsx": {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    inline: false,
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Strictly block path traversal or invalid characters
  if (!filename || !/^[a-zA-Z0-9._-]+$/.test(filename) || filename.includes("..")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const ext = extname(filename).toLowerCase();
  const meta = EXT_MIME_MAP[ext];
  if (!meta) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 404 });
  }

  // Non-image uploaded documents (PDF/Office) require authenticated admin access
  if (!meta.inline) {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const primaryDir = join(process.cwd(), "uploads");
  const legacyDir = join(process.cwd(), "public", "uploads");
  const primaryPath = join(primaryDir, filename);
  const legacyPath = join(legacyDir, filename);

  let baseDir: string | null = null;
  let candidatePath: string | null = null;
  if (existsSync(primaryPath)) {
    baseDir = primaryDir;
    candidatePath = primaryPath;
  } else if (existsSync(legacyPath)) {
    baseDir = legacyDir;
    candidatePath = legacyPath;
  }

  if (!baseDir || !candidatePath) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    // Verify symlink containment and regular file type
    const [realBase, realTarget] = await Promise.all([
      realpath(baseDir),
      realpath(candidatePath),
    ]);
    if (!realTarget.startsWith(realBase + sep)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const fileStats = await stat(realTarget);
    if (!fileStats.isFile()) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = await readFile(realTarget);
    const headers: Record<string, string> = {
      "Content-Type": meta.mime,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": meta.inline
        ? "public, max-age=31536000, immutable"
        : "private, no-store",
    };

    if (!meta.inline) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
      headers["Content-Security-Policy"] = "sandbox";
    }

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (error) {
    console.error("Failed to read uploaded file:", error);
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 });
  }
}
