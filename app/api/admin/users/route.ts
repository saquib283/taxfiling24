import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, username: true, role: true, createdAt: true },
  });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  try {
    const { name, username, password, role } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role: role || "ADMIN", // default or strict
      },
    });

    return NextResponse.json({ success: true, user: { id: user.id } });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
