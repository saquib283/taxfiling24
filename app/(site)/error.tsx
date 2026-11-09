"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if available
    console.error("Site Application Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[var(--bg)] px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600 mb-6 border border-red-100">
        <AlertCircle className="h-8 w-8" />
      </div>

      <h1 className="text-3xl font-black tracking-tight text-[var(--fg)] sm:text-4xl">
        Something went wrong
      </h1>
      
      <p className="mt-3 max-w-md text-sm text-[var(--fg-muted)] leading-relaxed">
        An unexpected error occurred while loading this page. Our team has been notified. 
        Please try refreshing the page or navigating back to the home page.
      </p>

      {error.digest && (
        <p className="mt-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
          Error ID: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-[var(--fg)] shadow-sm hover:bg-slate-50 transition-all active:scale-95"
        >
          <Home className="h-4 w-4" />
          Go Back Home
        </Link>
      </div>
    </div>
  );
}
