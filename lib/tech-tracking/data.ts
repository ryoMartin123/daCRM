// ─── Technician live-location tracking ────────────────────
// Field techs' phones report GPS while clocked in (whole shift); the desktop
// dispatch board shows the live marker and "today's route" breadcrumb. Mirrors
// the jobs store: an in-memory cache backed by localStorage (so the mock app
// works on one device), with Supabase write-through + Realtime when configured —
// which is what makes the phone → dispatcher cross-device sync actually work.
//
// Identity is the tech's full name (matches Job.assignedTo / MapTech.name) until
// real auth lands. Two tables back this:
//
//   create table if not exists technician_locations (
//     tech_name   text primary key,
//     company_id  text, location_id text,
//     lat double precision not null, lng double precision not null,
//     heading double precision, speed double precision, accuracy double precision,
//     on_duty boolean not null default true,
//     recorded_at timestamptz not null default now()
//   );
//   create table if not exists technician_location_history (
//     id bigint generated always as identity primary key,
//     tech_name text not null, company_id text, location_id text,
//     lat double precision not null, lng double precision not null,
//     heading double precision, speed double precision, accuracy double precision,
//     on_duty boolean not null default true,
//     recorded_at timestamptz not null default now()
//   );
//   create index if not exists idx_tech_hist_name_time
//     on technician_location_history (tech_name, recorded_at desc);
//   alter publication supabase_realtime add table technician_locations;

import { notifyDataChanged, invalidateOnStorage } from "@/lib/sync/liveData";
import { getSupabase } from "@/lib/supabase/client";

export interface TechLocation {
  techName: string;
  companyId?: string;
  locationId?: string;
  lat: number;
  lng: number;
  heading?: number;   // degrees clockwise from north (0–360), when the device reports it
  speed?: number;     // metres/second
  accuracy?: number;  // metres
  onDuty: boolean;    // false once the tech clocks out (marker goes idle)
  gpsActive?: boolean; // false = clocked in but GPS not currently streaming (paused)
  gpsError?: string;   // "permission" | "unavailable" — device denied/failed location
  recordedAt: string; // ISO timestamp of the fix (or presence ping)
}

const LATEST_KEY = "routiqa-tech-locations"; // Record<techName, TechLocation>
const TRAIL_KEY  = "routiqa-tech-trail";      // TechLocation[] (capped breadcrumb)

// A fix older than this is treated as stale — the tech is no longer "live".
export const LOCATION_STALE_MS = 5 * 60_000;
const TRAIL_MAX_AGE_MS = 12 * 60 * 60_000; // keep ~one shift of breadcrumb
const TRAIL_MAX = 2500;                      // hard cap on locally-kept points (higher: fast updates)

let _latest: Record<string, TechLocation> | undefined;
let _trail: TechLocation[] | undefined;
let _realtimeStarted = false;

// ── Cache I/O ─────────────────────────────────────────────
function loadLatest(): Record<string, TechLocation> {
  if (_latest) return _latest;
  if (typeof window === "undefined") return (_latest = {});
  try { _latest = JSON.parse(localStorage.getItem(LATEST_KEY) || "{}"); } catch { _latest = {}; }
  return _latest!;
}
function loadTrail(): TechLocation[] {
  if (_trail) return _trail;
  if (typeof window === "undefined") return (_trail = []);
  try { _trail = JSON.parse(localStorage.getItem(TRAIL_KEY) || "[]"); } catch { _trail = []; }
  return _trail!;
}
function writeLatest() { if (typeof window !== "undefined") localStorage.setItem(LATEST_KEY, JSON.stringify(_latest ?? {})); }
function writeTrail()  { if (typeof window !== "undefined") localStorage.setItem(TRAIL_KEY,  JSON.stringify(_trail ?? [])); }

// Another tab wrote → drop our in-memory caches so reads re-hydrate.
invalidateOnStorage([LATEST_KEY, TRAIL_KEY], () => { _latest = undefined; _trail = undefined; });

// ── Reads ─────────────────────────────────────────────────
export function getLiveLocations(): Record<string, TechLocation> { return { ...loadLatest() }; }
export function getLiveLocation(name: string): TechLocation | undefined { return loadLatest()[name]; }

export function isLocationStale(loc: TechLocation, now = Date.now()): boolean {
  return now - new Date(loc.recordedAt).getTime() > LOCATION_STALE_MS;
}
// "Live" = on duty AND a recent fix.
export function isTechLive(name: string, now = Date.now()): boolean {
  const l = loadLatest()[name];
  return !!l && l.onDuty && !isLocationStale(l, now);
}

// Today's breadcrumb for one tech, oldest → newest.
export function getTechTrail(name: string, sinceMs = TRAIL_MAX_AGE_MS): TechLocation[] {
  const cut = Date.now() - sinceMs;
  return loadTrail()
    .filter(p => p.techName === name && new Date(p.recordedAt).getTime() >= cut)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
}

