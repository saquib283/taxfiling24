"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Calendar,
  CalendarClock,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  Filter,
  Info,
  Link2,
  Loader2,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Sliders,
  Trash2,
  User,
  Users,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import {
  formatTimeLabel,
  getDateKey,
  getMeetingTypeLabel,
  getNextReminderPreview,
  isSafeHttpUrl,
  type BookingAvailabilityRule,
  type BookingBlockedDate,
  type BookingServiceConfig,
  type BookingSettings,
  type MeetingType,
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
  source?: string | null;
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

const STATUS_OPTIONS = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "RESCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
] as const;

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
    name: "New Consultation Service",
    description: "Personalized statutory filing and advisory session with a senior tax consultant.",
    durationMinutes: 30,
    slotIntervalMinutes: 30,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 15,
    maxBookingsPerSlot: 1,
    meetingType: "VIDEO",
    locationLabel: "Google Meet or Zoom link provided upon confirmation",
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
    reason: "Public Holiday / Office Closed",
  };
}

function appointmentToEditor(
  appointment: AppointmentRecord,
  fallbackServiceId: string = ""
): AppointmentEditorState {
  return {
    adminNotes: appointment.adminNotes || "",
    cancellationReason: appointment.cancellationReason || "",
    date: getDateKey(appointment.date),
    id: appointment.id,
    meetingLink: appointment.meetingLink || "",
    serviceId: appointment.serviceId || fallbackServiceId,
    status: appointment.status,
    time: appointment.time || "",
  };
}

function getStatusBadge(status: string) {
  switch (status) {
    case "CONFIRMED":
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        dot: "bg-emerald-500",
        label: "Confirmed",
      };
    case "PENDING":
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200/80",
        dot: "bg-amber-500 animate-pulse",
        label: "Pending Review",
      };
    case "RESCHEDULED":
      return {
        bg: "bg-sky-50 text-sky-700 border-sky-200/80",
        dot: "bg-sky-500",
        label: "Rescheduled",
      };
    case "COMPLETED":
      return {
        bg: "bg-slate-100 text-slate-700 border-slate-200",
        dot: "bg-slate-400",
        label: "Completed",
      };
    case "CANCELLED":
      return {
        bg: "bg-rose-50 text-rose-700 border-rose-200/80",
        dot: "bg-rose-500",
        label: "Cancelled",
      };
    case "NO_SHOW":
      return {
        bg: "bg-zinc-100 text-zinc-600 border-zinc-200",
        dot: "bg-zinc-400",
        label: "No Show",
      };
    default:
      return {
        bg: "bg-slate-50 text-slate-700 border-slate-200",
        dot: "bg-slate-400",
        label: status,
      };
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

function formatRelativeDate(dateStr: string) {
  const target = new Date(dateStr);
  const now = new Date();
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((targetMidnight - nowMidnight) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: "Today", isToday: true, isPast: false };
  if (diffDays === 1) return { label: "Tomorrow", isToday: false, isPast: false };
  if (diffDays === -1) return { label: "Yesterday", isToday: false, isPast: true };
  if (diffDays < -1) return { label: `${Math.abs(diffDays)}d ago`, isToday: false, isPast: true };
  return { label: `In ${diffDays}d`, isToday: false, isPast: false };
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-indigo-100 text-indigo-700 ring-indigo-200/60",
    "bg-emerald-100 text-emerald-800 ring-emerald-200/60",
    "bg-sky-100 text-sky-800 ring-sky-200/60",
    "bg-amber-100 text-amber-800 ring-amber-200/60",
    "bg-violet-100 text-violet-800 ring-violet-200/60",
    "bg-rose-100 text-rose-800 ring-rose-200/60",
  ];
  const charCode = name.charCodeAt(0) || 0;
  return colors[charCode % colors.length];
}

