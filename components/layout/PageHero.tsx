import type { ReactNode } from "react";

interface PageHeroProps {
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  compact?: boolean;
  rightSlot?: ReactNode;
  bottomSlot?: ReactNode;
}

export default function PageHero({
  title,
  description,
  align = "center",
  compact = false,
  rightSlot,
  bottomSlot,
}: PageHeroProps) {
  const isCentered = align === "center" && !rightSlot;

  return (
    <section className="relative overflow-hidden bg-[var(--primary)] border-b border-white/10 text-white">
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute top-0 right-0 h-80 w-80 -translate-y-1/2 translate-x-1/4 rounded-full bg-[var(--accent)]/12 blur-[100px] pointer-events-none" />

      <div
        className={`container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 ${
          compact ? "py-9 sm:py-11 lg:py-12" : "py-10 sm:py-12 lg:py-14"
        }`}
      >
        <div
          className={
            isCentered
              ? "mx-auto max-w-3xl text-center"
              : "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
          }
        >
          <div className={isCentered ? "" : "max-w-2xl"}>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              {title}
            </h1>
            {description ? (
              <p
                className={`mt-3 text-sm sm:text-base text-white/80 leading-relaxed ${
                  isCentered ? "mx-auto max-w-2xl" : "max-w-xl"
                }`}
              >
                {description}
              </p>
            ) : null}
            {bottomSlot ? <div className="mt-6">{bottomSlot}</div> : null}
          </div>

          {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
        </div>
      </div>
    </section>
  );
}

