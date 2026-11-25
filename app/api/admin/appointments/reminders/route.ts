import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireRole } from "@/lib/auth";
import {
  getBookingConfig,
  getDueReminderOffsets,
  isSafeHttpUrl,
  parseSentReminderOffsets,
} from "@/lib/booking";
import {
  sendAppointmentNotification,
  type AppointmentNotificationType,
} from "@/lib/booking-notifications";
import { getSettings } from "@/lib/settings";

const ALLOWED_NOTIFICATION_TYPES = new Set([
  "CONFIRMATION",
  "MEETING_LINK",
  "REMINDER",
  "RESCHEDULED",
  "CANCELLED",
]);

type ReminderRequestPayload = {
  appointmentId?: string;
  meetingLink?: string;
  reminderOffsetMinutes?: number;
  type?: "CONFIRMATION" | "MEETING_LINK" | "REMINDER" | "RESCHEDULED" | "CANCELLED";
};

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as ReminderRequestPayload;

    if (!body.appointmentId || !body.type || !ALLOWED_NOTIFICATION_TYPES.has(body.type)) {
      return NextResponse.json(
        { error: "Valid appointment ID and notification type are required." },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: body.appointmentId },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    if (!appointment.email || appointment.email.includes("walkin@")) {
      return NextResponse.json(
        { error: "Cannot dispatch email notification: appointment has no valid client email." },
        { status: 400 }
      );
    }

    // If caller passes an updated meetingLink along with MEETING_LINK action, validate and persist it
    let effectiveLink = appointment.meetingLink;
    if (body.meetingLink !== undefined && body.meetingLink.trim()) {
      if (!isSafeHttpUrl(body.meetingLink)) {
        return NextResponse.json(
          { error: "Meeting link must start with http:// or https://." },
          { status: 400 }
        );
      }
      effectiveLink = body.meetingLink.trim();
    }

    if (body.type === "MEETING_LINK" && !effectiveLink) {
      return NextResponse.json(
        { error: "Add a valid https:// meeting link before sending it to the client." },
        { status: 400 }
      );
    }

    const settingsMap = await getSettings();
    const config = getBookingConfig(settingsMap);
    const service =
      config.services.find((item) => item.id === appointment.serviceId) ||
      config.services.find((item) => item.name === appointment.service);
    const notificationType: AppointmentNotificationType = body.type;
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
      appointment: { ...appointment, meetingLink: effectiveLink },
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
        meetingLink: effectiveLink,
        confirmationSentAt:
          body.type === "CONFIRMATION" ? new Date() : appointment.confirmationSentAt,
        meetingLinkSentAt:
          body.type === "MEETING_LINK" ? new Date() : appointment.meetingLinkSentAt,
        reminderCount:
          body.type === "REMINDER"
            ? (appointment.reminderCount || 0) + 1
            : appointment.reminderCount,
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
      updated.id,
      auth.user.userId
    );

    return NextResponse.json({ appointment: updated, provider: sendResult.provider });
  } catch (error) {
    console.error("Failed to send appointment email", error);
    return NextResponse.json(
      {
        error: "Failed to send appointment email. Verify email provider configuration and try again.",
      },
      { status: 500 }
    );
  }
}
