import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import {
  getBookingConfig,
  serializeBookingConfig,
  type BookingAvailabilityRule,
  type BookingBlockedDate,
  type BookingServiceConfig,
  type BookingSettings,
} from "@/lib/booking";

type BookingConfigPayload = {
  availabilityRules?: BookingAvailabilityRule[];
  blockedDates?: BookingBlockedDate[];
  services?: BookingServiceConfig[];
  settings?: BookingSettings;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BookingConfigPayload;
    const normalized = getBookingConfig({
      BOOKING_AVAILABILITY_JSON: JSON.stringify(body.availabilityRules || []),
      BOOKING_BLOCKED_DATES_JSON: JSON.stringify(body.blockedDates || []),
      BOOKING_SERVICES_JSON: JSON.stringify(body.services || []),
      BOOKING_SETTINGS_JSON: JSON.stringify(body.settings || {}),
    });
    const serialized = serializeBookingConfig(normalized);

    await Promise.all(
      Object.entries(serialized).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );

    await logActivity(
      "UPDATED",
      "BookingConfig",
      `Updated booking configuration with ${normalized.services.length} services`
    );

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Failed to save booking configuration", error);
    return NextResponse.json(
      { error: "Failed to save booking configuration" },
      { status: 500 }
    );
  }
}
