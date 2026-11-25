import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function GET(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const rawLimit = Number.parseInt(searchParams.get("limit") || "200", 10);
    const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(500, Math.max(1, rawLimit)) : 200;
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

    const subscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });
    return NextResponse.json(subscribers);
  } catch (error) {
    console.error("Failed to fetch subscribers:", error);
    return NextResponse.json({ error: "Failed to fetch subscribers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      reactivate?: boolean;
    };
    const email = body.email?.trim()?.toLowerCase();
    const name = body.name?.trim() || null;

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address format." }, { status: 400 });
    }

    const existing = await prisma.subscriber.findUnique({ where: { email } });

    if (existing) {
      // Never silently override an unsubscribed contact's opt-out without explicit reactivation
      if (!existing.isActive && !body.reactivate) {
        return NextResponse.json(
          {
            error:
              "This email previously unsubscribed / is suppressed. Toggle its status explicitly in Audience Hub if the user has re-consented.",
          },
          { status: 409 }
        );
      }

      const subscriber = await prisma.subscriber.update({
        where: { id: existing.id },
        data: {
          name: name || existing.name,
          ...(body.reactivate ? { isActive: true } : {}),
        },
      });

      await logActivity(
        "UPDATED",
        "Subscriber",
        `Updated subscriber: ${email}`,
        subscriber.id,
        auth.user.userId
      );

      return NextResponse.json({ subscriber, message: "Subscriber updated successfully." });
    }

    const subscriber = await prisma.subscriber.create({
      data: {
        email,
        name,
        source: "MANUAL",
        isActive: true,
      },
    });

    await logActivity(
      "CREATED",
      "Subscriber",
      `Added subscriber: ${email}`,
      subscriber.id,
      auth.user.userId
    );

    return NextResponse.json({ subscriber, message: "Subscriber saved successfully." });
  } catch (error) {
    console.error("Failed to add subscriber", error);
    return NextResponse.json({ error: "Failed to save subscriber" }, { status: 500 });
  }
}
