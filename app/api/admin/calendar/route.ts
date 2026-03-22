import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const deadlines = await prisma.complianceDeadline.findMany({ orderBy: { date: "asc" } });
    return NextResponse.json(deadlines);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const deadline = await prisma.complianceDeadline.create({ data: { ...body, date: new Date(body.date) } });
    return NextResponse.json(deadline, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