function getInitials(name: string) {
  if (!name) return "??";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
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
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [appointmentEditor, setAppointmentEditor] = useState<AppointmentEditorState | null>(null);
  const [services, setServices] = useState<BookingServiceConfig[]>([]);
  const [availabilityRules, setAvailabilityRules] = useState<BookingAvailabilityRule[]>([]);
  const [blockedDates, setBlockedDates] = useState<BookingBlockedDate[]>([]);
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);
  const [slotOptions, setSlotOptions] = useState<SlotOption[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"bookings" | "services" | "settings">("bookings");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState(false);
  const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [reminderDrafts, setReminderDrafts] = useState<Record<string, string>>({});
  const selectedAppointmentIdRef = useRef<string | null>(null);

  useEffect(() => {
    selectedAppointmentIdRef.current = selectedAppointmentId;
  }, [selectedAppointmentId]);

  const [newBookingForm, setNewBookingForm] = useState({
    adminNotes: "",
    date: getDateKey(new Date()),
    email: "",
    meetingLink: "",
    name: "",
    notifyClient: true,
    phone: "",
    serviceId: "",
    status: "CONFIRMED",
    time: "10:00",
  });

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
      setReminderDrafts(
        Object.fromEntries(
          data.services.map((s) => [s.id, reminderOffsetsToValue(s.reminderOffsetsMinutes)])
        )
      );
      setAvailabilityRules(data.availabilityRules);
      setBlockedDates(data.blockedDates);
      setBookingSettings(data.settings);

      const currentSelectedId = selectedAppointmentIdRef.current;
      if (currentSelectedId) {
        const found = data.appointments.find((item) => item.id === currentSelectedId);
        if (found) {
          setAppointmentEditor(appointmentToEditor(found, data.services[0]?.id || ""));
        } else {
          setSelectedAppointmentId(null);
          setAppointmentEditor(null);
        }
      }
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to load appointments workspace.",
        type: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkspace(true);
  }, [loadWorkspace]);

  const filteredAppointments = useMemo(() => {
    if (!workspace) return [];

    return workspace.appointments.filter((appointment) => {
      const matchesSearch =
        appointment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const fetchSlots = useCallback(async (serviceId: string, date: string, excludeId?: string) => {
    if (!serviceId || !date) {
      setSlotOptions([]);
      return;
    }

    setSlotsLoading(true);
    try {
      const params = new URLSearchParams({ serviceId, date });
      if (excludeId) params.set("excludeAppointmentId", excludeId);
      const response = await fetch(`/api/appointments?${params.toString()}`);
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
      void fetchSlots(appointmentEditor.serviceId, appointmentEditor.date, appointmentEditor.id);
    }
  }, [appointmentEditor?.date, appointmentEditor?.serviceId, appointmentEditor?.id, fetchSlots]);

  const openAppointmentDrawer = (appointment: AppointmentRecord) => {
    setSelectedAppointmentId(appointment.id);
    setAppointmentEditor(appointmentToEditor(appointment, services[0]?.id || ""));
    setFeedback(null);
  };

  const closeAppointmentDrawer = () => {
    setSelectedAppointmentId(null);
    setAppointmentEditor(null);
  };

  const updateAppointmentField = (field: keyof AppointmentEditorState, value: string) => {
    setAppointmentEditor((current) => (current ? { ...current, [field]: value } : current));
  };

  const saveBooking = async () => {
    if (!appointmentEditor) return;

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
        throw new Error(data.error || "Unable to save consultation changes.");
      }

      setFeedback({ text: "Consultation updated successfully.", type: "success" });
      await loadWorkspace();
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to save changes.",
        type: "error",
      });
    } finally {
      setSavingBooking(false);
    }
  };

  const sendClientEmail = async (
    type: "CONFIRMATION" | "MEETING_LINK" | "REMINDER" | "RESCHEDULED" | "CANCELLED"
  ) => {
    if (!selectedAppointment) return;

    setSendingEmail(type);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/appointments/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: selectedAppointment.id,
          type,
          ...(type === "MEETING_LINK" && appointmentEditor?.meetingLink
            ? { meetingLink: appointmentEditor.meetingLink.trim() }
            : {}),
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to dispatch consultation email.");
      }

      const labelMap = {
        CONFIRMATION: "Confirmation email sent.",
        MEETING_LINK: "Meeting link shared with client.",
        REMINDER: "Reminder notification dispatched.",
        RESCHEDULED: "Reschedule notice sent.",
        CANCELLED: "Cancellation notice sent.",
      };

      setFeedback({ text: labelMap[type], type: "success" });
      await loadWorkspace();
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to send email notification.",
        type: "error",
      });
    } finally {
      setSendingEmail(null);
    }
  };

  const confirmDeleteBooking = async () => {
    if (!selectedAppointment) return;

    setDeletingBooking(true);
    try {
      const response = await fetch(`/api/admin/appointments?id=${selectedAppointment.id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete this appointment.");
      }

      setFeedback({ text: "Consultation deleted successfully.", type: "success" });
      closeAppointmentDrawer();
      setIsDeleteDialogOpen(false);
      await loadWorkspace();
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to delete appointment.",
        type: "error",
      });
    } finally {
      setDeletingBooking(false);
    }
  };

  const exportBookingsCsv = () => {
    if (!workspace?.appointments || workspace.appointments.length === 0) {
      setFeedback({ text: "No consultation records available to export.", type: "error" });
      return;
    }

    const sanitizeCsv = (val: unknown) => {
      if (val === null || val === undefined) return '""';
      let str = String(val).replace(/"/g, '""').trim();
      if (/^[=+\-@\t\r]/.test(str)) {
        str = `'${str}`;
      }
      return `"${str}"`;
    };

    const headers = [
      "Reference",
      "Client Name",
      "Email",
      "Phone",
      "Service",
      "Date",
      "Time",
      "Status",
      "Meeting Link",
      "Admin Notes",
      "Created At",
    ];

    const rows = filteredAppointments.map((app) => [
      sanitizeCsv(app.bookingReference),
      sanitizeCsv(app.name),
      sanitizeCsv(app.email),
      sanitizeCsv(app.phone),
      sanitizeCsv(app.service),
      sanitizeCsv(getDateKey(app.date)),
      sanitizeCsv(app.time),
      sanitizeCsv(app.status),
      sanitizeCsv(app.meetingLink),
      sanitizeCsv(app.adminNotes),
      sanitizeCsv(app.createdAt),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tax-consultations-${getDateKey(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback({ text: "Consultation records exported to CSV.", type: "success" });
  };

  const handleCreateNewBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookingForm.name.trim()) {
      setFeedback({ text: "Client name is required.", type: "error" });
      return;
    }
    if (!newBookingForm.email.trim() && !newBookingForm.phone.trim()) {
      setFeedback({ text: "Please provide either an email or phone number.", type: "error" });
      return;
    }

    setCreatingBooking(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/admin/appointments", {
        body: JSON.stringify({
          ...newBookingForm,
          serviceId: newBookingForm.serviceId || services[0]?.id || null,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      let data: { error?: string } = {};
      try {
        data = (await response.json()) as { error?: string };
      } catch {
        data = { error: `Server response error (${response.status}: ${response.statusText || "Timeout"})` };
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to schedule appointment.");
      }

      setFeedback({ text: "Consultation scheduled successfully.", type: "success" });
      setIsNewBookingModalOpen(false);
      setNewBookingForm({
        adminNotes: "",
        date: getDateKey(new Date()),
        email: "",
        meetingLink: "",
        name: "",
        notifyClient: true,
        phone: "",
        serviceId: services[0]?.id || "",
        status: "CONFIRMED",
        time: "10:00",
      });
      await loadWorkspace();
    } catch (err) {
      setFeedback({
        text: err instanceof Error ? err.message : "Failed to create booking.",
        type: "error",
      });
    } finally {
      setCreatingBooking(false);
    }
  };

  const saveConfig = async () => {
    if (!bookingSettings) return;

    setSavingConfig(true);
    setFeedback(null);

    try {
      const mergedServices = services.map((s) =>
        reminderDrafts[s.id] !== undefined
          ? { ...s, reminderOffsetsMinutes: parseReminderOffsets(reminderDrafts[s.id]) }
          : s
      );
      const response = await fetch("/api/admin/appointments/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availabilityRules,
          blockedDates,
          services: mergedServices,
          settings: bookingSettings,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to save configuration.");
      }

      setFeedback({ text: "Booking rules and services saved.", type: "success" });
      await loadWorkspace();
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to save configuration.",
        type: "error",
      });
    } finally {
      setSavingConfig(false);
    }
  };

  const copyMeetingLink = async (url: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      setFeedback({ text: "Meeting link copied to clipboard.", type: "success" });
    } catch {
      setFeedback({ text: "Failed to copy link.", type: "error" });
    }
  };

  if (loading || !workspace || !bookingSettings) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="h-10 w-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-4" />
        <h2 className="text-base font-semibold text-slate-800">Loading Consultations Studio</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          Fetching appointments roster, bookable services, and weekly schedule rules...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header & Context */}
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Consultation Bookings
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Live Studio
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl">
            Coordinate tax advisory appointments, assign video meeting rooms, and configure bookable time slots.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadWorkspace()}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs disabled:opacity-60 cursor-pointer"
            title="Refresh appointments data"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={exportBookingsCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setNewBookingForm({
                adminNotes: "",
                date: getDateKey(new Date()),
                email: "",
                meetingLink: "",
                name: "",
                notifyClient: true,
                phone: "",
                serviceId: services[0]?.id || "",
                status: "CONFIRMED",
                time: "10:00",
              });
              setIsNewBookingModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            New Appointment
          </button>
        </div>
      </header>

      {/* Floating feedback alert */}
      {feedback && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-xs sm:text-sm flex items-center justify-between gap-3 transition-all ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-900"
              : "border-rose-200 bg-rose-50/90 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span
              className={`h-2 w-2 rounded-full ${
                feedback.type === "success" ? "bg-emerald-600" : "bg-rose-600"
              }`}
            />
            <span className="font-medium">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <nav className="flex space-x-1 sm:space-x-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab("bookings");
              setFeedback(null);
            }}
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === "bookings"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <CalendarClock className="h-4 w-4 text-slate-400" />
            Appointments
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
              {workspace.summary.total}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("services");
              setFeedback(null);
            }}
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === "services"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <Video className="h-4 w-4 text-slate-400" />
            Services & Durations
            <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
              {services.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("settings");
              setFeedback(null);
            }}
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer ${
              activeTab === "settings"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            <Sliders className="h-4 w-4 text-slate-400" />
            Availability & Rules
          </button>
        </nav>

        <div className="hidden md:flex items-center text-xs text-slate-400 font-medium">
          Timezone: {bookingSettings.timezone}
        </div>
      </div>

      {/* TAB 1: BOOKINGS ROSTER & AGENDA */}
      {activeTab === "bookings" && (
        <div className="space-y-6">
          {/* Executive Agenda Strip */}
          <section
            aria-label="Consultations Summary"
            className="grid grid-cols-2 md:grid-cols-4 gap-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 sm:p-4"
          >
            <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Today&apos;s Sessions</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">
                  {workspace.summary.today}
                </span>
                <Clock className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {workspace.summary.today > 0 ? "Scheduled for today" : "No consultations today"}
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Awaiting Confirmation</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-amber-600">
                  {workspace.summary.pending}
                </span>
                <BellRing className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {workspace.summary.pending > 0 ? "Requires review" : "All requests handled"}
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Upcoming Confirmed</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-700">
                  {workspace.summary.upcoming}
                </span>
                <CalendarRange className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {workspace.summary.withMeetingLink} with video links ready
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
              <span className="text-xs font-medium text-slate-500">Total Archive</span>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-bold text-slate-900">
                  {workspace.summary.total}
                </span>
                <CheckCircle2 className="h-4 w-4 text-slate-400" />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {workspace.summary.confirmed} confirmed all-time
              </p>
            </div>
          </section>

          {/* Unified Filter & Search Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by client name, email, phone, reference, or service..."
                  className="w-full rounded-xl border border-slate-200 pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Counter / Active Filter Info */}
              <div className="text-xs text-slate-500 self-center">
                Showing <strong className="text-slate-800">{filteredAppointments.length}</strong> of{" "}
                {workspace.appointments.length} appointments
              </div>
            </div>

            {/* Segmented Status Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-medium mr-1.5 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Status:
              </span>
              {STATUS_OPTIONS.map((status) => {
                const count =
                  status === "ALL"
                    ? workspace.appointments.length
                    : workspace.appointments.filter((a) => a.status === status).length;

                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      statusFilter === status
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    <span>{status === "ALL" ? "All Appointments" : status.toLowerCase().replace("_", " ")}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                        statusFilter === status ? "bg-slate-700 text-white" : "bg-white text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Directory Roster: Table / Cards */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
            {filteredAppointments.length === 0 ? (
              <div className="py-16 px-6 text-center max-w-md mx-auto">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3.5">
                  <Calendar className="h-6 w-6" />
                </div>
                {workspace.appointments.length === 0 ? (
                  <>
                    <h3 className="text-base font-bold text-slate-900">No Consultations Scheduled Yet</h3>
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                      Client bookings submitted through your website booking form will automatically show up here. You can also schedule manual walk-in or telephone sessions.
                    </p>
                    <div className="mt-5 flex justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsNewBookingModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition cursor-pointer shadow-xs"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Schedule First Consultation
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-bold text-slate-900">No Matching Appointments</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      No bookings matched your filter query ({statusFilter !== "ALL" ? statusFilter : ""} &quot;{searchTerm}&quot;).
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("ALL");
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 sm:px-5">Client</th>
                      <th className="py-3 px-4 sm:px-5">Service</th>
                      <th className="py-3 px-4 sm:px-5">Scheduled Slot</th>
                      <th className="py-3 px-4 sm:px-5">Meeting Link</th>
                      <th className="py-3 px-4 sm:px-5">Status</th>
                      <th className="py-3 px-4 sm:px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {filteredAppointments.map((appointment) => {
                      const badge = getStatusBadge(appointment.status);
                      const relative = formatRelativeDate(appointment.date);
                      const isSelected = selectedAppointmentId === appointment.id;

                      return (
                        <tr
                          key={appointment.id}
                          className={`hover:bg-slate-50/80 transition-colors group cursor-pointer ${
                            isSelected ? "bg-indigo-50/40" : ""
                          }`}
                          onClick={() => openAppointmentDrawer(appointment)}
                        >
                          {/* Client column */}
                          <td className="py-3.5 px-4 sm:px-5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs ring-1 shrink-0 ${getAvatarColor(
                                  appointment.name
                                )}`}
                              >
                                {getInitials(appointment.name)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900 truncate">
                                    {appointment.name}
                                  </span>
                                  {appointment.bookingReference && (
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/60 shrink-0">
                                      {appointment.bookingReference}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate flex items-center gap-2 mt-0.5">
                                  <span>{appointment.email}</span>
                                  {appointment.phone && (
                                    <>
                                      <span className="text-slate-300">•</span>
                                      <span>{appointment.phone}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Service column */}
                          <td className="py-3.5 px-4 sm:px-5">
                            <div className="font-medium text-slate-800">
                              {appointment.service || "General Consultation"}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Video className="h-3 w-3 text-slate-400" />
                              <span>{appointment.locationLabel || "Online Session"}</span>
                            </div>
                          </td>

                          {/* Scheduled slot column */}
                          <td className="py-3.5 px-4 sm:px-5">
                            <div className="flex items-center gap-1.5 font-medium text-slate-900">
                              <span>
                                {new Date(appointment.date).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                  relative.isToday
                                    ? "bg-amber-100 text-amber-800"
                                    : relative.isPast
                                    ? "bg-slate-100 text-slate-500"
                                    : "bg-indigo-50 text-indigo-700"
                                }`}
                              >
                                {relative.label}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <span>
                                {appointment.slotLabel || formatTimeLabel(appointment.time)}
                              </span>
                            </div>
                          </td>

                          {/* Meeting Link column */}
                          <td className="py-3.5 px-4 sm:px-5">
                            {appointment.meetingLink ? (
                              <div
                                className="inline-flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded-md border border-indigo-100 font-medium"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Video className="h-3 w-3 text-indigo-500" />
                                <span className="max-w-[120px] truncate">Link Ready</span>
                                <button
                                  type="button"
                                  onClick={() => copyMeetingLink(appointment.meetingLink!)}
                                  className="hover:text-indigo-800 p-0.5 rounded cursor-pointer"
                                  title="Copy meeting link"
                                >
                                  <Copy className="h-3 w-3" />
                                </button>
                                {isSafeHttpUrl(appointment.meetingLink) && (
                                  <a
                                    href={appointment.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-indigo-800 p-0.5 rounded"
                                    title="Open in new window"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                                <VideoOff className="h-3 w-3 text-slate-300" />
                                None assigned
                              </span>
                            )}
                          </td>

                          {/* Status badge */}
                          <td className="py-3.5 px-4 sm:px-5">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                          </td>

                          {/* Action button */}
                          <td className="py-3.5 px-4 sm:px-5 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openAppointmentDrawer(appointment);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 shadow-2xs transition cursor-pointer"
                            >
                              <span>Manage</span>
                              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CONSULTATION SERVICES */}
      {activeTab === "services" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Bookable Consultation Services</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure appointment duration, buffer intervals between slots, and meeting modes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setServices((curr) => [...curr, createServiceDraft()])}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Service Type
              </button>
              <button
                type="button"
                onClick={saveConfig}
                disabled={savingConfig}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-semibold transition shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {savingConfig ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Changes
              </button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {services.map((service, index) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col transition hover:border-slate-300"
              >
                {/* Header ribbon with accent color */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: service.color || "#2563eb" }}
                />

                <div className="p-5 space-y-4 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Service Title
                      </label>
                      <input
                        value={service.name}
                        onChange={(e) =>
                          setServices((curr) =>
                            curr.map((item, i) => (i === index ? { ...item, name: e.target.value } : item))
                          )
                        }
                        placeholder="e.g. GST Filing Consultation"
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div className="w-36 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                        Meeting Mode
                      </label>
                      <select
                        value={service.meetingType}
                        onChange={(e) =>
                          setServices((curr) =>
                            curr.map((item, i) =>
                              i === index
                                ? { ...item, meetingType: e.target.value as BookingServiceConfig["meetingType"] }
                                : item
                            )
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 bg-white"
                      >
                        <option value="VIDEO">Video Call</option>
                        <option value="PHONE">Phone Call</option>
                        <option value="IN_PERSON">In Person</option>
                        <option value="CUSTOM_LINK">Custom Link</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Client Description
                    </label>
                    <textarea
                      value={service.description}
                      onChange={(e) =>
                        setServices((curr) =>
                          curr.map((item, i) => (i === index ? { ...item, description: e.target.value } : item))
                        )
                      }
                      rows={2}
                      placeholder="Brief overview visible to clients when selecting this consultation..."
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Location / Connection Info
                    </label>
                    <input
                      value={service.locationLabel}
                      onChange={(e) =>
                        setServices((curr) =>
                          curr.map((item, i) => (i === index ? { ...item, locationLabel: e.target.value } : item))
                        )
                      }
                      placeholder="e.g. Google Meet link shared after approval"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Timing Matrix */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2.5 text-center">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Duration</span>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={service.durationMinutes}
                          onChange={(e) =>
                            setServices((curr) =>
                              curr.map((item, i) =>
                                i === index ? { ...item, durationMinutes: Number(e.target.value) } : item
                              )
                            )
                          }
                          className="w-12 text-center font-bold text-sm text-slate-900 bg-white border border-slate-200 rounded py-0.5"
                        />
                        <span className="text-[11px] text-slate-500">min</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Interval</span>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={service.slotIntervalMinutes}
                          onChange={(e) =>
                            setServices((curr) =>
                              curr.map((item, i) =>
                                i === index ? { ...item, slotIntervalMinutes: Number(e.target.value) } : item
                              )
                            )
                          }
                          className="w-12 text-center font-bold text-sm text-slate-900 bg-white border border-slate-200 rounded py-0.5"
                        />
                        <span className="text-[11px] text-slate-500">min</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase block">Buffer After</span>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        <input
                          type="number"
                          value={service.bufferAfterMinutes}
                          onChange={(e) =>
                            setServices((curr) =>
                              curr.map((item, i) =>
                                i === index ? { ...item, bufferAfterMinutes: Number(e.target.value) } : item
                              )
                            )
                          }
                          className="w-12 text-center font-bold text-sm text-slate-900 bg-white border border-slate-200 rounded py-0.5"
                        />
                        <span className="text-[11px] text-slate-500">min</span>
                      </div>
                    </div>
                  </div>

                  {/* Reminder offsets */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                      Automated Reminder Offsets (Minutes before start)
                    </label>
                    <input
                      value={
                        reminderDrafts[service.id] !== undefined
                          ? reminderDrafts[service.id]
                          : reminderOffsetsToValue(service.reminderOffsetsMinutes)
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        setReminderDrafts((prev) => ({ ...prev, [service.id]: raw }));
                      }}
                      onBlur={() => {
                        const raw = reminderDrafts[service.id];
                        if (raw === undefined) return;
                        const parsed = parseReminderOffsets(raw);
                        setServices((curr) =>
                          curr.map((item, i) =>
                            i === index ? { ...item, reminderOffsetsMinutes: parsed } : item
                          )
                        );
                        setReminderDrafts((prev) => ({
                          ...prev,
                          [service.id]: reminderOffsetsToValue(parsed),
                        }));
                      }}
                      placeholder="1440, 120 (24h and 2h prior)"
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={service.isActive}
                      onChange={(e) =>
                        setServices((curr) =>
                          curr.map((item, i) => (i === index ? { ...item, isActive: e.target.checked } : item))
                        )
                      }
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4"
                    />
                    Active on Booking Page
                  </label>

                  <button
                    type="button"
                    onClick={() => setServices((curr) => curr.filter((_, i) => i !== index))}
                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-800 transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AVAILABILITY RULES & POLICIES */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Weekly Schedule & Policy Rules</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set regular office consultation hours, minimum advance notice, and public holiday dates.
              </p>
            </div>
            <button
              type="button"
              onClick={saveConfig}
              disabled={savingConfig}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-semibold transition shadow-xs disabled:opacity-60 cursor-pointer"
            >
              {savingConfig ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save All Rules
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Weekly Availability Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-900">Weekly Working Windows</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setAvailabilityRules((curr) => [...curr, createAvailabilityDraft(1)])}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Window
                </button>
              </div>

              <div className="space-y-2.5">
                {availabilityRules.map((rule, index) => (
                  <div
                    key={rule.id}
                    className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl border border-slate-200/70 bg-slate-50/40 text-xs"
                  >
                    <select
                      value={rule.weekday}
                      onChange={(e) =>
                        setAvailabilityRules((curr) =>
                          curr.map((item, i) => (i === index ? { ...item, weekday: Number(e.target.value) } : item))
                        )
                      }
                      className="w-28 rounded-lg border border-slate-200 px-2.5 py-1.5 font-semibold text-slate-800 bg-white"
                    >
                      {WEEKDAY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>

                    <span className="text-slate-400">from</span>
                    <input
                      type="time"
                      value={rule.startTime}
                      onChange={(e) =>
                        setAvailabilityRules((curr) =>
                          curr.map((item, i) => (i === index ? { ...item, startTime: e.target.value } : item))
                        )
                      }
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-medium text-slate-800 bg-white"
                    />

                    <span className="text-slate-400">to</span>
                    <input
                      type="time"
                      value={rule.endTime}
                      onChange={(e) =>
                        setAvailabilityRules((curr) =>
                          curr.map((item, i) => (i === index ? { ...item, endTime: e.target.value } : item))
                        )
                      }
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-medium text-slate-800 bg-white"
                    />

                    <div className="ml-auto flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.isActive}
                          onChange={(e) =>
                            setAvailabilityRules((curr) =>
                              curr.map((item, i) => (i === index ? { ...item, isActive: e.target.checked } : item))
                            )
                          }
                          className="rounded border-slate-300 text-slate-900"
                        />
                        Active
                      </label>
                      <button
                        type="button"
                        onClick={() => setAvailabilityRules((curr) => curr.filter((_, i) => i !== index))}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Policy Settings */}
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Sliders className="h-4 w-4 text-slate-500" />
                  <h3 className="text-sm font-bold text-slate-900">Booking Policies</h3>
                </div>

                <div className="grid gap-3.5 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                      Timezone
                    </label>
                    <input
                      value={bookingSettings.timezone}
                      onChange={(e) =>
                        setBookingSettings((curr) => (curr ? { ...curr, timezone: e.target.value } : curr))
                      }
                      placeholder="e.g. Asia/Kolkata"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                        Min Notice (Hours)
                      </label>
                      <input
                        type="number"
                        value={bookingSettings.minNoticeHours}
                        onChange={(e) =>
                          setBookingSettings((curr) =>
                            curr ? { ...curr, minNoticeHours: Number(e.target.value) } : curr
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                        Advance Window (Days)
                      </label>
                      <input
                        type="number"
                        value={bookingSettings.maxAdvanceDays}
                        onChange={(e) =>
                          setBookingSettings((curr) =>
                            curr ? { ...curr, maxAdvanceDays: Number(e.target.value) } : curr
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2.5 pt-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bookingSettings.autoConfirmNewBookings}
                      onChange={(e) =>
                        setBookingSettings((curr) =>
                          curr ? { ...curr, autoConfirmNewBookings: e.target.checked } : curr
                        )
                      }
                      className="rounded border-slate-300 text-slate-900"
                    />
                    Auto-confirm incoming website bookings immediately
                  </label>
                </div>
              </div>

              {/* Blocked Dates / Holiday Overrides */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-rose-500" />
                    <h3 className="text-sm font-bold text-slate-900">Blocked Holidays & Dates</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBlockedDates((curr) => [...curr, createBlockedDateDraft()])}
                    className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 hover:text-rose-800 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Holiday Block
                  </button>
                </div>

                <div className="space-y-2.5">
                  {blockedDates.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">No holiday dates currently blocked.</p>
                  ) : (
                    blockedDates.map((block, index) => (
                      <div
                        key={block.id}
                        className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/40 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="date"
                            value={block.date}
                            onChange={(e) =>
                              setBlockedDates((curr) =>
                                curr.map((item, i) => (i === index ? { ...item, date: e.target.value } : item))
                              )
                            }
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-slate-800 bg-white"
                          />
                          <input
                            type="text"
                            value={block.reason}
                            placeholder="Reason (e.g. Diwali, Office Maintenance)"
                            onChange={(e) =>
                              setBlockedDates((curr) =>
                                curr.map((item, i) => (i === index ? { ...item, reason: e.target.value } : item))
                              )
                            }
                            className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1 text-slate-800 bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => setBlockedDates((curr) => curr.filter((_, i) => i !== index))}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SLIDE-OVER DRAWER: APPOINTMENT INSPECTOR & MANAGEMENT */}
      {selectedAppointment && appointmentEditor && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200"
            onClick={closeAppointmentDrawer}
          />

          <section
            aria-label="Appointment Details"
            className="fixed inset-y-0 right-0 w-full sm:max-w-xl bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm ring-1 shrink-0 ${getAvatarColor(
                    selectedAppointment.name
                  )}`}
                >
                  {getInitials(selectedAppointment.name)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 truncate">
                      {selectedAppointment.name}
                    </h2>
                    {selectedAppointment.bookingReference && (
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-200/70 px-1.5 py-0.2 rounded font-semibold shrink-0">
                        {selectedAppointment.bookingReference}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {selectedAppointment.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeAppointmentDrawer}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition cursor-pointer"
                  title="Close inspector"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick Action Email Dispatch Strip */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-100/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <span className="text-xs text-slate-500 font-medium">Quick Email Actions:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void sendClientEmail("CONFIRMATION")}
                  disabled={sendingEmail !== null}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {sendingEmail === "CONFIRMATION" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  )}
                  Confirmation
                </button>
                <button
                  type="button"
                  onClick={() => void sendClientEmail("REMINDER")}
                  disabled={sendingEmail !== null}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {sendingEmail === "REMINDER" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <BellRing className="h-3 w-3 text-amber-600" />
                  )}
                  Reminder
                </button>
                <button
                  type="button"
                  onClick={() => void sendClientEmail("MEETING_LINK")}
                  disabled={sendingEmail !== null || !appointmentEditor.meetingLink}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 disabled:opacity-50 cursor-pointer shadow-2xs"
                >
                  {sendingEmail === "MEETING_LINK" ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Link2 className="h-3 w-3 text-indigo-600" />
                  )}
                  Share Link
                </button>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
              {/* Contact Information */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Telephone</span>
                  <a
                    href={`tel:${selectedAppointment.phone}`}
                    className="font-semibold text-slate-900 hover:text-indigo-600 flex items-center gap-1.5"
                  >
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {selectedAppointment.phone || "Not provided"}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Email Address</span>
                  <a
                    href={`mailto:${selectedAppointment.email}`}
                    className="font-semibold text-slate-900 hover:text-indigo-600 flex items-center gap-1.5"
                  >
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {selectedAppointment.email}
                  </a>
                </div>

                {selectedAppointment.message && (
                  <div className="pt-2.5 mt-2.5 border-t border-slate-200/70">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-1">
                      Client Booking Notes / Inquiry
                    </span>
                    <p className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200/60 leading-relaxed font-normal">
                      {selectedAppointment.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Consultation Setup */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Service Category
                  </label>
                  <select
                    value={appointmentEditor.serviceId}
                    onChange={(e) => updateAppointmentField("serviceId", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500 bg-white"
                  >
                    {services.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name} ({svc.durationMinutes} mins)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Session Date
                    </label>
                    <input
                      type="date"
                      value={appointmentEditor.date}
                      onChange={(e) => updateAppointmentField("date", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Status
                    </label>
                    <select
                      value={appointmentEditor.status}
                      onChange={(e) => updateAppointmentField("status", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500 bg-white font-semibold"
                    >
                      {STATUS_OPTIONS.filter((s) => s !== "ALL").map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Slot Selector */}
                <div className="rounded-xl border border-slate-200/90 p-3.5 bg-slate-50/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Available Time Slots for Selected Date
                    </span>
                    {slotsLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-0.5">
                    {slotOptions.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">
                        {slotsLoading ? "Calculating schedule..." : "No regular working hours slots on this date."}
                      </span>
                    ) : (
                      slotOptions.map((slot) => (
                        <button
                          key={`${slot.date}-${slot.startTime}`}
                          type="button"
                          onClick={() => updateAppointmentField("time", slot.startTime)}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                            appointmentEditor.time === slot.startTime
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {slot.label}
                        </button>
                      ))
                    )}
                  </div>

                  {!availableSlotValueSet.has(appointmentEditor.time) && appointmentEditor.time && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 font-medium">
                      Current slot: <strong>{formatTimeLabel(appointmentEditor.time)}</strong> (manual reservation outside standard availability rules).
                    </div>
                  )}
                </div>

                {/* Meeting Link input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Meeting Link (Google Meet / Zoom / MS Teams)
                    </label>
                    {appointmentEditor.meetingLink && (
                      <button
                        type="button"
                        onClick={() => copyMeetingLink(appointmentEditor.meetingLink)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedLink ? "Copied" : "Copy"}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="url"
                      value={appointmentEditor.meetingLink}
                      onChange={(e) => updateAppointmentField("meetingLink", e.target.value)}
                      placeholder="https://meet.google.com/xyz-abcd-efg"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500 pr-9"
                    />
                    {appointmentEditor.meetingLink && isSafeHttpUrl(appointmentEditor.meetingLink) && (
                      <a
                        href={appointmentEditor.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title="Open link"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Internal Admin Notes */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Internal Advisory Notes (Private to Admin)
                  </label>
                  <textarea
                    rows={3}
                    value={appointmentEditor.adminNotes}
                    onChange={(e) => updateAppointmentField("adminNotes", e.target.value)}
                    placeholder="Documents required, specific tax questions to prepare, follow-ups..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Cancellation Reason if Cancelled */}
                {appointmentEditor.status === "CANCELLED" && (
                  <div>
                    <label className="text-xs font-semibold text-rose-700 block mb-1.5">
                      Cancellation Reason
                    </label>
                    <textarea
                      rows={2}
                      value={appointmentEditor.cancellationReason}
                      onChange={(e) => updateAppointmentField("cancellationReason", e.target.value)}
                      placeholder="Reason for cancellation (included in client notice)..."
                      className="w-full rounded-xl border border-rose-200 px-3 py-2 text-xs sm:text-sm text-slate-800 outline-none focus:border-rose-500 resize-none bg-rose-50/20"
                    />
                  </div>
                )}
              </div>

              {/* Email Audit Log */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-xs space-y-2">
                <span className="font-semibold text-slate-700 block mb-1">Email Delivery Log</span>
                <div className="flex justify-between text-slate-500">
                  <span>Confirmation Email</span>
                  <span className="font-medium text-slate-700">
                    {selectedAppointment.confirmationSentAt
                      ? new Date(selectedAppointment.confirmationSentAt).toLocaleString()
                      : "Not sent"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Last Reminder Dispatched</span>
                  <span className="font-medium text-slate-700">
                    {selectedAppointment.reminderSentAt
                      ? new Date(selectedAppointment.reminderSentAt).toLocaleString()
                      : "None"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Meeting Link Notification</span>
                  <span className="font-medium text-slate-700">
                    {selectedAppointment.meetingLinkSentAt
                      ? new Date(selectedAppointment.meetingLinkSentAt).toLocaleString()
                      : "Not shared via email"}
                  </span>
                </div>
              </div>
            </div>

            {/* Drawer Bottom Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-800 px-3 py-2 rounded-lg hover:bg-rose-50 transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeAppointmentDrawer}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={saveBooking}
                  disabled={savingBooking}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 text-xs font-semibold transition disabled:opacity-60 cursor-pointer shadow-xs"
                >
                  {savingBooking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Changes
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* MODAL: SCHEDULE NEW CONSULTATION */}
      {isNewBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Schedule New Consultation</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Book an in-person, telephone, or online tax advisory session.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewBookingModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewBooking} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Client Full Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={newBookingForm.name}
                  onChange={(e) => setNewBookingForm({ ...newBookingForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="client@domain.com"
                    value={newBookingForm.email}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={newBookingForm.phone}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Consultation Service
                </label>
                <select
                  value={newBookingForm.serviceId}
                  onChange={(e) => setNewBookingForm({ ...newBookingForm, serviceId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm outline-none focus:border-indigo-500 bg-white"
                >
                  {services.map((svc) => (
                    <option key={svc.id} value={svc.id}>
                      {svc.name} ({svc.durationMinutes} mins)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Date *</label>
                  <input
                    required
                    type="date"
                    value={newBookingForm.date}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Time (HH:mm) *</label>
                  <input
                    required
                    type="time"
                    value={newBookingForm.time}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, time: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm outline-none focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Status</label>
                  <select
                    value={newBookingForm.status}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm outline-none focus:border-indigo-500 bg-white font-medium"
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Meeting Link (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/..."
                    value={newBookingForm.meetingLink}
                    onChange={(e) => setNewBookingForm({ ...newBookingForm, meetingLink: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Admin Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes regarding client inquiry or advisory scope..."
                  value={newBookingForm.adminNotes}
                  onChange={(e) => setNewBookingForm({ ...newBookingForm, adminNotes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newBookingForm.notifyClient}
                  onChange={(e) => setNewBookingForm({ ...newBookingForm, notifyClient: e.target.checked })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-xs text-slate-600 font-medium">
                  Email appointment confirmation notice to client immediately
                </span>
              </label>

              <div className="pt-3 flex gap-2.5 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewBookingModalOpen(false)}
                  disabled={creatingBooking}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingBooking}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 text-xs font-semibold transition disabled:opacity-60 cursor-pointer shadow-xs"
                >
                  {creatingBooking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Schedule Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE APPOINTMENT CONFIRMATION */}
      {isDeleteDialogOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 mb-3.5">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Consultation?</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete the booking for{" "}
              <strong className="text-slate-900">{selectedAppointment.name}</strong> scheduled on{" "}
              <strong className="text-slate-900">
                {selectedAppointment.date.slice(0, 10)} at {selectedAppointment.time}
              </strong>
              ? This action is permanent and cannot be undone.
            </p>
            <div className="mt-5 flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={deletingBooking}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDeleteBooking()}
                disabled={deletingBooking}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-60"
              >
                {deletingBooking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
