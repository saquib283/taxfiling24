import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { ingestContact } from "@/lib/audience-service";
import { verifyAdmin } from "@/lib/auth";
import {
  addMinutes,
  combineDateAndTime,
  createBookingReference,
  getAvailableSlots,
  getBookingConfig,
  getDateKey,
  isValidDateKey,
} from "@/lib/booking";
import { sendAppointmentNotification } from "@/lib/booking-notifications";
import { getSettings } from "@/lib/settings";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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

function sanitizeTimezone(raw: unknown, fallback: string): string {
  if (typeof raw !== "string") return fallback;
  const candidate = raw.trim();
  if (!candidate || candidate.length > 64) return fallback;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: candidate });
    return candidate;
  } catch {
    return fallback;
  }
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
    const rawDate = url.searchParams.get("date");
    const date = rawDate ? rawDate.trim() : getDateKey(new Date());

    if (!isValidDateKey(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const serviceId = url.searchParams.get("serviceId") || activeServices[0]?.id;
    const selectedService = activeServices.find((service) => service.id === serviceId);

    // Allow authenticated admin to exclude current appointment when rescheduling
    let excludeAppointmentId: string | undefined;
    const requestedExclude = url.searchParams.get("excludeAppointmentId")?.trim();
    if (requestedExclude) {
      const admin = await verifyAdmin();
      if (admin) {
        excludeAppointmentId = requestedExclude;
      }
    }

    const appointments = await getAppointmentsForDate(date);
    const availableSlots = selectedService
      ? getAvailableSlots({
          appointments,
          availabilityRules: config.availabilityRules,
          blockedDates: config.blockedDates,
          date,
          excludeAppointmentId,
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
    const clientIp = getClientIp(req);
    const ipRate = checkRateLimit("public-booking-ip", clientIp, {
      limit: 5,
      windowMs: 60 * 1000,
    });
    if (!ipRate.allowed) {
      return NextResponse.json(
        { error: "Too many booking requests. Please wait a moment before trying again." },
        { status: 429, headers: { "Retry-After": String(ipRate.retryAfterSeconds) } }
      );
    }

    const body = (await req.json()) as BookingRequestPayload;
    const cleanName = String(body.name || "").trim().slice(0, 120);
    const cleanEmail = String(body.email || "").trim().toLowerCase().slice(0, 180);
    const cleanPhone = String(body.phone || "").trim().slice(0, 30);
    const cleanDate = String(body.date || "").trim();
    const cleanTime = String(body.time || "").trim();
    const cleanMessage = String(body.message || "").trim().slice(0, 2000);

    if (!cleanName || !cleanEmail || !cleanPhone || !cleanDate || !cleanTime) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!isValidDateKey(cleanDate)) {
      return NextResponse.json(
        { error: "Invalid booking date format. Expected YYYY-MM-DD." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const phoneDigits = cleanPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        { error: "Please provide a valid phone number (min 10 digits)." },
        { status: 400 }
      );
    }

    const emailRate = checkRateLimit("public-booking-email", cleanEmail, {
      limit: 3,
      windowMs: 15 * 60 * 1000,
    });
    if (!emailRate.allowed) {
      return NextResponse.json(
        { error: "Too many booking attempts for this email. Please wait before scheduling again." },
        { status: 429, headers: { "Retry-After": String(emailRate.retryAfterSeconds) } }
      );
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
    const lockName = `tf24_booking_${cleanDate}`;

    // Serialize concurrent booking reservations for the same date via MySQL session advisory lock
    // inside a single Prisma transaction connection so two requests cannot double-book the same slot
    const appointment = await prisma.$transaction(
      async (tx) => {
        const lockRows = await tx.$queryRaw<Array<{ acquired: number | bigint | null }>>`
          SELECT GET_LOCK(${lockName}, 5) AS acquired
        `;
        const acquired = Number(lockRows?.[0]?.acquired ?? 0);
        if (acquired !== 1) {
          throw new Error("LOCK_TIMEOUT");
        }

        try {
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

          return await tx.appointment.create({
            data: {
              adminNotes: null,
              bookingReference: createBookingReference(),
              customerTimezone: sanitizeTimezone(body.customerTimezone, config.settings.timezone),
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
        } finally {
          await tx.$queryRaw`SELECT RELEASE_LOCK(${lockName})`.catch(() => {});
        }
      },
      { timeout: 10000 }
    );

    // Send customer notification outside transaction (never blocks booking response)
    const notification = config.settings.autoConfirmNewBookings
      ? "CONFIRMATION"
      : "BOOKING_RECEIVED";
    const dispatchCustomerNotification = async () => {
      try {
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
    };

    await Promise.race([
      dispatchCustomerNotification(),
      new Promise((resolve) => setTimeout(resolve, 2500)),
    ]);

    await logActivity(
      "CREATED",
      "Appointment",
      `New website booking for ${service.name} on ${cleanDate} at ${appointment.slotLabel || cleanTime}`,
      appointment.id
    );

    ingestContact({
      email: cleanEmail,
      name: cleanName,
      phone: cleanPhone,
      source: "APPOINTMENT",
      tags: [service.name || "CA Consultation Booking"],
      updateIfExists: false,
    }).catch((e) => console.warn("[Audience] Failed to auto-ingest appointment client:", e));

    return NextResponse.json(
      {
        id: appointment.id,
        bookingReference: appointment.bookingReference,
        status: appointment.status,
        service: appointment.service,
        date: appointment.date,
        time: appointment.time,
        slotLabel: appointment.slotLabel,
        durationMinutes: appointment.durationMinutes,
        locationLabel: appointment.locationLabel,
        locationType: appointment.locationType,
        customerTimezone: appointment.customerTimezone,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "SLOT_UNAVAILABLE") {
      return NextResponse.json(
        { error: "That time slot is no longer available. Please select another slot." },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message === "LOCK_TIMEOUT") {
      return NextResponse.json(
        { error: "The booking slot is currently busy. Please try again in a second." },
        { status: 503 }
      );
    }

    console.error("Appointment Error:", error);
    return NextResponse.json(
      { error: "Failed to schedule appointment" },
      { status: 500 }
    );
  }
}
