import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

function parseCalendarDate(raw: unknown): Date | null {
  if (typeof raw !== "string" && !(raw instanceof Date)) return null;
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Normalize YYYY-MM-DD to 12:00 IST (06:30 UTC) so the calendar day never shifts across timezones
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? new Date(`${trimmed}T12:00:00+05:30`)
    : new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET() {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const deadlines = await prisma.complianceDeadline.findMany({ orderBy: { date: "asc" } });
    return NextResponse.json(deadlines);
  } catch (error: unknown) {
    console.error("Failed to fetch deadlines:", error);
    return NextResponse.json(
      { error: "Failed to fetch deadlines" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const category = typeof body.category === "string" ? body.category.trim() : "";
    const parsedDate = parseCalendarDate(body.date);

    if (!title || !category) {
      return NextResponse.json(
        { error: "Title and category are required." },
        { status: 400 }
      );
    }

    if (!parsedDate) {
      return NextResponse.json(
        { error: "Please provide a valid statutory due date." },
        { status: 400 }
      );
    }

    const deadline = await prisma.complianceDeadline.create({
      data: {
        title,
        category,
        date: parsedDate,
        desc: typeof body.desc === "string" ? body.desc.trim() : "",
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });

    revalidatePath("/");

    await logActivity(
      "CREATED",
      "Deadline",
      `Created deadline: ${deadline.title}`,
      deadline.id,
      auth.user.userId
    );
    return NextResponse.json(deadline, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create deadline:", error);
    return NextResponse.json(
      { error: "Failed to create deadline" },
      { status: 500 }
    );
  }
}
