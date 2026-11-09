import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/email-campaigns";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim()?.toLowerCase();
  const token = searchParams.get("token")?.trim();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  // Safe method: do not mutate database on GET. Validate token if present.
  const isValid = token ? verifyUnsubscribeToken(email, token) : false;

  return NextResponse.json({
    email,
    validToken: isValid,
    message: "To unsubscribe, please submit confirmation via POST."
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; token?: string; resubscribe?: boolean };
    const email = body.email?.trim()?.toLowerCase();
    const token = body.token?.trim();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (body.resubscribe) {
      await prisma.subscriber.upsert({
        where: { email },
        update: { isActive: true },
        create: { email, isActive: true },
      });
      return NextResponse.json({ message: "You have been resubscribed successfully." });
    }

    // Unsubscribe mutation: enforce HMAC token verification
    if (!token || !verifyUnsubscribeToken(email, token)) {
      return NextResponse.json(
        { error: "Invalid or missing security token for unsubscription. Please use the link provided in your email." },
        { status: 403 }
      );
    }

    await prisma.subscriber.updateMany({
      where: { email },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "You have been unsubscribed successfully." });
  } catch (error) {
    console.error("Failed to update subscription preference", error);
    return NextResponse.json({ error: "Failed to update subscription preference." }, { status: 500 });
  }
}

