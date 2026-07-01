"use client";

// ─── LocationReporter ─────────────────────────────────────
// Mounted once in the mobile PWA shell. While the field tech is clocked in
// (whole-shift tracking), it watches the device GPS and reports throttled fixes
// to the tech-tracking store, which the desktop dispatch board renders live.
// On clock-out / unmount it stops the watch and marks the tech idle.
//
// Foreground-only by design: a browser PWA can read GPS reliably only while the
// app is open. True background tracking needs a native wrapper — a later phase.

import { useEffect, useRef, useState } from "react";
import { getCurrentTech, getClockState } from "@/lib/mobile/data";
import { reportLocation, setTechOffDuty, type TechLocation } from "@/lib/tech-tracking/data";
import { DATA_EVENT } from "@/lib/sync/liveData";

const MIN_INTERVAL_MS = 3_000;  // near-real-time: report at most ~every 3s while moving …
const MIN_MOVE_M = 8;           // … or as soon as they've moved ~8m
const HEARTBEAT_MS = 30_000;    // presence ping cadence (keeps the board's state honest)
const GPS_ACTIVE_WINDOW = 75_000; // no real fix for this long while clocked in → "GPS paused" (blue)

function haversineM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLng = toRad(bLng - aLng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function LocationReporter() {
  const [clockedIn, setClockedIn] = useState(false);

  // The Time Card toggles a localStorage flag; mirror it here (same-doc event,
  // cross-tab storage, focus, plus a slow poll as a safety net).
  useEffect(() => {
    const sync = () => setClockedIn(getClockState().in);
    sync();
    window.addEventListener(DATA_EVENT, sync);
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    const iv = window.setInterval(sync, 15_000);
    return () => {
      window.removeEventListener(DATA_EVENT, sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
      window.clearInterval(iv);
    };
  }, []);

  const lastRef = useRef<{ t: number; lat: number; lng: number } | null>(null);   // throttle gate
  const lastFixRef = useRef<{ t: number; lat: number; lng: number } | null>(null); // last real GPS fix
  const errorRef = useRef<string | null>(null);

  useEffect(() => {
    if (!clockedIn) { errorRef.current = null; return; }
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const me = getCurrentTech();
    if (!me?.fullName) return;
    const assign = me.assignments?.[0];
    let stopped = false;

    // A presence ping at the last-known position — carries clock-in + GPS health
    // even when there's no new fix (so blue/red states can be shown).
    const presence = (gpsActive: boolean, gpsError?: string): TechLocation | null => {
      const fix = lastFixRef.current;
      if (!fix) return null;   // no position ever → can't place a marker
      return {
        techName: me.fullName, companyId: assign?.companyId, locationId: assign?.locationId,
        lat: fix.lat, lng: fix.lng, onDuty: true, gpsActive, gpsError,
        recordedAt: new Date().toISOString(),
      };
    };

    const onPos = (pos: GeolocationPosition) => {
      if (stopped) return;
      errorRef.current = null;                        // fixes flowing → clear any prior error
      const { latitude, longitude, heading, speed, accuracy } = pos.coords;
      const now = Date.now();
      lastFixRef.current = { t: now, lat: latitude, lng: longitude };
      const last = lastRef.current;
      const movedFar = last ? haversineM(last.lat, last.lng, latitude, longitude) >= MIN_MOVE_M : true;
      const elapsed = last ? now - last.t : Infinity;
      if (last && !movedFar && elapsed < MIN_INTERVAL_MS) return; // throttle identical stationary fixes
      lastRef.current = { t: now, lat: latitude, lng: longitude };
      reportLocation({
        techName: me.fullName, companyId: assign?.companyId, locationId: assign?.locationId,
        lat: latitude, lng: longitude,
        heading: heading == null || Number.isNaN(heading) ? undefined : heading,
        speed: speed == null || Number.isNaN(speed) ? undefined : speed,
        accuracy: accuracy ?? undefined,
        onDuty: true, gpsActive: true, recordedAt: new Date().toISOString(),
      });
    };

    const onErr = (e: GeolocationPositionError) => {
      // 1 = permission denied (persistent), 2/3 = position unavailable / timeout.
      errorRef.current = e.code === 1 ? "permission" : "unavailable";
      const p = presence(false, errorRef.current);       // surfaces as red at last-known
      if (p) reportLocation(p, { trail: false });
      console.warn("[location] geolocation error:", e.message);
    };

    const watchId = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true, maximumAge: 0, timeout: 27_000,  // maximumAge 0 = always a fresh fix
    });

    // Heartbeat — keep the board's read honest without new GPS events: green while
    // fixes are recent, blue (GPS paused) once they stop, red on a standing error.
    const beat = window.setInterval(() => {
      if (stopped) return;
      const fix = lastFixRef.current;
      if (!fix) return;
      const p = errorRef.current
        ? presence(false, errorRef.current)                        // red — error persists
        : Date.now() - fix.t < GPS_ACTIVE_WINDOW
          ? presence(true)                                         // green — still streaming
          : presence(false);                                       // blue — clocked in, GPS paused
      if (p) reportLocation(p, { trail: false });
    }, HEARTBEAT_MS);

    return () => {
      stopped = true;
      navigator.geolocation.clearWatch(watchId);
      window.clearInterval(beat);
      setTechOffDuty(me.fullName);
    };
  }, [clockedIn]);

  return null;
}
