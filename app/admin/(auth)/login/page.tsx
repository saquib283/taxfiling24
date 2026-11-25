"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Loader2,
  Lock,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

const WORKSPACE_CAPABILITIES = [
  {
    icon: Users,
    title: "Client leads & quotation studio",
    description: "Manage inquiries, GST proposals, follow-ups, and WhatsApp conversations.",
  },
  {
    icon: CalendarClock,
    title: "Consultation scheduling",
    description: "Coordinate CA appointments, reminders, and meeting confirmations.",
  },
  {
    icon: FileSpreadsheet,
    title: "Compliance & publishing",
    description: "Update statutory deadlines, services, knowledge articles, and SEO metadata.",
  },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const [usernameInvalid, setUsernameInvalid] = useState(false);
  const [passwordInvalid, setPasswordInvalid] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const usernameDirtyRef = useRef(false);
  const passwordDirtyRef = useRef(false);
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "unconfigured") {
      setError(
        "Server authentication is not configured. Set JWT_SECRET in your environment before signing in."
      );
    }

    return () => {
      if (announceTimerRef.current) {
        clearTimeout(announceTimerRef.current);
      }
    };
  }, []);

  const announcePolite = (message: string) => {
    if (announceTimerRef.current) {
      clearTimeout(announceTimerRef.current);
    }
    setAnnouncement("");
    announceTimerRef.current = setTimeout(() => {
      setAnnouncement(message);
    }, 350);
  };

  const syncFieldValidation = (
    el: HTMLInputElement | null,
    setter: (invalid: boolean) => void,
    label: string,
    announce: boolean
  ) => {
    if (!el) return;
    const supportsUserInvalid =
      typeof CSS !== "undefined" && CSS.supports("selector(:user-invalid)");
    const isInvalid = supportsUserInvalid
      ? el.matches(":user-invalid")
      : !el.validity.valid;

    if (!supportsUserInvalid) {
      el.classList.toggle("user-invalid-fallback", isInvalid);
    }

    setter(isInvalid);
    if (isInvalid && announce) {
      announcePolite(`Error: ${label} is required.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    if (!form.checkValidity()) {
      const uInvalid = !usernameRef.current?.validity.valid;
      const pInvalid = !passwordRef.current?.validity.valid;
      setUsernameInvalid(uInvalid);
      setPasswordInvalid(pInvalid);
      if (usernameRef.current) {
        usernameRef.current.classList.toggle("user-invalid-fallback", uInvalid);
      }
      if (passwordRef.current) {
        passwordRef.current.classList.toggle("user-invalid-fallback", pInvalid);
      }
      if (uInvalid) {
        usernameRef.current?.focus();
      } else if (pInvalid) {
        passwordRef.current?.focus();
      }
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        const msg =
          data.error === "Invalid credentials"
            ? "Incorrect username or password. Check your credentials and try again."
            : data.error || "Sign-in failed. Verify your credentials and try again.";
        setError(msg);
        announcePolite(`Error: ${msg}`);
        passwordRef.current?.focus();
      }
    } catch {
      const msg = "Unable to reach the authentication server. Check your connection and try again.";
      setError(msg);
      announcePolite(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const iconSpring = prefersReducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, duration: 0.3, bounce: 0 };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] grid lg:grid-cols-12">
      {/* Screen-reader polite announcer */}
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {/* ─── Left Column: Architectural Brand Ledger Panel (Desktop) ─── */}
      <aside className="relative hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between overflow-hidden bg-[#0A2540] text-white p-12 xl:p-16 border-r border-slate-900/15">
        {/* Precision architectural ledger grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
        {/* Subtle top sovereign gold hairline */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#D4AF37] via-[#D4AF37]/60 to-transparent"
        />
        {/* Quiet radial vignette for depth */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 85% 15%, rgba(212, 175, 55, 0.10) 0%, transparent 48%), radial-gradient(circle at 10% 90%, rgba(7, 26, 46, 0.9) 0%, transparent 60%)",
          }}
        />

        {/* Top Bar: Brand Identity */}
        <div className="relative z-10 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-3 rounded-xl bg-white/95 px-3.5 py-2 shadow-sm transition-opacity hover:opacity-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D4AF37]"
          >
            <Image
              src="/brand-logo.png"
              alt="TaxFiling24"
              width={136}
              height={46}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D4AF37]"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span>Back to website</span>
          </Link>
        </div>

        {/* Center Editorial Copy & Structured Capabilities */}
        <div className="relative z-10 my-auto max-w-xl py-10">
          <div className="mb-5 h-px w-12 bg-[#D4AF37]" aria-hidden="true" />
          <h2 className="text-3xl xl:text-4xl font-semibold tracking-[-0.025em] leading-[1.15] text-white [text-wrap:balance]">
            Practice operations, built for statutory precision.
          </h2>
          <p className="mt-4 text-sm xl:text-[15px] leading-relaxed text-slate-300 max-w-md [text-wrap:pretty]">
            Centralize client advisory, compliance calendars, quotation proposals, and website publishing inside one controlled workspace.
          </p>

          <dl className="mt-10 divide-y divide-white/10 border-t border-b border-white/10">
            {WORKSPACE_CAPABILITIES.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-4 py-4">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[#D4AF37] ring-1 ring-white/10">
                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <div>
                    <dt className="text-sm font-semibold text-white">{item.title}</dt>
                    <dd className="mt-0.5 text-xs leading-relaxed text-slate-300/85">
                      {item.description}
                    </dd>
                  </div>
                </div>
              );
            })}
          </dl>
        </div>

        {/* Bottom Quiet Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
          <div className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.75} aria-hidden="true" />
            <span>Encrypted HTTP-only admin session</span>
          </div>
          <span className="tabular-nums">taxfiling24.com</span>
        </div>
      </aside>

      {/* ─── Right Column: Focused Sign-In Desk ─── */}
      <main
        id="main"
        className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between px-5 py-8 sm:px-10 lg:px-12 xl:px-16"
      >
        {/* Mobile Header (compact so keyboard never obscures Sign in button) */}
        <div className="flex items-center justify-between lg:hidden mb-6">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/brand-logo.png"
              alt="TaxFiling24"
              width={132}
              height={44}
              priority
              className="h-8 w-auto object-contain"
            />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-[#0A2540] transition-colors py-2 px-2.5 rounded-lg"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span>Website</span>
          </Link>
        </div>

        {/* Form Container */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
          className="w-full max-w-[400px] mx-auto my-auto"
        >
          <div className="mb-8">
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-[-0.025em] text-[#0F172A] [text-wrap:balance]">
              Sign in to Admin Desk
            </h1>
            <p className="mt-2 text-sm text-[#475569] leading-relaxed [text-wrap:pretty]">
              Enter your TaxFiling24 staff credentials to access content, bookings, and client CRM.
            </p>
          </div>

          <AnimatePresence initial={false}>
            {error && (
              <motion.div
                key="auth-error"
                role="alert"
                initial={prefersReducedMotion ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                <AlertCircle
                  className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <span className="leading-snug">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Username Field */}
            <div className="auth-field">
              <label
                htmlFor="admin-username"
                className="block text-sm font-medium text-[#0F172A] mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <input
                  ref={usernameRef}
                  id="admin-username"
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  value={username}
                  aria-invalid={usernameInvalid ? "true" : "false"}
                  aria-describedby={usernameInvalid ? "admin-username-error" : undefined}
                  onChange={(e) => {
                    usernameDirtyRef.current = true;
                    setUsername(e.target.value);
                    if (error) setError("");
                    if (usernameInvalid) {
                      syncFieldValidation(e.currentTarget, setUsernameInvalid, "Username", false);
                    }
                  }}
                  onBlur={(e) => {
                    if (!usernameDirtyRef.current) return;
                    syncFieldValidation(e.currentTarget, setUsernameInvalid, "Username", true);
                  }}
                  onInvalid={() => {
                    setUsernameInvalid(true);
                  }}
                  placeholder="Enter your username"
                  className="auth-input block w-full h-11 rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-[#0F172A] placeholder:text-slate-400 shadow-[0_1px_2px_rgba(10,37,64,0.04)] transition-[border-color,background-color,box-shadow] duration-150 hover:border-slate-400 focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0A2540]"
                />
              </div>
              <p
                id="admin-username-error"
                className={`auth-field-error mt-1.5 items-center gap-1.5 text-xs font-medium text-red-700 ${
                  usernameInvalid ? "flex" : "hidden"
                }`}
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                <span>Enter your admin username to continue.</span>
              </p>
            </div>

            {/* Password Field */}
            <div className="auth-field">
              <label
                htmlFor="admin-password"
                className="block text-sm font-medium text-[#0F172A] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <input
                  ref={passwordRef}
                  id="admin-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  enterKeyHint="done"
                  value={password}
                  aria-invalid={passwordInvalid ? "true" : "false"}
                  aria-describedby={passwordInvalid ? "admin-password-error" : undefined}
                  onChange={(e) => {
                    passwordDirtyRef.current = true;
                    setPassword(e.target.value);
                    if (error) setError("");
                    if (passwordInvalid) {
                      syncFieldValidation(e.currentTarget, setPasswordInvalid, "Password", false);
                    }
                  }}
                  onBlur={(e) => {
                    if (!passwordDirtyRef.current) return;
                    syncFieldValidation(e.currentTarget, setPasswordInvalid, "Password", true);
                  }}
                  onInvalid={() => {
                    setPasswordInvalid(true);
                  }}
                  placeholder="Enter your password"
                  className="auth-input block w-full h-11 rounded-xl border border-slate-300 bg-white pl-10 pr-12 text-sm text-[#0F172A] placeholder:text-slate-400 shadow-[0_1px_2px_rgba(10,37,64,0.04)] transition-[border-color,background-color,box-shadow] duration-150 hover:border-slate-400 focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0A2540]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-colors duration-150 hover:bg-slate-100 hover:text-[#0A2540] focus-visible:outline-2 focus-visible:outline-[#0A2540] cursor-pointer"
                >
                  <AnimatePresence initial={false} mode="wait">
                    {showPassword ? (
                      <motion.span
                        key="eye-off"
                        initial={
                          prefersReducedMotion
                            ? false
                            : { opacity: 0, scale: 0.25, filter: "blur(4px)" }
                        }
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={
                          prefersReducedMotion
                            ? undefined
                            : { opacity: 0, scale: 0.25, filter: "blur(4px)" }
                        }
                        transition={iconSpring}
                        className="inline-flex"
                      >
                        <EyeOff className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="eye"
                        initial={
                          prefersReducedMotion
                            ? false
                            : { opacity: 0, scale: 0.25, filter: "blur(4px)" }
                        }
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        exit={
                          prefersReducedMotion
                            ? undefined
                            : { opacity: 0, scale: 0.25, filter: "blur(4px)" }
                        }
                        transition={iconSpring}
                        className="inline-flex"
                      >
                        <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
              <p
                id="admin-password-error"
                className={`auth-field-error mt-1.5 items-center gap-1.5 text-xs font-medium text-red-700 ${
                  passwordInvalid ? "flex" : "hidden"
                }`}
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
                <span>Enter your password to sign in.</span>
              </p>
            </div>

            {/* Primary Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-[#0A2540] px-5 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(10,37,64,0.16),0_1px_2px_rgba(10,37,64,0.10)] transition-[background-color,transform,box-shadow] duration-150 hover:bg-[#11345E] hover:shadow-[0_8px_20px_-4px_rgba(10,37,64,0.24)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A2540] disabled:opacity-60 disabled:pointer-events-none cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden="true" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </div>
          </form>

          {/* Calm Access Notice */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 flex items-center justify-between gap-4 text-xs text-slate-500">
            <span>Authorized TaxFiling24 staff only.</span>
            <Link
              href="/contact"
              className="font-medium text-[#0A2540] hover:underline underline-offset-4 shrink-0"
            >
              Need help?
            </Link>
          </div>
        </motion.div>

        {/* Bottom Copyright (subtle, aligned cleanly) */}
        <p className="mt-8 text-center lg:text-left text-xs text-slate-400 max-w-[400px] mx-auto w-full">
          © {new Date().getFullYear()} TaxFiling24. All access is logged for security.
        </p>
      </main>
    </div>
  );
}
