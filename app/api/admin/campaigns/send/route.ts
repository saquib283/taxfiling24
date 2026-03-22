import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { subject, content } = await request.json();

    if (!subject || !content) {
      return NextResponse.json({ error: "Subject and Content are required" }, { status: 400 });
    }

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
      return NextResponse.json(
        { error: "SMTP Configuration missing in .env (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)" },
        { status: 500 }
      );
    }

    // Get active subscribers
    const subscribers = await prisma.subscriber.findMany({
      where: { isActive: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json({ message: "No active subscribers to send to." });
    }

    // Configure Mailer
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: port === "465", // true for 465, false for other ports
      auth: { user, pass },
    });

    const emails = subscribers.map(s => s.email);

    // Send email
    await transporter.sendMail({
      from: `"TaxFiling24 Updates" <${user}>`,
      to: user, // Send to self
      bcc: emails, // BCC all subscribers
      subject,
      html: content,
    });

    // Save Campaign to Database
    const campaign = await prisma.campaign.create({
      data: {
        subject,
        content,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to send campaign" }, { status: 500 });
  }
}
