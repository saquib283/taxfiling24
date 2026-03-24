import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const service = await prisma.service.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        icon: data.icon,
        category: data.category,
        href: data.href || null,
        overview: data.overview !== undefined ? data.overview : undefined,
        benefits: data.benefits !== undefined ? data.benefits : undefined,
        subServices: data.subServices !== undefined ? data.subServices : undefined,
        documentsRequired: data.documentsRequired !== undefined ? data.documentsRequired : undefined,
        process: data.process !== undefined ? data.process : undefined,
        faqs: data.faqs !== undefined ? data.faqs : undefined,
      },
    });

    return NextResponse.json(service);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
