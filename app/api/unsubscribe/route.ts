import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/email-campaigns";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit("public-unsubscribe-get", ip, {
    limit: 30,
    windowMs: 60 * 1000,
  });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim()?.toLowerCase() || "";
  const token = searchParams.get("token")?.trim() || "";

  if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const isValid = token ? verifyUnsubscribeToken(email, token) : false;

  return NextResponse.json({
    email,
    validToken: isValid,
    message: "To update your email preference, please submit confirmation via POST.",
  });
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit("public-unsubscribe-post", ip, {
      limit: 15,
      windowMs: 60 * 1000,
    });
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      email?: string;
      token?: string;
      resubscribe?: boolean;
    } | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!email || email.length > 254 || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    if (!token || !verifyUnsubscribeToken(email, token)) {
      return NextResponse.json(
        {
          error:
            "Invalid or missing security token. Please use the personalized unsubscribe link provided in your email.",
        },
        { status: 403 }
      );
    }

    if (body.resubscribe) {
      await prisma.subscriber.updateMany({
        where: { email },
        data: { isActive: true },
      });
      return NextResponse.json({ message: "You have been resubscribed successfully." });
    }

    await prisma.subscriber.updateMany({
      where: { email },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "You have been unsubscribed successfully." });
  } catch (error) {
    console.error("Failed to update subscription preference", error);
    return NextResponse.json(
      { error: "Failed to update subscription preference." },
      { status: 500 }
    );
  }
}
