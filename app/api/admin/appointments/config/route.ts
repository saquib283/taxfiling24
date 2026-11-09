import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireAdmin } from "@/lib/auth";
import {
  getBookingConfig,
  serializeBookingConfig,
  type BookingAvailabilityRule,
  type BookingBlockedDate,
  type BookingServiceConfig,
  type BookingSettings,
} from "@/lib/booking";
import { getSettings } from "@/lib/settings";

type BookingConfigPayload = {
  availabilityRules?: BookingAvailabilityRule[];
  blockedDates?: BookingBlockedDate[];
  services?: BookingServiceConfig[];
  settings?: BookingSettings;
};

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settingsMap = await getSettings();
    const config = getBookingConfig(settingsMap);
    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to fetch booking configuration", error);
    return NextResponse.json(
      { error: "Failed to fetch booking configuration" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
