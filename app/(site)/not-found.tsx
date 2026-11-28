import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[var(--bg)] text-center px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-4 text-6xl font-black text-[var(--primary)] tracking-tight">
        404
      </h1>
      <h2 className="mb-4 text-2xl font-bold text-[var(--fg)]">
        Page Not Found
      </h2>
      <p className="mb-8 max-w-md text-sm text-[var(--fg-muted)] leading-relaxed">
        The page you are looking for does not exist or has been moved. 
        Please verify the URL or return to the home page.
      </p>
      <Link
        href="/"
        className="rounded-[var(--radius)] bg-[var(--primary)] px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-[var(--shadow-md)] hover:bg-[var(--primary-hover)] transition-all active:scale-95 cursor-pointer"
      >
        Go back home
      </Link>
    </div>
  );
}
