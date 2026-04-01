import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import {
  addMinutes,
  combineDateAndTime,
  getAvailableSlots,
  getBookingConfig,
  getDateKey,
  getDueReminderOffsets,
} from "@/lib/booking";
import { getSettings } from "@/lib/settings";

type AppointmentUpdatePayload = {
  adminNotes?: string | null;
  cancellationReason?: string | null;
  date?: string;
  id?: string;
  meetingLink?: string | null;
  serviceId?: string | null;
  status?: string;
  time?: string;
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

export async function GET() {
  try {
    const settingsMap = await getSettings();
    const config = getBookingConfig(settingsMap);
    const appointments = await prisma.appointment.findMany({
      orderBy: [{ date: "asc" }, { createdAt: "desc" }],
    });
    const servicesById = new Map(config.services.map((service) => [service.id, service]));
    const todayKey = getDateKey(new Date());
    const now = new Date();

    const summary = appointments.reduce(
      (acc, appointment) => {
        const start = appointment.startAt ? new Date(appointment.startAt) : combineDateAndTime(getDateKey(appointment.date), appointment.time);
        const isUpcoming =
          start > now && !["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appointment.status);
        const service = appointment.serviceId ? servicesById.get(appointment.serviceId) : undefined;
        const dueReminders = getDueReminderOffsets({
          appointment,
          service,
          settings: config.settings,
          now,
        });

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

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as AppointmentUpdatePayload;
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing appointment ID" }, { status: 400 });
    }

    const existing = await prisma.appointment.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const settingsMap = await getSettings();
    const config = getBookingConfig(settingsMap);
    const service =
      config.services.find((item) => item.id === (body.serviceId || existing.serviceId) && item.isActive) ||
      config.services.find((item) => item.name === existing.service && item.isActive) ||
      config.services.find((item) => item.isActive);

    if (!service) {
      return NextResponse.json(
        { error: "No active booking service is available for this appointment." },
        { status: 400 }
      );
    }

    const nextDate = body.date || getDateKey(existing.date);
    const nextTime = body.time || existing.time;
    const hasScheduleChanged =
      nextDate !== getDateKey(existing.date) ||
      nextTime !== existing.time ||
      body.serviceId !== undefined;

    let slotStart = existing.startAt ? new Date(existing.startAt) : combineDateAndTime(nextDate, nextTime);
    let slotEnd = existing.endAt ? new Date(existing.endAt) : addMinutes(slotStart, service.durationMinutes);
    let slotLabel = existing.slotLabel || existing.time;

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

      if (!slot) {
        return NextResponse.json(
          { error: "That slot is not available anymore." },
          { status: 409 }
        );
      }

      slotStart = new Date(slot.startAt);
      slotEnd = new Date(slot.endAt);
      slotLabel = slot.label;
    }

    const nextStatus =
      body.status ||
      (hasScheduleChanged && !["COMPLETED", "CANCELLED", "NO_SHOW"].includes(existing.status)
        ? "RESCHEDULED"
        : existing.status);

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        adminNotes: body.adminNotes ?? existing.adminNotes ?? null,
        cancellationReason:
          nextStatus === "CANCELLED"
            ? body.cancellationReason ?? existing.cancellationReason ?? null
            : null,
        cancelledAt: nextStatus === "CANCELLED" ? new Date() : null,
        date: new Date(nextDate),
        durationMinutes: service.durationMinutes,
        endAt: slotEnd,
        locationLabel: service.locationLabel,
        locationType: service.meetingType,
        meetingLink: body.meetingLink ?? existing.meetingLink ?? null,
        service: service.name,
        serviceId: service.id,
        slotLabel,
        startAt: slotStart,
        status: nextStatus,
        time: nextTime,
      },
    });

    await logActivity(
      "UPDATED",
      "Appointment",
      `Updated booking ${updated.bookingReference || updated.id} to ${updated.status}`,
      updated.id
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
      deleted.id
    );

    return NextResponse.json({ message: "Appointment deleted" });
  } catch (error) {
    console.error("Failed to delete appointment", error);
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 }
    );
  }
}
