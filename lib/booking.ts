import crypto from "crypto";

export const BOOKING_SETTING_KEYS = [
  "BOOKING_SERVICES_JSON",
  "BOOKING_AVAILABILITY_JSON",
  "BOOKING_BLOCKED_DATES_JSON",
  "BOOKING_SETTINGS_JSON",
] as const;

export type MeetingType = "VIDEO" | "PHONE" | "IN_PERSON" | "CUSTOM_LINK";

export interface BookingServiceConfig {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  slotIntervalMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  maxBookingsPerSlot: number;
  meetingType: MeetingType;
  locationLabel: string;
  reminderOffsetsMinutes: number[];
  color: string;
  isActive: boolean;
}

export interface BookingAvailabilityRule {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface BookingBlockedDate {
  id: string;
  date: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  reason: string;
}

export interface BookingSettings {
  timezone: string;
  minNoticeHours: number;
  maxAdvanceDays: number;
  autoConfirmNewBookings: boolean;
  defaultReminderOffsetsMinutes: number[];
  bookingWindowLabel: string;
}

export interface BookingConfig {
  services: BookingServiceConfig[];
  availabilityRules: BookingAvailabilityRule[];
  blockedDates: BookingBlockedDate[];
  settings: BookingSettings;
}

export interface BookingAppointmentLike {
  id?: string;
  date: Date | string;
  time: string;
  startAt?: Date | string | null;
  endAt?: Date | string | null;
  durationMinutes?: number | null;
  status?: string | null;
  sentReminderOffsets?: string | null;
}

export interface AvailableSlot {
  date: string;
  endAt: string;
  endTime: string;
  label: string;
  startAt: string;
  startTime: string;
}

export const DEFAULT_BOOKING_SERVICES: BookingServiceConfig[] = [
  {
    id: "service-consultation",
    name: "General Consultation",
    description: "Discuss tax, GST, compliance, or registration questions with an expert.",
    durationMinutes: 30,
    slotIntervalMinutes: 30,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 15,
    maxBookingsPerSlot: 1,
    meetingType: "VIDEO",
    locationLabel: "Google Meet or custom video link shared after confirmation",
    reminderOffsetsMinutes: [1440, 120],
    color: "#2563eb",
    isActive: true,
  },
  {
    id: "service-gst-review",
    name: "GST Filing Review",
    description: "Review filing readiness, deadlines, and missing documents with the GST team.",
    durationMinutes: 45,
    slotIntervalMinutes: 30,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 15,
    maxBookingsPerSlot: 1,
    meetingType: "VIDEO",
    locationLabel: "Online review session with filing walkthrough",
    reminderOffsetsMinutes: [1440, 180],
    color: "#0f766e",
    isActive: true,
  },
  {
    id: "service-registration",
    name: "Business Registration",
    description: "Founders can discuss entity choice, registrations, and next-step paperwork.",
    durationMinutes: 45,
    slotIntervalMinutes: 30,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 15,
    maxBookingsPerSlot: 1,
    meetingType: "PHONE",
    locationLabel: "Phone or WhatsApp callback from the advisory team",
    reminderOffsetsMinutes: [1440, 60],
    color: "#7c3aed",
    isActive: true,
  },
];

export const DEFAULT_BOOKING_AVAILABILITY: BookingAvailabilityRule[] = [
  { id: "mon-am", weekday: 1, startTime: "10:00", endTime: "18:00", isActive: true },
  { id: "tue-am", weekday: 2, startTime: "10:00", endTime: "18:00", isActive: true },
  { id: "wed-am", weekday: 3, startTime: "10:00", endTime: "18:00", isActive: true },
  { id: "thu-am", weekday: 4, startTime: "10:00", endTime: "18:00", isActive: true },
  { id: "fri-am", weekday: 5, startTime: "10:00", endTime: "18:00", isActive: true },
  { id: "sat-am", weekday: 6, startTime: "10:00", endTime: "15:00", isActive: true },
];

export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  timezone: "Asia/Kolkata",
  minNoticeHours: 4,
  maxAdvanceDays: 45,
  autoConfirmNewBookings: false,
  defaultReminderOffsetsMinutes: [1440, 120],
  bookingWindowLabel: "Mon-Sat, 10:00 AM to 6:00 PM",
};

