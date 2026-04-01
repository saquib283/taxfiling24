import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

type TemplatePayload = {
  category?: string;
  content?: string;
  description?: string;
  id?: string;
  isAiGenerated?: boolean;
  name?: string;
  preheader?: string;
  subject?: string;
};

export async function GET() {
  try {
    const templates = await prisma.campaignTemplate.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error("Failed to fetch campaign templates", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as TemplatePayload;

    if (!payload.name?.trim()) {
      return NextResponse.json(
        { error: "Template name is required." },
        { status: 400 }
      );
    }

    if (!payload.subject?.trim()) {
      return NextResponse.json(
        { error: "Template subject is required." },
        { status: 400 }
      );
    }

    if (!payload.content?.trim()) {
      return NextResponse.json(
        { error: "Template content is required." },
        { status: 400 }
      );
    }

    const data = {
      category: payload.category?.trim() || "Newsletter",
      content: payload.content.trim(),
      description: payload.description?.trim() || null,
      isAiGenerated: Boolean(payload.isAiGenerated),
      name: payload.name.trim(),
      preheader: payload.preheader?.trim() || null,
      subject: payload.subject.trim(),
    };

    const template = payload.id
      ? await prisma.campaignTemplate.update({
          where: { id: payload.id },
          data,
        })
      : await prisma.campaignTemplate.create({
          data,
        });

    await logActivity(
      payload.id ? "UPDATED" : "CREATED",
      "Campaign",
      `${payload.id ? "Updated" : "Created"} campaign template: ${template.name}`,
      template.id
    );

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Failed to save campaign template", error);
    return NextResponse.json(
      { error: "Failed to save campaign template" },
      { status: 500 }
    );
  }
}
