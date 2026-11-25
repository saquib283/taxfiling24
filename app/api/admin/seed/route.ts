import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const auth = await requireRole(["ADMIN"]);
  if (!auth.ok) return auth.response;

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
  return NextResponse.json({
    status: "ok",
    adminCount,
    message: "Use CLI `npm run seed` to initialize or seed database records.",
  });
}
