import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const faqs = await prisma.fAQ.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json(faqs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const faq = await prisma.fAQ.create({ data: body });
    return NextResponse.json(faq, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
