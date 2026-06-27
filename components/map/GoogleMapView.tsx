"use client";

// ─── GoogleMapView — primary CRM map provider ─────────────
// Google Maps is the CRM's map foundation (same ecosystem as our address
// validation/geocoding). This is the single reusable map surface: it owns all
// Google Maps imperative wiring (map, markers, clustering, traffic, route line)
// behind a small declarative prop API, so CRM features never touch the Google SDK
// directly. Swapping providers later means swapping only this file.

import { useEffect, useRef } from "react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import {
  MARKER_CONFIG, TECH_STATUS_CONFIG, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM,
  type MapJob, type MapTech, type TechRoute,
} from "@/lib/dispatch-map/data";

const ACCENT = "#4f46e5"; // CRM indigo
const svgUrl = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

// Teardrop job pin — colored by status, white core, optional selection ring.
function jobPin(color: string, selected: boolean): google.maps.Icon {
  const w = selected ? 34 : 27, h = selected ? 44 : 35;
  const ring = selected ? `<circle cx="12" cy="12" r="6.6" fill="none" stroke="#ffffff" stroke-width="1.4" opacity="0.9"/>` : "";
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
}

export default function GoogleMapView({ jobs, techs, route, selectedJobId, onSelectJob, flyTo, showTechs = true, traffic = false, cluster = true }: GoogleMapViewProps) {
  const { loaded, unavailable } = useGoogleMaps();

  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const jobMarkersRef = useRef<google.maps.Marker[]>([]);
  const techMarkersRef = useRef<google.maps.Marker[]>([]);
  const polyRef = useRef<google.maps.Polyline | null>(null);
  const trafficRef = useRef<google.maps.TrafficLayer | null>(null);
  const didFitRef = useRef(false);
  const lastFlyRef = useRef("");
  const onSelectRef = useRef(onSelectJob);
  onSelectRef.current = onSelectJob;

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
      const marker = new google.maps.Marker({
        position: { lat: j.lat, lng: j.lng },
        icon: jobPin(MARKER_CONFIG[j.kind].color, j.id === selectedJobId),
        title: `${j.customerName} — ${j.title}`,
        zIndex: j.id === selectedJobId ? 999 : undefined,
      });
      marker.addListener("click", () => onSelectRef.current?.(j.id));
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
  }, [jobs, selectedJobId, cluster, loaded]);

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
  }, [techs, showTechs, loaded]);

  // Route polyline.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    polyRef.current?.setMap(null);
    if (route && route.path.length > 1) {
      polyRef.current = new google.maps.Polyline({
        path: route.path.map(p => ({ lat: p.lat, lng: p.lng })), map,
        strokeColor: ACCENT, strokeOpacity: 0.85, strokeWeight: 4,
      });
    }
    return () => { polyRef.current?.setMap(null); };
  }, [route, loaded]);

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
