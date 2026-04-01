import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { getBookingConfig, getDueReminderOffsets, parseSentReminderOffsets } from "@/lib/booking";
import { sendAppointmentNotification, type AppointmentNotificationType } from "@/lib/booking-notifications";
import { getSettings } from "@/lib/settings";

type ReminderRequestPayload = {
  appointmentId?: string;
  reminderOffsetMinutes?: number;
  type?: "CONFIRMATION" | "MEETING_LINK" | "REMINDER";
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ReminderRequestPayload;

    if (!body.appointmentId || !body.type) {
      return NextResponse.json(
        { error: "Appointment ID and reminder type are required." },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: body.appointmentId },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    if (body.type === "MEETING_LINK" && !appointment.meetingLink) {
      return NextResponse.json(
        { error: "Add a meeting link before sending it to the client." },
        { status: 400 }
      );
    }

    const settingsMap = await getSettings();
    const config = getBookingConfig(settingsMap);
    const service =
      config.services.find((item) => item.id === appointment.serviceId) ||
      config.services.find((item) => item.name === appointment.service);
    const notificationType: AppointmentNotificationType =
      body.type === "CONFIRMATION"
        ? "CONFIRMATION"
        : body.type === "MEETING_LINK"
        ? "MEETING_LINK"
        : "REMINDER";
    const dueOffsets =
      body.type === "REMINDER"
        ? getDueReminderOffsets({
            appointment,
            service,
            settings: config.settings,
          })
        : [];
    const reminderOffsetMinutes =
      body.reminderOffsetMinutes ??
      (dueOffsets.length > 0 ? dueOffsets[dueOffsets.length - 1] : null);

    const sendResult = await sendAppointmentNotification({
      appointment,
      reminderOffsetMinutes,
      service,
      settings: config.settings,
      settingsMap,
      type: notificationType,
    });

    const sentOffsets = new Set(parseSentReminderOffsets(appointment.sentReminderOffsets));
    if (body.type === "REMINDER") {
      dueOffsets.forEach((offset) => sentOffsets.add(offset));
      if (typeof reminderOffsetMinutes === "number") {
        sentOffsets.add(reminderOffsetMinutes);
      }
    }

    const updated = await prisma.appointment.update({
      where: { id: appointment.id },
      data: {
        confirmationSentAt:
          body.type === "CONFIRMATION" ? new Date() : appointment.confirmationSentAt,
        meetingLinkSentAt:
          body.type === "MEETING_LINK" ? new Date() : appointment.meetingLinkSentAt,
        reminderCount:
          body.type === "REMINDER" ? (appointment.reminderCount || 0) + 1 : appointment.reminderCount,
        reminderSentAt:
          body.type === "REMINDER" ? new Date() : appointment.reminderSentAt,
        sentReminderOffsets:
          body.type === "REMINDER"
            ? [...sentOffsets].sort((a, b) => b - a).join(",")
            : appointment.sentReminderOffsets,
        status:
          body.type === "CONFIRMATION" && appointment.status === "PENDING"
            ? "CONFIRMED"
            : appointment.status,
      },
    });

    await logActivity(
      "SENT",
      "Appointment",
      `Sent ${body.type.toLowerCase()} email for ${updated.bookingReference || updated.id} via ${sendResult.provider}`,
      updated.id
    );

    return NextResponse.json({ appointment: updated, provider: sendResult.provider });
  } catch (error) {
    console.error("Failed to send appointment email", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send appointment email",
      },
      { status: 500 }
    );
  }
}
