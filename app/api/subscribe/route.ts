import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(request: Request) {
  try {
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const now = Date.now();
    const rateData = rateLimitMap.get(clientIp) || { count: 0, lastRequest: now };

    if (now - rateData.lastRequest > 60_000) {
      rateData.count = 1;
      rateData.lastRequest = now;
    } else {
      rateData.count += 1;
    }
    rateLimitMap.set(clientIp, rateData);

    if (rateData.count > 10) {
      return NextResponse.json(
        { error: "Too many subscription attempts. Please try again in a minute." },
        { status: 429 }
      );
    }

    const { email: rawEmail, name: rawName } = await request.json();
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    const name = typeof rawName === "string" ? rawName.trim().slice(0, 100) : null;

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    if (email.length > 254 || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 });
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
        return NextResponse.json({ success: true, message: "Subscription reactivated successfully!" });
      }
      return NextResponse.json({ success: true, message: "You are already subscribed to our newsletter." });
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
    console.error("Subscription error:", err);
    return NextResponse.json({ error: "Failed to subscribe. Please try again later." }, { status: 500 });
  }
}
