"use client";

// ─── TechLocationsHydrator ────────────────────────────────
// Boots the Supabase-backed technician-location cache and its Realtime feed, so
// the desktop dispatch board shows live tech markers as their phones report in.
// Re-hydrates on focus/visibility as a safety net for missed Realtime events.
// No-ops gracefully when Supabase env vars are absent (localStorage-only mode).
// Renders nothing. Mounted once in the root layout, beside JobsHydrator.

import { useEffect } from "react";
import { hydrateTechLocations } from "@/lib/tech-tracking/data";

export default function TechLocationsHydrator() {
  useEffect(() => {
    void hydrateTechLocations();
    const onFocus = () => { void hydrateTechLocations(); };
    const onVisible = () => { if (document.visibilityState === "visible") void hydrateTechLocations(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
