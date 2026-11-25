import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import {
  getBookingConfig,
  getDueReminderOffsets,
  parseSentReminderOffsets,
} from "@/lib/booking";
import { sendAppointmentNotification } from "@/lib/booking-notifications";
import { getSettings } from "@/lib/settings";
import { safeSecretCompare } from "@/lib/rate-limit";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return false; // Fail closed if CRON_SECRET is not configured
  }

  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (match && match[1] && safeSecretCompare(match[1].trim(), secret)) {
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    const windowEnd = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000); // 8 days ahead

    const settingsMap = await getSettings();
    const config = getBookingConfig(settingsMap);
    const appointments = await prisma.appointment.findMany({
      where: {
        status: { in: ["CONFIRMED", "RESCHEDULED"] },
        date: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    });

    const servicesById = new Map(config.services.map((service) => [service.id, service]));
    const sentAppointments: string[] = [];
    const failedAppointments: Array<{ id: string; error: string }> = [];

    for (const appointment of appointments) {
      // Skip synthetic placeholder emails
      if (!appointment.email || appointment.email.toLowerCase().includes("walkin@")) {
        continue;
      }

      const service =
        (appointment.serviceId ? servicesById.get(appointment.serviceId) : undefined) ||
        config.services.find((item) => item.name === appointment.service);
      const dueOffsets = getDueReminderOffsets({
        appointment,
        service,
        settings: config.settings,
        now,
      });

      if (dueOffsets.length === 0) {
        continue;
      }

      const reminderOffsetMinutes = dueOffsets[dueOffsets.length - 1];

      // Isolate per-appointment errors so one bad delivery never aborts the entire cron run
      try {
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
      } catch (err) {
        console.error(
          `[Cron] Reminder failed for appointment ${appointment.id}:`,
          err
        );
        failedAppointments.push({
          id: appointment.id,
          error: "Delivery failed",
        });
      }
    }

    return NextResponse.json({
      sentCount: sentAppointments.length,
      sentAppointments,
      failedCount: failedAppointments.length,
      failedAppointments,
    });
  } catch (error) {
    console.error("Failed to process appointment reminders", error);
    return NextResponse.json(
      { error: "Failed to process appointment reminders" },
      { status: 500 }
    );
  }
}
