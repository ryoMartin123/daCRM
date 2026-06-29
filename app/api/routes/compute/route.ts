// ─── POST /api/routes/compute ─────────────────────────────
// Server-side route computation. If GOOGLE_ROUTES_API_KEY is set it calls the
// Google Routes API (Compute Routes) and normalizes the result; otherwise it
// returns a deterministic mock route. The API key never reaches the browser.

import { NextRequest, NextResponse } from "next/server";
import { encodePolyline, haversine, etaFromNow } from "@/lib/navigation/geo";
import type { ComputeRouteRequest, RouteData, RouteStep, Maneuver, LatLng } from "@/lib/navigation/types";

export const runtime = "nodejs";

const DRIVE_MPS = 12; // ~27 mph blended city speed for the mock

export async function POST(req: NextRequest) {
  let body: ComputeRouteRequest;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad request" }, { status: 400 }); }
  if (!body?.origin || typeof body.origin.lat !== "number") return NextResponse.json({ error: "origin required" }, { status: 400 });

  // Prefer a dedicated server-side routes key. Fall back to the Maps key (already
  // public) so enabling the Routes API on the existing key "just works". A
  // referrer-restricted key fails server-side → graceful mock fallback below.
  const key = process.env.GOOGLE_ROUTES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const source = process.env.GOOGLE_ROUTES_API_KEY ? "routes-key"
    : process.env.GOOGLE_MAPS_API_KEY ? "maps-server"
    : process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? "maps-public" : "none";
  if (key) {
    try {
      const data = await callGoogle(body, key);
      if (data) return NextResponse.json(data, { headers: { "x-route-source": source } });
    } catch (e) {
      console.error("Routes API failed, falling back to mock:", e);
    }
  }
  return NextResponse.json(mockRoute(body), { headers: { "x-route-source": "mock" } });
}

// ─── Google Routes API ──
async function callGoogle(body: ComputeRouteRequest, key: string): Promise<RouteData | null> {
  const dest = body.destination;
  const destination = dest.lat != null && dest.lng != null
    ? { location: { latLng: { latitude: dest.lat, longitude: dest.lng } } }
    : { address: dest.address };
  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.polyline.encodedPolyline,routes.legs.steps.startLocation,routes.legs.steps.endLocation",
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: body.origin.lat, longitude: body.origin.lng } } },
      destination,
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: false,
      routeModifiers: { avoidTolls: !!body.options?.avoidTolls, avoidHighways: !!body.options?.avoidHighways },
    }),
  });
  if (!res.ok) throw new Error(`Routes API ${res.status}`);
  const json = await res.json();
  const r = json.routes?.[0];
  if (!r) return null;
  const sec = (d?: string) => (d ? parseInt(d.replace("s", ""), 10) : 0);
  const steps: RouteStep[] = (r.legs?.[0]?.steps ?? []).map((s: Record<string, unknown>) => {
    const nav = s.navigationInstruction as { maneuver?: string; instructions?: string } | undefined;
    const start = s.startLocation as { latLng: { latitude: number; longitude: number } };
    const end = s.endLocation as { latLng: { latitude: number; longitude: number } };
    return {
      instruction: nav?.instructions ?? "Continue",
      maneuver: mapGoogleManeuver(nav?.maneuver),
      distanceMeters: (s.distanceMeters as number) ?? 0,
      durationSeconds: sec(s.staticDuration as string),
      polyline: (s.polyline as { encodedPolyline?: string })?.encodedPolyline ?? "",
      start: { lat: start.latLng.latitude, lng: start.latLng.longitude },
      end: { lat: end.latLng.latitude, lng: end.latLng.longitude },
    };
  });
  const durationSeconds = sec(r.duration);
  return {
    polyline: r.polyline?.encodedPolyline ?? "",
    distanceMeters: r.distanceMeters ?? 0,
    durationSeconds,
    durationInTrafficSeconds: durationSeconds,
    etaIso: etaFromNow(durationSeconds),
    steps,
  };
}

function mapGoogleManeuver(m?: string): Maneuver {
  switch (m) {
    case "TURN_LEFT": return "turn-left";
    case "TURN_RIGHT": return "turn-right";
    case "TURN_SLIGHT_LEFT": return "turn-slight-left";
    case "TURN_SLIGHT_RIGHT": return "turn-slight-right";
    case "TURN_SHARP_LEFT": return "turn-sharp-left";
    case "TURN_SHARP_RIGHT": return "turn-sharp-right";
    case "UTURN_LEFT": case "UTURN_RIGHT": return "uturn";
    case "RAMP_LEFT": return "ramp-left";
    case "RAMP_RIGHT": return "ramp-right";
    case "FORK_LEFT": return "fork-left";
    case "FORK_RIGHT": return "fork-right";
    case "MERGE": return "merge";
    case "ROUNDABOUT_LEFT": case "ROUNDABOUT_RIGHT": return "roundabout";
    case "DEPART": return "depart";
    case "ARRIVE": return "arrive";
    default: return "straight";
  }
}

// ─── Mock route ──
// Builds an L-shaped path (a couple of turns) from origin to destination so the
// nav UI has realistic steps/polyline without a live API.
function mockRoute(body: ComputeRouteRequest): RouteData {
  const o = body.origin;
  const d: LatLng = (body.destination.lat != null && body.destination.lng != null)
    ? { lat: body.destination.lat, lng: body.destination.lng }
    : { lat: o.lat + 0.03, lng: o.lng + 0.035 };             // ~3mi offset if no coords

  const corner: LatLng = { lat: o.lat, lng: d.lng };          // go east, then north (an "L")
  const legs: { from: LatLng; to: LatLng; maneuver: Maneuver; instruction: string; street: string }[] = [
    { from: o, to: corner, maneuver: "depart", instruction: "Head toward the destination", street: "Main St" },
    { from: corner, to: d, maneuver: "turn-left", instruction: "Turn left", street: "Market Ave" },
  ];

  const interp = (a: LatLng, b: LatLng, n = 6): LatLng[] =>
    Array.from({ length: n + 1 }, (_, i) => ({ lat: a.lat + (b.lat - a.lat) * (i / n), lng: a.lng + (b.lng - a.lng) * (i / n) }));

  const steps: RouteStep[] = [];
  const full: LatLng[] = [o];
  let total = 0;
  legs.forEach((leg, i) => {
    const pts = interp(leg.from, leg.to);
    const dist = haversine(leg.from, leg.to);
    total += dist;
    steps.push({
      instruction: leg.instruction, maneuver: leg.maneuver, distanceMeters: dist,
      durationSeconds: dist / DRIVE_MPS, polyline: encodePolyline(pts),
      start: leg.from, end: leg.to, streetName: leg.street,
    });
    full.push(...pts.slice(1));
    if (i === legs.length - 1) {
      steps.push({ instruction: "Arrive at destination", maneuver: "arrive", distanceMeters: 0, durationSeconds: 0, polyline: encodePolyline([leg.to, leg.to]), start: leg.to, end: leg.to, streetName: leg.street });
    }
  });

  const durationSeconds = total / DRIVE_MPS;
  const lats = full.map(p => p.lat), lngs = full.map(p => p.lng);
  return {
    polyline: encodePolyline(full),
    distanceMeters: total,
    durationSeconds,
    durationInTrafficSeconds: durationSeconds * 1.12,
    etaIso: etaFromNow(durationSeconds * 1.12),
    steps,
    bounds: { north: Math.max(...lats), south: Math.min(...lats), east: Math.max(...lngs), west: Math.min(...lngs) },
  };
}
