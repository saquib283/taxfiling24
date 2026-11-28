"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  MessageSquare,
  CheckCircle2,
  Loader2,
  Sparkles,
  AlertCircle,
  Video,
  ShieldCheck,
  Award,
  Link2,
  Copy,
} from "lucide-react";
import { getMeetingTypeLabel, type BookingServiceConfig, type BookingSettings } from "@/lib/booking";

type SlotOption = {
  date: string;
  label: string;
  startTime: string;
};

type AvailabilityResponse = {
  availableSlots?: SlotOption[];
  error?: string;
  selectedServiceId?: string;
  services?: BookingServiceConfig[];
  settings?: BookingSettings | null;
};

export default function ConsultationBookingClient() {
  const [loading, setLoading] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    date: string;
    reference: string;
    service: string;
    time: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [services, setServices] = useState<BookingServiceConfig[]>([]);
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    message: "",
    name: "",
    phone: "",
  });

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) || null,
    [selectedServiceId, services]
  );
  const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const validateForm = () => {
    if (!formData.name.trim()) return "Full name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) return "Valid email address is required";
    if (formData.phone.replace(/\D/g, "").length < 10) return "Valid phone number (min 10 digits) is required";
    if (!selectedDate) return "Please choose a preferred consultation date";
    if (!selectedSlot) return "Please select a time slot";
    return null;
  };

  const fetchAvailability = async (serviceId: string, dateKey: string) => {
    if (!dateKey) {
      setSlots([]);
      setSelectedSlot(null);
      return;
    }

    setLoadingAvailability(true);
    try {
      const response = await fetch(`/api/appointments?date=${dateKey}&serviceId=${serviceId}`);
      const data = (await response.json()) as AvailabilityResponse;

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch available slots.");
      }

      setSlots(Array.isArray(data.availableSlots) ? data.availableSlots : []);
      setSelectedSlot((current) => {
        if (!current) return null;
        return data.availableSlots?.find((slot: SlotOption) => slot.startTime === current.startTime) || null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch available slots.");
      setSlots([]);
      setSelectedSlot(null);
    } finally {
      setLoadingAvailability(false);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const nextDate = new Date();
      const dateKey = format(nextDate, "yyyy-MM-dd");
      setLoadingAvailability(true);

      try {
        const response = await fetch(`/api/appointments?date=${dateKey}`);
        const data = (await response.json()) as AvailabilityResponse;

        if (!response.ok) {
          throw new Error(data.error || "Failed to load booking services.");
        }

        const nextServices = Array.isArray(data.services) ? data.services : [];
        setServices(nextServices);
        setBookingSettings(data.settings || null);
        setSelectedDate(nextDate);

        const initialService = nextServices[0];
        if (initialService) {
          setSelectedServiceId(initialService.id);
        }
        setSlots(Array.isArray(data.availableSlots) ? data.availableSlots : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize booking.");
      } finally {
        setLoadingAvailability(false);
      }
    };

    void initialize();
  }, []);

  useEffect(() => {
    if (!selectedDateKey || !selectedServiceId) return;
    void fetchAvailability(selectedServiceId, selectedDateKey);
  }, [selectedDateKey, selectedServiceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const payload = {
        customerTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        date: selectedDateKey,
        email: formData.email.trim(),
        message: formData.message.trim(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        service: selectedService?.name || "Consultation",
        serviceId: selectedServiceId,
        time: selectedSlot?.startTime || "",
      };

      const res = await fetch("/api/appointments", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setBookingReference(data.bookingReference || null);
        setConfirmedBooking({
          date: selectedDateKey,
          reference: data.bookingReference || "Confirmed",
          service: selectedService?.name || "Consultation",
          time: selectedSlot?.label || selectedSlot?.startTime || "",
        });
        setFormData({ email: "", message: "", name: "", phone: "" });
        setSelectedSlot(null);
      } else {
        setError(data.error || "Failed to schedule appointment");
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError("An unexpected error occurred. Please try again or reach out directly.");
    } finally {
      setLoading(false);
    }
  };

  const copyRef = () => {
    if (!confirmedBooking?.reference) return;
    void navigator.clipboard.writeText(confirmedBooking.reference);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (success && confirmedBooking) {
    return (
      <div className="rounded-[var(--radius-xl)] border border-emerald-200/80 bg-[var(--bg-card)] p-8 md:p-12 shadow-[var(--shadow-lg)] text-center max-w-2xl mx-auto">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <span className="inline-block rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
          Booking Confirmed
        </span>
        <h2 className="mt-3 text-2xl font-black text-[var(--fg)] md:text-3xl">
          Your Consultation is Reserved!
        </h2>
        <p className="mt-2 text-sm text-[var(--fg-muted)] leading-relaxed max-w-md mx-auto">
          We have registered your session. Our advisory desk has sent a confirmation email with calendar and joining details.
        </p>

        <div className="mt-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] p-6 text-left space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">Reference ID</span>
            <button
              type="button"
              onClick={copyRef}
              className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-[var(--primary)] hover:text-[var(--primary-hover)]"
            >
              <span>{confirmedBooking.reference}</span>
              <Copy className="h-3.5 w-3.5" />
              {copied && <span className="text-xs font-normal text-emerald-700">Copied!</span>}
            </button>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--fg-muted)]">Service:</span>
            <span className="font-semibold text-[var(--fg)]">{confirmedBooking.service}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--fg-muted)]">Date & Slot:</span>
            <span className="font-semibold text-[var(--fg)]">
              {confirmedBooking.date} at {confirmedBooking.time}
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg-card)] px-6 py-3.5 text-sm font-semibold text-[var(--fg-soft)] hover:bg-[var(--bg)] transition shadow-sm"
          >
            Book Another Session
          </button>
          <a
            href="/"
            className="rounded-[var(--radius)] bg-[var(--primary)] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[var(--primary-hover)] transition shadow-sm text-center"
          >
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr] items-start">
      {/* Left Column: Interactive Booking Form */}
      <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-10 shadow-[var(--shadow-lg)]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--fg)] sm:text-3xl">
            Select Your Consultation Slot
          </h2>
          <p className="mt-1.5 text-sm text-[var(--fg-muted)]">
            Choose your service and an available time slot. Our advisory team will connect directly with you.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-[var(--radius)] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
              1. Choose Service
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {services.map((service) => {
                const isSelected = selectedServiceId === service.id;
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(service.id);
                      setSelectedSlot(null);
                      if (error) setError(null);
                    }}
                    className={`rounded-[var(--radius)] border p-4 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-sm ring-1 ring-[var(--primary)]"
                        : "border-[var(--border)] bg-[var(--bg-card)] hover:border-[var(--primary-border)] hover:bg-[var(--bg)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[var(--fg)]">{service.name}</span>
                      <span className="text-[11px] font-bold text-[var(--fg-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-full shrink-0">
                        {service.durationMinutes}m
                      </span>
                    </div>
                    {service.description && (
                      <p className="mt-1 text-xs text-[var(--fg-muted)] line-clamp-2">{service.description}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
              2. Select Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--fg-muted)] z-[1] pointer-events-none" />
              <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => {
                  setSelectedDate(date);
                  setSelectedSlot(null);
                  if (error) setError(null);
                }}
                minDate={new Date()}
                placeholderText="Select Date"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] pl-12 pr-4 py-3.5 text-sm font-medium text-[var(--fg)] outline-none focus:border-[var(--primary)] focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[var(--primary)]/10 transition"
                dateFormat="EEEE, MMMM d, yyyy"
              />
            </div>
          </div>

          {/* Slot Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                3. Choose Time Slot
              </label>
              {loadingAvailability && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--fg-muted)] font-medium">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Updating slots...
                </div>
              )}
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg)] p-4">
              {slots.length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--fg-muted)]">
                  {loadingAvailability
                    ? "Checking consultant availability..."
                    : "No slots available on this date. Please select another day."}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={`${slot.date}-${slot.startTime}`}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot);
                          if (error) setError(null);
                        }}
                        className={`rounded-[var(--radius)] px-3.5 py-3 text-sm font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[var(--primary)] text-white shadow-[var(--shadow-md)] scale-[1.02]"
                            : "bg-[var(--bg-card)] text-[var(--fg-soft)] border border-[var(--border)] hover:border-[var(--primary-border)] hover:bg-[var(--bg)]"
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)] mb-2">
              4. Your Contact Details
            </label>
            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-muted)]" />
                <input
                  required
                  type="text"
                  placeholder="Full Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] pl-11 pr-4 py-3.5 text-sm text-[var(--fg)] outline-none focus:border-[var(--primary)] focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[var(--primary)]/10 transition"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-muted)]" />
                  <input
                    required
                    type="email"
                    placeholder="Email Address *"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] pl-11 pr-4 py-3.5 text-sm text-[var(--fg)] outline-none focus:border-[var(--primary)] focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[var(--primary)]/10 transition"
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-muted)]" />
                  <input
                    required
                    type="tel"
                    placeholder="Phone Number (10 digits) *"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] pl-11 pr-4 py-3.5 text-sm text-[var(--fg)] outline-none focus:border-[var(--primary)] focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[var(--primary)]/10 transition"
                  />
                </div>
              </div>

              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 h-4 w-4 text-[var(--fg-muted)]" />
                <textarea
                  placeholder="Briefly describe what you would like to discuss (optional)..."
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--bg)] pl-11 pr-4 py-3 text-sm text-[var(--fg)] outline-none focus:border-[var(--primary)] focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[var(--primary)]/10 transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[var(--radius)] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold py-4 text-sm transition-all shadow-[var(--shadow-md)] flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                Confirm & Reserve Slot
                <Sparkles className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Column: Advisory Highlights & Reassurance */}
      <div className="space-y-6">
        {/* Selected Booking Summary Card */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-[var(--shadow-md)]">
          <h3 className="text-base font-bold text-[var(--fg)] flex items-center gap-2">
            <Clock className="h-4 w-4 text-[var(--primary)]" />
            Booking Summary
          </h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--fg-muted)]">Service:</span>
              <span className="font-semibold text-[var(--fg)]">
                {selectedService?.name || "Please choose a service"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--fg-muted)]">Meeting Format:</span>
              <span className="font-semibold text-[var(--fg)] flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-[var(--primary)]" />
                {selectedService ? getMeetingTypeLabel(selectedService.meetingType) : "Video Conference"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--fg-muted)]">Date:</span>
              <span className="font-semibold text-[var(--fg)]">
                {selectedDateKey || "Not chosen"}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-[var(--border)]">
              <span className="text-[var(--fg-muted)]">Time:</span>
              <span className="font-semibold text-[var(--fg)]">
                {selectedSlot?.label || "Select an available slot"}
              </span>
            </div>
            {selectedService?.locationLabel && (
              <div className="py-2 text-xs text-[var(--fg-muted)] flex items-start gap-1.5">
                <Link2 className="h-3.5 w-3.5 shrink-0 text-[var(--fg-muted)] mt-0.5" />
                <span>{selectedService.locationLabel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Guarantees Box */}
        <div className="rounded-[var(--radius-xl)] border border-white/10 bg-[var(--primary)] text-white p-6 sm:p-8 shadow-[var(--shadow-md)]">
          <h3 className="text-base font-bold tracking-tight text-white mb-4">
            Why Consult With TaxFiling24?
          </h3>
          <ul className="space-y-4 text-sm text-white/80">
            <li className="flex items-start gap-3">
              <Award className="h-5 w-5 text-[var(--accent)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Certified Professionals</strong>
                Direct 1-on-1 access to qualified CAs, CSs, and tax advocates with deep corporate and individual filing expertise.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-[var(--accent)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">100% Strict Confidentiality</strong>
                All financial details, PAN records, and corporate data are protected with end-to-end security.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-[var(--accent)] shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block">Actionable Roadmaps</strong>
                Get instant clarity on tax savings, compliance deadlines, GST filings, and business legal structures.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

