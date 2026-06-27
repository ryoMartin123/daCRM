// ─── Dispatch Map — data layer ────────────────────────────
// Turns real CRM jobs + the technician roster into mappable points, routes, and
// (mocked) AI routing suggestions. The CRM has no geocodes yet, so we derive
// stable lat/lng from each job's service area + a hash of its id — deterministic,
// so markers don't jump between renders. Designed so a real geocoder and live
// technician GPS can replace `geocode()`/`tech.current` later without changing
// the UI. Assignment writes back through the real jobs store (updateJob).

import { getAllJobs, updateJob, type Job, type JobType } from "@/lib/jobs/data";
import { getStaffRoster } from "@/lib/calendar/data";
import { getDispatchBoardMembers } from "@/lib/users/data";

// ── Geocoding (mock) ──────────────────────────────────────
// NOTE: real geocoding now flows through lib/maps/services (GeocodingService),
// which prefers Google-captured lat/lng and falls back to this stable mock.
export type LatLng = { lat: number; lng: number };

// Approximate centers for the seeded service areas (CSRA + Columbia).
const SA_COORDS: Record<string, LatLng> = {
  sa_augusta:   { lat: 33.4735, lng: -82.0105 },
  sa_martinez:  { lat: 33.5179, lng: -82.0765 },
  sa_grovetown: { lat: 33.4507, lng: -82.1968 },
  sa_n_augusta: { lat: 33.5018, lng: -81.9651 },
  sa_evans:     { lat: 33.5337, lng: -82.1307 },
  sa_harlem:    { lat: 33.4151, lng: -82.3124 },
  sa_columbia:  { lat: 34.0007, lng: -81.0348 },
  sa_aiken:     { lat: 33.5604, lng: -81.7196 },
};
const DEFAULT_CENTER: LatLng = { lat: 33.4735, lng: -82.0105 }; // Augusta, GA
export const MAP_DEFAULT_CENTER = DEFAULT_CENTER;
export const MAP_DEFAULT_ZOOM = 11;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
// Stable point near the area center; ~±2.5 mi jitter keyed by the seed.
export function geocode(seed: string, serviceAreaId?: string): LatLng {
  const base = (serviceAreaId && SA_COORDS[serviceAreaId]) || DEFAULT_CENTER;
  const h = hash(seed);
  const dLat = (((h % 1000) / 1000) - 0.5) * 0.075;
  const dLng = ((((h >> 10) % 1000) / 1000) - 0.5) * 0.075;
  return { lat: base.lat + dLat, lng: base.lng + dLng };
}

// Real geocodes from Google, keyed by the address string. `null` = in-flight or
// failed (→ fall back to the mock point). getMapJobs prefers a real coord here so
// pins land on the actual address; geocodeJobAddresses() fills it in the
// background and asks the caller to re-render as results arrive.
const realCoords = new Map<string, LatLng | null>();

export async function geocodeJobAddresses(jobs: MapJob[], onDone: () => void): Promise<void> {
  if (typeof google === "undefined" || !google.maps?.Geocoder) return;
  const geocoder = new google.maps.Geocoder();
  let any = false;
  for (const j of jobs) {
    const q = j.address?.trim();
    if (!q || realCoords.has(q)) continue;
    realCoords.set(q, null); // mark in-flight so we never geocode the same address twice
    try {
      const { results } = await geocoder.geocode({ address: q });
      const loc = results?.[0]?.geometry?.location;
      if (loc) { realCoords.set(q, { lat: loc.lat(), lng: loc.lng() }); any = true; }
    } catch { /* over-query-limit / not found → keep null, mock stands in */ }
  }
  // One re-render after the whole batch — not per address — so the map isn't
  // rebuilding markers (and jittering) on every geocode result.
  if (any) onDone();
}

export function haversineMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
// Mock drive estimate at ~28 mph average city speed + 2 min buffer.
export function driveMinutes(a: LatLng, b: LatLng): number {
  return Math.max(1, Math.round((haversineMiles(a, b) / 28) * 60) + 2);
}

// ── Map job ───────────────────────────────────────────────
export type JobMarkerKind = "emergency" | "unassigned" | "in_progress" | "completed" | "maintenance" | "estimate" | "scheduled";

export const MARKER_CONFIG: Record<JobMarkerKind, { label: string; color: string }> = {
  emergency:   { label: "Emergency",   color: "#dc2626" },
  unassigned:  { label: "Unassigned",  color: "#6b7280" },
  in_progress: { label: "In progress", color: "#2563eb" },
  completed:   { label: "Completed",   color: "#16a34a" },
  maintenance: { label: "Maintenance", color: "#7c3aed" },
  estimate:    { label: "Estimate",    color: "#f59e0b" },
  scheduled:   { label: "Scheduled",   color: "#0891b2" },
};

