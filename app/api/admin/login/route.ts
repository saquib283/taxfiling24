import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_OPTIONS,
  computePasswordFingerprint,
  getJwtSecretKey,
} from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { checkRateLimit, getClientIp, resetRateLimit } from "@/lib/rate-limit";

// Dummy bcrypt hash to equalize timing when a username does not exist
const DUMMY_PASSWORD_HASH =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8M8M7y/xH2j5q1X0oU/f1C0w4t8gPe";

const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const rawUsername = (body as Record<string, unknown>).username;
    const rawPassword = (body as Record<string, unknown>).password;

    if (
      typeof rawUsername !== "string" ||
      typeof rawPassword !== "string" ||
      !rawUsername.trim() ||
      !rawPassword
    ) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const username = rawUsername.trim().slice(0, 64);
    const password = rawPassword;

    if (Buffer.byteLength(password, "utf8") > 72) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ip = getClientIp(request);
    const lowerUser = username.toLowerCase();

    // Enforce bounded per-IP and per-account brute-force limits
    const ipLimit = checkRateLimit("admin-login-ip", ip, {
      limit: 25,
      windowMs: LOGIN_WINDOW_MS,
    });
    const pairLimit = checkRateLimit("admin-login-pair", `${ip}:${lowerUser}`, {
      limit: 8,
      windowMs: LOGIN_WINDOW_MS,
    });
    const userLimit = checkRateLimit("admin-login-user", lowerUser, {
      limit: 15,
      windowMs: LOGIN_WINDOW_MS,
    });

    if (!ipLimit.allowed || !pairLimit.allowed || !userLimit.allowed) {
      const retrySecs = Math.max(
        ipLimit.retryAfterSeconds,
        pairLimit.retryAfterSeconds,
        userLimit.retryAfterSeconds
      );
      const retryMinutes = Math.max(1, Math.ceil(retrySecs / 60));
      return NextResponse.json(
        { error: `Too many failed login attempts. Try again in ${retryMinutes} minute(s).` },
        { status: 429, headers: { "Retry-After": String(retrySecs) } }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    const hashToCompare = user ? user.password : DUMMY_PASSWORD_HASH;
    const isValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !isValid) {
      await logActivity(
        "LOGIN_FAILED",
        "Auth",
        `Failed login attempt for username "${username}" from ${ip}`,
        user?.id,
        user?.id
      );

      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Clear per-pair failure counter on successful login
    resetRateLimit("admin-login-pair", `${ip}:${lowerUser}`);

    // Sign JWT with keyed password+role fingerprint for instant invalidation on password/role change
    const secret = getJwtSecretKey();
    const token = await new SignJWT({
      userId: user.id,
      role: user.role,
      name: user.name || user.username,
      pfp: computePasswordFingerprint(user.password, user.role),
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, ADMIN_COOKIE_OPTIONS);

    await logActivity(
      "LOGIN",
      "Auth",
      `${user.name || user.username} (${user.role}) signed in from ${ip}`,
      user.id,
      user.id
    );

    return NextResponse.json({ message: "Login successful" });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Authentication service error. Please try again." },
      { status: 500 }
    );
  }
}
