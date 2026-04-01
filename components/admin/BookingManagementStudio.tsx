"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Copy,
  Link2,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import {
  formatTimeLabel,
  getMeetingTypeLabel,
  getNextReminderPreview,
  type BookingAvailabilityRule,
  type BookingBlockedDate,
  type BookingServiceConfig,
  type BookingSettings,
} from "@/lib/booking";

type AppointmentRecord = {
  id: string;
  bookingReference?: string | null;
  name: string;
  email: string;
  phone: string;
  service?: string | null;
  serviceId?: string | null;
  date: string;
  time: string;
  slotLabel?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  durationMinutes?: number | null;
  locationType?: string | null;
  locationLabel?: string | null;
  meetingLink?: string | null;
  message?: string | null;
  adminNotes?: string | null;
  cancellationReason?: string | null;
  status: string;
  reminderCount?: number | null;
  sentReminderOffsets?: string | null;
  confirmationSentAt?: string | null;
  reminderSentAt?: string | null;
  meetingLinkSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type SlotOption = {
  date: string;
  label: string;
  startTime: string;
};

type AppointmentWorkspace = {
  appointments: AppointmentRecord[];
  services: BookingServiceConfig[];
  availabilityRules: BookingAvailabilityRule[];
  blockedDates: BookingBlockedDate[];
  settings: BookingSettings;
  summary: {
    confirmed: number;
    pending: number;
    remindersDue: number;
    today: number;
    total: number;
    upcoming: number;
    withMeetingLink: number;
  };
};

type AppointmentEditorState = {
  id: string;
  serviceId: string;
  date: string;
  time: string;
  status: string;
  meetingLink: string;
  adminNotes: string;
  cancellationReason: string;
};

const STATUS_OPTIONS = ["PENDING", "CONFIRMED", "RESCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"];
const WEEKDAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

function createServiceDraft(): BookingServiceConfig {
  return {
    id: `service-${Date.now()}`,
    name: "",
    description: "",
    durationMinutes: 30,
    slotIntervalMinutes: 30,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 15,
    maxBookingsPerSlot: 1,
    meetingType: "VIDEO",
    locationLabel: "",
    reminderOffsetsMinutes: [1440, 120],
    color: "#2563eb",
    isActive: true,
  };
}

function createAvailabilityDraft(weekday: number): BookingAvailabilityRule {
  return {
    id: `availability-${Date.now()}-${weekday}`,
    weekday,
    startTime: "10:00",
    endTime: "18:00",
    isActive: true,
  };
}

function createBlockedDateDraft(): BookingBlockedDate {
  const today = new Date();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  return {
    id: `block-${Date.now()}`,
    date: `${today.getFullYear()}-${month}-${day}`,
    isAllDay: true,
    reason: "Unavailable",
  };
}

function appointmentToEditor(
  appointment: AppointmentRecord,
  fallbackServiceId: string = ""
): AppointmentEditorState {
  return {
    adminNotes: appointment.adminNotes || "",
    cancellationReason: appointment.cancellationReason || "",
    date: appointment.date.slice(0, 10),
    id: appointment.id,
    meetingLink: appointment.meetingLink || "",
    serviceId: appointment.serviceId || fallbackServiceId,
    status: appointment.status,
    time: appointment.time || "",
  };
}

function getStatusClasses(status: string) {
  switch (status) {
    case "CONFIRMED":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "RESCHEDULED":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "COMPLETED":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "CANCELLED":
    case "NO_SHOW":
      return "bg-rose-50 text-rose-700 border-rose-100";
    default:
      return "bg-amber-50 text-amber-700 border-amber-100";
  }
}

function parseReminderOffsets(value: string) {
  return value
    .split(",")
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((item) => Number.isFinite(item) && item >= 0);
}

function reminderOffsetsToValue(offsets: number[]) {
  return offsets.join(", ");
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Not sent yet";
  }
  return new Date(value).toLocaleString();
}

