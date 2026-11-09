import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { ingestContact } from "@/lib/audience-service";
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

// In-memory rate limiting map (IP -> timestamp & count)
const bookingRateLimitMap = new Map<string, { count: number; lastRequest: number }>();

function checkRateLimit(request: Request): boolean {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5; // 5 booking requests per minute per IP

  const rateData = bookingRateLimitMap.get(clientIp) || { count: 0, lastRequest: now };

  if (now - rateData.lastRequest > windowMs) {
    rateData.count = 1;
    rateData.lastRequest = now;
  } else {
    rateData.count = (rateData.count || 0) + 1;
  }

  bookingRateLimitMap.set(clientIp, { count: rateData.count, lastRequest: now });

  return rateData.count <= maxRequests;
}

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
    if (!checkRateLimit(req)) {
      return NextResponse.json(
        { error: "Too many booking requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    const body = (await req.json()) as BookingRequestPayload;
    const cleanName = (body.name || "").trim();
    const cleanEmail = (body.email || "").trim().toLowerCase();
    const cleanPhone = (body.phone || "").trim();
    const cleanDate = (body.date || "").trim();
    const cleanTime = (body.time || "").trim();
    const cleanMessage = (body.message || "").trim();

    if (!cleanName || !cleanEmail || !cleanPhone || !cleanDate || !cleanTime) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const phoneDigits = cleanPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return NextResponse.json({ error: "Please provide a valid phone number (min 10 digits)." }, { status: 400 });
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

    const status = config.settings.autoConfirmNewBookings ? "CONFIRMED" : "PENDING";
    const { dayEnd, dayStart } = getDayRange(cleanDate);

    // Concurrency-safe atomic reservation inside Prisma transaction
    const appointment = await prisma.$transaction(async (tx) => {
      const activeAppointments = await tx.appointment.findMany({
        where: {
          date: {
            gte: dayStart,
            lt: dayEnd,
          },
        },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      });

      const availableSlots = getAvailableSlots({
        appointments: activeAppointments,
        availabilityRules: config.availabilityRules,
        blockedDates: config.blockedDates,
        date: cleanDate,
        service,
        settings: config.settings,
      });

      const slot =
        availableSlots.find((item) => item.startTime === cleanTime) ||
        availableSlots.find((item) => item.label === cleanTime);

      if (!slot) {
        throw new Error("SLOT_UNAVAILABLE");
      }

      return tx.appointment.create({
        data: {
          adminNotes: null,
          bookingReference: createBookingReference(),
          customerTimezone: body.customerTimezone || config.settings.timezone,
          date: new Date(slot.startAt),
          durationMinutes: service.durationMinutes,
          email: cleanEmail,
          endAt: new Date(slot.endAt),
          locationLabel: service.locationLabel,
          locationType: service.meetingType,
          message: cleanMessage || null,
          name: cleanName,
          phone: cleanPhone,
          service: service.name,
          serviceId: service.id,
          slotLabel: slot.label,
          source: "WEBSITE",
          startAt: new Date(slot.startAt),
          status,
          time: slot.startTime,
        },
      });
    });

    // Send customer notification outside transaction
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
      `New website booking for ${service.name} on ${cleanDate} at ${appointment.slotLabel || cleanTime}`,
      appointment.id
    );

    // Automatically synchronize booked appointment clients into Campaign Audience
    ingestContact({
      email: cleanEmail,
      name: cleanName,
      phone: cleanPhone,
      source: "APPOINTMENT",
      tags: [service.name || "CA Consultation Booking"],
      updateIfExists: true,
    }).catch((e) => console.warn("[Audience] Failed to auto-ingest appointment client:", e));

    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_UNAVAILABLE") {
      return NextResponse.json(
        { error: "That time slot is no longer available. Please select another slot." },
        { status: 409 }
      );
    }

    console.error("Appointment Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to schedule appointment" },
      { status: 500 }
    );
  }
}
