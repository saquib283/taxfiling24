import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export interface AdminUser {
  userId: string;
  role: string;
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
 * Verifies the admin JWT token from cookies.
 * Returns the decoded user payload or null if invalid/missing.
 */
export async function verifyAdmin(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) return null;

    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secret);

    return {
      userId: payload.userId as string,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

/**
 * Verifies admin auth in API route handlers.
 * Usage:
 *   const admin = await requireAdmin();
 *   if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 */
export async function requireAdmin(): Promise<AdminUser | null> {
  return verifyAdmin();
}
