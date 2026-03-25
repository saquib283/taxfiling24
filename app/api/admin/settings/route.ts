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
    return new Response(JSON.stringify({ message: "Settings updated successfully" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
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

    return new Response(JSON.stringify(config), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
