import crypto from "crypto";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export type AdminRole = "ADMIN" | "EDITOR" | "VIEWER";
export const ALLOWED_ROLES: readonly AdminRole[] = ["ADMIN", "EDITOR", "VIEWER"];
export const BCRYPT_COST = 12;

export const ADMIN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 60 * 60 * 2, // 2 hours
  path: "/",
};

export interface AdminUser {
  userId: string;
  role: AdminRole;
  name: string;
  username: string;
}

const COMMON_WEAK_PASSWORDS = new Set([
  "admin123",
  "admin1234",
  "admin12345",
  "password123",
  "password1234",
  "1234567890",
  "123456789012",
  "qwerty1234",
  "qwerty12345",
  "welcome123",
  "taxfiling24",
  "taxfiling24123",
  "changeme123",
]);

export function isValidAdminRole(role: unknown): role is AdminRole {
  return typeof role === "string" && (ALLOWED_ROLES as readonly string[]).includes(role);
}

/**
 * Validates admin password strength:
 * - 10 to 72 UTF-8 bytes (bcrypt silently truncates beyond 72 bytes)
 * - Contains at least one letter and one number
 * - Not a common weak password or containing the username
 */
export function validatePasswordStrength(password: string, username?: string): string | null {
  if (typeof password !== "string" || password.length < 10) {
    return "Password must be at least 10 characters long.";
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    return "Password must not exceed 72 bytes.";
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include at least one letter and one number.";
  }
  const normalized = password.toLowerCase().trim();
  if (COMMON_WEAK_PASSWORDS.has(normalized)) {
    return "Please choose a stronger, less common password.";
  }
  if (username && username.trim().length >= 3 && normalized.includes(username.trim().toLowerCase())) {
    return "Password cannot contain your username.";
  }
  return null;
}

/**
 * Resolves the JWT secret key. Fails closed if not configured.
 */
export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("SECURITY_MISCONFIGURATION: JWT_SECRET environment variable is missing or empty.");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Derives a keyed HMAC fingerprint of a user's bcrypt password hash and role.
 * Included in JWT claims so password changes OR role changes immediately revoke
 * prior tokens without requiring a schema migration.
 */
export function computePasswordFingerprint(passwordHash: string, role?: string): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("SECURITY_MISCONFIGURATION: JWT_SECRET environment variable is missing or empty.");
  }
  return crypto
    .createHmac("sha256", secret)
    .update(`pfp:v2:${passwordHash}:${role || ""}`)
    .digest("hex")
    .slice(0, 32);
}

function timingSafeHexEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verifies the admin JWT token from cookies AND validates live user existence,
 * current role, and keyed password+role fingerprint against the database.
 */
export async function verifyAdmin(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) return null;

    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const userId = typeof payload.userId === "string" ? payload.userId : "";
    const tokenPfp = typeof payload.pfp === "string" ? payload.pfp : "";
    if (!userId || !tokenPfp) return null;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, role: true, password: true },
    });

    if (!dbUser) return null;

    const liveRole: AdminRole = isValidAdminRole(dbUser.role) ? dbUser.role : "VIEWER";
    const expectedPfp = computePasswordFingerprint(dbUser.password, liveRole);
    if (!timingSafeHexEqual(tokenPfp, expectedPfp)) {
      return null;
    }

    return {
      userId: dbUser.id,
      role: liveRole,
      name: dbUser.name || dbUser.username,
      username: dbUser.username,
    };
  } catch {
    return null;
  }
}

/**
 * Verifies admin auth in API route handlers, optionally restricting to allowed roles.
 */
export async function requireAdmin(
  allowedRoles?: readonly AdminRole[]
): Promise<AdminUser | null> {
  const user = await verifyAdmin();
  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;
  return user;
}

/**
 * Strict RBAC guard for API routes that distinguishes 401 Unauthorized vs 403 Forbidden.
 */
export async function requireRole(
  allowedRoles: readonly AdminRole[] = ["ADMIN", "EDITOR", "VIEWER"]
): Promise<{ ok: true; user: AdminUser } | { ok: false; response: NextResponse }> {
  const user = await verifyAdmin();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!allowedRoles.includes(user.role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Forbidden: insufficient permissions for this action" },
        { status: 403 }
      ),
    };
  }
  return { ok: true, user };
}

/**
 * Strict server-side RBAC guard for Admin Server Component layouts and pages.
 * Redirects unauthenticated or revoked sessions to /admin/login and unauthorized roles to /admin.
 */
export async function requirePageRole(
  allowedRoles: readonly AdminRole[] = ["ADMIN", "EDITOR", "VIEWER"]
): Promise<AdminUser> {
  const user = await verifyAdmin();
  if (!user) {
    redirect("/admin/login");
  }
  if (!allowedRoles.includes(user.role)) {
    redirect("/admin");
  }
  return user;
}
