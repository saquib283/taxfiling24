import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const faqs = await prisma.fAQ.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(faqs);
  } catch (error: unknown) {
    console.error("Failed to fetch FAQs:", error);
    return NextResponse.json(
      { error: "Failed to fetch FAQs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const question = typeof body.question === "string" ? body.question.trim() : "";
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question and answer are required." },
        { status: 400 }
      );
    }

    const parsedOrder = Number.parseInt(String(body.sortOrder ?? 0), 10);
    const sortOrder = Number.isFinite(parsedOrder) ? parsedOrder : 0;

    const faq = await prisma.fAQ.create({
      data: {
        question,
        answer,
        sortOrder,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      },
    });

    revalidatePath("/");
    revalidatePath("/contact");

    await logActivity("CREATED", "FAQ", `Created FAQ: ${faq.question.slice(0, 80)}`, faq.id, auth.user.userId);
    return NextResponse.json(faq, { status: 201 });
  } catch (error: unknown) {
    console.error("Failed to create FAQ:", error);
    return NextResponse.json(
      { error: "Failed to create FAQ" },
      { status: 500 }
    );
  }
}
