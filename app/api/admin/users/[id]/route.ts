import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activity-log";
import { BCRYPT_COST, isValidAdminRole, requireRole, validatePasswordStrength } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { name, role, password } = body as Record<string, unknown>;
    const updateData: { name?: string | null; role?: string; password?: string } = {};

    if (name !== undefined) {
      updateData.name = typeof name === "string" && name.trim() ? name.trim().slice(0, 100) : null;
    }

    if (role !== undefined) {
      if (!isValidAdminRole(role)) {
        return NextResponse.json(
          { error: "Invalid role. Allowed values: ADMIN, EDITOR, VIEWER" },
          { status: 400 }
        );
      }
      if (auth.user.userId === id && role !== "ADMIN") {
        return NextResponse.json(
          { error: "You cannot demote your own admin account" },
          { status: 400 }
        );
      }
      updateData.role = role;
    }

    if (typeof password === "string" && password.length > 0) {
      const strengthError = validatePasswordStrength(password);
      if (strengthError) {
        return NextResponse.json({ error: strengthError }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, BCRYPT_COST);
    }

    const result = await prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({ where: { id } });
      if (!targetUser) return { error: "User not found", status: 404 as const };

      if (targetUser.role === "ADMIN" && updateData.role && updateData.role !== "ADMIN") {
        const adminCount = await tx.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) {
          return { error: "Cannot demote the last admin account", status: 400 as const };
        }
      }

      const updated = await tx.user.update({
        where: { id },
        data: updateData,
        select: { id: true, name: true, username: true, role: true, createdAt: true },
      });
      return { user: updated };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await logActivity(
      "UPDATED",
      "User",
      `Updated user ${result.user.username} (role: ${result.user.role}${updateData.password ? ", password reset" : ""})`,
      result.user.id,
      auth.user.userId
    );
    return NextResponse.json(result.user);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    if (auth.user.userId === id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({ where: { id } });
      if (!targetUser) return { error: "User not found", status: 404 as const };

      if (targetUser.role === "ADMIN") {
        const adminCount = await tx.user.count({ where: { role: "ADMIN" } });
        if (adminCount <= 1) {
          return { error: "Cannot delete the last admin account", status: 400 as const };
        }
      }

      await tx.user.delete({ where: { id } });
      return { deleted: targetUser };
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    await logActivity(
      "DELETED",
      "User",
      `Deleted user ${result.deleted.username} (${result.deleted.role})`,
      id,
      auth.user.userId
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
