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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Service not found." }, { status: 404 });
    }

    const data = await request.json();

    const title = typeof data.title === "string" ? data.title.trim() : existing.title;
    const description =
      typeof data.description === "string" ? data.description.trim() : existing.description;
    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
    }

    let nextSlug = existing.slug;
    if (data.slug !== undefined) {
      const candidate = slugify(String(data.slug ?? ""));
      if (!candidate) {
        return NextResponse.json({ error: "Service slug cannot be empty." }, { status: 400 });
      }
      nextSlug = candidate;
    }

    let href: string | null | undefined = undefined;
    if (data.href !== undefined) {
      const candidate = typeof data.href === "string" ? data.href.trim() : "";
      if (!candidate) {
        href = null;
      } else if (!isSafeHref(candidate)) {
        return NextResponse.json(
          { error: "Redirection URL must start with /, http://, or https://." },
          { status: 400 }
        );
      } else {
        href = candidate;
      }
    }

    const heroBg =
      data.heroBg !== undefined
        ? typeof data.heroBg === "string" && data.heroBg.trim()
          ? data.heroBg.trim()
          : null
        : undefined;

    const service = await prisma.service.update({
      where: { id },
      data: {
        title,
        slug: nextSlug,
        description,
        icon: typeof data.icon === "string" && data.icon.trim() ? data.icon.trim() : undefined,
        category:
          typeof data.category === "string" && data.category.trim()
            ? data.category.trim()
            : undefined,
        href,
        heroBg,
        overview:
          data.overview !== undefined
            ? typeof data.overview === "string" && data.overview.trim()
              ? data.overview.trim()
              : null
            : undefined,
        benefits: data.benefits !== undefined && Array.isArray(data.benefits) ? data.benefits : undefined,
        subServices:
          data.subServices !== undefined && Array.isArray(data.subServices)
            ? data.subServices
            : undefined,
        documentsRequired:
          data.documentsRequired !== undefined && Array.isArray(data.documentsRequired)
            ? data.documentsRequired
            : undefined,
        process: data.process !== undefined && Array.isArray(data.process) ? data.process : undefined,
        faqs: data.faqs !== undefined && Array.isArray(data.faqs) ? data.faqs : undefined,
      },
    });

    revalidatePath("/");
    revalidatePath("/services");
    revalidatePath(`/services/${existing.slug}`);
    if (service.slug !== existing.slug) {
      revalidatePath(`/services/${service.slug}`);
    }
    revalidatePath("/sitemap.xml");

    await logActivity("UPDATED", "Service", `Updated service: ${service.title}`, service.id, auth.user.userId);
    return NextResponse.json(service);
  } catch (error: unknown) {
    const code = (error as { code?: string })?.code;
    if (code === "P2002") {
      return NextResponse.json({ error: "A service with this slug already exists." }, { status: 409 });
    }
    if (code === "P2025") {
      return NextResponse.json({ error: "Service not found." }, { status: 404 });
    }
    console.error("Failed to update service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const deleted = await prisma.service.delete({
      where: { id },
    });

    revalidatePath("/");
    revalidatePath("/services");
    revalidatePath(`/services/${deleted.slug}`);
    revalidatePath("/sitemap.xml");

    await logActivity("DELETED", "Service", `Deleted service: ${deleted.title}`, id, auth.user.userId);
    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Service not found." }, { status: 404 });
    }
    console.error("Failed to delete service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
