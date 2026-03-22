"use client";

import { useState, useEffect } from "react";
import { Star, Quote } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";

export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setReviews(data.filter((r: any) => r.isApproved));
        }
      })
      .catch(() => {});
  }, []);

  if (reviews.length === 0) return null;

  // Duplicate for smooth infinite scrolling (need enough items to fill screen multiple times)
  const duplicatedReviews = [...reviews, ...reviews, ...reviews, ...reviews, ...reviews, ...reviews];

  return (
    <section className="relative overflow-hidden border-t border-[var(--border)] bg-[var(--bg-muted)]/30 py-16 lg:py-24">
      {/* Ambient background glows */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_bottom_left,var(--accent-soft),transparent_50%)] opacity-70" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,var(--accent-soft),transparent_50%)] opacity-70" />

      {/* Embedded CSS for infinite marquee animation */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 0.75rem)); } 
        }
        .animate-marquee {
          animation: marquee 50s linear infinite;
          width: max-content;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="container mx-auto mb-16 px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--accent-light)]/20 bg-[var(--accent-soft)] px-5 py-2 text-xs font-bold tracking-wider text-[var(--primary)] uppercase shadow-sm">
            <Star className="h-4 w-4 fill-current text-[#f59e0b]" />
            Thousands of Happy Clients
          </span>
          <h2 className="mb-6 text-4xl font-extrabold tracking-tight text-[var(--fg)] sm:text-5xl lg:text-6xl">
            Don't Just Take Our Word For It
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[var(--fg-muted)]">
            We build <strong className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">long-term</strong> partnerships that drive your business forward with verified transparency and unmatched execution speeds.
          </p>
        </AnimatedSection>
      </div>

      <div 
        className="relative flex w-full overflow-hidden" 
        style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
      >
        <div className="animate-marquee flex gap-6 py-6 pl-6">
          {duplicatedReviews.map((review, i) => (
            <div
              key={i}
              className="group relative flex w-[320px] shrink-0 flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-white/70 p-8 shadow-[var(--shadow-sm)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/95 hover:shadow-[var(--shadow-lg)] sm:w-[420px] dark:bg-[var(--bg-card)]/50 dark:hover:bg-[var(--bg-card)]/80"
            >
              <Quote className="absolute -right-4 -top-4 h-32 w-32 text-[var(--primary)] opacity-[0.03] transition-transform duration-500 group-hover:scale-110 group-hover:opacity-[0.05]" />
              
              <div className="mb-6 flex gap-1.5 text-[#f59e0b]">
                {Array.from({ length: review.rating || 5 }).map((_, idx) => (
                  <Star key={idx} className="h-5 w-5 fill-current" />
                ))}
              </div>
              
              <p className="relative z-10 mb-8 flex-1 text-base italic leading-relaxed text-[var(--fg-muted)] sm:text-lg">
                "{review.content}"
              </p>
              
              <div className="relative z-10 flex items-center gap-4 border-t border-[var(--border)] pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-lg font-bold text-white shadow-md">
                  {review.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-base font-bold tracking-tight text-[var(--fg)]">{review.name}</h4>
                  {review.role && (
                    <p className="text-sm font-medium text-[var(--primary)] mt-0.5">{review.role}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
