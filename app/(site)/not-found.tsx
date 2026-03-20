import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background-light)]">
      <h1 className="mb-4 text-4xl font-bold text-[var(--color-primary-light)]">
        404
      </h1>
      <p className="mb-8 text-[var(--color-text-secondary)]">
        Page not found
      </p>
      <Link
        href="/"
        className="rounded-lg bg-[var(--color-primary)] px-6 py-3 font-medium text-white hover:opacity-90"
      >
        Go back home
      </Link>
    </div>
  );
}