export interface MapJob {
  id: string;
  accountId: string;
  customerName: string;
  customerInitials: string;
  title: string;
  type: JobType;
  status: string;
  priority: Job["priority"];
  address: string;
  serviceAreaId?: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  assignedTo: string;
  lat: number;
  lng: number;
  day: number | null;     // start timestamp (ms) for date filtering / ordering
  kind: JobMarkerKind;
}

function markerKind(job: Job): JobMarkerKind {
  if (job.type === "emergency" || job.priority === "urgent") return "emergency";
  if (!job.assignedTo?.trim()) return "unassigned";
  const s = job.status.toLowerCase();
  if (s.includes("complete")) return "completed";
  if (s.includes("progress") || s.includes("route") || s.includes("dispatch") || s.includes("site")) return "in_progress";
  if (job.type === "maintenance" || job.type === "agreement_visit" || job.dispatchType === "agreement_visit") return "maintenance";
  if (job.type === "estimate" || job.dispatchType === "sales_appointment") return "estimate";
  return "scheduled";
}

function parseDay(date: string, time: string): number | null {
  if (!date) return null;
  const d = new Date(`${date} ${time || "9:00 AM"}`);
  return isNaN(d.getTime()) ? null : d.getTime();
}

export interface MapScope { companyId?: string; locationId?: string; serviceAreaId?: string }

export function getMapJobs(scope: MapScope = {}): MapJob[] {
  return getAllJobs()
    .filter(j => j.status.toLowerCase() !== "canceled")
    .filter(j => (!scope.companyId || j.companyId === scope.companyId)
      && (!scope.locationId || j.locationId === scope.locationId)
      && (!scope.serviceAreaId || j.serviceAreaId === scope.serviceAreaId))
    .map(j => {
      // Prefer the real geocode of the address; mock point until it resolves.
      const addr = j.propertyAddress?.trim();
      const { lat, lng } = (addr && realCoords.get(addr)) || geocode(j.id, j.serviceAreaId);
      return {
        id: j.id, accountId: j.accountId, customerName: j.customerName, customerInitials: j.customerInitials,
        title: j.title, type: j.type, status: j.status, priority: j.priority,
        address: j.propertyAddress ?? "", serviceAreaId: j.serviceAreaId,
        scheduledDate: j.scheduledDate, scheduledTime: j.scheduledTime, durationMinutes: j.durationMinutes,
        assignedTo: j.assignedTo ?? "", lat, lng,
        day: parseDay(j.scheduledDate, j.scheduledTime), kind: markerKind(j),
      };
    });
}

// ── Map technician ────────────────────────────────────────
export type MapTechStatus = "available" | "en_route" | "on_site" | "wrapping_up" | "delayed" | "on_break" | "off_duty";

export const TECH_STATUS_CONFIG: Record<MapTechStatus, { label: string; color: string }> = {
  available:   { label: "Available",   color: "#16a34a" },
  en_route:    { label: "En route",    color: "#2563eb" },
  on_site:     { label: "On site",     color: "#7c3aed" },
  wrapping_up: { label: "Wrapping up", color: "#0891b2" },
  delayed:     { label: "Delayed",     color: "#f59e0b" },
  on_break:    { label: "On break",    color: "#9ca3af" },
  off_duty:    { label: "Off duty",    color: "#6b7280" },
};

const SKILL_POOL = ["HVAC Install", "AC Repair", "Heating", "Refrigeration", "Electrical", "Maintenance", "Ductwork"];
const STATUS_CYCLE: MapTechStatus[] = ["available", "en_route", "on_site", "wrapping_up", "delayed", "on_break"];

export interface MapTech {
  name: string;
  initials: string;
  status: MapTechStatus;
  skills: string[];
  truck: string;
  base: LatLng;
  current: LatLng | null;   // null = no live location yet
  lastCheckIn: string;
}

