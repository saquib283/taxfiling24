"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, User, Mail, Phone, MessageSquare, CheckCircle2, Loader2, Sparkles, AlertCircle, Video, Link2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { getMeetingTypeLabel, type BookingServiceConfig, type BookingSettings } from "@/lib/booking";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultService?: string;
}

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

export default function BookingModal({ isOpen, onClose, defaultService }: BookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [services, setServices] = useState<BookingServiceConfig[]>([]);
  const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) || null,
    [selectedServiceId, services]
  );
  const selectedDateKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Invalid email address";
    if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) return "Invalid phone number (min 10 digits)";
    if (!selectedDate) return "Please select a date";
    if (!selectedSlot) return "Please select a slot";
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
    if (!isOpen) return;

    const initialize = async () => {
      const nextDate = new Date();
      const dateKey = format(nextDate, "yyyy-MM-dd");
      setSuccess(false);
      setBookingReference(null);
      setError(null);
      setSelectedSlot(null);
      setLoadingAvailability(true);

      try {
        const response = await fetch(`/api/appointments?date=${dateKey}`);
        const data = (await response.json()) as AvailabilityResponse;

        if (!response.ok) {
          throw new Error(data.error || "Failed to load booking options.");
        }

        const nextServices = Array.isArray(data.services) ? data.services : [];
        setServices(nextServices);
        setBookingSettings(data.settings || null);
        setSelectedDate(nextDate);

        const preferredService =
          nextServices.find((service) => service.name === defaultService) ||
          nextServices.find((service) => service.id === data.selectedServiceId) ||
          nextServices[0];

        const nextServiceId = preferredService?.id || "";
        setSelectedServiceId(nextServiceId);
        setSlots(Array.isArray(data.availableSlots) && nextServiceId === data.selectedServiceId ? data.availableSlots : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load booking options.");
      } finally {
        setLoadingAvailability(false);
      }
    };

    void initialize();
  }, [defaultService, isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedDateKey || !selectedServiceId) {
      return;
    }

    void fetchAvailability(selectedServiceId, selectedDateKey);
  }, [isOpen, selectedDateKey, selectedServiceId]);

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
        ...formData,
        customerTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        date: selectedDateKey,
        service: selectedService?.name || "",
        serviceId: selectedServiceId,
        time: selectedSlot?.startTime || "",
      };

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setBookingReference(data.bookingReference || null);
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: ""
        });
        setSelectedSlot(null);
      } else {
        setError(data.error || "Failed to schedule appointment");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-0"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-[var(--bg-card)] rounded-[var(--radius-xl)] sm:rounded-[var(--radius-2xl)] shadow-[var(--shadow-lg)] overflow-hidden border border-[var(--border)] z-10 my-auto"
        >
          <style>{`
            .react-datepicker-wrapper { width: 100%; }
            .react-datepicker {
              font-family: inherit;
              border: 1px solid var(--border) !important;
              border-radius: 1rem !important;
              overflow: hidden;
              box-shadow: var(--shadow-lg) !important;
              background-color: var(--bg-card) !important;
            }
            .react-datepicker__header {
              background-color: var(--bg-muted) !important;
              border-bottom: 1px solid var(--border) !important;
              padding-top: 1rem !important;
            }
            .react-datepicker__current-month, .react-datepicker__day-name {
              color: var(--fg) !important;
            }
            .react-datepicker__day {
              color: var(--fg) !important;
            }
            .react-datepicker__day--selected, 
            .react-datepicker__day--keyboard-selected {
              background-color: var(--primary) !important;
              color: white !important;
              border-radius: 0.5rem !important;
            }
            .react-datepicker__day:hover {
              background-color: var(--accent-soft) !important;
              color: var(--primary) !important;
              border-radius: 0.5rem !important;
            }
            .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li:hover {
              background-color: var(--accent-soft) !important;
              color: var(--primary) !important;
            }
            .react-datepicker__time-list-item--selected {
              background-color: var(--primary) !important;
              color: white !important;
            }
            .react-datepicker__input-container input {
               width: 100%;
            }
          `}</style>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full bg-[var(--bg-muted)] text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--border)] transition-all z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {!success ? (
            <div className="p-6 sm:p-10">
              <div className="mb-6 sm:mb-8">
                <div className="inline-flex items-center gap-2 bg-[var(--accent-soft)] text-[var(--primary)] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3 shadow-sm border border-[var(--accent-light)]/20">
                  <Calendar className="h-3 w-3" />
                  Schedule Consultation
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--fg)] tracking-tight">
                  Book Your <span className="text-[var(--primary)]">Expert Session</span>
                </h2>
                <p className="text-[var(--fg-muted)] text-sm mt-1">Select a convenient time for your financial consultation.</p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--fg-muted)] ml-1 uppercase tracking-wide">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-soft)] z-[1]" />
                      <input
                        required
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="MD REHAN"
                        className="w-full pl-10 pr-4 py-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl sm:rounded-2xl text-sm text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all placeholder:text-[var(--fg-soft)]/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--fg-muted)] ml-1 uppercase tracking-wide">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-soft)] z-[1]" />
                      <input
                        required
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="mdray283@gmail.com"
                        className="w-full pl-10 pr-4 py-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl sm:rounded-2xl text-sm text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all placeholder:text-[var(--fg-soft)]/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--fg-muted)] ml-1 uppercase tracking-wide">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-soft)] z-[1]" />
                      <input
                        required
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 9162712267"
                        className="w-full pl-10 pr-4 py-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl sm:rounded-2xl text-sm text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all placeholder:text-[var(--fg-soft)]/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--fg-muted)] ml-1 uppercase tracking-wide">Select Service</label>
                    <div className="relative">
                      <select
                        value={selectedServiceId}
                        onChange={(e) => { setSelectedServiceId(e.target.value); setSelectedSlot(null); if (error) setError(null); }}
                        className="w-full px-4 py-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl sm:rounded-2xl text-sm text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all appearance-none cursor-pointer"
                      >
                        {services.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--fg-soft)]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--fg-muted)] ml-1 uppercase tracking-wide">Preferred Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--fg-soft)] z-[1]" />
                      <DatePicker
                        selected={selectedDate}
                        onChange={(date: Date | null) => { setSelectedDate(date); setSelectedSlot(null); if (error) setError(null); }}
                        minDate={new Date()}
                        placeholderText="Select Date"
                        className="w-full pl-10 pr-4 py-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl sm:rounded-2xl text-sm text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all"
                        dateFormat="dd/MM/yyyy"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--fg-muted)] ml-1 uppercase tracking-wide">Meeting Summary</label>
                    <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] px-4 py-3 text-sm text-[var(--fg-muted)]">
                      <div className="flex items-center gap-2 text-[var(--fg)] font-semibold">
                        <Video className="h-4 w-4 text-[var(--primary)]" />
                        {selectedService ? getMeetingTypeLabel(selectedService.meetingType) : "Select a service"}
                      </div>
                      <div className="mt-2 text-xs leading-relaxed">
                        {selectedService?.description || bookingSettings?.bookingWindowLabel || "Choose a service and date to see slots."}
                      </div>
                      {selectedService?.locationLabel ? (
                        <div className="mt-2 flex items-start gap-2 text-xs">
                          <Link2 className="h-3.5 w-3.5 mt-0.5 text-[var(--primary)]" />
                          {selectedService.locationLabel}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-[var(--fg-muted)] ml-1 uppercase tracking-wide">Available Slots</label>
                    {loadingAvailability ? <Loader2 className="h-4 w-4 animate-spin text-[var(--fg-soft)]" /> : null}
                  </div>
                  <div className="rounded-xl sm:rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] p-3">
                    {slots.length === 0 ? (
                      <div className="px-2 py-3 text-sm text-[var(--fg-muted)]">
                        No slots available for the selected date. Try another day.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {slots.map((slot) => (
                          <button
                            key={`${slot.date}-${slot.startTime}`}
                            type="button"
                            onClick={() => { setSelectedSlot(slot); if (error) setError(null); }}
                            className={`rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
                              selectedSlot?.startTime === slot.startTime
                                ? "bg-[var(--primary)] text-white shadow-[var(--shadow-md)]"
                                : "bg-white text-[var(--fg)] hover:bg-[var(--accent-soft)] hover:text-[var(--primary)] border border-[var(--border)]"
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--fg-muted)] ml-1 uppercase tracking-wide">Message (Optional)</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3.5 top-3.5 h-4 w-4 text-[var(--fg-soft)]" />
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Briefly describe your requirement..."
                      rows={2}
                      className="w-full pl-10 pr-4 py-3 bg-[var(--bg-muted)] border border-[var(--border)] rounded-xl sm:rounded-2xl text-sm text-[var(--fg)] focus:ring-2 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] outline-none transition-all resize-none placeholder:text-[var(--fg-soft)]/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold py-4 rounded-xl sm:rounded-2xl shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] transition-all flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Confirm Appointment
                      <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-emerald-100">
                <CheckCircle2 className="h-8 w-8 sm:h-10 sm:h-10 text-emerald-500" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--fg)] mb-2">Appointment Secured!</h2>
              <p className="text-[var(--fg-muted)] text-sm mb-8 leading-relaxed">
                {bookingReference
                  ? `Our team has received your booking request. Reference: ${bookingReference}.`
                  : "Our team has received your request and will contact you shortly to confirm the details."}
              </p>
              <button
                onClick={onClose}
                className="w-full bg-[var(--fg)] text-[var(--bg-card)] font-bold py-4 rounded-xl sm:rounded-2xl hover:opacity-90 transition-all shadow-[var(--shadow-md)]"
              >
                Close Window
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
