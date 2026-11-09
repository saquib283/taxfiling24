import {
  buildAppointmentCancelledEmail,
  buildAppointmentConfirmationEmail,
  buildAppointmentEmailContext,
  buildAppointmentReminderEmail,
  buildAppointmentRescheduledEmail,
  buildBookingReceivedEmail,
  buildMeetingLinkEmail,
} from "@/lib/appointment-emails";
import { type BookingServiceConfig, type BookingSettings } from "@/lib/booking";
import { sendTransactionalEmail } from "@/lib/email-delivery";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { getSettings } from "@/lib/settings";

export type AppointmentNotificationType =
  | "BOOKING_RECEIVED"
  | "CONFIRMATION"
  | "REMINDER"
  | "MEETING_LINK"
  | "RESCHEDULED"
  | "CANCELLED";

export interface AppointmentNotificationAppointment {
  bookingReference?: string | null;
  cancellationReason?: string | null;
  date: Date | string;
  email: string;
  phone?: string | null;
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

  let email: { html: string; subject: string };

  switch (params.type) {
    case "BOOKING_RECEIVED":
      email = buildBookingReceivedEmail(context);
      break;
    case "CONFIRMATION":
      email = buildAppointmentConfirmationEmail(context);
      break;
    case "MEETING_LINK":
      email = buildMeetingLinkEmail(context);
      break;
    case "RESCHEDULED":
      email = buildAppointmentRescheduledEmail(context);
      break;
    case "CANCELLED":
      email = buildAppointmentCancelledEmail({
        ...context,
        reason: params.appointment.cancellationReason,
      });
      break;
    case "REMINDER":
    default:
      email = buildAppointmentReminderEmail(context);
      break;
  }

  // Send WhatsApp notification alongside email if phone number is available
  if (params.appointment.phone) {
    let waText = "";
    if (params.type === "CONFIRMATION" || params.type === "BOOKING_RECEIVED") {
      waText = `Namaste ${context.clientName}! 🙏\n\nYour consultation booking with *TaxFiling24* for *${serviceName}* is confirmed!\n\n📅 *Date:* ${context.dateLabel}\n⏰ *Time:* ${context.timeLabel}\n📍 *Mode:* ${locationLabel || "Online Video Conference"}\n${context.meetingLink ? `🔗 *Meeting Link:* ${context.meetingLink}\n` : ""}🔖 *Booking Reference:* ${context.bookingReference || "TF24-APT"}\n\nWe look forward to speaking with you!\n*TaxFiling24 Advisory Team*`;
    } else if (params.type === "REMINDER") {
      waText = `Namaste ${context.clientName}! ⏰\n\nFriendly reminder: Your consultation with *TaxFiling24* for *${serviceName}* is coming up on *${context.dateLabel}* at *${context.timeLabel}*.\n\n${context.meetingLink ? `🔗 *Join Link:* ${context.meetingLink}\n` : ""}If you need to reschedule or have questions, reply directly to this chat.\n\n*TaxFiling24*`;
    } else if (params.type === "CANCELLED") {
      waText = `Hello ${context.clientName}, your appointment with TaxFiling24 for ${serviceName} on ${context.dateLabel} has been cancelled.${params.appointment.cancellationReason ? ` Reason: ${params.appointment.cancellationReason}` : ""} To book a new slot, visit https://taxfiling24.com/book.`;
    }

    if (waText) {
      sendWhatsAppMessage({
        to: params.appointment.phone,
        text: waText,
      }).catch((waErr) => console.warn("[WhatsApp] Appointment notification dispatch skipped/failed:", waErr));
    }
  }

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
