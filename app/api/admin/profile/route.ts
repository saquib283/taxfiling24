import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE_OPTIONS,
  BCRYPT_COST,
  computePasswordFingerprint,
  getJwtSecretKey,
  requireRole,
  validatePasswordStrength,
} from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";
import { checkRateLimit, resetRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: { id: true, name: true, username: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Profile API Error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { name, currentPassword, newPassword } = body as Record<string, unknown>;

    const user = await prisma.user.findUnique({ where: { id: auth.user.userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updateData: { name?: string; password?: string } = {};

    if (typeof name === "string" && name.trim()) {
      updateData.name = name.trim().slice(0, 100);
    }

    let passwordChanged = false;
    if (typeof newPassword === "string" && newPassword.length > 0) {
      const pwdLimit = checkRateLimit("profile-password-change", auth.user.userId, {
        limit: 8,
        windowMs: 15 * 60 * 1000,
      });
      if (!pwdLimit.allowed) {
        return NextResponse.json(
          { error: "Too many password change attempts. Please try again later." },
          { status: 429, headers: { "Retry-After": String(pwdLimit.retryAfterSeconds) } }
        );
      }

      if (typeof currentPassword !== "string" || !currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to set a new password" },
          { status: 400 }
        );
      }
      if (Buffer.byteLength(currentPassword, "utf8") > 72) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      const strengthError = validatePasswordStrength(newPassword, user.username);
      if (strengthError) {
        return NextResponse.json({ error: strengthError }, { status: 400 });
      }
      if (newPassword === currentPassword) {
        return NextResponse.json(
          { error: "New password must be different from your current password." },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        await logActivity(
          "LOGIN_FAILED",
          "Auth",
          `Incorrect current password entered during profile password change (${user.username})`,
          user.id,
          user.id
        );
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      resetRateLimit("profile-password-change", auth.user.userId);
      updateData.password = await bcrypt.hash(newPassword, BCRYPT_COST);
      passwordChanged = true;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No changes to save." });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: { id: true, name: true, username: true, role: true, password: true },
    });

    // Re-issue cookie with updated password+role fingerprint so current browser stays signed in
    // while all other active sessions are immediately invalidated.
    if (passwordChanged) {
      const secret = getJwtSecretKey();
      const token = await new SignJWT({
        userId: updated.id,
        role: updated.role,
        name: updated.name || updated.username,
        pfp: computePasswordFingerprint(updated.password, updated.role),
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("2h")
        .sign(secret);

      const cookieStore = await cookies();
      cookieStore.set("admin_token", token, ADMIN_COOKIE_OPTIONS);
    }

    await logActivity(
      "UPDATED",
      "User",
      passwordChanged
        ? `Updated profile and changed password (${updated.username})`
        : `Updated profile display name (${updated.username})`,
      updated.id,
      updated.id
    );

    return NextResponse.json({ message: "Profile updated successfully!" });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