function safeJsonParse<T>(value: string | undefined, fallback: T): T {
  if (!value?.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeReminderOffsets(values: number[] | undefined, fallback: number[]): number[] {
  const normalized = (values || [])
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value >= 0);

  if (normalized.length === 0) {
    return [...fallback];
  }

  return [...new Set(normalized)].sort((a, b) => b - a);
}

function normalizeServices(value: BookingServiceConfig[]): BookingServiceConfig[] {
  return value
    .map((service, index) => ({
      bufferAfterMinutes: Number(service.bufferAfterMinutes ?? 0),
      bufferBeforeMinutes: Number(service.bufferBeforeMinutes ?? 0),
      color: service.color || DEFAULT_BOOKING_SERVICES[index % DEFAULT_BOOKING_SERVICES.length]?.color || "#2563eb",
      description: service.description || "",
      durationMinutes: Number(service.durationMinutes ?? 30),
      id: service.id || `service-${index + 1}`,
      isActive: service.isActive !== false,
      locationLabel: service.locationLabel || "",
      maxBookingsPerSlot: Math.max(1, Number(service.maxBookingsPerSlot ?? 1)),
      meetingType: service.meetingType || "VIDEO",
      name: service.name || `Service ${index + 1}`,
      reminderOffsetsMinutes: normalizeReminderOffsets(
        service.reminderOffsetsMinutes,
        DEFAULT_BOOKING_SETTINGS.defaultReminderOffsetsMinutes
      ),
      slotIntervalMinutes: Math.max(15, Number(service.slotIntervalMinutes ?? service.durationMinutes ?? 30)),
    }))
    .filter((service) => service.name.trim().length > 0);
}

function normalizeAvailabilityRules(value: BookingAvailabilityRule[]): BookingAvailabilityRule[] {
  return value
    .map((rule, index) => ({
      endTime: rule.endTime || "18:00",
      id: rule.id || `availability-${index + 1}`,
      isActive: rule.isActive !== false,
      startTime: rule.startTime || "10:00",
      weekday: Number(rule.weekday ?? 0),
    }))
    .filter((rule) => rule.weekday >= 0 && rule.weekday <= 6);
}

function normalizeBlockedDates(value: BookingBlockedDate[]): BookingBlockedDate[] {
  return value.map((block, index) => ({
    date: block.date,
    endTime: block.endTime || undefined,
    id: block.id || `block-${index + 1}`,
    isAllDay: block.isAllDay !== false ? Boolean(block.isAllDay) : false,
    reason: block.reason || "Unavailable",
    startTime: block.startTime || undefined,
  }));
}

export function getBookingConfig(settings: Record<string, string | undefined>): BookingConfig {
  const services = normalizeServices(
    safeJsonParse(settings.BOOKING_SERVICES_JSON, DEFAULT_BOOKING_SERVICES)
  );
  const availabilityRules = normalizeAvailabilityRules(
    safeJsonParse(settings.BOOKING_AVAILABILITY_JSON, DEFAULT_BOOKING_AVAILABILITY)
  );
  const blockedDates = normalizeBlockedDates(
    safeJsonParse(settings.BOOKING_BLOCKED_DATES_JSON, [] as BookingBlockedDate[])
  );
  const settingsValue = safeJsonParse(settings.BOOKING_SETTINGS_JSON, DEFAULT_BOOKING_SETTINGS);

  return {
    services: services.length > 0 ? services : DEFAULT_BOOKING_SERVICES,
    availabilityRules,
    blockedDates,
    settings: {
      autoConfirmNewBookings: Boolean(settingsValue.autoConfirmNewBookings),
      bookingWindowLabel:
        settingsValue.bookingWindowLabel || DEFAULT_BOOKING_SETTINGS.bookingWindowLabel,
      defaultReminderOffsetsMinutes: normalizeReminderOffsets(
        settingsValue.defaultReminderOffsetsMinutes,
        DEFAULT_BOOKING_SETTINGS.defaultReminderOffsetsMinutes
      ),
      maxAdvanceDays: Number(settingsValue.maxAdvanceDays ?? DEFAULT_BOOKING_SETTINGS.maxAdvanceDays),
      minNoticeHours: Number(settingsValue.minNoticeHours ?? DEFAULT_BOOKING_SETTINGS.minNoticeHours),
      timezone: settingsValue.timezone || DEFAULT_BOOKING_SETTINGS.timezone,
    },
  };
}

export function serializeBookingConfig(config: BookingConfig) {
  return {
    BOOKING_AVAILABILITY_JSON: JSON.stringify(config.availabilityRules),
    BOOKING_BLOCKED_DATES_JSON: JSON.stringify(config.blockedDates),
    BOOKING_SERVICES_JSON: JSON.stringify(config.services),
    BOOKING_SETTINGS_JSON: JSON.stringify(config.settings),
  };
}

export function getDateKey(value: Date | string): string {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map((part) => Number.parseInt(part, 10));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0;
  }
  return hours * 60 + minutes;
}

