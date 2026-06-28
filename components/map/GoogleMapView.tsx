"use client";

// ─── GoogleMapView — primary CRM map provider ─────────────
// Google Maps is the CRM's map foundation (same ecosystem as our address
// validation/geocoding). This is the single reusable map surface: it owns all
// Google Maps imperative wiring (map, markers, clustering, traffic, route line)
// behind a small declarative prop API, so CRM features never touch the Google SDK
// directly. Swapping providers later means swapping only this file.

import { useEffect, useMemo, useRef } from "react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import {
  MARKER_CONFIG, TECH_STATUS_CONFIG, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM,
  type MapJob, type MapTech, type TechRoute,
} from "@/lib/dispatch-map/data";

const ACCENT = "#4f46e5"; // CRM indigo
const svgUrl = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

// Teardrop job pin — colored by status, white core, optional selection ring.
// `hovered` enlarges it ~20% for clear "you're over a clickable pin" feedback.
function jobPin(color: string, selected: boolean, hovered = false): google.maps.Icon {
  const bw = selected ? 40 : 27, bh = selected ? 52 : 35;
  const f = hovered ? 1.18 : 1;
  const w = Math.round(bw * f), h = Math.round(bh * f);
  const ring = selected ? `<circle cx="12" cy="12" r="7" fill="none" stroke="#ffffff" stroke-width="2"/><circle cx="12" cy="12" r="2.2" fill="#ffffff"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 24 32"><path d="M12 0C5.37 0 0 5.37 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.37 18.63 0 12 0z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/><circle cx="12" cy="12" r="4.4" fill="#ffffff"/>${ring}</svg>`;
  return { url: svgUrl(svg), scaledSize: new google.maps.Size(w, h), anchor: new google.maps.Point(w / 2, h) };
}
// Rounded-square tech marker with initials — visually distinct from job pins.
function techPin(color: string, initials: string): google.maps.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" rx="9" fill="${color}" stroke="#ffffff" stroke-width="2.5"/><text x="16" y="21" text-anchor="middle" fill="#ffffff" font-size="13" font-weight="700" font-family="system-ui, sans-serif">${initials}</text></svg>`;
  return { url: svgUrl(svg), scaledSize: new google.maps.Size(30, 30), anchor: new google.maps.Point(15, 15) };
}

export interface GoogleMapViewProps {
  jobs: MapJob[];
  techs: MapTech[];
  route?: TechRoute | null;
  selectedJobId?: string | null;
  onSelectJob?: (id: string) => void;
  flyTo?: { lat: number; lng: number } | null;
  showTechs?: boolean;
  traffic?: boolean;
  cluster?: boolean;
  /** Follow real roads via Google Directions (traffic-aware) instead of straight
   *  lines. Reports back the live drive time/distance via onRouteMeta. */
  roadRoute?: boolean;
  onRouteMeta?: (meta: { durationMin: number; distanceMi: number; live: boolean } | null) => void;
}