// Only people on the dispatch board(s) for the active scope are dispatchable on
// the map — so the Techs list, markers, assign dropdown, and Dispatch Assistant
// all draw from the same board-candidate set (matches the job-creation flow).
export function getMapTechnicians(companyId?: string, locationId?: string): MapTech[] {
  const onBoard = getDispatchBoardMembers(companyId, locationId);
  return getStaffRoster().filter(t => onBoard.has(t.name)).map((t, i) => {
    const h = hash(t.name);
    const status: MapTechStatus = t.status === "off_today" ? "off_duty" : STATUS_CYCLE[h % STATUS_CYCLE.length];
    const skills = [SKILL_POOL[h % SKILL_POOL.length], SKILL_POOL[(h >> 4) % SKILL_POOL.length]].filter((s, idx, a) => a.indexOf(s) === idx);
    const base = geocode(`base-${t.name}`, ["sa_augusta", "sa_evans", "sa_martinez"][h % 3]);
    const current = status === "off_duty" ? null : geocode(`cur-${t.name}`, ["sa_augusta", "sa_evans", "sa_martinez", "sa_grovetown"][h % 4]);
    return {
      name: t.name, initials: t.initials, status, skills,
      truck: `Truck ${10 + (i % 12)}`, base, current,
      lastCheckIn: status === "off_duty" ? "—" : ["just now", "4 min ago", "18 min ago", "32 min ago"][h % 4],
    };
  });
}

// ── Routes ────────────────────────────────────────────────
export interface RouteStop { job: MapJob; driveMin: number; driveMi: number }
export interface TechRoute {
  techName: string;
  stops: RouteStop[];
  totalDriveMin: number;
  totalMiles: number;
  totalJobMin: number;
  path: LatLng[];          // base → stop → stop … for drawing
}

export function buildRoute(tech: MapTech, jobs: MapJob[]): TechRoute {
  const mine = jobs
    .filter(j => j.assignedTo === tech.name && j.day != null)
    .sort((a, b) => (a.day! - b.day!));
  let prev: LatLng = tech.base;
  const path: LatLng[] = [tech.base];
  let totalDriveMin = 0, totalMiles = 0, totalJobMin = 0;
  const stops: RouteStop[] = mine.map(j => {
    const here = { lat: j.lat, lng: j.lng };
    const mi = haversineMiles(prev, here);
    const min = driveMinutes(prev, here);
    totalMiles += mi; totalDriveMin += min; totalJobMin += j.durationMinutes;
    prev = here; path.push(here);
    return { job: j, driveMin: min, driveMi: Math.round(mi * 10) / 10 };
  });
  return { techName: tech.name, stops, totalDriveMin, totalMiles: Math.round(totalMiles * 10) / 10, totalJobMin, path };
}

// ── Assignment (writes back to the real jobs store) ───────
function initials(name: string): string {
  return name.split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase();
}
export function assignJob(jobId: string, techName: string): void {
  updateJob(jobId, { assignedTo: techName, assignedToInitials: techName ? initials(techName) : "" });
}

// ── AI routing suggestions (mocked, with reasons) ─────────
// The engine is mocked but the *inputs are real* (distance, skills, gaps), so the
// reasons read true. Suggestions never auto-apply — the dispatcher confirms.
export interface AiSuggestion {
  id: string;
  kind: "assign" | "reassign" | "reorder" | "risk";
  title: string;
  reason: string;
  jobId?: string;
  techName?: string;     // suggested technician (for assign/reassign)
  impact?: string;       // the operational payoff, e.g. "Saves ~24 min drive"
  confidence?: "high" | "medium" | "low";
}