export function minutesToTime(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${`${hours}`.padStart(2, "0")}:${`${minutes}`.padStart(2, "0")}`;
}

export function formatTimeLabel(time: string): string {
  const minutes = parseTimeToMinutes(time);
  const hours = Math.floor(minutes / 60);
  const hour12 = hours % 12 || 12;
  const suffix = hours >= 12 ? "PM" : "AM";
  return `${hour12}:${`${minutes % 60}`.padStart(2, "0")} ${suffix}`;
}

export function combineDateAndTime(dateKey: string, time: string): Date {
  return new Date(`${dateKey}T${time}:00`);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function isWithinAdvanceWindow(dateKey: string, settings: BookingSettings): boolean {
  const today = new Date();
  const selected = combineDateAndTime(dateKey, "00:00");
  const noticeLimit = addMinutes(today, settings.minNoticeHours * 60);
  const maxAdvance = addMinutes(new Date(), settings.maxAdvanceDays * 24 * 60);

  return selected <= maxAdvance && selected >= addMinutes(noticeLimit, -parseTimeToMinutes("23:59"));
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA;
}

function getAppointmentWindow(
  appointment: BookingAppointmentLike,
  defaultDuration: number
): { start: Date; end: Date } | null {
  const start =
    appointment.startAt
      ? new Date(appointment.startAt)
      : combineDateAndTime(getDateKey(appointment.date), appointment.time);
  const end =
    appointment.endAt
      ? new Date(appointment.endAt)
      : addMinutes(start, appointment.durationMinutes || defaultDuration);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return { start, end };
}

function getBlockedWindows(dateKey: string, blockedDates: BookingBlockedDate[]) {
  return blockedDates
    .filter((block) => block.date === dateKey)
    .map((block) => {
      if (block.isAllDay || !block.startTime || !block.endTime) {
        return { start: 0, end: 24 * 60 };
      }

      return {
        end: parseTimeToMinutes(block.endTime),
        start: parseTimeToMinutes(block.startTime),
      };
    });
}

export function getAvailableSlots(params: {
  appointments: BookingAppointmentLike[];
  availabilityRules: BookingAvailabilityRule[];
  blockedDates: BookingBlockedDate[];
  date: string;
  excludeAppointmentId?: string;
  service: BookingServiceConfig;
  settings: BookingSettings;
}): AvailableSlot[] {
  const { appointments, availabilityRules, blockedDates, date, excludeAppointmentId, service, settings } = params;

  if (!isWithinAdvanceWindow(date, settings)) {
    return [];
  }

  const weekday = combineDateAndTime(date, "00:00").getDay();
  const activeRules = availabilityRules.filter(
    (rule) => rule.isActive && rule.weekday === weekday
  );

  if (activeRules.length === 0) {
    return [];
  }

  const blockedWindows = getBlockedWindows(date, blockedDates);
  const candidateSlots: AvailableSlot[] = [];
  const now = new Date();

  for (const rule of activeRules) {
    const ruleStart = parseTimeToMinutes(rule.startTime);
    const ruleEnd = parseTimeToMinutes(rule.endTime);
    const lastStart = ruleEnd - service.durationMinutes;

    for (
      let startMinutes = ruleStart;
      startMinutes <= lastStart;
      startMinutes += service.slotIntervalMinutes
    ) {
      const slotStart = combineDateAndTime(date, minutesToTime(startMinutes));
      const slotEnd = addMinutes(slotStart, service.durationMinutes);
      const occupiedStart = addMinutes(slotStart, -service.bufferBeforeMinutes);
      const occupiedEnd = addMinutes(slotEnd, service.bufferAfterMinutes);

      if (slotStart < addMinutes(now, settings.minNoticeHours * 60)) {
        continue;
      }

      const isBlocked = blockedWindows.some((block) => {
        const blockStart = combineDateAndTime(date, minutesToTime(block.start));
        const blockEnd = combineDateAndTime(date, minutesToTime(block.end));
        return overlaps(occupiedStart, occupiedEnd, blockStart, blockEnd);
      });

      if (isBlocked) {
        continue;
      }

      let exactSlotCount = 0;
      let hasConflict = false;

      for (const appointment of appointments) {
        if (appointment.id && excludeAppointmentId && appointment.id === excludeAppointmentId) {
          continue;
        }

        if (appointment.status && ["CANCELLED", "NO_SHOW"].includes(appointment.status)) {
          continue;
        }

        const window = getAppointmentWindow(appointment, service.durationMinutes);
        if (!window) {
          continue;
        }

        const sameSlot =
          window.start.getTime() === slotStart.getTime() &&
          window.end.getTime() === slotEnd.getTime();

        if (sameSlot) {
          exactSlotCount += 1;
          if (exactSlotCount < service.maxBookingsPerSlot) {
            continue;
          }
        }

        if (overlaps(occupiedStart, occupiedEnd, window.start, window.end)) {
          hasConflict = true;
          break;
        }
      }

      if (hasConflict || exactSlotCount >= service.maxBookingsPerSlot) {
        continue;
      }

      candidateSlots.push({
        date,
        endAt: slotEnd.toISOString(),
        endTime: minutesToTime(startMinutes + service.durationMinutes),
        label: formatTimeLabel(minutesToTime(startMinutes)),
        startAt: slotStart.toISOString(),
        startTime: minutesToTime(startMinutes),
      });
    }
  }

  return candidateSlots;
}

export function parseSentReminderOffsets(value: string | null | undefined): number[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((part) => Number.isFinite(part) && part >= 0);
}

export function getReminderOffsets(
  service: BookingServiceConfig | undefined,
  settings: BookingSettings
): number[] {
  return normalizeReminderOffsets(
    service?.reminderOffsetsMinutes,
    settings.defaultReminderOffsetsMinutes
  );
}

export function getDueReminderOffsets(params: {
  appointment: BookingAppointmentLike;
  service?: BookingServiceConfig;
  settings: BookingSettings;
  now?: Date;
}): number[] {
  const { appointment, service, settings } = params;
  const now = params.now || new Date();
  const sentOffsets = new Set(parseSentReminderOffsets(appointment.sentReminderOffsets));
  const start =
    appointment.startAt
      ? new Date(appointment.startAt)
      : combineDateAndTime(getDateKey(appointment.date), appointment.time);

  if (Number.isNaN(start.getTime()) || start <= now) {
    return [];
  }

  return getReminderOffsets(service, settings)
    .filter((offset) => !sentOffsets.has(offset))
    .filter((offset) => addMinutes(start, -offset) <= now)
    .sort((a, b) => a - b);
}

export function getNextReminderPreview(
  appointment: BookingAppointmentLike,
  service: BookingServiceConfig | undefined,
  settings: BookingSettings
): number | null {
  const start =
    appointment.startAt
      ? new Date(appointment.startAt)
      : combineDateAndTime(getDateKey(appointment.date), appointment.time);

  if (Number.isNaN(start.getTime())) {
    return null;
  }

  const sentOffsets = new Set(parseSentReminderOffsets(appointment.sentReminderOffsets));
  const remaining = getReminderOffsets(service, settings).filter(
    (offset) => !sentOffsets.has(offset)
  );

  return remaining.length > 0 ? remaining[0] : null;
}

export function createBookingReference(): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 12);
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `BK-${stamp}-${suffix}`;
}

export function getMeetingTypeLabel(type: MeetingType | string | undefined): string {
  switch (type) {
    case "PHONE":
      return "Phone Call";
    case "IN_PERSON":
      return "In-Person";
    case "CUSTOM_LINK":
      return "Shared Link";
    case "VIDEO":
    default:
      return "Video Meeting";
  }
}
