"use client";

import { useEffect, useRef, useState } from "react";

export function VolunteerCount({ program }: { program?: string }) {
  const [count, setCount] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState(0);
  const displayedRef = useRef(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const query = program ? `?program=${encodeURIComponent(program)}` : "";
        const response = await fetch(`/api/volunteers/count${query}`, { cache: "no-store" });
        const data = (await response.json()) as { count?: number };
        if (active && response.ok && typeof data.count === "number") setCount(data.count);
      } catch {}
    };
    load();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 15_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [program]);
  useEffect(() => {
    if (count === null) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = displayedRef.current;
    if (reducedMotion || from === count) {
      displayedRef.current = count;
      setDisplayCount(count);
      return;
    }
    let frame = 0;
    const startedAt = performance.now();
    const duration = 900;
    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + (count - from) * eased);
      displayedRef.current = next;
      setDisplayCount(next);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [count]);
  return <><strong className="volunteer-count-number" aria-hidden="true">{count === null ? "—" : `${displayCount}+`}</strong><span className="sr-only" aria-live="polite">{count === null ? "Loading volunteer count" : `${count} or more volunteers`}</span></>;
}
