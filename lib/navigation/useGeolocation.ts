"use client";

// ─── Geolocation watch hook ───────────────────────────────
// Watches the device position while navigation is active. Uses watchPosition
// (high accuracy) and reports each fix; throttling of backend/session writes is
// the caller's job. onUpdate is held in a ref so changing it doesn't re-subscribe.

import { useEffect, useRef, useState } from "react";
import type { LatLng } from "./types";

export interface Fix extends LatLng { heading?: number; speed?: number; accuracy?: number; at: number }

export function useWatchPosition(active: boolean, onUpdate?: (fix: Fix) => void) {
  const [position, setPosition] = useState<Fix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cb = useRef(onUpdate); cb.current = onUpdate;

  useEffect(() => {
    if (!active) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) { setError("Geolocation unavailable"); return; }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const fix: Fix = {
          lat: p.coords.latitude, lng: p.coords.longitude,
          heading: p.coords.heading ?? undefined, speed: p.coords.speed ?? undefined,
          accuracy: p.coords.accuracy, at: Date.now(),
        };
        setError(null); setPosition(fix); cb.current?.(fix);
      },
      (e) => setError(e.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [active]);

  return { position, error };
}
