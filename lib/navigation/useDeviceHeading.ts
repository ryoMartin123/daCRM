"use client";

// ─── Device compass heading ───────────────────────────────
// Reports which way the phone is physically pointing (degrees clockwise from
// true north), so the nav puck can show facing direction and react to rotation
// even while standing still — GPS `heading` only exists while moving.
//
// iOS gives an absolute compass via `webkitCompassHeading` but requires a
// permission grant from a USER GESTURE (call request() inside a tap handler).
// Other browsers expose `alpha` (no permission). Updates are written to a ref —
// NOT React state — because the events fire many times per second and the
// animation loop reads them directly; re-rendering on every tick would thrash.

import { useEffect, useRef, useState } from "react";

interface IOSOrientationEvent extends DeviceOrientationEvent { webkitCompassHeading?: number }
type OrientationPerm = { requestPermission?: () => Promise<"granted" | "denied" | "default"> };

export function useDeviceHeading(enabled: boolean) {
  const headingRef = useRef<number | null>(null);   // read by the rAF loop
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (!enabled || !granted || typeof window === "undefined") return;
    const onOrient = (e: IOSOrientationEvent) => {
      let h: number | null = null;
      if (typeof e.webkitCompassHeading === "number") {
        h = e.webkitCompassHeading;                 // iOS: already clockwise from north
      } else if (typeof e.alpha === "number" && e.absolute !== false) {
        h = 360 - e.alpha;                          // standard: alpha is counter-clockwise
      }
      if (h != null && !Number.isNaN(h)) headingRef.current = ((h % 360) + 360) % 360;
    };
    window.addEventListener("deviceorientationabsolute", onOrient as EventListener, true);
    window.addEventListener("deviceorientation", onOrient as EventListener, true);
    return () => {
      window.removeEventListener("deviceorientationabsolute", onOrient as EventListener, true);
      window.removeEventListener("deviceorientation", onOrient as EventListener, true);
    };
  }, [enabled, granted]);

  // Must be called from a user gesture (e.g. a tap) on iOS.
  const request = async (): Promise<boolean> => {
    try {
      const Ctor = (typeof window !== "undefined" ? window.DeviceOrientationEvent : undefined) as
        (typeof DeviceOrientationEvent & OrientationPerm) | undefined;
      if (Ctor && typeof Ctor.requestPermission === "function") {
        const res = await Ctor.requestPermission();
        const ok = res === "granted";
        setGranted(ok);
        return ok;
      }
      setGranted(true);   // non-iOS: no permission needed
      return true;
    } catch {
      setGranted(false);
      return false;
    }
  };

  return { headingRef, granted, request };
}