export default function GoogleMapView({ jobs, techs, route, selectedJobId, onSelectJob, flyTo, showTechs = true, traffic = false, cluster = true, roadRoute = true, onRouteMeta }: GoogleMapViewProps) {
  const { loaded, unavailable } = useGoogleMaps();

  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const jobMarkersRef = useRef<google.maps.Marker[]>([]);
  const techMarkersRef = useRef<google.maps.Marker[]>([]);
  const polyRef = useRef<google.maps.Polyline | null>(null);
  const dirServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const dirRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const routeTokenRef = useRef(0);
  const trafficRef = useRef<google.maps.TrafficLayer | null>(null);
  const pulseRef = useRef<google.maps.OverlayView | null>(null);
  const didFitRef = useRef(false);
  const lastFlyRef = useRef("");
  const onSelectRef = useRef(onSelectJob);
  onSelectRef.current = onSelectJob;
  const onRouteMetaRef = useRef(onRouteMeta);
  onRouteMetaRef.current = onRouteMeta;

  // Callers pass freshly-filtered arrays every render, so depend on a stable
  // CONTENT signature — markers/route only rebuild when something actually
  // changed, not on every parent re-render (which otherwise flickers the pins
  // and fires redundant Directions requests).
  const jobsSig = useMemo(() => jobs.map(j => `${j.id}:${j.lat.toFixed(5)},${j.lng.toFixed(5)}:${j.kind}`).join("|") + `#${selectedJobId ?? ""}`, [jobs, selectedJobId]);
  const techsSig = useMemo(() => techs.filter(t => t.current).map(t => `${t.name}:${t.current!.lat.toFixed(5)},${t.current!.lng.toFixed(5)}:${t.status}`).join("|"), [techs]);
  const routeSig = useMemo(() => (route?.path ?? []).map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join("|"), [route]);

  // Init the map once.
  useEffect(() => {
    if (!loaded || !divRef.current || mapRef.current) return;
    mapRef.current = new google.maps.Map(divRef.current, {
      center: MAP_DEFAULT_CENTER, zoom: MAP_DEFAULT_ZOOM,
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false, zoomControl: false,
      clickableIcons: false, gestureHandling: "greedy",
    });
  }, [loaded]);

  // Job markers (+ clustering when enabled).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    clustererRef.current?.clearMarkers();
    jobMarkersRef.current.forEach(m => m.setMap(null));

    const markers = jobs.map(j => {
      const color = MARKER_CONFIG[j.kind].color;
      const isSel = j.id === selectedJobId;
      const marker = new google.maps.Marker({
        position: { lat: j.lat, lng: j.lng },
        icon: jobPin(color, isSel),
        title: `${j.customerName} — ${j.title}`,
        cursor: "pointer",
        zIndex: isSel ? 999 : 1,
      });
      marker.addListener("click", () => onSelectRef.current?.(j.id));
      // Hover affordance: grow the pin and lift it above its neighbors.
      marker.addListener("mouseover", () => { marker.setIcon(jobPin(color, isSel, true)); marker.setZIndex(1000); });
      marker.addListener("mouseout", () => { marker.setIcon(jobPin(color, isSel)); marker.setZIndex(isSel ? 999 : 1); });
      return marker;
    });
    jobMarkersRef.current = markers;

    if (cluster) {
      if (!clustererRef.current) clustererRef.current = new MarkerClusterer({ map });
      clustererRef.current.addMarkers(markers);
    } else {
      markers.forEach(m => m.setMap(map));
    }

    if (!didFitRef.current && markers.length) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach(m => { const p = m.getPosition(); if (p) bounds.extend(p); });
      map.fitBounds(bounds, 64);
      didFitRef.current = true;
    }
    return () => { clustererRef.current?.clearMarkers(); markers.forEach(m => m.setMap(null)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- jobsSig captures job content
  }, [jobsSig, cluster, loaded]);

  // Technician markers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    techMarkersRef.current.forEach(m => m.setMap(null));
    if (!showTechs) { techMarkersRef.current = []; return; }
    techMarkersRef.current = techs.filter(t => t.current).map(t => new google.maps.Marker({
      position: { lat: t.current!.lat, lng: t.current!.lng }, map,
      icon: techPin(TECH_STATUS_CONFIG[t.status].color, t.initials),
      title: `${t.name} · ${TECH_STATUS_CONFIG[t.status].label}`,
      zIndex: 500,
    }));
    return () => { techMarkersRef.current.forEach(m => m.setMap(null)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- techsSig captures tech content
  }, [techsSig, showTechs, loaded]);

  // Route — real road geometry via Directions (traffic-aware) with a straight-
  // line fallback. The tech's location is the origin; their scheduled jobs are
  // the ordered waypoints, so the drawn route is what they'd actually drive.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const token = ++routeTokenRef.current;
    const clearAll = () => { polyRef.current?.setMap(null); polyRef.current = null; dirRendererRef.current?.setMap(null); };
    clearAll();

    const pts = route?.path ?? [];
    if (pts.length < 2) { onRouteMetaRef.current?.(null); return; }

    const drawStraight = () => {
      polyRef.current = new google.maps.Polyline({ path: pts.map(p => ({ lat: p.lat, lng: p.lng })), map, strokeColor: ACCENT, strokeOpacity: 0.85, strokeWeight: 4 });
    };

    if (!roadRoute) { drawStraight(); onRouteMetaRef.current?.(null); return; }

    if (!dirServiceRef.current) dirServiceRef.current = new google.maps.DirectionsService();
    if (!dirRendererRef.current) dirRendererRef.current = new google.maps.DirectionsRenderer({
      suppressMarkers: true, preserveViewport: true, suppressInfoWindows: true,
      polylineOptions: { strokeColor: ACCENT, strokeOpacity: 0.9, strokeWeight: 5 },
    });

    dirServiceRef.current.route({
      origin: pts[0],
      destination: pts[pts.length - 1],
      waypoints: pts.slice(1, -1).map(p => ({ location: p, stopover: true })),
      travelMode: google.maps.TravelMode.DRIVING,
      drivingOptions: { departureTime: new Date(), trafficModel: google.maps.TrafficModel.BEST_GUESS },
    }, (res, status) => {
      if (token !== routeTokenRef.current) return; // a newer route superseded this request
      if (status === google.maps.DirectionsStatus.OK && res) {
        dirRendererRef.current!.setMap(map);
        dirRendererRef.current!.setDirections(res);
        const legs = res.routes[0]?.legs ?? [];
        const secs = legs.reduce((s, l) => s + (l.duration_in_traffic?.value ?? l.duration?.value ?? 0), 0);
        const meters = legs.reduce((s, l) => s + (l.distance?.value ?? 0), 0);
        onRouteMetaRef.current?.({ durationMin: Math.round(secs / 60), distanceMi: Math.round(meters / 1609.34 * 10) / 10, live: legs.some(l => !!l.duration_in_traffic) });
      } else {
        drawStraight();                 // Directions unavailable (e.g. API not enabled) → straight fallback
        onRouteMetaRef.current?.(null);
      }
    });

    return () => { clearAll(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- routeSig captures route content
  }, [routeSig, roadRoute, loaded]);

  // Traffic layer.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (traffic) {
      if (!trafficRef.current) trafficRef.current = new google.maps.TrafficLayer();
      trafficRef.current.setMap(map);
    } else {
      trafficRef.current?.setMap(null);
    }
  }, [traffic, loaded]);

  // Selected-job pulse — a sonar ring behind the selected pin so it's obvious
  // which marker the clicked job is tied to.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    pulseRef.current?.setMap(null); pulseRef.current = null;
    const sel = jobs.find(j => j.id === selectedJobId);
    if (!sel) return;
    const color = MARKER_CONFIG[sel.kind].color;
    const lat = sel.lat, lng = sel.lng;
    class Pulse extends google.maps.OverlayView {
      div?: HTMLDivElement;
      onAdd() {
        const d = document.createElement("div");
        d.className = "map-pulse";
        d.style.setProperty("--pulse-color", color);
        this.div = d;
        this.getPanes()?.overlayLayer.appendChild(d);
      }
      draw() {
        const p = this.getProjection()?.fromLatLngToDivPixel(new google.maps.LatLng(lat, lng));
        if (p && this.div) { this.div.style.left = `${p.x}px`; this.div.style.top = `${p.y}px`; }
      }
      onRemove() { this.div?.remove(); this.div = undefined; }
    }
    const overlay = new Pulse();
    overlay.setMap(map);
    pulseRef.current = overlay;
    // The wave is just an attention cue — fade it out after 10s so it doesn't
    // pulse forever on the selected pin.
    const timer = window.setTimeout(() => { overlay.setMap(null); if (pulseRef.current === overlay) pulseRef.current = null; }, 10000);
    return () => { window.clearTimeout(timer); overlay.setMap(null); pulseRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJobId, jobsSig, loaded]);

  // Pan to the focused point ONLY when it actually changes — `flyTo` is a fresh
  // object every render, so without this the map would re-pan/zoom on every
  // re-render (e.g. as geocoding results arrive) and fight the user.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTo) return;
    const key = `${flyTo.lat.toFixed(5)},${flyTo.lng.toFixed(5)}`;
    if (key === lastFlyRef.current) return;
    lastFlyRef.current = key;
    map.panTo(flyTo);
    if (map.getZoom()! < 13) map.setZoom(13);
  }, [flyTo]);

  if (unavailable) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6 text-center" style={{ backgroundColor: "var(--bg-surface-2)" }}>
        <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>
          Map unavailable — set <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable Google Maps.
        </p>
      </div>
    );
  }
  return (
    <div className="relative h-full w-full">
      <div ref={divRef} className="h-full w-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)", backgroundColor: "var(--bg-surface-2)" }}>Loading map…</div>
      )}
    </div>
  );
}
