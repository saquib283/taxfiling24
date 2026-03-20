import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const adminExists = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await prisma.user.create({
        data: {
          username: "admin",
          password: hashedPassword,
          name: "Administrator",
          role: "ADMIN",
        },
      });
      return NextResponse.json({ message: "Admin user created: admin / admin123" });
    } else {
      return NextResponse.json({ message: "Admin user already exists" });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
