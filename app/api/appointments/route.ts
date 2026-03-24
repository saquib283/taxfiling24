import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, service, date, time, message } = body;

    if (!name || !email || !phone || !date || !time) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        name,
        email,
        phone,
        service,
        date: new Date(date),
        time,
        message,
        status: "PENDING",
      },
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (error: any) {
    console.error("Appointment Error:", error);
    return NextResponse.json(
      { error: "Failed to schedule appointment" },
      { status: 500 }
    );
  }
}
