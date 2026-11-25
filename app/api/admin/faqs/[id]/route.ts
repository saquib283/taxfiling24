import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: {
      question?: string;
      answer?: string;
      sortOrder?: number;
      isActive?: boolean;
    } = {};

    if (body.question !== undefined) {
      const q = String(body.question ?? "").trim();
      if (!q) {
        return NextResponse.json({ error: "Question cannot be empty." }, { status: 400 });
      }
      updateData.question = q;
    }

    if (body.answer !== undefined) {
      const a = String(body.answer ?? "").trim();
      if (!a) {
        return NextResponse.json({ error: "Answer cannot be empty." }, { status: 400 });
      }
      updateData.answer = a;
    }

    if (body.sortOrder !== undefined) {
      const parsedOrder = Number.parseInt(String(body.sortOrder), 10);
      if (Number.isFinite(parsedOrder)) {
        updateData.sortOrder = parsedOrder;
      }
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    const faq = await prisma.fAQ.update({ where: { id }, data: updateData });

    revalidatePath("/");
    revalidatePath("/contact");

    await logActivity("UPDATED", "FAQ", `Updated FAQ: ${faq.question.slice(0, 80)}`, faq.id, auth.user.userId);
    return NextResponse.json(faq);
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "FAQ not found." }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update FAQ" },
      { status: 500 }
    );
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const deleted = await prisma.fAQ.delete({ where: { id } });

    revalidatePath("/");
    revalidatePath("/contact");

    await logActivity("DELETED", "FAQ", `Deleted FAQ: ${deleted.question.slice(0, 80)}`, id, auth.user.userId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "FAQ not found." }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete FAQ" },
      { status: 500 }
    );
  }
}
