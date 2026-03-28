import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum size is 10MB." }, { status: 400 });
    }

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `File type '${file.type}' is not allowed.` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `${uniqueSuffix}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    const uploadDir = join(process.cwd(), "public", "uploads");
    
    // Debug logging for production diagnosis
    console.log(`[Upload API] Attempting to upload to: ${uploadDir}`);

    // Ensure upload directory exists
    try {
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
        console.log(`[Upload API] Created directory: ${uploadDir}`);
      }
    } catch (mkdirError: any) {
      console.error(`[Upload API] Failed to create directory: ${mkdirError.message}`);
      return NextResponse.json({ 
        error: `Storage error: Failed to create upload directory. ${mkdirError.message}` 
      }, { status: 500 });
    }

    const path = join(uploadDir, filename);
    
    try {
      await writeFile(path, buffer);
      console.log(`[Upload API] Successfully wrote file: ${path}`);
    } catch (writeError: any) {
      console.error(`[Upload API] Failed to write file: ${writeError.message}`);
      return NextResponse.json({ 
        error: `Storage error: Failed to write file to disk. ${writeError.message}. This usually happens on serverless platforms (like Vercel) where the filesystem is read-only.` 
      }, { status: 500 });
    }
    
    // Return the URL for the client to use
    return NextResponse.json({ 
      url: `/uploads/${filename}`,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error: any) {
    console.error(`[Upload API] Unexpected error: ${error.message}`);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}