export function computeSuggestions(jobs: MapJob[], techs: MapTech[]): AiSuggestion[] {
  const out: AiSuggestion[] = [];
  const available = techs.filter(t => t.status !== "off_duty" && t.current);

  // 1. Closest available tech for the highest-priority unassigned job.
  const unassigned = jobs.filter(j => j.kind === "unassigned" || (!j.assignedTo && j.day != null));
  const target = unassigned.find(j => j.kind === "emergency") ?? unassigned[0];
  if (target && available.length) {
    const nearest = available
      .map(t => ({ t, mi: haversineMiles(t.current!, { lat: target.lat, lng: target.lng }) }))
      .sort((a, b) => a.mi - b.mi)[0];
    if (nearest) {
      const min = Math.round((nearest.mi / 28) * 60) + 2;
      out.push({
        id: `sg-assign-${target.id}`, kind: "assign", jobId: target.id, techName: nearest.t.name,
        title: `Assign “${target.title}” to ${nearest.t.name}`,
        reason: `${nearest.t.name} is ~${min} min (${nearest.mi.toFixed(1)} mi) away, is ${TECH_STATUS_CONFIG[nearest.t.status].label.toLowerCase()}, and carries ${nearest.t.skills.join(" / ")}.`,
        impact: `Closest available tech`, confidence: nearest.mi < 8 ? "high" : "medium",
      });
    }
  }

  // 2. Drive-time reduction: the tech with the longest route could shed its
  //    farthest stop to a closer teammate.
  const routes = techs.map(t => buildRoute(t, jobs)).filter(r => r.stops.length > 1).sort((a, b) => b.totalDriveMin - a.totalDriveMin);
  const heavy = routes[0];
  if (heavy) {
    const far = [...heavy.stops].sort((a, b) => b.driveMi - a.driveMi)[0];
    const alt = available.find(t => t.name !== heavy.techName);
    if (far && alt) {
      const saved = Math.max(6, Math.round(far.driveMi / 28 * 60));
      out.push({
        id: `sg-move-${far.job.id}`, kind: "reassign", jobId: far.job.id, techName: alt.name,
        title: `Move “${far.job.title}” from ${heavy.techName} to ${alt.name}`,
        reason: `${heavy.techName}'s route is the day's longest at ${heavy.totalDriveMin} min driving. Reassigning this ${far.driveMi}-mi leg to ${alt.name} cuts backtracking and keeps both inside their windows.`,
        impact: `Saves ~${saved} min drive`, confidence: "medium",
      });
    }
  }

  // 3. Overtime risk on overloaded routes.
  const overloaded = routes.find(r => r.totalJobMin + r.totalDriveMin > 480);
  if (overloaded) {
    out.push({
      id: `sg-risk-${overloaded.techName}`, kind: "risk", techName: overloaded.techName,
      title: `${overloaded.techName} is at overtime risk`,
      reason: `${overloaded.stops.length} jobs + ${overloaded.totalDriveMin} min driving ≈ ${Math.round((overloaded.totalJobMin + overloaded.totalDriveMin) / 60)} hrs today. Consider moving one job to a lighter route.`,
      impact: `Overtime risk`, confidence: "high",
    });
  }

  return out;
}

// ── Context-aware suggestions (for the selected job / technician) ──
export function suggestForJob(job: MapJob, techs: MapTech[]): AiSuggestion[] {
  if (job.assignedTo) return [];   // already assigned — nothing to recommend
  const available = techs.filter(t => t.status !== "off_duty" && t.current);
  const nearest = available
    .map(t => ({ t, mi: haversineMiles(t.current!, { lat: job.lat, lng: job.lng }) }))
    .sort((a, b) => a.mi - b.mi)[0];
  if (!nearest) return [];
  const min = Math.round((nearest.mi / 28) * 60) + 2;
  return [{
    id: `cj-${job.id}`, kind: "assign", jobId: job.id, techName: nearest.t.name,
    title: `Best fit: ${nearest.t.name}`,
    reason: `${nearest.t.name} is ~${min} min (${nearest.mi.toFixed(1)} mi) away, ${TECH_STATUS_CONFIG[nearest.t.status].label.toLowerCase()}, and carries ${nearest.t.skills.join(" / ")}.`,
    impact: `${min} min to arrive`, confidence: nearest.mi < 8 ? "high" : "medium",
  }];
}
export function suggestForTech(tech: MapTech, jobs: MapJob[]): AiSuggestion[] {
  const out: AiSuggestion[] = [];
  if (tech.current) {
    const near = jobs.filter(j => j.kind === "unassigned")
      .map(j => ({ j, mi: haversineMiles(tech.current!, { lat: j.lat, lng: j.lng }) }))
      .sort((a, b) => a.mi - b.mi)[0];
    if (near && near.mi < 15) {
      out.push({
        id: `ct-${tech.name}-${near.j.id}`, kind: "assign", jobId: near.j.id, techName: tech.name,
        title: `Nearby: ${near.j.customerName}`,
        reason: `An unassigned ${near.j.title} sits ${near.mi.toFixed(1)} mi from ${tech.name}'s current location — a low-detour pickup.`,
        impact: `+1 job, ${near.mi.toFixed(1)} mi`, confidence: near.mi < 6 ? "high" : "medium",
      });
    }
  }
  const r = buildRoute(tech, jobs);
  if (r.totalJobMin + r.totalDriveMin > 480) {
    out.push({
      id: `ct-risk-${tech.name}`, kind: "risk", techName: tech.name,
      title: `Route at overtime risk`,
      reason: `${r.stops.length} jobs + ${r.totalDriveMin} min driving ≈ ${Math.round((r.totalJobMin + r.totalDriveMin) / 60)} hrs. Consider shifting one stop to a lighter route.`,
      impact: `Rebalance suggested`, confidence: "medium",
    });
  }
  return out;
}
