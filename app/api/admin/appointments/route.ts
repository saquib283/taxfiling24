import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireRole } from "@/lib/auth";
import {
  addMinutes,
  combineDateAndTime,
  createBookingReference,
  formatTimeLabel,
  getAvailableSlots,
  getBookingConfig,
  getDateKey,
  getDueReminderOffsets,
  isSafeHttpUrl,
  isValidDateKey,
} from "@/lib/booking";
import { sendAppointmentNotification } from "@/lib/booking-notifications";
import { getSettings } from "@/lib/settings";

const ALLOWED_APPOINTMENT_STATUSES = new Set([
  "PENDING",
  "CONFIRMED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

type AppointmentUpdatePayload = {
  adminNotes?: string | null;
  cancellationReason?: string | null;
  date?: string;
  forceOverride?: boolean;
  id?: string;
  meetingLink?: string | null;
  notifyClient?: boolean;
  serviceId?: string | null;
  status?: string;
  time?: string;
};

type AdminCreateBookingPayload = {
  adminNotes?: string | null;
  date: string;
  email: string;
  forceOverride?: boolean;
  meetingLink?: string | null;
  name: string;
  notifyClient?: boolean;
  phone: string;
  serviceId?: string | null;
  status?: string;
  time: string;
};

function getDayRange(dateKey: string) {
  const dayStart = combineDateAndTime(dateKey, "00:00");
  return {
    dayEnd: addMinutes(dayStart, 24 * 60),
    dayStart,
  };
}

async function getAppointmentsForDate(dateKey: string) {
  const { dayEnd, dayStart } = getDayRange(dateKey);

  return prisma.appointment.findMany({
    where: {
      date: {
        gte: dayStart,
        lt: dayEnd,
      },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
}

function hasActiveOverlap(params: {
  appointments: Array<{
    id: string;
    date: Date;
    time: string;
    startAt: Date | null;
    endAt: Date | null;
    durationMinutes: number | null;
    status: string;
  }>;
  excludeId?: string;
  slotStart: Date;
  slotEnd: Date;
  maxBookingsPerSlot: number;
  defaultDuration: number;
}) {
  let exactCount = 0;
  for (const app of params.appointments) {
    if (params.excludeId && app.id === params.excludeId) continue;
    if (["CANCELLED", "NO_SHOW"].includes(app.status)) continue;

    const start = app.startAt
      ? new Date(app.startAt)
      : combineDateAndTime(getDateKey(app.date), app.time);
    const end = app.endAt
      ? new Date(app.endAt)
      : addMinutes(start, app.durationMinutes || params.defaultDuration);

    if (
      start.getTime() === params.slotStart.getTime() &&
      end.getTime() === params.slotEnd.getTime()
    ) {
      exactCount += 1;
      if (exactCount >= params.maxBookingsPerSlot) return true;
      continue;
    }

    if (params.slotStart < end && start < params.slotEnd) {
      return true;
    }
  }
  return false;
}

export async function GET() {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const settingsMap = await getSettings();
    const config = getBookingConfig(settingsMap);
    const appointments = await prisma.appointment.findMany({
      orderBy: [{ date: "asc" }, { createdAt: "desc" }],
      take: 500,
    });
    const servicesById = new Map(config.services.map((service) => [service.id, service]));
    const todayKey = getDateKey(new Date());
    const now = new Date();

    const summary = appointments.reduce(
      (acc, appointment) => {
        const start = appointment.startAt
          ? new Date(appointment.startAt)
          : combineDateAndTime(getDateKey(appointment.date), appointment.time);
        const isUpcoming =
          start > now && !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appointment.status);
        const service = appointment.serviceId
          ? servicesById.get(appointment.serviceId)
          : undefined;
        // Reminders only apply to active CONFIRMED / RESCHEDULED appointments
        const isReminderEligible =
          appointment.status === "CONFIRMED" || appointment.status === "RESCHEDULED";
        const dueReminders = isReminderEligible
          ? getDueReminderOffsets({
              appointment,
              service,
              settings: config.settings,
              now,
            })
          : [];

        acc.total += 1;
        if (getDateKey(appointment.date) === todayKey) acc.today += 1;
        if (appointment.status === "PENDING") acc.pending += 1;
        if (appointment.status === "CONFIRMED") acc.confirmed += 1;
        if (isUpcoming) acc.upcoming += 1;
        if (appointment.meetingLink) acc.withMeetingLink += 1;
        if (dueReminders.length > 0) acc.remindersDue += 1;
        return acc;
      },
      {
        confirmed: 0,
        pending: 0,
        remindersDue: 0,
        today: 0,
        total: 0,
        upcoming: 0,
        withMeetingLink: 0,
      }
    );

    return NextResponse.json({
      appointments,
      availabilityRules: config.availabilityRules,
      blockedDates: config.blockedDates,
      services: config.services,
      settings: config.settings,
      summary,
    });
  } catch (error) {
    console.error("Failed to fetch appointment workspace", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as AdminCreateBookingPayload;
    const cleanName = (body.name || "").trim();
    const cleanEmail = (body.email || "").trim().toLowerCase();
    const cleanPhone = (body.phone || "").trim();
    const cleanDate = (body.date || "").trim();
    const cleanTime = (body.time || "").trim();
    const status = body.status || "CONFIRMED";
    const notifyClient = body.notifyClient !== false;
    const meetingLink = body.meetingLink?.trim() || null;

    if (!cleanName || !cleanDate || !cleanTime) {
      return NextResponse.json(
        { error: "Client name, date, and time slot are required." },
        { status: 400 }
      );
    }

    if (!isValidDateKey(cleanDate)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD." },
        { status: 400 }
      );
    }

    if (!ALLOWED_APPOINTMENT_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid appointment status." }, { status: 400 });
    }

    if (meetingLink && !isSafeHttpUrl(meetingLink)) {
      return NextResponse.json(
        { error: "Meeting link must start with http:// or https://." },
        { status: 400 }
      );
    }

    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json(
        { error: "Please provide either an email address or phone number for the client." },
        { status: 400 }
      );
    }

    const settingsMap = await getSettings();
    const config = getBookingConfig(settingsMap);
    const service =
      config.services.find((item) => item.id === body.serviceId && item.isActive) ||
      config.services.find((item) => item.isActive) ||
      config.services[0];

    const durationMinutes = service?.durationMinutes || 30;
    const slotStart = combineDateAndTime(cleanDate, cleanTime);
    if (Number.isNaN(slotStart.getTime())) {
      return NextResponse.json({ error: "Invalid time slot." }, { status: 400 });
    }
    const slotEnd = addMinutes(slotStart, durationMinutes);
    const slotLabel = formatTimeLabel(cleanTime);

    if (!body.forceOverride) {
      const sameDayAppointments = await getAppointmentsForDate(cleanDate);
      const conflict = hasActiveOverlap({
        appointments: sameDayAppointments,
        slotStart,
        slotEnd,
        maxBookingsPerSlot: service?.maxBookingsPerSlot || 1,
        defaultDuration: durationMinutes,
      });
      if (conflict) {
        return NextResponse.json(
          {
            error:
              "Another active consultation already overlaps this time slot. Pick an open slot or cancel the conflicting booking first.",
          },
          { status: 409 }
        );
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        adminNotes: body.adminNotes || "Manually scheduled by administrator",
        bookingReference: createBookingReference(),
        customerTimezone: config.settings.timezone,
        date: slotStart,
        durationMinutes,
        email: cleanEmail || "walkin@taxfiling24.com",
        endAt: slotEnd,
        locationLabel: service?.locationLabel || null,
        locationType: service?.meetingType || "VIDEO",
        meetingLink,
        name: cleanName,
        phone: cleanPhone || "N/A",
        service: service?.name || "Consultation",
        serviceId: service?.id || null,
        slotLabel,
        source: "ADMIN",
        startAt: slotStart,
        status,
        time: cleanTime,
      },
    });

    if (notifyClient && cleanEmail) {
      const dispatchNotification = async () => {
        try {
          await sendAppointmentNotification({
            appointment,
            service,
            settings: config.settings,
            settingsMap,
            type: "CONFIRMATION",
          });

          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { confirmationSentAt: new Date() },
          });
        } catch (err) {
          console.warn(
            "Could not dispatch confirmation email for admin-created booking:",
            err
          );
        }
      };

      await Promise.race([
        dispatchNotification(),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    }

    await logActivity(
      "CREATED",
      "Appointment",
      `Admin manually scheduled booking for ${cleanName} on ${cleanDate} at ${slotLabel}`,
      appointment.id,
      auth.user.userId
    );

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Admin booking creation error:", error);
    return NextResponse.json(
      { error: "Failed to create booking." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as AppointmentUpdatePayload;
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing appointment ID" }, { status: 400 });
    }

    if (body.status !== undefined && !ALLOWED_APPOINTMENT_STATUSES.has(body.status)) {
      return NextResponse.json({ error: "Invalid appointment status." }, { status: 400 });
    }

    const cleanedLink =
      body.meetingLink !== undefined ? body.meetingLink?.trim() || null : undefined;
    if (cleanedLink && !isSafeHttpUrl(cleanedLink)) {
      return NextResponse.json(
        { error: "Meeting link must start with http:// or https://." },
        { status: 400 }
      );
    }

    const existing = await prisma.appointment.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const settingsMap = await getSettings();
    const config = getBookingConfig(settingsMap);
    const service =
      config.services.find(
        (item) => item.id === (body.serviceId || existing.serviceId) && item.isActive
      ) ||
      config.services.find((item) => item.name === existing.service && item.isActive) ||
      config.services.find((item) => item.isActive);

    if (!service) {
      return NextResponse.json(
        { error: "No active booking service is available for this appointment." },
        { status: 400 }
      );
    }

    const existingDateKey = getDateKey(existing.date);
    const nextDate = body.date ? body.date.trim() : existingDateKey;
    if (!isValidDateKey(nextDate)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD." },
        { status: 400 }
      );
    }
    const nextTime = body.time ? body.time.trim() : existing.time;
    const hasScheduleChanged =
      nextDate !== existingDateKey ||
      nextTime !== existing.time ||
      (body.serviceId !== undefined && body.serviceId !== existing.serviceId);

    let slotStart = existing.startAt
      ? new Date(existing.startAt)
      : combineDateAndTime(nextDate, nextTime);
    let slotEnd = existing.endAt
      ? new Date(existing.endAt)
      : addMinutes(slotStart, service.durationMinutes);
    let slotLabel = existing.slotLabel || formatTimeLabel(existing.time);

    if (hasScheduleChanged) {
      const sameDayAppointments = await getAppointmentsForDate(nextDate);
      const slots = getAvailableSlots({
        appointments: sameDayAppointments,
        availabilityRules: config.availabilityRules,
        blockedDates: config.blockedDates,
        date: nextDate,
        excludeAppointmentId: existing.id,
        service,
        settings: config.settings,
      });
      const slot =
        slots.find((item) => item.startTime === nextTime) ||
        slots.find((item) => item.label === nextTime);

      if (slot) {
        slotStart = new Date(slot.startAt);
        slotEnd = new Date(slot.endAt);
        slotLabel = slot.label;
      } else {
        slotStart = combineDateAndTime(nextDate, nextTime);
        if (Number.isNaN(slotStart.getTime())) {
          return NextResponse.json({ error: "Invalid time slot." }, { status: 400 });
        }
        slotEnd = addMinutes(slotStart, service.durationMinutes);
        slotLabel = formatTimeLabel(nextTime);

        if (!body.forceOverride) {
          const conflict = hasActiveOverlap({
            appointments: sameDayAppointments,
            excludeId: existing.id,
            slotStart,
            slotEnd,
            maxBookingsPerSlot: service.maxBookingsPerSlot,
            defaultDuration: service.durationMinutes,
          });
          if (conflict) {
            return NextResponse.json(
              {
                error:
                  "Another active consultation overlaps the requested reschedule time. Choose a different slot.",
              },
              { status: 409 }
            );
          }
        }
      }
    }

    const nextStatus =
      body.status ||
      (hasScheduleChanged &&
      !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(existing.status)
        ? "RESCHEDULED"
        : existing.status);

    const isNowRescheduled =
      (hasScheduleChanged || nextStatus === "RESCHEDULED") &&
      nextStatus !== "CANCELLED" &&
      nextStatus !== "COMPLETED";
    const isNowCancelled = nextStatus === "CANCELLED" && existing.status !== "CANCELLED";
    const isNowConfirmed =
      nextStatus === "CONFIRMED" &&
      existing.status === "PENDING" &&
      !existing.confirmationSentAt;

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        adminNotes:
          body.adminNotes !== undefined ? body.adminNotes : existing.adminNotes ?? null,
        cancellationReason:
          nextStatus === "CANCELLED"
            ? body.cancellationReason ?? existing.cancellationReason ?? null
            : null,
        // Preserve original cancelledAt timestamp when editing an already-cancelled record
        cancelledAt:
          nextStatus === "CANCELLED" ? existing.cancelledAt || new Date() : null,
        date: slotStart,
        durationMinutes: service.durationMinutes,
        endAt: slotEnd,
        locationLabel: service.locationLabel,
        locationType: service.meetingType,
        meetingLink: cleanedLink !== undefined ? cleanedLink : existing.meetingLink ?? null,
        // Reset reminder tracking when schedule changes so new reminders fire on time
        ...(hasScheduleChanged ? { sentReminderOffsets: "" } : {}),
        service: service.name,
        serviceId: service.id,
        slotLabel,
        startAt: slotStart,
        status: nextStatus,
        time: nextTime,
      },
    });

    // Proactive customer notifications (stamp confirmationSentAt ONLY after delivery succeeds)
    if (body.notifyClient !== false && updated.email && !updated.email.includes("walkin@")) {
      const dispatchUpdateNotification = async () => {
        try {
          if (isNowCancelled) {
            await sendAppointmentNotification({
              appointment: {
                ...updated,
                cancellationReason: updated.cancellationReason,
              },
              service,
              settings: config.settings,
              settingsMap,
              type: "CANCELLED",
            });
          } else if (isNowRescheduled && hasScheduleChanged) {
            await sendAppointmentNotification({
              appointment: updated,
              service,
              settings: config.settings,
              settingsMap,
              type: "RESCHEDULED",
            });
          } else if (isNowConfirmed) {
            await sendAppointmentNotification({
              appointment: updated,
              service,
              settings: config.settings,
              settingsMap,
              type: "CONFIRMATION",
            });
            await prisma.appointment.update({
              where: { id: updated.id },
              data: { confirmationSentAt: new Date() },
            });
          }
        } catch (notifyErr) {
          console.warn("Could not dispatch status update email to customer:", notifyErr);
        }
      };

      await Promise.race([
        dispatchUpdateNotification(),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);
    }

    await logActivity(
      "UPDATED",
      "Appointment",
      `Updated booking ${updated.bookingReference || updated.id} to ${updated.status}`,
      updated.id,
      auth.user.userId
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update appointment", error);
    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const deleted = await prisma.appointment.delete({
      where: { id },
    });

    await logActivity(
      "DELETED",
      "Appointment",
      `Deleted booking ${deleted.bookingReference || deleted.id}`,
      deleted.id,
      auth.user.userId
    );

    return NextResponse.json({ message: "Appointment deleted" });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }
    console.error("Failed to delete appointment", error);
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}
