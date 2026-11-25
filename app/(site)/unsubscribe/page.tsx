"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Mail, ShieldAlert, ArrowLeft, Loader2 } from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "resubscribed" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleUnsubscribe(targetEmail?: string) {
    const emailToUse = (targetEmail || email).trim();
    if (!emailToUse) {
      setStatus("error");
      setMessage("Please provide a valid email address.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToUse, token }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process request.");
      }

      setStatus("success");
      setMessage("You have been successfully removed from our email list.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function handleResubscribe() {
    if (!email.trim()) return;
    setStatus("loading");

    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), token, resubscribe: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resubscribe.");
      }

      setStatus("resubscribed");
      setMessage("You have been re-subscribed to TaxFiling24 updates!");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          {status === "success" ? (
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          ) : status === "resubscribed" ? (
            <CheckCircle2 className="h-7 w-7 text-blue-600" />
          ) : (
            <Mail className="h-7 w-7 text-slate-600" />
          )}
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {status === "success"
            ? "Unsubscribed"
            : status === "resubscribed"
            ? "Welcome Back!"
            : "Email Preferences"}
        </h1>

        <p className="mt-2 text-sm text-slate-500 leading-relaxed">
          {status === "success"
            ? message || "We've removed your email address from our marketing campaigns and newsletters."
            : status === "resubscribed"
            ? message || "Your subscription has been restored."
            : "Opt out of updates, tax compliance notifications, and newsletters from TaxFiling24."}
        </p>

        {status === "idle" || status === "loading" || status === "error" ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUnsubscribe();
            }}
            className="mt-6 space-y-4"
          >
            <div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none shadow-sm"
              />
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 text-left rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm px-4 py-3 transition active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating preferences...
                </>
              ) : initialEmail ? (
                "Confirm Unsubscribe"
              ) : (
                "Unsubscribe from Emails"
              )}
            </button>
          </form>
        ) : status === "success" ? (
          <div className="mt-6 space-y-4">
            <p className="text-xs text-slate-400">
              Unsubscribed by mistake? You can re-enable emails below.
            </p>
            <button
              onClick={handleResubscribe}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm px-4 py-2.5 transition active:scale-95 cursor-pointer shadow-sm"
            >
              Re-subscribe to Updates
            </button>
          </div>
        ) : null}

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to TaxFiling24 Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}

