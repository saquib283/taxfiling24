import { formatTimeLabel, getMeetingTypeLabel } from "@/lib/booking";

export interface AppointmentEmailContext {
  bookingReference?: string | null;
  clientName: string;
  dateLabel: string;
  meetingLink?: string | null;
  message?: string | null;
  reminderOffsetMinutes?: number | null;
  serviceName: string;
  statusLabel?: string;
  supportEmail?: string;
  supportPhone?: string;
  timeLabel: string;
  timezoneLabel?: string;
  locationLabel?: string | null;
  locationType?: string | null;
}

function renderShell(title: string, intro: string, body: string, context: AppointmentEmailContext) {
  const supportLine = [context.supportEmail, context.supportPhone].filter(Boolean).join(" · ");

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;">
        <div style="padding:28px 28px 18px;background:linear-gradient(135deg,#0f172a,#2563eb);color:#ffffff;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;opacity:0.9;">TaxFiling24 Booking Desk</div>
          <h1 style="margin:12px 0 6px;font-size:28px;line-height:1.15;">${title}</h1>
          <p style="margin:0;color:rgba(255,255,255,0.85);font-size:14px;line-height:1.6;">${intro}</p>
        </div>
        <div style="padding:28px;">
          ${body}
          <div style="margin-top:24px;padding:18px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
            <div style="font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;">Appointment summary</div>
            <div style="margin-top:12px;font-size:14px;line-height:1.8;">
              <div><strong>Service:</strong> ${context.serviceName}</div>
              <div><strong>Date:</strong> ${context.dateLabel}</div>
              <div><strong>Time:</strong> ${context.timeLabel}${context.timezoneLabel ? ` (${context.timezoneLabel})` : ""}</div>
              <div><strong>Mode:</strong> ${getMeetingTypeLabel(context.locationType || "VIDEO")}</div>
              ${context.locationLabel ? `<div><strong>Details:</strong> ${context.locationLabel}</div>` : ""}
              ${context.bookingReference ? `<div><strong>Reference:</strong> ${context.bookingReference}</div>` : ""}
            </div>
          </div>
        </div>
        <div style="padding:18px 28px;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;background:#f8fafc;">
          ${supportLine || "TaxFiling24 booking support"}
        </div>
      </div>
    </div>
  `;
}

export function buildBookingReceivedEmail(context: AppointmentEmailContext) {
  return {
    html: renderShell(
      "We received your booking request",
      "Our team has your request and will review the slot shortly.",
      `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hello ${context.clientName},</p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Thanks for booking with TaxFiling24. We have received your request and our team will confirm the slot soon.</p>
        ${context.message ? `<p style="margin:0;font-size:15px;line-height:1.7;">Your note: ${context.message}</p>` : ""}
      `,
      context
    ),
    subject: `Booking request received for ${context.serviceName}`,
  };
}

export function buildAppointmentConfirmationEmail(context: AppointmentEmailContext) {
  return {
    html: renderShell(
      "Your appointment is confirmed",
      "Your booking is locked in and the details are below.",
      `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hello ${context.clientName},</p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Your appointment has been confirmed. Please keep this email for the meeting details.</p>
        ${context.meetingLink ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;"><a href="${context.meetingLink}" style="display:inline-block;padding:12px 18px;border-radius:14px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;">Open meeting link</a></p>` : ""}
      `,
      context
    ),
    subject: `Appointment confirmed: ${context.serviceName} on ${context.dateLabel}`,
  };
}

export function buildAppointmentReminderEmail(context: AppointmentEmailContext) {
  const reminderLabel =
    context.reminderOffsetMinutes && context.reminderOffsetMinutes >= 60
      ? `${Math.round(context.reminderOffsetMinutes / 60)} hour${context.reminderOffsetMinutes >= 120 ? "s" : ""}`
      : `${context.reminderOffsetMinutes || 0} minutes`;

  return {
    html: renderShell(
      "Appointment reminder",
      "A quick reminder so your session stays on track.",
      `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hello ${context.clientName},</p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">This is a reminder for your upcoming ${context.serviceName} appointment${context.reminderOffsetMinutes ? ` in about ${reminderLabel}` : ""}.</p>
        ${context.meetingLink ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;"><a href="${context.meetingLink}" style="display:inline-block;padding:12px 18px;border-radius:14px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;">Join the meeting</a></p>` : ""}
      `,
      context
    ),
    subject: `Reminder: ${context.serviceName} at ${context.timeLabel}`,
  };
}

export function buildMeetingLinkEmail(context: AppointmentEmailContext) {
  return {
    html: renderShell(
      "Your meeting link is ready",
      "Use the link below to join at the scheduled time.",
      `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hello ${context.clientName},</p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Here is the meeting link for your appointment.</p>
        ${context.meetingLink ? `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;"><a href="${context.meetingLink}" style="display:inline-block;padding:12px 18px;border-radius:14px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;">Open meeting link</a></p>` : "<p style='margin:0 0 14px;font-size:15px;line-height:1.7;'>The admin team will share the final joining link shortly.</p>"}
      `,
      context
    ),
    subject: `Meeting link: ${context.serviceName}`,
  };
}

export function buildAppointmentEmailContext(input: {
  bookingReference?: string | null;
  clientName: string;
  date: Date | string;
  locationLabel?: string | null;
  locationType?: string | null;
  meetingLink?: string | null;
  message?: string | null;
  reminderOffsetMinutes?: number | null;
  serviceName: string;
  supportEmail?: string;
  supportPhone?: string;
  time: string;
  timezoneLabel?: string;
}) {
  const date = new Date(input.date);

  return {
    bookingReference: input.bookingReference,
    clientName: input.clientName,
    dateLabel: Number.isNaN(date.getTime()) ? String(input.date) : date.toLocaleDateString(),
    locationLabel: input.locationLabel,
    locationType: input.locationType,
    meetingLink: input.meetingLink,
    message: input.message,
    reminderOffsetMinutes: input.reminderOffsetMinutes,
    serviceName: input.serviceName,
    supportEmail: input.supportEmail,
    supportPhone: input.supportPhone,
    timeLabel: input.time.includes(":") ? formatTimeLabel(input.time) : input.time,
    timezoneLabel: input.timezoneLabel,
  };
}
