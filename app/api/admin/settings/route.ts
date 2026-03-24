import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  try {
    const { settings } = await request.json(); // Expected: { settings: { KEY: value } }

    const updates = Object.entries(settings).map(async ([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    });

    await Promise.all(updates);

    // Invalidate the root layout cache so the new theme takes effect immediately in production
    revalidatePath("/", "layout");

    await logActivity("UPDATED", "Setting", `Updated ${Object.keys(settings).length} settings`);
    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    // Convert to key-value object for easier consumption
    const config = settings.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
