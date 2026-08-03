"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

export interface CarouselSlide {
  readonly src: string;
  readonly alt: string;
  readonly title: string;
  readonly body: string;
}

const SLIDE_DURATION_MS = 6000;

/**
 * Pencil spec — the image + dots + caption block on the auth panel.
 *
 * Auto-advances, but pauses while the pointer or keyboard focus is inside it,
 * and doesn't animate at all for anyone who has asked for reduced motion.
 * Slides are crossfaded rather than unmounted so the panel height never jumps.
 */
export function AuthCarousel({
  slides,
  startIndex = 0,
}: {
  readonly slides: readonly CarouselSlide[];
  /** Which slide the panel opens on, so each auth screen leads with its own. */
  readonly startIndex?: number;
}) {
  const [active, setActive] = useState(startIndex % slides.length);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
  }, []);

  const next = useCallback(() => {
    setActive((index) => (index + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (paused || reducedMotion.current || slides.length <= 1) return;
    const timer = setInterval(next, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [paused, next, slides.length]);

  const current = slides[active];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="What you can do with Expensio"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="w-full space-y-6"
    >
      <div className="relative aspect-[400/320] w-full overflow-hidden rounded-lg bg-brand-1000/40">
        {slides.map((slide, index) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={index === active ? slide.alt : ""}
            fill
            sizes="(max-width: 1023px) 0px, 460px"
            priority={index === startIndex}
            aria-hidden={index !== active}
            className={cn(
              "object-cover transition-opacity duration-700 motion-reduce:transition-none",
              index === active ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-2.5">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Show slide ${index + 1}: ${slide.title}`}
            aria-current={index === active}
            className={cn(
              "size-2.5 rounded-pill transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-900",
              index === active
                ? "w-6 bg-white"
                : "bg-white/40 hover:bg-white/60",
            )}
          />
        ))}
      </div>

      {/* aria-live so the caption change is announced without moving focus. */}
      <div aria-live="polite" aria-atomic className="min-h-[104px] text-center">
        <h2 className="text-h2 font-semibold text-content-inverse">
          {current.title}
        </h2>
        <p className="mx-auto mt-2.5 max-w-[380px] text-body leading-relaxed text-white/70">
          {current.body}
        </p>
      </div>
    </section>
  );
}
