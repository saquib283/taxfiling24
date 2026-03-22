import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Returns a map of integration key -> boolean (configured or not).
 * Never returns actual values — only presence checks.
 */
export async function GET() {
  try {
    const statuses: Record<string, boolean> = {};

    // Check environment variables
    statuses["SMTP_HOST"] = !!process.env.SMTP_HOST;
    statuses["SMTP_PORT"] = !!process.env.SMTP_PORT;
    statuses["SMTP_USER"] = !!process.env.SMTP_USER;
    statuses["SMTP_PASS"] = !!process.env.SMTP_PASS;
    statuses["DATABASE_URL"] = !!process.env.DATABASE_URL;

    // Check settings stored in DB
    const settings = await prisma.setting.findMany({
      where: {
        key: { in: ["ga_id", "GEMINI_API_KEY"] },
      },
    });

    // Check DB settings
    for (const s of settings) {
      statuses[s.key] = !!s.value && s.value.trim() !== "";
    }

    // Also check env for GEMINI_API_KEY as fallback
    if (!statuses["GEMINI_API_KEY"]) {
      statuses["GEMINI_API_KEY"] = !!process.env.GEMINI_API_KEY;
    }

    return NextResponse.json(statuses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
