import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if already subscribed
    const existing = await prisma.subscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (!existing.isActive) {
        // Re-activate
        await prisma.subscriber.update({
          where: { email },
          data: { isActive: true, name: name || existing.name },
        });
        return NextResponse.json({ success: true, message: "Subscription reactivated!" });
      }
      return NextResponse.json({ success: true, message: "You are already subscribed!" });
    }

    await prisma.subscriber.create({
      data: {
        email,
        name: name || null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, message: "Subscribed successfully!" });
  } catch (err) {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
