import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { SERVICES_DETAIL_DATA } from "@/lib/services-detail-data";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

function resolveServiceCategory(slug: string): string {
  if (slug.includes("business-setup") || slug.includes("licences")) return "registration";
  if (slug.includes("taxation") || slug.includes("gst")) return "taxation";
  if (slug.includes("roc") || slug.includes("compliance")) return "compliance";
  if (slug.includes("accounting")) return "accounting";
  if (slug.includes("audit")) return "audit";
  if (slug.includes("cfo") || slug.includes("special-services")) return "advisory";
  return "General";
}

export async function POST() {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const createdServices = [];

    for (const [slug, data] of Object.entries(SERVICES_DETAIL_DATA)) {
      const existing = await prisma.service.findUnique({ where: { slug } });

      if (!existing) {
        const newService = await prisma.service.create({
          data: {
            title: data.title,
            slug,
            description: data.description,
            overview: data.overview,
            heroBg: data.heroBg,
            benefits: data.benefits as any,
            subServices: data.subServices as any,
            documentsRequired: data.documentsRequired as any,
            process: data.process as any,
            faqs: data.faqs as any,
            icon: "Briefcase",
            category: resolveServiceCategory(slug),
            href: `/services/${slug}`,
          },
        });
        createdServices.push(newService);
      }
    }

    if (createdServices.length > 0) {
      revalidatePath("/");
      revalidatePath("/services");
      revalidatePath("/sitemap.xml");
      await logActivity(
        "CREATED",
        "Service",
        `Seeded ${createdServices.length} default services`,
        undefined,
        auth.user.userId
      );
    }

    return NextResponse.json({
      message: "Seeded successfully",
      count: createdServices.length,
      services: createdServices,
    });
  } catch (error) {
    console.error("Seed services error:", error);
    return NextResponse.json({ error: "Failed to seed services" }, { status: 500 });
  }
}