export default function BookingManagementStudio() {
  const [workspace, setWorkspace] = useState<AppointmentWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingBooking, setSavingBooking] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [appointmentEditor, setAppointmentEditor] = useState<AppointmentEditorState | null>(null);
  const [services, setServices] = useState<BookingServiceConfig[]>([]);
  const [availabilityRules, setAvailabilityRules] = useState<BookingAvailabilityRule[]>([]);
  const [blockedDates, setBlockedDates] = useState<BookingBlockedDate[]>([]);
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);
  const [slotOptions, setSlotOptions] = useState<SlotOption[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const loadWorkspace = useCallback(async (initial = false) => {
    if (!initial) {
      setRefreshing(true);
    }

    try {
      const response = await fetch("/api/admin/appointments");

      if (!response.ok) {
        throw new Error("Unable to load the booking workspace.");
      }

      const data = (await response.json()) as AppointmentWorkspace;
      setWorkspace(data);
      setServices(data.services);
      setAvailabilityRules(data.availabilityRules);
      setBlockedDates(data.blockedDates);
      setBookingSettings(data.settings);

      if (!selectedAppointmentId && data.appointments[0]) {
        setSelectedAppointmentId(data.appointments[0].id);
        setAppointmentEditor(appointmentToEditor(data.appointments[0], data.services[0]?.id || ""));
      } else if (selectedAppointmentId) {
        const selected = data.appointments.find((item) => item.id === selectedAppointmentId);
        if (selected) {
          setAppointmentEditor(appointmentToEditor(selected, data.services[0]?.id || ""));
        }
      }
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to load the booking workspace.",
        type: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedAppointmentId]);

  useEffect(() => {
    void loadWorkspace(true);
  }, [loadWorkspace]);

  const filteredAppointments = useMemo(() => {
    if (!workspace) {
      return [];
    }

    return workspace.appointments.filter((appointment) => {
      const matchesSearch =
        appointment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.service || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.bookingReference || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || appointment.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, workspace]);

  const selectedAppointment = useMemo(
    () => workspace?.appointments.find((item) => item.id === selectedAppointmentId) || null,
    [selectedAppointmentId, workspace]
  );

  const selectedService = useMemo(
    () => services.find((item) => item.id === appointmentEditor?.serviceId) || services[0] || null,
    [appointmentEditor?.serviceId, services]
  );

  const availableSlotValueSet = useMemo(
    () => new Set(slotOptions.map((slot) => slot.startTime)),
    [slotOptions]
  );

  const fetchSlots = useCallback(async (serviceId: string, date: string) => {
    if (!serviceId || !date) {
      setSlotOptions([]);
      return;
    }

    setSlotsLoading(true);

    try {
      const response = await fetch(`/api/appointments?serviceId=${serviceId}&date=${date}`);
      const data = (await response.json()) as { availableSlots?: SlotOption[] };
      setSlotOptions(Array.isArray(data.availableSlots) ? data.availableSlots : []);
    } catch {
      setSlotOptions([]);
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (appointmentEditor?.serviceId && appointmentEditor.date) {
      void fetchSlots(appointmentEditor.serviceId, appointmentEditor.date);
    }
  }, [appointmentEditor?.date, appointmentEditor?.serviceId, fetchSlots]);

  const selectAppointment = (appointment: AppointmentRecord) => {
    setSelectedAppointmentId(appointment.id);
    setAppointmentEditor(appointmentToEditor(appointment, services[0]?.id || ""));
    setFeedback(null);
  };

  const updateAppointmentField = (field: keyof AppointmentEditorState, value: string) => {
    setAppointmentEditor((current) => (current ? { ...current, [field]: value } : current));
  };

  const saveBooking = async () => {
    if (!appointmentEditor) {
      return;
    }

    setSavingBooking(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointmentEditor),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to save the booking.");
      }

      setFeedback({ text: "Booking updated successfully.", type: "success" });
      await loadWorkspace();
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to save the booking.",
        type: "error",
      });
    } finally {
      setSavingBooking(false);
    }
  };

  const sendClientEmail = async (type: "CONFIRMATION" | "MEETING_LINK" | "REMINDER") => {
    if (!selectedAppointment) {
      return;
    }

    setSendingEmail(type);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/appointments/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: selectedAppointment.id, type }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to send the appointment email.");
      }

      setFeedback({
        text:
          type === "CONFIRMATION"
            ? "Confirmation email sent."
            : type === "MEETING_LINK"
            ? "Meeting link email sent."
            : "Reminder email sent.",
        type: "success",
      });
      await loadWorkspace();
    } catch (error) {
      setFeedback({
        text:
          error instanceof Error
            ? error.message
            : "Unable to send the appointment email.",
        type: "error",
      });
    } finally {
      setSendingEmail(null);
    }
  };

  const removeAppointment = async () => {
    if (!selectedAppointment || !window.confirm("Delete this booking?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/appointments?id=${selectedAppointment.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete the booking.");
      }

      setFeedback({ text: "Booking deleted.", type: "success" });
      setSelectedAppointmentId(null);
      setAppointmentEditor(null);
      await loadWorkspace();
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to delete the booking.",
        type: "error",
      });
    }
  };

  const saveConfig = async () => {
    if (!bookingSettings) {
      return;
    }

    setSavingConfig(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/appointments/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availabilityRules,
          blockedDates,
          services,
          settings: bookingSettings,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to save booking configuration.");
      }

      setFeedback({ text: "Booking setup saved.", type: "success" });
      await loadWorkspace();
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to save booking configuration.",
        type: "error",
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const duplicateMeetingLink = async () => {
    if (!selectedAppointment?.meetingLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedAppointment.meetingLink);
      setFeedback({ text: "Meeting link copied to clipboard.", type: "success" });
    } catch {
      setFeedback({ text: "Could not copy the meeting link.", type: "error" });
    }
  };

  if (loading || !workspace || !bookingSettings) {
    return (
      <div className="p-6 min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading booking management...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_28%),linear-gradient(135deg,_#f8fbff,_#ffffff_45%,_#eef7ff)] shadow-sm">
        <div className="px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                <CalendarClock className="h-3.5 w-3.5" />
                Booking Management
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                Slots, reminders, and booking operations in one place
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
                Manage website bookings with real slot availability, appointment statuses,
                reminders, meeting links, and scheduling rules from the admin panel.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Upcoming</div>
                <div className="mt-2 text-2xl font-bold text-gray-950">{workspace.summary.upcoming}</div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Reminders Due</div>
                <div className="mt-2 text-2xl font-bold text-gray-950">{workspace.summary.remindersDue}</div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">With Meeting Link</div>
                <div className="mt-2 text-2xl font-bold text-gray-950">{workspace.summary.withMeetingLink}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {feedback.text}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Total Bookings</p>
              <p className="mt-2 text-3xl font-bold text-gray-950">{workspace.summary.total}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600"><Calendar className="h-5 w-5" /></div>
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Today</p>
              <p className="mt-2 text-3xl font-bold text-gray-950">{workspace.summary.today}</p>
            </div>
            <div className="rounded-2xl bg-violet-50 p-3 text-violet-600"><Clock3 className="h-5 w-5" /></div>
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Pending</p>
              <p className="mt-2 text-3xl font-bold text-gray-950">{workspace.summary.pending}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600"><BellRing className="h-5 w-5" /></div>
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Confirmed</p>
              <p className="mt-2 text-3xl font-bold text-gray-950">{workspace.summary.confirmed}</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.9fr)]">
        <section className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-100 px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-950">Bookings</h2>
                <p className="mt-1 text-sm text-gray-500">Search, filter, and open any booking for detailed actions.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void loadWorkspace()}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={saveConfig}
                  disabled={savingConfig}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Booking Setup
                </button>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by client, email, reference, or service..."
                  className="w-full rounded-2xl border border-gray-200 px-11 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {["ALL", ...STATUS_OPTIONS].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      statusFilter === status
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-h-[820px] overflow-y-auto">
            {filteredAppointments.length === 0 ? (
              <div className="px-6 py-16 text-center text-sm text-gray-500">
                No bookings match the current filter.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredAppointments.map((appointment) => (
                  <button
                    key={appointment.id}
                    type="button"
                    onClick={() => selectAppointment(appointment)}
                    className={`w-full px-6 py-5 text-left transition hover:bg-gray-50 ${
                      selectedAppointmentId === appointment.id ? "bg-blue-50/60" : "bg-white"
                    }`}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-sm font-semibold text-gray-950">{appointment.name}</h3>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(appointment.status)}`}>{appointment.status}</span>
                          {appointment.bookingReference ? (
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                              {appointment.bookingReference}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm text-gray-500">{appointment.service || "Consultation"}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                          <span>{appointment.email}</span>
                          <span>{new Date(appointment.date).toLocaleDateString()}</span>
                          <span>{appointment.slotLabel || formatTimeLabel(appointment.time)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-600">
                          {appointment.meetingLink ? "Meeting Link Added" : "No Link Yet"}
                        </span>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">
                          {appointment.reminderCount || 0} reminders
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          {selectedAppointment && appointmentEditor ? (
            <div className="space-y-5">
              <div className="border-b border-gray-100 pb-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-950">Booking detail</h2>
                    <p className="mt-1 text-sm text-gray-500">{selectedAppointment.email}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(selectedAppointment.status)}`}>
                    {selectedAppointment.status}
                  </span>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Client</div>
                  <div className="mt-2 text-sm font-semibold text-gray-950">{selectedAppointment.name}</div>
                  <div className="mt-1 text-sm text-gray-500">{selectedAppointment.phone}</div>
                  {selectedAppointment.message ? (
                    <div className="mt-3 text-sm text-gray-600">{selectedAppointment.message}</div>
                  ) : null}
                </div>

                <select
                  value={appointmentEditor.serviceId}
                  onChange={(event) => updateAppointmentField("serviceId", event.target.value)}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input type="date" value={appointmentEditor.date} onChange={(event) => updateAppointmentField("date", event.target.value)} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <select value={appointmentEditor.status} onChange={(event) => updateAppointmentField("status", event.target.value)} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50">
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">Available slots</div>
                    {slotsLoading ? <Loader2 className="h-4 w-4 animate-spin text-gray-400" /> : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {slotOptions.length === 0 ? (
                      <span className="text-sm text-gray-500">No slots available for this date.</span>
                    ) : (
                      slotOptions.map((slot) => (
                        <button
                          key={`${slot.date}-${slot.startTime}`}
                          type="button"
                          onClick={() => updateAppointmentField("time", slot.startTime)}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                            appointmentEditor.time === slot.startTime
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))
                    )}
                  </div>
                  {!availableSlotValueSet.has(appointmentEditor.time) && appointmentEditor.time ? (
                    <div className="mt-3 text-xs text-amber-700">Current slot is not in the available list for the selected date.</div>
                  ) : null}
                </div>

                <input
                  value={appointmentEditor.meetingLink}
                  onChange={(event) => updateAppointmentField("meetingLink", event.target.value)}
                  placeholder="Meeting link"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
                <textarea
                  value={appointmentEditor.adminNotes}
                  onChange={(event) => updateAppointmentField("adminNotes", event.target.value)}
                  placeholder="Admin notes"
                  rows={4}
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
                {appointmentEditor.status === "CANCELLED" ? (
                  <textarea
                    value={appointmentEditor.cancellationReason}
                    onChange={(event) => updateAppointmentField("cancellationReason", event.target.value)}
                    placeholder="Cancellation reason"
                    rows={3}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                ) : null}

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm">
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Meeting mode</span>
                      <span className="font-semibold text-gray-900">{getMeetingTypeLabel(selectedService?.meetingType)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Next reminder</span>
                      <span className="font-semibold text-gray-900">
                        {selectedService ? `${getNextReminderPreview(selectedAppointment, selectedService, bookingSettings) ?? "None"}` : "None"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Confirmation sent</span>
                      <span className="font-semibold text-gray-900">{formatDateTime(selectedAppointment.confirmationSentAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Last reminder</span>
                      <span className="font-semibold text-gray-900">{formatDateTime(selectedAppointment.reminderSentAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Meeting link sent</span>
                      <span className="font-semibold text-gray-900">{formatDateTime(selectedAppointment.meetingLinkSentAt)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={saveBooking} disabled={savingBooking} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60">
                    {savingBooking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Booking
                  </button>
                  <button type="button" onClick={duplicateMeetingLink} disabled={!selectedAppointment.meetingLink} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    <Copy className="h-4 w-4" />
                    Copy Meeting Link
                  </button>
                  <button type="button" onClick={() => void sendClientEmail("CONFIRMATION")} disabled={sendingEmail === "CONFIRMATION"} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                    {sendingEmail === "CONFIRMATION" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                    Send Confirmation
                  </button>
                  <button type="button" onClick={() => void sendClientEmail("REMINDER")} disabled={sendingEmail === "REMINDER"} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                    {sendingEmail === "REMINDER" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
                    Send Reminder
                  </button>
                  <button type="button" onClick={() => void sendClientEmail("MEETING_LINK")} disabled={sendingEmail === "MEETING_LINK" || !appointmentEditor.meetingLink} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                    {sendingEmail === "MEETING_LINK" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                    Share Meeting Link
                  </button>
                  <button type="button" onClick={removeAppointment} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                    Delete Booking
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-sm text-gray-500">Select a booking to manage it.</div>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:items-start">
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="border-b border-gray-100 pb-5">
            <div className="flex items-center gap-2 text-xl font-semibold text-gray-950">
              <Video className="h-5 w-5" />
              Bookable services
            </div>
            <p className="mt-1 text-sm text-gray-500">Control slot duration, buffer time, reminders, and meeting mode.</p>
          </div>
          <div className="mt-5 space-y-4">
            {services.map((service, index) => (
              <div key={service.id} className="rounded-2xl border border-gray-200 p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={service.name} onChange={(event) => setServices((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))} placeholder="Service name" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <select value={service.meetingType} onChange={(event) => setServices((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, meetingType: event.target.value as BookingServiceConfig["meetingType"] } : item))} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50">
                    {["VIDEO", "PHONE", "IN_PERSON", "CUSTOM_LINK"].map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <textarea value={service.description} onChange={(event) => setServices((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))} placeholder="Short description" rows={3} className="sm:col-span-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <input value={service.locationLabel} onChange={(event) => setServices((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, locationLabel: event.target.value } : item))} placeholder="Location or instructions" className="sm:col-span-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <input type="number" value={service.durationMinutes} onChange={(event) => setServices((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, durationMinutes: Number(event.target.value), slotIntervalMinutes: Math.min(Number(event.target.value) || item.slotIntervalMinutes, item.slotIntervalMinutes || Number(event.target.value)) } : item))} placeholder="Duration" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <input type="number" value={service.slotIntervalMinutes} onChange={(event) => setServices((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, slotIntervalMinutes: Number(event.target.value) } : item))} placeholder="Interval" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <input type="number" value={service.maxBookingsPerSlot} onChange={(event) => setServices((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, maxBookingsPerSlot: Number(event.target.value) } : item))} placeholder="Capacity" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <input type="number" value={service.bufferBeforeMinutes} onChange={(event) => setServices((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, bufferBeforeMinutes: Number(event.target.value) } : item))} placeholder="Buffer before" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <input type="number" value={service.bufferAfterMinutes} onChange={(event) => setServices((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, bufferAfterMinutes: Number(event.target.value) } : item))} placeholder="Buffer after" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <input value={reminderOffsetsToValue(service.reminderOffsetsMinutes)} onChange={(event) => setServices((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, reminderOffsetsMinutes: parseReminderOffsets(event.target.value) } : item))} placeholder="1440, 120" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={service.isActive} onChange={(event) => setServices((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, isActive: event.target.checked } : item))} />
                    Active
                  </label>
                  <button type="button" onClick={() => setServices((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setServices((current) => [...current, createServiceDraft()])} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              <Plus className="h-4 w-4" />
              Add Service
            </button>
          </div>
        </section>
        </div>

        <div className="space-y-6">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="border-b border-gray-100 pb-5">
            <div className="flex items-center gap-2 text-xl font-semibold text-gray-950">
              <Settings2 className="h-5 w-5" />
              Availability
            </div>
            <p className="mt-1 text-sm text-gray-500">Set recurring weekly windows plus core booking policies.</p>
          </div>
          <div className="mt-5 space-y-3">
            {availabilityRules.map((rule, index) => (
              <div key={rule.id} className="rounded-2xl border border-gray-200 p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr_0.8fr_auto]">
                  <select value={rule.weekday} onChange={(event) => setAvailabilityRules((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, weekday: Number(event.target.value) } : item))} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50">
                    {WEEKDAY_OPTIONS.map((weekday) => <option key={weekday.value} value={weekday.value}>{weekday.label}</option>)}
                  </select>
                  <input type="time" value={rule.startTime} onChange={(event) => setAvailabilityRules((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, startTime: event.target.value } : item))} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <input type="time" value={rule.endTime} onChange={(event) => setAvailabilityRules((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, endTime: event.target.value } : item))} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <button type="button" onClick={() => setAvailabilityRules((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Delete</button>
                </div>
                <label className="mt-3 inline-flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={rule.isActive} onChange={(event) => setAvailabilityRules((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, isActive: event.target.checked } : item))} />
                  Rule active
                </label>
              </div>
            ))}
            <button type="button" onClick={() => setAvailabilityRules((current) => [...current, createAvailabilityDraft(1)])} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              <Plus className="h-4 w-4" />
              Add Availability Window
            </button>

            <div className="rounded-2xl border border-gray-200 p-4">
              <div className="text-sm font-semibold text-gray-900">Booking policies</div>
              <div className="mt-3 grid gap-3">
                <input value={bookingSettings.timezone} onChange={(event) => setBookingSettings((current) => current ? { ...current, timezone: event.target.value } : current)} placeholder="Timezone" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input type="number" value={bookingSettings.minNoticeHours} onChange={(event) => setBookingSettings((current) => current ? { ...current, minNoticeHours: Number(event.target.value) } : current)} placeholder="Min notice" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <input type="number" value={bookingSettings.maxAdvanceDays} onChange={(event) => setBookingSettings((current) => current ? { ...current, maxAdvanceDays: Number(event.target.value) } : current)} placeholder="Advance window" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                </div>
                <input value={bookingSettings.bookingWindowLabel} onChange={(event) => setBookingSettings((current) => current ? { ...current, bookingWindowLabel: event.target.value } : current)} placeholder="Booking window label" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                <input value={reminderOffsetsToValue(bookingSettings.defaultReminderOffsetsMinutes)} onChange={(event) => setBookingSettings((current) => current ? { ...current, defaultReminderOffsetsMinutes: parseReminderOffsets(event.target.value) } : current)} placeholder="Default reminders" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={bookingSettings.autoConfirmNewBookings} onChange={(event) => setBookingSettings((current) => current ? { ...current, autoConfirmNewBookings: event.target.checked } : current)} />
                  Auto-confirm new website bookings
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="border-b border-gray-100 pb-5">
            <div className="flex items-center gap-2 text-xl font-semibold text-gray-950">
              <Users className="h-5 w-5" />
              Blocked dates
            </div>
            <p className="mt-1 text-sm text-gray-500">Pause bookings for holidays, events, or internal holds.</p>
          </div>
          <div className="mt-5 space-y-3">
            {blockedDates.map((block, index) => (
              <div key={block.id} className="rounded-2xl border border-gray-200 p-4">
                <div className="grid gap-3">
                  <input type="date" value={block.date} onChange={(event) => setBlockedDates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, date: event.target.value } : item))} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={block.isAllDay} onChange={(event) => setBlockedDates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, isAllDay: event.target.checked } : item))} />
                    All day block
                  </label>
                  {!block.isAllDay ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input type="time" value={block.startTime || ""} onChange={(event) => setBlockedDates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, startTime: event.target.value } : item))} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                      <input type="time" value={block.endTime || ""} onChange={(event) => setBlockedDates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, endTime: event.target.value } : item))} className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                    </div>
                  ) : null}
                  <input value={block.reason} onChange={(event) => setBlockedDates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, reason: event.target.value } : item))} placeholder="Reason" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <button type="button" onClick={() => setBlockedDates((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                    Remove Block
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setBlockedDates((current) => [...current, createBlockedDateDraft()])} className="inline-flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50">
              <Plus className="h-4 w-4" />
              Add Blocked Date
            </button>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}
