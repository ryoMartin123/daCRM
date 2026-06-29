// ─── Navigation geometry helpers ──────────────────────────
// Polyline encode/decode (Google algorithm), haversine distance, point-to-path
// distance (for off-route detection), and display formatters. Pure + isomorphic.

import type { LatLng } from "./types";

export function decodePolyline(str: string): LatLng[] {
  let index = 0, lat = 0, lng = 0;
  const out: LatLng[] = [];
  while (index < str.length) {
    let result = 0, shift = 0, b: number;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    result = 0; shift = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    out.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return out;
}

export function encodePolyline(points: LatLng[]): string {
  let lastLat = 0, lastLng = 0, result = "";
  const enc = (v: number) => {
    let sgn = v < 0 ? ~(v << 1) : (v << 1), s = "";
    while (sgn >= 0x20) { s += String.fromCharCode((0x20 | (sgn & 0x1f)) + 63); sgn >>= 5; }
    s += String.fromCharCode(sgn + 63);
    return s;
  };
  for (const p of points) {
    const la = Math.round(p.lat * 1e5), ln = Math.round(p.lng * 1e5);
    result += enc(la - lastLat) + enc(ln - lastLng);
    lastLat = la; lastLng = ln;
  }
  return result;
}

const R = 6371000;
const toRad = (d: number) => (d * Math.PI) / 180;

export function haversine(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Min distance (meters) from a point to a polyline path, via local equirectangular
// projection — good enough for the short distances off-route detection needs.
export function distanceToPath(p: LatLng, path: LatLng[]): number {
  if (path.length === 0) return Infinity;
  const cos = Math.cos(toRad(p.lat));
  const xy = (q: LatLng): [number, number] => [(q.lng - p.lng) * cos * 111320, (q.lat - p.lat) * 110540];
  if (path.length === 1) { const [x, y] = xy(path[0]); return Math.hypot(x, y); }
  let min = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const [x1, y1] = xy(path[i]); const [x2, y2] = xy(path[i + 1]);
    const dx = x2 - x1, dy = y2 - y1; const len2 = dx * dx + dy * dy;
    let t = len2 ? -((x1 * dx + y1 * dy) / len2) : 0; t = Math.max(0, Math.min(1, t));
    const d = Math.hypot(x1 + t * dx, y1 + t * dy);
    if (d < min) min = d;
  }
  return min;
}

// Initial bearing (degrees, 0=N) from a → b.
export function bearing(a: LatLng, b: LatLng): number {
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat));
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng));
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// The point `meters` along a path, with the heading of that segment. Used by the
// dev "simulate drive" mode. Returns null once past the end.
export function pointAlong(path: LatLng[], meters: number): { point: LatLng; heading: number } | null {
  let acc = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const d = haversine(path[i], path[i + 1]);
    if (acc + d >= meters) {
      const t = d ? (meters - acc) / d : 0;
      return {
        point: { lat: path[i].lat + (path[i + 1].lat - path[i].lat) * t, lng: path[i].lng + (path[i + 1].lng - path[i].lng) * t },
        heading: bearing(path[i], path[i + 1]),
      };
    }
    acc += d;
  }
  return null;
}

// ─── Display formatters ──
export const metersToMiles = (m: number) => m / 1609.34;
export const metersToFeet = (m: number) => m * 3.28084;

export function fmtDistance(m: number): string {
  const mi = metersToMiles(m);
  if (mi < 0.1) return `${Math.round(metersToFeet(m) / 10) * 10} ft`;
  return `${mi.toFixed(mi < 10 ? 1 : 0)} mi`;
}
export function fmtDuration(sec: number): string {
  const min = Math.max(1, Math.round(sec / 60));
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}
export function fmtClock(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
export const etaFromNow = (sec: number) => new Date(Date.now() + sec * 1000).toISOString();
