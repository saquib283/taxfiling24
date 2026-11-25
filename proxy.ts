import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_ONLY_PAGE_PREFIXES = [
  "/admin/users",
  "/admin/settings",
  "/admin/theme",
  "/admin/integrations",
  "/admin/seo",
  "/admin/code-injection",
  "/admin/activity-log",
  "/admin/activity",
];

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function getAllowedOrigins(request: NextRequest): Set<string> {
  const origins = new Set<string>([request.nextUrl.origin]);
  for (const envUrl of [process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_APP_URL]) {
    if (!envUrl) continue;
    try {
      origins.add(new URL(envUrl).origin);
    } catch {
      // ignore invalid env URL
    }
  }
  return origins;
}

function isSameOriginRequest(request: NextRequest): boolean {
  const secFetchSite = request.headers.get("sec-fetch-site")?.toLowerCase();
  if (secFetchSite === "cross-site") {
    return false;
  }

  const allowedOrigins = getAllowedOrigins(request);
  const originHeader = request.headers.get("origin")?.trim();
  if (originHeader) {
    if (originHeader === "null") return false;
    return allowedOrigins.has(originHeader);
  }

  const refererHeader = request.headers.get("referer")?.trim();
  if (refererHeader) {
    try {
      return allowedOrigins.has(new URL(refererHeader).origin);
    } catch {
      return false;
    }
  }

  // If browser metadata indicates a fetch request without Origin/Referer, fail closed unless same-origin
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    return false;
  }

  return true;
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const method = request.method.toUpperCase();

  // Enforce same-origin CSRF protection on all mutating admin API requests (including login/logout)
  if (pathname.startsWith("/api/admin") && MUTATING_METHODS.has(method)) {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json(
        { error: "Forbidden: cross-origin request blocked" },
        { status: 403 }
      );
    }
  }

  // Skip auth gate on login routes
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  // Protect /admin pages and /api/admin routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const secretKey = process.env.JWT_SECRET?.trim();
    if (!secretKey) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Server authentication error" }, { status: 500 });
      }
      return NextResponse.redirect(new URL("/admin/login?error=unconfigured", request.url));
    }

    try {
      const secret = new TextEncoder().encode(secretKey);
      const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
      const role = typeof payload.role === "string" ? payload.role : "VIEWER";

      // Defense-in-depth RBAC at proxy layer (complemented by live DB checks in requireRole / requirePageRole)
      if (
        role !== "ADMIN" &&
        ADMIN_ONLY_PAGE_PREFIXES.some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
        )
      ) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }

      // Block VIEWER role from any API mutation except logout & own profile
      if (
        role === "VIEWER" &&
        pathname.startsWith("/api/admin") &&
        MUTATING_METHODS.has(method) &&
        pathname !== "/api/admin/logout" &&
        pathname !== "/api/admin/profile"
      ) {
        return NextResponse.json(
          { error: "Forbidden: read-only viewer role cannot modify data" },
          { status: 403 }
        );
      }

      return NextResponse.next();
    } catch {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
