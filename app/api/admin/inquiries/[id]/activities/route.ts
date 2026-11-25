import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logLeadActivity } from "@/lib/lead-crm";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const activities = await prisma.leadActivity.findMany({
      where: { inquiryId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(activities);
  } catch (error: any) {
    console.error("Failed to load lead activities:", error);
    return NextResponse.json({ error: "Failed to load activities" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const inquiry = await prisma.inquiry.findUnique({ where: { id }, select: { id: true } });
    if (!inquiry) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const body = await request.json();
    const { type = "NOTE", title, description, metadata } = body;

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: "Activity title is required" }, { status: 400 });
    }

    const activity = await logLeadActivity({
      inquiryId: id,
      type,
      title: String(title).trim(),
      description: description?.trim() || null,
      metadata,
      performedBy: auth.user.name || auth.user.username || auth.user.role,
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create lead activity:", error);
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 });
  }
}
