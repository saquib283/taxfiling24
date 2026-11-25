import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { BCRYPT_COST, isValidAdminRole, requireRole, validatePasswordStrength } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, username: true, role: true, createdAt: true },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Fetch users error:", error);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { name, username: rawUsername, password, role: rawRole } = body as Record<string, unknown>;
    const username = typeof rawUsername === "string" ? rawUsername.trim() : "";

    if (!username || typeof password !== "string" || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9._@-]{3,64}$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3–64 characters using letters, numbers, ., _, @, or -" },
        { status: 400 }
      );
    }

    const strengthError = validatePasswordStrength(password, username);
    if (strengthError) {
      return NextResponse.json({ error: strengthError }, { status: 400 });
    }

    const role = rawRole === undefined ? "EDITOR" : rawRole;
    if (!isValidAdminRole(role)) {
      return NextResponse.json(
        { error: "Invalid role. Allowed values: ADMIN, EDITOR, VIEWER" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST);

    const user = await prisma.user.create({
      data: {
        name: typeof name === "string" && name.trim() ? name.trim().slice(0, 100) : null,
        username,
        password: hashedPassword,
        role,
      },
      select: { id: true, name: true, username: true, role: true, createdAt: true },
    });

    await logActivity(
      "CREATED",
      "User",
      `Created user ${user.username} with role ${user.role}`,
      user.id,
      auth.user.userId
    );

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
