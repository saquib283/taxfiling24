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

export function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

export function isSafeHttpUrl(url: string | null | undefined): boolean {
  if (!url || !url.trim()) return true; // empty is allowed when optional
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

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
    .map((service, index) => {
      const duration = Math.max(5, Math.min(480, Number(service.durationMinutes ?? 30) || 30));
      return {
        bufferAfterMinutes: Math.max(0, Math.min(180, Number(service.bufferAfterMinutes ?? 0) || 0)),
        bufferBeforeMinutes: Math.max(0, Math.min(180, Number(service.bufferBeforeMinutes ?? 0) || 0)),
        color:
          service.color ||
          DEFAULT_BOOKING_SERVICES[index % DEFAULT_BOOKING_SERVICES.length]?.color ||
          "#2563eb",
        description: service.description || "",
        durationMinutes: duration,
        id: service.id || `service-${index + 1}`,
        isActive: service.isActive !== false,
        locationLabel: service.locationLabel || "",
        maxBookingsPerSlot: Math.max(1, Math.min(100, Number(service.maxBookingsPerSlot ?? 1) || 1)),
        meetingType: service.meetingType || "VIDEO",
        name: service.name || `Service ${index + 1}`,
        reminderOffsetsMinutes: normalizeReminderOffsets(
          service.reminderOffsetsMinutes,
          DEFAULT_BOOKING_SETTINGS.defaultReminderOffsetsMinutes
        ),
        slotIntervalMinutes: Math.max(
          5,
          Math.min(240, Number(service.slotIntervalMinutes ?? duration) || duration)
        ),
      };
    })
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
      maxAdvanceDays: Math.max(
        1,
        Math.min(365, Number(settingsValue.maxAdvanceDays ?? DEFAULT_BOOKING_SETTINGS.maxAdvanceDays) || 45)
      ),
      minNoticeHours: Math.max(
        0,
        Math.min(720, Number(settingsValue.minNoticeHours ?? DEFAULT_BOOKING_SETTINGS.minNoticeHours) || 0)
      ),
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

/**
 * Converts a Date or ISO timestamp into YYYY-MM-DD strictly in Asia/Kolkata timezone.
 * Prevents early-morning IST appointments (00:00–05:29 IST) from rolling back -1 day in UTC.
 */
export function getDateKey(value: Date | string): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return trimmed.slice(0, 10);
    }
    value = parsed;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(value);
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
  const cleanDate = getDateKey(dateKey);
  const normalizedTime = time.length === 5 ? time : time.padStart(5, "0");
  return new Date(`${cleanDate}T${normalizedTime}:00+05:30`);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

function isWithinAdvanceWindow(dateKey: string, settings: BookingSettings): boolean {
  if (!isValidDateKey(dateKey)) return false;
  const today = new Date();
  const selectedStart = combineDateAndTime(dateKey, "00:00");
  const selectedEnd = combineDateAndTime(dateKey, "23:59");
  const noticeLimit = addMinutes(today, settings.minNoticeHours * 60);
  const maxAdvance = addMinutes(today, settings.maxAdvanceDays * 24 * 60);

  return selectedStart <= maxAdvance && selectedEnd >= noticeLimit;
}

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA;
}

function getAppointmentWindow(
  appointment: BookingAppointmentLike,
  defaultDuration: number
): { start: Date; end: Date } | null {
  const start = appointment.startAt
    ? new Date(appointment.startAt)
    : combineDateAndTime(getDateKey(appointment.date), appointment.time);
  const end = appointment.endAt
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
  const {
    appointments,
    availabilityRules,
    blockedDates,
    date,
    excludeAppointmentId,
    service,
    settings,
  } = params;

  if (!isWithinAdvanceWindow(date, settings)) {
    return [];
  }

  const safeDuration = Math.max(5, service.durationMinutes || 30);
  const safeInterval = Math.max(5, service.slotIntervalMinutes || safeDuration);
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).getUTCDay();
  const activeRules = availabilityRules.filter(
    (rule) => rule.isActive && rule.weekday === weekday
  );

  if (activeRules.length === 0) {
    return [];
  }

  const blockedWindows = getBlockedWindows(date, blockedDates);
  const candidateSlots: AvailableSlot[] = [];
  const seenStartTimes = new Set<string>();
  const now = new Date();

  for (const rule of activeRules) {
    const ruleStart = parseTimeToMinutes(rule.startTime);
    const ruleEnd = parseTimeToMinutes(rule.endTime);
    const lastStart = ruleEnd - safeDuration;

    for (
      let startMinutes = ruleStart;
      startMinutes <= lastStart;
      startMinutes += safeInterval
    ) {
      const startTimeStr = minutesToTime(startMinutes);
      if (seenStartTimes.has(startTimeStr)) {
        continue;
      }

      const slotStart = combineDateAndTime(date, startTimeStr);
      const slotEnd = addMinutes(slotStart, safeDuration);
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

        const window = getAppointmentWindow(appointment, safeDuration);
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

        // Symmetrical buffer check: neither candidate's buffer nor existing appointment's buffer may collide
        const existingBufferedStart = addMinutes(window.start, -service.bufferBeforeMinutes);
        const existingBufferedEnd = addMinutes(window.end, service.bufferAfterMinutes);

        if (
          overlaps(occupiedStart, occupiedEnd, window.start, window.end) ||
          overlaps(slotStart, slotEnd, existingBufferedStart, existingBufferedEnd)
        ) {
          hasConflict = true;
          break;
        }
      }

      if (hasConflict || exactSlotCount >= service.maxBookingsPerSlot) {
        continue;
      }

      seenStartTimes.add(startTimeStr);
      candidateSlots.push({
        date,
        endAt: slotEnd.toISOString(),
        endTime: minutesToTime(startMinutes + safeDuration),
        label: formatTimeLabel(startTimeStr),
        startAt: slotStart.toISOString(),
        startTime: startTimeStr,
      });
    }
  }

  return candidateSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
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
  const start = appointment.startAt
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
  const start = appointment.startAt
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
