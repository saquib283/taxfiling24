import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface AdminUser {
  userId: string;
  role: string;
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

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "secure-admin-secret-key-default-256"
    );
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
 * Verifies admin auth and returns user or throws a Response.
 * Use in API route handlers for clean one-liner auth checks.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await verifyAdmin();
  if (!user) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return user;
}
