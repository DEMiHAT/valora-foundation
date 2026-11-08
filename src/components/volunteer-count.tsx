"use client";

import { useEffect, useState } from "react";

export function VolunteerCount({ program }: { program?: string }) {
  const [count, setCount] = useState<number | null>(null);
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
  return <strong className="volunteer-count-number" aria-live="polite">{count === null ? "—" : `${count}+`}</strong>;
}
