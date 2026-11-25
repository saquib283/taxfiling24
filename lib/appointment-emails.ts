import { formatTimeLabel, getMeetingTypeLabel, isSafeHttpUrl } from "@/lib/booking";

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

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSafeLink(link?: string | null): string | null {
  if (!link || !link.trim()) return null;
  const trimmed = link.trim();
  return isSafeHttpUrl(trimmed) ? trimmed : null;
}

function renderShell(
  title: string,
  intro: string,
  body: string,
  context: AppointmentEmailContext
) {
  const supportLine = [context.supportEmail, context.supportPhone]
    .filter(Boolean)
    .map((v) => escapeHtml(v))
    .join(" &middot; ");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#0f172a;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;padding:32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:620px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05),0 2px 4px -2px rgba(0,0,0,0.05);">
              <!-- Header -->
              <tr>
                <td style="padding:32px 32px 24px;background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);color:#ffffff;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td>
                        <span style="display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#93c5fd;background:rgba(255,255,255,0.1);padding:4px 10px;border-radius:999px;">
                          TaxFiling24 Advisory Desk
                        </span>
                        <h1 style="margin:16px 0 8px;font-size:24px;font-weight:800;line-height:1.25;color:#ffffff;">
                          ${escapeHtml(title)}
                        </h1>
                        <p style="margin:0;color:#cbd5e1;font-size:14px;line-height:1.6;">
                          ${escapeHtml(intro)}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding:32px;">
                  ${body}

                  <!-- Summary Box -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
                    <tr>
                      <td style="padding:20px;">
                        <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#64748b;margin-bottom:12px;">
                          Session Overview
                        </div>
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;line-height:1.8;color:#1e293b;">
                          <tr>
                            <td style="padding:4px 0;width:32%;color:#64748b;font-weight:500;">Service</td>
                            <td style="padding:4px 0;font-weight:700;color:#0f172a;">${escapeHtml(context.serviceName)}</td>
                          </tr>
                          <tr>
                            <td style="padding:4px 0;color:#64748b;font-weight:500;">Date</td>
                            <td style="padding:4px 0;font-weight:600;color:#0f172a;">${escapeHtml(context.dateLabel)}</td>
                          </tr>
                          <tr>
                            <td style="padding:4px 0;color:#64748b;font-weight:500;">Time</td>
                            <td style="padding:4px 0;font-weight:600;color:#0f172a;">${escapeHtml(context.timeLabel)}${context.timezoneLabel ? ` (${escapeHtml(context.timezoneLabel)})` : ""}</td>
                          </tr>
                          <tr>
                            <td style="padding:4px 0;color:#64748b;font-weight:500;">Format</td>
                            <td style="padding:4px 0;font-weight:600;color:#0f172a;">${escapeHtml(getMeetingTypeLabel(context.locationType || "VIDEO"))}</td>
                          </tr>
                          ${context.locationLabel ? `
                          <tr>
                            <td style="padding:4px 0;color:#64748b;font-weight:500;">Location/Notes</td>
                            <td style="padding:4px 0;color:#334155;">${escapeHtml(context.locationLabel)}</td>
                          </tr>` : ""}
                          ${context.bookingReference ? `
                          <tr>
                            <td style="padding:4px 0;color:#64748b;font-weight:500;">Reference ID</td>
                            <td style="padding:4px 0;font-family:monospace;font-weight:700;color:#2563eb;">${escapeHtml(context.bookingReference)}</td>
                          </tr>` : ""}
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;text-align:center;line-height:1.6;">
                  <div>${supportLine || "TaxFiling24 Advisory Services &middot; Expert CA, CS &amp; Legal Consultations"}</div>
                  <div style="margin-top:6px;font-size:11px;color:#94a3b8;">
                    This is an automated operational notification regarding your consultation appointment.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function buildBookingReceivedEmail(context: AppointmentEmailContext) {
  const safeName = escapeHtml(context.clientName);
  const safeMsg = context.message
    ? escapeHtml(context.message).replace(/\n/g, "<br />")
    : "";

  return {
    html: renderShell(
      "We received your booking request",
      "Our team has your request and will review the slot shortly.",
      `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hello ${safeName},</p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Thanks for booking with TaxFiling24. We have received your request and our advisory desk will confirm your consultation slot shortly.</p>
        ${safeMsg ? `<p style="margin:0;font-size:14px;line-height:1.6;background:#f8fafc;border-left:3px solid #cbd5e1;padding:10px 14px;color:#475569;"><strong>Your requirement:</strong> ${safeMsg}</p>` : ""}
      `,
      context
    ),
    subject: `Booking Request Received: ${context.serviceName} (${context.bookingReference || "Pending"})`,
  };
}

export function buildAppointmentConfirmationEmail(context: AppointmentEmailContext) {
  const safeName = escapeHtml(context.clientName);
  const safeLink = getSafeLink(context.meetingLink);

  return {
    html: renderShell(
      "Your appointment is confirmed",
      "Your consultation slot has been locked in with our advisory team.",
      `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hello ${safeName},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Your appointment has been confirmed. Please save this email and keep your documents ready for the consultation session.</p>
        ${safeLink ? `
          <div style="margin:20px 0;">
            <a href="${escapeHtml(safeLink)}" style="display:inline-block;padding:12px 24px;border-radius:10px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">
              Join Meeting Link
            </a>
          </div>
        ` : ""}
      `,
      context
    ),
    subject: `Appointment Confirmed: ${context.serviceName} on ${context.dateLabel}`,
  };
}

export function buildAppointmentReminderEmail(context: AppointmentEmailContext) {
  const safeName = escapeHtml(context.clientName);
  const safeService = escapeHtml(context.serviceName);
  const safeLink = getSafeLink(context.meetingLink);

  const reminderLabel =
    context.reminderOffsetMinutes && context.reminderOffsetMinutes >= 60
      ? `${Math.round(context.reminderOffsetMinutes / 60)} hour${context.reminderOffsetMinutes >= 120 ? "s" : ""}`
      : `${context.reminderOffsetMinutes || 0} minutes`;

  return {
    html: renderShell(
      "Upcoming Appointment Reminder",
      "A quick reminder so your consultation stays right on track.",
      `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hello ${safeName},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">This is a friendly reminder for your upcoming <strong>${safeService}</strong> appointment${context.reminderOffsetMinutes ? ` in about <strong>${escapeHtml(reminderLabel)}</strong>` : ""}.</p>
        ${safeLink ? `
          <div style="margin:20px 0;">
            <a href="${escapeHtml(safeLink)}" style="display:inline-block;padding:12px 24px;border-radius:10px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">
              Join Meeting Room
            </a>
          </div>
        ` : ""}
      `,
      context
    ),
    subject: `Reminder: ${context.serviceName} at ${context.timeLabel} (${context.dateLabel})`,
  };
}

export function buildMeetingLinkEmail(context: AppointmentEmailContext) {
  const safeName = escapeHtml(context.clientName);
  const safeService = escapeHtml(context.serviceName);
  const safeLink = getSafeLink(context.meetingLink);

  return {
    html: renderShell(
      "Your Meeting Link is Ready",
      "Use the link below to join your advisory session at the scheduled time.",
      `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hello ${safeName},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Here is the direct meeting link for your upcoming <strong>${safeService}</strong> session.</p>
        ${safeLink ? `
          <div style="margin:20px 0;">
            <a href="${escapeHtml(safeLink)}" style="display:inline-block;padding:12px 24px;border-radius:10px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">
              Open Meeting Room
            </a>
          </div>
          <p style="margin:12px 0 0;font-size:12px;color:#64748b;word-break:break-all;">Direct link: ${escapeHtml(safeLink)}</p>
        ` : "<p style='margin:0 0 14px;font-size:15px;line-height:1.7;'>The consultant will share the live joining link right before your scheduled slot.</p>"}
      `,
      context
    ),
    subject: `Meeting Link: ${context.serviceName} (${context.timeLabel}, ${context.dateLabel})`,
  };
}

export function buildAppointmentRescheduledEmail(context: AppointmentEmailContext) {
  const safeName = escapeHtml(context.clientName);
  const safeService = escapeHtml(context.serviceName);
  const safeLink = getSafeLink(context.meetingLink);

  return {
    html: renderShell(
      "Appointment Rescheduled",
      "Your consultation schedule has been updated to a new date/time.",
      `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hello ${safeName},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;">Your appointment for <strong>${safeService}</strong> has been successfully rescheduled. Please review the updated time slot below.</p>
        ${safeLink ? `
          <div style="margin:20px 0;">
            <a href="${escapeHtml(safeLink)}" style="display:inline-block;padding:12px 24px;border-radius:10px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">
              Open Meeting Link
            </a>
          </div>
        ` : ""}
      `,
      context
    ),
    subject: `Appointment Rescheduled: ${context.serviceName} on ${context.dateLabel}`,
  };
}

export function buildAppointmentCancelledEmail(
  context: AppointmentEmailContext & { reason?: string | null }
) {
  const safeName = escapeHtml(context.clientName);
  const safeService = escapeHtml(context.serviceName);
  const safeDate = escapeHtml(context.dateLabel);
  const safeTime = escapeHtml(context.timeLabel);
  const safeReason = context.reason
    ? escapeHtml(context.reason).replace(/\n/g, "<br />")
    : "";

  return {
    html: renderShell(
      "Appointment Cancelled",
      "Notice regarding the cancellation of your consultation session.",
      `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Hello ${safeName},</p>
        <p style="margin:0 0 14px;font-size:15px;line-height:1.7;">Your appointment for <strong>${safeService}</strong> previously scheduled for <strong>${safeDate} at ${safeTime}</strong> has been cancelled.</p>
        ${safeReason ? `
          <div style="margin:16px 0;padding:14px;background:#fef2f2;border-left:4px solid #ef4444;border-radius:6px;color:#991b1b;font-size:14px;line-height:1.6;">
            <strong>Reason:</strong> ${safeReason}
          </div>
        ` : ""}
        <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:#475569;">If you would like to book a new appointment or have any questions, please feel free to visit our booking desk or reply to this email.</p>
      `,
      context
    ),
    subject: `Appointment Cancelled: ${context.serviceName}${context.bookingReference ? ` (${context.bookingReference})` : ""}`,
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
  let dateLabel = String(input.date);
  if (!Number.isNaN(date.getTime())) {
    try {
      dateLabel = date.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      dateLabel = date.toLocaleDateString();
    }
  }

  return {
    bookingReference: input.bookingReference,
    clientName: input.clientName,
    dateLabel,
    locationLabel: input.locationLabel,
    locationType: input.locationType,
    meetingLink: getSafeLink(input.meetingLink),
    message: input.message,
    reminderOffsetMinutes: input.reminderOffsetMinutes,
    serviceName: input.serviceName,
    supportEmail: input.supportEmail,
    supportPhone: input.supportPhone,
    timeLabel: input.time.includes(":") ? formatTimeLabel(input.time) : input.time,
    timezoneLabel: input.timezoneLabel || "IST",
  };
}
