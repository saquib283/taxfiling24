import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import {
  addMinutes,
  combineDateAndTime,
  createBookingReference,
  getAvailableSlots,
  getBookingConfig,
  getDateKey,
} from "@/lib/booking";
import { sendAppointmentNotification } from "@/lib/booking-notifications";
import { getSettings } from "@/lib/settings";

type BookingRequestPayload = {
  customerTimezone?: string;
  date?: string;
  email?: string;
  message?: string;
  name?: string;
  phone?: string;
  service?: string;
  serviceId?: string;
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const settingsMap = await getSettings();
    const config = getBookingConfig(settingsMap);
    const activeServices = config.services.filter((service) => service.isActive);
    const date = url.searchParams.get("date") || getDateKey(new Date());
    const serviceId = url.searchParams.get("serviceId") || activeServices[0]?.id;
    const selectedService = activeServices.find((service) => service.id === serviceId);
    const appointments = await getAppointmentsForDate(date);
    const availableSlots = selectedService
      ? getAvailableSlots({
          appointments,
          availabilityRules: config.availabilityRules,
          blockedDates: config.blockedDates,
          date,
          service: selectedService,
          settings: config.settings,
        })
      : [];

    return NextResponse.json({
      availableSlots,
      selectedDate: date,
      selectedServiceId: selectedService?.id || null,
      services: activeServices,
      settings: config.settings,
    });
  } catch (error) {
    console.error("Booking availability error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking availability." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BookingRequestPayload;
    const { name, email, phone, date, time } = body;

    if (!name || !email || !phone || !date || !time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const settingsMap = await getSettings();
    const config = getBookingConfig(settingsMap);
    const service =
      config.services.find((item) => item.id === body.serviceId && item.isActive) ||
      config.services.find((item) => item.name === body.service && item.isActive) ||
      config.services.find((item) => item.isActive);

    if (!service) {
      return NextResponse.json(
        { error: "No bookable service is currently available." },
        { status: 400 }
      );
    }

    const appointments = await getAppointmentsForDate(date);
    const availableSlots = getAvailableSlots({
      appointments,
      availabilityRules: config.availabilityRules,
      blockedDates: config.blockedDates,
      date,
      service,
      settings: config.settings,
    });
    const slot =
      availableSlots.find((item) => item.startTime === time) ||
      availableSlots.find((item) => item.label === time);

    if (!slot) {
      return NextResponse.json(
        { error: "That slot is no longer available. Please choose another time." },
        { status: 409 }
      );
    }

    const status = config.settings.autoConfirmNewBookings ? "CONFIRMED" : "PENDING";
    const appointment = await prisma.appointment.create({
      data: {
        adminNotes: null,
        bookingReference: createBookingReference(),
        customerTimezone: body.customerTimezone || config.settings.timezone,
        date: new Date(date),
        durationMinutes: service.durationMinutes,
        email,
        endAt: new Date(slot.endAt),
        locationLabel: service.locationLabel,
        locationType: service.meetingType,
        message: body.message || null,
        name,
        phone,
        service: service.name,
        serviceId: service.id,
        slotLabel: slot.label,
        source: "WEBSITE",
        startAt: new Date(slot.startAt),
        status,
        time: slot.startTime,
      },
    });

    try {
      const notification = config.settings.autoConfirmNewBookings ? "CONFIRMATION" : "BOOKING_RECEIVED";
      const sendResult = await sendAppointmentNotification({
        appointment,
        service,
        settings: config.settings,
        settingsMap,
        type: notification,
      });

      if (notification === "CONFIRMATION") {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            confirmationSentAt: new Date(),
          },
        });
      }

      console.info("Appointment email sent via", sendResult.provider);
    } catch (emailError) {
      console.warn("Appointment email could not be sent:", emailError);
    }

    await logActivity(
      "CREATED",
      "Appointment",
      `New website booking for ${service.name} on ${date} at ${slot.label}`,
      appointment.id
    );

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    console.error("Appointment Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to schedule appointment" },
      { status: 500 }
    );
  }
}
