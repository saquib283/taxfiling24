import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);
    const rate = checkRateLimit("public-subscribe", clientIp, {
      limit: 10,
      windowMs: 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many subscription attempts. Please try again in a minute." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const rawEmail = (body as Record<string, unknown>).email;
    const rawName = (body as Record<string, unknown>).name;
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
    const name = typeof rawName === "string" ? rawName.trim().slice(0, 100) : null;

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    if (email.length > 254 || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 });
    }

    const existing = await prisma.subscriber.findUnique({
      where: { email },
      select: { id: true },
    });

    // Never enumerate existing emails or bypass opt-out/bounce suppression (isActive: false)
    if (!existing) {
      await prisma.subscriber.create({
        data: {
          email,
          name: name || null,
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Thank you! Your subscription request has been recorded.",
    });
  } catch (err) {
    console.error("Subscription error:", err);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again later." },
      { status: 500 }
    );
  }
}
