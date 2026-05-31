"use client";

import { useEffect, useState } from "react";

// Shared singleton state — the Maps API only needs to load once per page session.
type LoadState = "idle" | "loading" | "loaded" | "error";

let _state: LoadState = "idle";
const _listeners = new Set<(s: LoadState) => void>();

function notify(next: LoadState) {
  _state = next;
  _listeners.forEach(fn => fn(next));
}

// Returns true once the Places library is actually available on the global.
function placesReady(): boolean {
  const g = (window as unknown as { google?: { maps?: { places?: unknown } } }).google;
  return Boolean(g?.maps?.places);
}

// With `loading=async`, the <script> onload fires before the `places` library
// is attached to `google.maps`. Poll until it's actually there.
function waitForPlaces(attempts = 0): void {
  if (placesReady()) {
    notify("loaded");
  } else if (attempts < 60) {            // ~6s max (60 × 100ms)
    setTimeout(() => waitForPlaces(attempts + 1), 100);
  } else {
    notify("error");                     // give up — degrade to manual entry
  }
}

function injectScript(apiKey: string): void {
  if (_state !== "idle") return;
  notify("loading");

  // Already injected (e.g. hot reload) — just wait for places to be ready.
  if (document.querySelector("script[data-gmaps]")) {
    waitForPlaces();
    return;
  }

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
  script.async = true;
  script.dataset.gmaps = "1";
  script.onload  = () => waitForPlaces();   // ← wait for places, not just the script
  script.onerror = () => notify("error");
  document.head.appendChild(script);
}

export function useGoogleMaps() {
  const [state, setState] = useState<LoadState>(() => _state);

  useEffect(() => {
    // Already resolved
    if (_state === "loaded") { setState("loaded"); return; }
    if (_state === "error")  { setState("error");  return; }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      notify("error");
      return;
    }

    const handler = (s: LoadState) => setState(s);
    _listeners.add(handler);
    if (_state === "idle") injectScript(apiKey);

    return () => { _listeners.delete(handler); };
  }, []);

  return {
    loaded:      state === "loaded",
    loading:     state === "loading" || state === "idle",
    unavailable: state === "error",   // no key or load failure — degrade gracefully
  };
}
