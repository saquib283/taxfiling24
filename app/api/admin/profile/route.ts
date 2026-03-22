import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "secure-admin-secret-key-default-256");
    const { payload } = await jwtVerify(token, secret);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: { id: true, name: true, username: true, role: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, currentPassword, newPassword } = await request.json();

    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "secure-admin-secret-key-default-256");
    const { payload } = await jwtVerify(token, secret);

    const user = await prisma.user.findUnique({ where: { id: payload.userId as string } });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

    if (name) {
      await prisma.user.update({ where: { id: user.id }, data: { name } });
    }

    if (newPassword && currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });

      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    }

    return NextResponse.json({ message: "Profile updated successfully!" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