export function relativeTime(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.round(m / 60)}h ago`;
}

// ── Tracking state — the dispatcher's at-a-glance status per tech ──────────
// off:        not clocked in / clocked out (gray)
// clocked_in: on shift but GPS not actively streaming — paused/denied (blue)*
// live:       on shift + a fresh GPS fix (green)
// stale:      on shift, fixes have paused — recently seen (orange)
// lost:       on shift but the signal dropped a while ago (red)
// *clocked_in needs a clock-in/permission signal the phone doesn't send yet; the
//  derivation below yields off/live/stale/lost. The visuals support all five.
export type TrackState = "off" | "clocked_in" | "live" | "stale" | "lost";

export const LIVE_FRESH_MS = 90_000;   // ≤90s since last fix = live

export const TRACK_STATE_META: Record<TrackState, { label: string; short: string; color: string }> = {
  off:        { label: "Off duty",      short: "Off",        color: "#6b7280" },
  clocked_in: { label: "Clocked in",    short: "Clocked in", color: "#2563eb" },
  live:       { label: "Live GPS",      short: "Live",       color: "#16a34a" },
  stale:      { label: "Stale signal",  short: "Stale",      color: "#f59e0b" },
  lost:       { label: "Signal lost",   short: "No signal",  color: "#dc2626" },
};

export function trackStateFor(loc: TechLocation | undefined, now = Date.now()): TrackState {
  if (!loc || !loc.onDuty) return "off";                    // not clocked in
  const age = now - new Date(loc.recordedAt).getTime();
  if (age > LOCATION_STALE_MS) return "lost";               // app closed / no heartbeat → red
  if (loc.gpsError) return "lost";                          // permission denied / device error → red
  if (loc.gpsActive === false) return "clocked_in";         // on shift, GPS paused → blue
  if (age <= LIVE_FRESH_MS) return "live";                  // streaming a fresh fix → green
  return "stale";                                           // fixes slowed → orange
}

// ── Writes (optimistic: cache + notify, then persist) ─────
// `trail` defaults true; heartbeats (re-stamping a stationary tech to keep them
// "live") pass false so they don't pile duplicate points into the breadcrumb.
export function reportLocation(loc: TechLocation, opts: { trail?: boolean } = {}): void {
  const latest = loadLatest();
  latest[loc.techName] = loc;
  _latest = latest;

  if (opts.trail !== false) {
    const cut = Date.now() - TRAIL_MAX_AGE_MS;
    _trail = [...loadTrail(), loc].filter(p => new Date(p.recordedAt).getTime() >= cut).slice(-TRAIL_MAX);
    writeTrail();
  }

  writeLatest();
  notifyDataChanged();
  persistLocation(loc);
}

// Clock-out / stop sharing — keep the last point but mark it idle.
export function setTechOffDuty(techName: string): void {
  const latest = loadLatest();
  const cur = latest[techName];
  if (!cur || !cur.onDuty) return;
  const next = { ...cur, onDuty: false, recordedAt: new Date().toISOString() };
  latest[techName] = next;
  _latest = latest;
  writeLatest();
  notifyDataChanged();
  persistLocation(next);
}

// ── Supabase mapping + write-through (no-op without a client) ──
function rowFromLoc(l: TechLocation) {
  return {
    tech_name: l.techName,
    company_id: l.companyId ?? null,
    location_id: l.locationId ?? null,
    lat: l.lat, lng: l.lng,
    heading: l.heading ?? null,
    speed: l.speed ?? null,
    accuracy: l.accuracy ?? null,
    on_duty: l.onDuty,
    gps_active: l.gpsActive ?? true,
    gps_error: l.gpsError ?? null,
    recorded_at: l.recordedAt,
  };
}
function locFromRow(r: Record<string, unknown>): TechLocation {
  return {
    techName: r.tech_name as string,
    companyId: (r.company_id as string | null) ?? undefined,
    locationId: (r.location_id as string | null) ?? undefined,
    lat: Number(r.lat), lng: Number(r.lng),
    heading: r.heading != null ? Number(r.heading) : undefined,
    speed: r.speed != null ? Number(r.speed) : undefined,
    accuracy: r.accuracy != null ? Number(r.accuracy) : undefined,
    onDuty: !!r.on_duty,
    gpsActive: r.gps_active == null ? true : !!r.gps_active,
    gpsError: (r.gps_error as string | null) ?? undefined,
    recordedAt: (r.recorded_at as string) ?? new Date().toISOString(),
  };
}
function persistLocation(l: TechLocation): void {
  const supabase = getSupabase(); if (!supabase) return;
  supabase.from("technician_locations").upsert(rowFromLoc(l), { onConflict: "tech_name" }).then(({ error }) => {
    if (error) console.error("[tech-tracking] latest upsert failed:", error.message);
  });
  supabase.from("technician_location_history").insert(rowFromLoc(l)).then(({ error }) => {
    if (error) console.error("[tech-tracking] history insert failed:", error.message);
  });
}

// ── Hydrate from Supabase, then start Realtime (safe to call repeatedly) ──
export async function hydrateTechLocations(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const { data, error } = await supabase.from("technician_locations").select("*");
  if (error) { console.error("[tech-tracking] hydrate failed:", error.message); return; }
  const map: Record<string, TechLocation> = {};
  for (const r of data ?? []) { const l = locFromRow(r as Record<string, unknown>); map[l.techName] = l; }
  _latest = map; writeLatest();

  const since = new Date(Date.now() - TRAIL_MAX_AGE_MS).toISOString();
  const { data: hist } = await supabase
    .from("technician_location_history").select("*")
    .gte("recorded_at", since).order("recorded_at", { ascending: true });
  if (hist) { _trail = (hist as Record<string, unknown>[]).map(locFromRow).slice(-TRAIL_MAX * 4); writeTrail(); }

  notifyDataChanged();
  startTechLocationsRealtime();
}

function startTechLocationsRealtime(): void {
  if (_realtimeStarted) return;
  const supabase = getSupabase(); if (!supabase) return;
  _realtimeStarted = true;
  supabase
    .channel("tech-locations-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "technician_locations" }, (payload) => {
      const latest = loadLatest();
      if (payload.eventType === "DELETE") {
        const name = (payload.old as { tech_name?: string })?.tech_name;
        if (name) delete latest[name];
      } else {
        const l = locFromRow(payload.new as Record<string, unknown>);
        latest[l.techName] = l;
      }
      _latest = latest;
      writeLatest();
      notifyDataChanged();
    })
    .subscribe();
}

// ── History review (Settings → Tracking) ──────────────────
// Reads from Supabase for arbitrary ranges (up to the 30-day retention window);
// falls back to the local breadcrumb cache when Supabase isn't configured.
const DAY_MS = 86_400_000;

function haversineMi(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Every technician who has any tracking data (latest table = one row per tech).
export async function fetchTrackedTechs(): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [...new Set(loadTrail().map(p => p.techName))].sort();
  const { data, error } = await supabase.from("technician_locations").select("tech_name");
  if (error) { console.error("[tech-tracking] tech list failed:", error.message); return []; }
  return [...new Set((data ?? []).map(r => r.tech_name as string))].sort();
}

// A tech's movement points within [fromISO, toISO], oldest → newest.
export async function fetchTechHistory(techName: string, fromISO: string, toISO: string): Promise<TechLocation[]> {
  const supabase = getSupabase();
  if (!supabase) {
    const f = new Date(fromISO).getTime(), t = new Date(toISO).getTime();
    return loadTrail().filter(p => p.techName === techName && new Date(p.recordedAt).getTime() >= f && new Date(p.recordedAt).getTime() <= t);
  }
  const { data, error } = await supabase.from("technician_location_history").select("*")
    .eq("tech_name", techName).gte("recorded_at", fromISO).lte("recorded_at", toISO)
    .order("recorded_at", { ascending: true }).limit(6000);
  if (error) { console.error("[tech-tracking] history fetch failed:", error.message); return []; }
  return (data ?? []).map(r => locFromRow(r as Record<string, unknown>));
}

export interface TrailSummary {
  distanceMi: number; firstAt: string | null; lastAt: string | null;
  durationMin: number; pointCount: number; stops: number;
}
// Distance (haversine sum), active window, and a naive "stops" count (dwelled
// within ~60m for ≥5 min).
export function summarizeTrail(points: TechLocation[]): TrailSummary {
  if (points.length === 0) return { distanceMi: 0, firstAt: null, lastAt: null, durationMin: 0, pointCount: 0, stops: 0 };
  let dist = 0;
  for (let i = 1; i < points.length; i++) dist += haversineMi(points[i - 1], points[i]);
  const firstAt = points[0].recordedAt, lastAt = points[points.length - 1].recordedAt;
  const durationMin = Math.max(0, Math.round((new Date(lastAt).getTime() - new Date(firstAt).getTime()) / 60_000));
  let stops = 0, anchor = 0;
  const dwellLongEnough = (from: number, to: number) => new Date(points[to].recordedAt).getTime() - new Date(points[from].recordedAt).getTime() >= 5 * 60_000 && to - from >= 2;
  for (let i = 1; i < points.length; i++) {
    if (haversineMi(points[anchor], points[i]) * 1609 > 60) {
      if (dwellLongEnough(anchor, i - 1)) stops++;
      anchor = i;
    }
  }
  if (dwellLongEnough(anchor, points.length - 1)) stops++;
  return { distanceMi: Math.round(dist * 10) / 10, firstAt, lastAt, durationMin, pointCount: points.length, stops };
}

// Local-day [start, end] ISO bounds for a "YYYY-MM-DD" date.
export function dayBoundsISO(ymd: string): { fromISO: string; toISO: string } {
  const from = new Date(`${ymd}T00:00:00`), to = new Date(`${ymd}T23:59:59.999`);
  return { fromISO: from.toISOString(), toISO: to.toISOString() };
}

// The earliest date we retain (30-day window), as YYYY-MM-DD.
export function retentionMinDate(): string {
  return new Date(Date.now() - 30 * DAY_MS).toISOString().slice(0, 10);
}
