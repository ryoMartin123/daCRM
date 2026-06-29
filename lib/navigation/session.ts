// ─── Route session store ──────────────────────────────────
// The active navigation session for a technician. Mock/local (one active
// session at a time) — swap the read/write for a Supabase `route_sessions`
// table later; the shape mirrors the planned columns. Throttled location
// writes happen in the Navigation screen, not here.

import type { RouteSession, RouteData, LatLng } from "./types";

const KEY = "routiqa-route-session";

function read(): RouteSession | null {
  if (typeof window === "undefined") return null;
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) as RouteSession : null; } catch { return null; }
}
function write(s: RouteSession | null): void {
  if (typeof window === "undefined") return;
  try { s ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export function getActiveSession(): RouteSession | null {
  const s = read();
  return s && s.status === "active" ? s : null;
}
export function getSessionForJob(jobId: string): RouteSession | null {
  const s = getActiveSession();
  return s && s.jobId === jobId ? s : null;
}

export function startSession(input: {
  technicianId: string; jobId: string; origin: LatLng; destination: LatLng; destinationAddress?: string; route: RouteData;
}): RouteSession {
  const now = new Date().toISOString();
  const s: RouteSession = {
    id: `rs-${Date.now()}`,
    technicianId: input.technicianId,
    jobId: input.jobId,
    status: "active",
    originLat: input.origin.lat, originLng: input.origin.lng,
    destinationAddress: input.destinationAddress,
    destinationLat: input.destination.lat, destinationLng: input.destination.lng,
    startedAt: now,
    routePolyline: input.route.polyline,
    distanceRemaining: input.route.distanceMeters,
    durationRemaining: input.route.durationInTrafficSeconds ?? input.route.durationSeconds,
    eta: input.route.etaIso,
    currentStepIndex: 0,
    offRoute: false,
    arrivalDetected: false,
  };
  write(s);
  return s;
}

export function updateSession(patch: Partial<RouteSession>): RouteSession | null {
  const s = read();
  if (!s) return null;
  const next = { ...s, ...patch };
  write(next);
  return next;
}

export function endSession(status: "completed" | "canceled"): void {
  const s = read();
  if (!s) return;
  write({ ...s, status, completedAt: new Date().toISOString() });
  // Active getters now return null; keep the record briefly for any observers.
  if (status === "canceled") write(null);
}
