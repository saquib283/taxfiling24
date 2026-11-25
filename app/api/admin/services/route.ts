import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { isSafeHref } from "@/lib/url-safety";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function GET() {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const services = await prisma.service.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(services);
  } catch (error: unknown) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const data = await request.json();

    const title = typeof data.title === "string" ? data.title.trim() : "";
    const description = typeof data.description === "string" ? data.description.trim() : "";
    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
    }

    const slug = slugify(typeof data.slug === "string" && data.slug.trim() ? data.slug : title);
    if (!slug) {
      return NextResponse.json({ error: "Please provide a valid URL slug." }, { status: 400 });
    }

    let href = `/services/${slug}`;
    if (typeof data.href === "string" && data.href.trim()) {
      const candidate = data.href.trim();
      if (!isSafeHref(candidate)) {
        return NextResponse.json(
          { error: "Redirection URL must start with /, http://, or https://." },
          { status: 400 }
        );
      }
      href = candidate;
    }

    const heroBg =
      typeof data.heroBg === "string" && data.heroBg.trim()
        ? data.heroBg.trim()
        : null;

    const service = await prisma.service.create({
      data: {
        title,
        slug,
        description,
        icon: typeof data.icon === "string" && data.icon.trim() ? data.icon.trim() : "Briefcase",
        category:
          typeof data.category === "string" && data.category.trim() ? data.category.trim() : "General",
        heroBg,
        href,
        overview: typeof data.overview === "string" && data.overview.trim() ? data.overview.trim() : null,
        benefits: Array.isArray(data.benefits) ? data.benefits : [],
        subServices: Array.isArray(data.subServices) ? data.subServices : [],
        documentsRequired: Array.isArray(data.documentsRequired) ? data.documentsRequired : [],
        process: Array.isArray(data.process) ? data.process : [],
        faqs: Array.isArray(data.faqs) ? data.faqs : [],
      },
    });

    revalidatePath("/");
    revalidatePath("/services");
    revalidatePath(`/services/${service.slug}`);
    revalidatePath("/sitemap.xml");

    await logActivity("CREATED", "Service", `Created service: ${service.title}`, service.id, auth.user.userId);
    return NextResponse.json(service, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: "A service with this slug already exists." }, { status: 409 });
    }
    console.error("Failed to create service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
