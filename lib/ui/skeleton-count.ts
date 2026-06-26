"use client";

// ─── Data-aware skeleton counts ───────────────────────────
// Loading skeletons should reflect how many records actually exist, not a
// hardcoded bulk. This maps each CRM section to a synchronous (in-memory) count
// so a route's loading.tsx can render the right number of skeleton rows/cards —
// one item → one skeleton, zero items → shell only (no fake content).
//
// useSyncExternalStore gives the count without a hydration mismatch: the server
// snapshot is the minimal fallback, the client snapshot is the real count, and
// React reconciles them cleanly. During client navigation (the usual case) the
// real count is used from the first frame, so there's no fake-bulk flash.

import { useEffect, useSyncExternalStore } from "react";
import { getAllCustomers } from "@/lib/customers/data";
import { getAllJobs, getAllWorkOrders } from "@/lib/jobs/data";
import { getAllLeads } from "@/lib/leads/data";
import { getAllAgreements } from "@/lib/agreements/data";
import { getAllInvoices, getAllQuotes } from "@/lib/quotes/data";
import { getAllItems } from "@/lib/items/data";
import { getAllTasks } from "@/lib/tasks/data";
import { getAllProjects } from "@/lib/projects/data";

// section key → its current record count (unscoped totals; a reasonable proxy).
// Sections whose page reports an exact count (via useRememberCount) don't need
// an entry here — the remembered count is used instead.
const SECTION_COUNT: Record<string, () => number> = {
  customers:     () => getAllCustomers().length,
  jobs:          () => getAllJobs().length,
  leads:         () => getAllLeads().length,
  agreements:    () => getAllAgreements().length,
  invoices:      () => getAllInvoices().length,
  quotes:        () => getAllQuotes().length,
  items:         () => getAllItems().length,
  tasks:         () => getAllTasks().length,
  "work-orders": () => getAllWorkOrders().length,
  projects:      () => getAllProjects().length,
};

// Minimal fallback for unmapped sections / before the count is known.
export const SKELETON_FALLBACK = 4;

// Clamp a raw count into a sensible skeleton range. 0 stays 0 (→ shell only);
// otherwise at least 1 and at most `max` so a long list never overloads the page.
export function clampSkeletonCount(count: number, max = 10): number {
  if (count <= 0) return 0;
  return Math.min(count, max);
}

const noopSubscribe = () => () => {};

// ── Remembered (exact) counts ─────────────────────────────
// The most accurate signal is the count a section actually showed last time —
// it already reflects scope, filters, and session edits (e.g. 1 file → 1). A
// section records its visible count via useRememberCount; the loader reads it
// back. Falls back to the unscoped getter, then a minimal default.
const KEY = (section: string) => `crm-skel-${section}`;

function rememberCount(section: string, n: number): void {
  try { localStorage.setItem(KEY(section), String(n)); } catch { /* ignore */ }
}
function readRemembered(section: string): number | null {
  try {
    const v = localStorage.getItem(KEY(section));
    if (v != null) { const n = parseInt(v, 10); if (!Number.isNaN(n)) return n; }
  } catch { /* ignore */ }
  return null;
}

// Call from a section's page/list with its real visible count so the next load
// mirrors it exactly.
export function useRememberCount(section: string, n: number): void {
  useEffect(() => { rememberCount(section, n); }, [section, n]);
}

// How many skeleton items to render for a section: prefer the exact remembered
// count, then the unscoped data getter, then the minimal fallback.
export function useSectionCount(section: string, max = 10): number {
  const get = () => {
    const remembered = readRemembered(section);
    if (remembered != null) return clampSkeletonCount(remembered, max);
    const getter = SECTION_COUNT[section];
    return getter ? clampSkeletonCount(getter(), max) : SKELETON_FALLBACK;
  };
  return useSyncExternalStore(noopSubscribe, get, () => SKELETON_FALLBACK);
}
