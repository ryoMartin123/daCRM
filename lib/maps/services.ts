// ─── Map services — provider-agnostic facade over Google ──
// CRM features call these services, never the Google SDK directly, so map logic
// stays out of business logic and the provider can be swapped in one place.
// Today: geocoding uses any lat/lng Google already captured on the address
// (Places Autocomplete fills ParsedAddress.latitude/longitude) with a stable mock
// fallback; drive time uses straight-line haversine. The seams below are where
// the Google Geocoding / Distance Matrix / Directions APIs plug in next.

import type { ParsedAddress } from "@/lib/address/types";
import { geocode as mockGeocode, haversineMiles, driveMinutes, type LatLng } from "@/lib/dispatch-map/data";

export type { LatLng };

// ── Geocoding ─────────────────────────────────────────────
export const GeocodingService = {
  /** Coordinates for an address. Prefers what Google already returned via Places
   *  (no extra call); otherwise resolves a stable placeholder by seed/area. */
  fromAddress(addr: Partial<ParsedAddress>, seed: string, serviceAreaId?: string): LatLng {
    if (typeof addr.latitude === "number" && typeof addr.longitude === "number") {
      return { lat: addr.latitude, lng: addr.longitude };
    }
    return mockGeocode(seed, serviceAreaId);
  },

  /** Live Google geocode for a free-text address. Used when we have an address
   *  string but no coordinates yet. Resolves null if Maps isn't loaded. */
  async geocode(query: string): Promise<{ point: LatLng; placeId?: string; formatted?: string } | null> {
    if (typeof google === "undefined" || !google.maps?.Geocoder) return null;
    const geocoder = new google.maps.Geocoder();
    try {
      const { results } = await geocoder.geocode({ address: query });
      const r = results?.[0];
      if (!r) return null;
      const loc = r.geometry.location;
      return { point: { lat: loc.lat(), lng: loc.lng() }, placeId: r.place_id, formatted: r.formatted_address };
    } catch {
      return null;
    }
  },

  /** A record is map-ready once it has coordinates. */
  isMapReady(addr: Partial<ParsedAddress>): boolean {
    return typeof addr.latitude === "number" && typeof addr.longitude === "number";
  },
};

// ── Drive time / distance ─────────────────────────────────
// Haversine estimate now; swap `between` for Google Distance Matrix (real road
// time + live traffic) without touching callers.
export const DriveTimeService = {
  between(a: LatLng, b: LatLng): { minutes: number; miles: number } {
    return { minutes: driveMinutes(a, b), miles: Math.round(haversineMiles(a, b) * 10) / 10 };
  },
};

// ── Routing ───────────────────────────────────────────────
// Nearest-first ordering placeholder; the seam for Google Directions waypoint
// optimization / a smarter route solver later.
export const RouteService = {
  /** Order stops greedily by nearest-next from a starting point. */
  orderNearest(start: LatLng, stops: LatLng[]): number[] {
    const remaining = stops.map((_, i) => i);
    const order: number[] = [];
    let cursor = start;
    while (remaining.length) {
      let best = 0, bestMi = Infinity;
      remaining.forEach((idx, k) => { const mi = haversineMiles(cursor, stops[idx]); if (mi < bestMi) { bestMi = mi; best = k; } });
      const idx = remaining.splice(best, 1)[0];
      order.push(idx); cursor = stops[idx];
    }
    return order;
  },
};
