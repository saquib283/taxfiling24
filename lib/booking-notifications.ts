import {
  buildAppointmentConfirmationEmail,
  buildAppointmentEmailContext,
  buildAppointmentReminderEmail,
  buildBookingReceivedEmail,
  buildMeetingLinkEmail,
} from "@/lib/appointment-emails";
import { type BookingServiceConfig, type BookingSettings } from "@/lib/booking";
import { sendTransactionalEmail } from "@/lib/email-delivery";
import { getSettings } from "@/lib/settings";

export type AppointmentNotificationType =
  | "BOOKING_RECEIVED"
  | "CONFIRMATION"
  | "REMINDER"
  | "MEETING_LINK";

export interface AppointmentNotificationAppointment {
  bookingReference?: string | null;
  date: Date | string;
  email: string;
  locationLabel?: string | null;
  locationType?: string | null;
  meetingLink?: string | null;
  message?: string | null;
  name: string;
  service?: string | null;
  time: string;
}

export async function sendAppointmentNotification(params: {
  appointment: AppointmentNotificationAppointment;
  reminderOffsetMinutes?: number | null;
  service?: BookingServiceConfig;
  settings?: BookingSettings;
  settingsMap?: Record<string, string>;
  type: AppointmentNotificationType;
}) {
  const settingsMap = params.settingsMap || (await getSettings());
  const serviceName = params.service?.name || params.appointment.service || "Consultation";
  const locationType = params.appointment.locationType || params.service?.meetingType || "VIDEO";
  const locationLabel =
    params.appointment.locationLabel || params.service?.locationLabel || "";
  const context = buildAppointmentEmailContext({
    bookingReference: params.appointment.bookingReference,
    clientName: params.appointment.name,
    date: params.appointment.date,
    locationLabel,
    locationType,
    meetingLink: params.appointment.meetingLink,
    message: params.appointment.message,
    reminderOffsetMinutes: params.reminderOffsetMinutes,
    serviceName,
    supportEmail: settingsMap.contact_email || settingsMap.EMAIL_FROM_EMAIL,
    supportPhone: settingsMap.contact_phone,
    time: params.appointment.time,
    timezoneLabel: params.settings?.timezone || "Asia/Kolkata",
  });

  const email =
    params.type === "BOOKING_RECEIVED"
      ? buildBookingReceivedEmail(context)
      : params.type === "CONFIRMATION"
      ? buildAppointmentConfirmationEmail(context)
      : params.type === "MEETING_LINK"
      ? buildMeetingLinkEmail(context)
      : buildAppointmentReminderEmail(context);

  return sendTransactionalEmail({
    html: email.html,
    subject: email.subject,
    tags: [
      { name: "appointment_email_type", value: params.type.toLowerCase() },
      ...(params.appointment.bookingReference
        ? [{ name: "booking_reference", value: params.appointment.bookingReference }]
        : []),
    ],
    to: params.appointment.email,
  });
}
