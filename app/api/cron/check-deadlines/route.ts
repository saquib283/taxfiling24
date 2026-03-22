import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import nodemailer from "nodemailer";

export async function GET() {
  try {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
      return NextResponse.json({ error: "SMTP Configuration missing for alerts." }, { status: 500 });
    }

    // Find deadlines in next 3 days
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + 3);

    const deadlines = await prisma.complianceDeadline.findMany({
      where: {
        date: {
          gte: now,
          lte: future,
        },
      },
    });

    if (deadlines.length === 0) {
      return NextResponse.json({ message: "No upcoming deadlines found." });
    }

    // Get subscribers
    const subscribers = await prisma.subscriber.findMany({ where: { isActive: true } });
    if (subscribers.length === 0) return NextResponse.json({ message: "No subscribers to alert." });

    const emails = subscribers.map(s => s.email);

    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port),
      secure: port === "465",
      auth: { user, pass },
    });

    const deadlineList = deadlines.map(d => `<li><strong>${d.title}</strong> - ${new Date(d.date).toLocaleDateString()}<br/>${d.desc || ""}</li>`).join("");

    await transporter.sendMail({
      from: `"TaxFiling24 Alerts" <${user}>`,
      to: user,
      bcc: emails,
      subject: "Upcoming Compliance & Tax Deadlines Alert",
      html: `
        <h2>Upcoming Deadlines</h2>
        <p>This is a reminder for the following upcoming tax & compliance deadlines in the next 3 days:</p>
        <ul>${deadlineList}</ul>
        <br/>
        <p>Ensure you file on time to avoid penalties!</p>
      `,
    });

    return NextResponse.json({ success: true, alertedCount: deadlines.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
