import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await request.json();

    if (!data.title || !data.description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const slug = data.slug ? slugify(data.slug) : slugify(data.title);

    const service = await prisma.service.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        icon: data.icon || "Briefcase",
        category: data.category || "General",
        heroBg: data.heroBg || "from-blue-600 to-indigo-700",
        href: data.href || `/services/${slug}`,
        overview: data.overview || null,
        benefits: data.benefits || [],
        subServices: data.subServices || [],
        documentsRequired: data.documentsRequired || [],
        process: data.process || [],
        faqs: data.faqs || [],
      },
    });

    return NextResponse.json(service);
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Service with this slug already exists." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
