import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SERVICES_DETAIL_DATA } from "@/lib/services-detail-data";
import { SERVICES } from "@/lib/constants";

export async function GET() {
  try {
    const createdServices = [];
    
    for (const [slug, data] of Object.entries(SERVICES_DETAIL_DATA)) {
      const existing = await prisma.service.findUnique({
        where: { slug }
      });
      
      if (!existing) {
        const baseDoc = SERVICES.find(s => s.href?.endsWith(slug));
        
        let categoryAssigned = "General";
        if (slug.includes("business-setup")) categoryAssigned = "tax"; // Based on page.tsx category maps
        if (slug.includes("gst") || slug.includes("it")) categoryAssigned = "gst";
        if (slug.includes("audit")) categoryAssigned = "audit";
        if (slug.includes("compliance") || slug.includes("roc")) categoryAssigned = "compliance";
        
        const newService = await prisma.service.create({
          data: {
            title: data.title,
            slug: slug,
            description: data.description,
            overview: data.overview,
            heroBg: data.heroBg,
            benefits: data.benefits as any,
            subServices: data.subServices as any,
            documentsRequired: data.documentsRequired as any,
            process: data.process as any,
            faqs: data.faqs as any,
            icon: "Briefcase", 
            category: categoryAssigned,
            href: `/services/${slug}`
          }
        });
        createdServices.push(newService);
      }
    }
    
    return NextResponse.json({ message: "Seeded successfully", count: createdServices.length, services: createdServices });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
