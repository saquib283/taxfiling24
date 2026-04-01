import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { getBookingConfig, getDueReminderOffsets, parseSentReminderOffsets } from "@/lib/booking";
import { sendAppointmentNotification } from "@/lib/booking-notifications";
import { getSettings } from "@/lib/settings";

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return true;
  }

  const headerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const queryToken = new URL(request.url).searchParams.get("secret");

  return headerToken === secret || queryToken === secret;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settingsMap = await getSettings();
    const config = getBookingConfig(settingsMap);
    const appointments = await prisma.appointment.findMany({
      where: {
        status: { in: ["CONFIRMED", "RESCHEDULED"] },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });
    const servicesById = new Map(config.services.map((service) => [service.id, service]));
    const sentAppointments: string[] = [];

    for (const appointment of appointments) {
      const service =
        (appointment.serviceId ? servicesById.get(appointment.serviceId) : undefined) ||
        config.services.find((item) => item.name === appointment.service);
      const dueOffsets = getDueReminderOffsets({
        appointment,
        service,
        settings: config.settings,
      });

      if (dueOffsets.length === 0) {
        continue;
      }

      const reminderOffsetMinutes = dueOffsets[dueOffsets.length - 1];

      await sendAppointmentNotification({
        appointment,
        reminderOffsetMinutes,
        service,
        settings: config.settings,
        settingsMap,
        type: "REMINDER",
      });

      const sentOffsets = new Set(parseSentReminderOffsets(appointment.sentReminderOffsets));
      dueOffsets.forEach((offset) => sentOffsets.add(offset));

      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          reminderCount: (appointment.reminderCount || 0) + 1,
          reminderSentAt: new Date(),
          sentReminderOffsets: [...sentOffsets].sort((a, b) => b - a).join(","),
        },
      });

      await logActivity(
        "SENT",
        "Appointment",
        `Auto reminder sent for ${appointment.bookingReference || appointment.id}`,
        appointment.id
      );

      sentAppointments.push(appointment.id);
    }

    return NextResponse.json({
      sentCount: sentAppointments.length,
      sentAppointments,
    });
  } catch (error) {
    console.error("Failed to process appointment reminders", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process appointment reminders",
      },
      { status: 500 }
    );
  }
}
