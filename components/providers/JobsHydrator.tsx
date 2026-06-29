"use client";

// ─── JobsHydrator ─────────────────────────────────────────
// Boots the Supabase-backed jobs cache. On mount it hydrates jobs from Postgres
// (which also starts the Realtime subscription), and re-hydrates when the tab
// regains focus / becomes visible — a cheap safety net in case a Realtime event
// was missed while the tab was backgrounded. Renders nothing.
//
// Mounted once in the root layout so BOTH the desktop dashboard and the /mobile
// PWA share the same hydrated jobs. Other entities can add sibling hydrators as
// they move to Supabase.

import { useEffect } from "react";
import { hydrateJobs } from "@/lib/jobs/data";

export default function JobsHydrator() {
  useEffect(() => {
    void hydrateJobs();

    const onFocus = () => { void hydrateJobs(); };
    const onVisible = () => { if (document.visibilityState === "visible") void hydrateJobs(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
