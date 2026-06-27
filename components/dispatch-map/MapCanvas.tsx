"use client";

// ─── Dispatch map canvas (Leaflet) ────────────────────────
// Client-only — imported via next/dynamic({ ssr:false }) from DispatchMap, since
// Leaflet needs `window`. Renders OSM tiles, colored job pins, technician/truck
// markers, and the highlighted route. Markers use L.divIcon (HTML) so we avoid
// Leaflet's default-icon asset path issues and can theme freely. Live GPS later
// just means feeding real `tech.current` coords — no canvas changes.

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MARKER_CONFIG, TECH_STATUS_CONFIG, MAP_DEFAULT_CENTER, MAP_DEFAULT_ZOOM,
  type MapJob, type MapTech, type TechRoute,
} from "@/lib/dispatch-map/data";

function jobIcon(job: MapJob, selected: boolean): L.DivIcon {
  const color = MARKER_CONFIG[job.kind].color;
  const ring = selected ? "box-shadow:0 0 0 4px rgba(225,29,72,0.35);" : "box-shadow:0 1px 4px rgba(0,0,0,0.4);";
  const size = selected ? 30 : 24;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;${ring}display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700;">${job.kind === "emergency" ? "!" : ""}</div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}
function techIcon(tech: MapTech): L.DivIcon {
  const color = TECH_STATUS_CONFIG[tech.status].color;
  return L.divIcon({
    className: "",
    html: `<div style="width:30px;height:30px;border-radius:9px;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;">${tech.initials}</div>`,
    iconSize: [30, 30], iconAnchor: [15, 15],
  });
}

// Pan the map to the focused point when the selection changes.
function FlyTo({ point }: { point: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => { if (point) map.flyTo([point.lat, point.lng], Math.max(map.getZoom(), 13), { duration: 0.6 }); }, [point, map]);
  return null;
}

export default function MapCanvas({
  jobs, techs, route, selectedJobId, onSelectJob, flyTo, showTechs = true,
}: {
  jobs: MapJob[];
  techs: MapTech[];
  route?: TechRoute | null;
  selectedJobId?: string | null;
  onSelectJob?: (id: string) => void;
  flyTo?: { lat: number; lng: number } | null;
  showTechs?: boolean;
}) {
  return (
    <MapContainer center={[MAP_DEFAULT_CENTER.lat, MAP_DEFAULT_CENTER.lng]} zoom={MAP_DEFAULT_ZOOM}
      scrollWheelZoom style={{ height: "100%", width: "100%", backgroundColor: "var(--bg-surface-2)" }}>
      <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FlyTo point={flyTo ?? null} />

      {route && route.path.length > 1 && (
        <Polyline positions={route.path.map(p => [p.lat, p.lng] as [number, number])} pathOptions={{ color: "#e11d48", weight: 3, opacity: 0.7, dashArray: "6 6" }} />
      )}

      {jobs.map(j => (
        <Marker key={j.id} position={[j.lat, j.lng]} icon={jobIcon(j, j.id === selectedJobId)}
          eventHandlers={{ click: () => onSelectJob?.(j.id) }}>
          <Popup>
            <div style={{ minWidth: 180 }}>
              <p style={{ fontWeight: 700, margin: 0 }}>{j.customerName}</p>
              <p style={{ margin: "2px 0", color: "#6b7280", fontSize: 12 }}>{j.title}</p>
              <p style={{ margin: "2px 0", fontSize: 12 }}>{j.address || "No address"}</p>
              <p style={{ margin: "2px 0", fontSize: 12 }}>
                {j.scheduledTime || "Unscheduled"} · {j.durationMinutes}m · {MARKER_CONFIG[j.kind].label}
              </p>
              <p style={{ margin: "2px 0 6px", fontSize: 12 }}>{j.assignedTo ? `Tech: ${j.assignedTo}` : "Unassigned"}</p>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => onSelectJob?.(j.id)} style={{ fontSize: 12, fontWeight: 600, color: "#e11d48", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Open in panel</button>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${j.lat},${j.lng}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#2563eb" }}>Directions</a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {showTechs && techs.filter(t => t.current).map(t => (
        <Marker key={t.name} position={[t.current!.lat, t.current!.lng]} icon={techIcon(t)}>
          <Popup>
            <div style={{ minWidth: 160 }}>
              <p style={{ fontWeight: 700, margin: 0 }}>{t.name}</p>
              <p style={{ margin: "2px 0", fontSize: 12, color: TECH_STATUS_CONFIG[t.status].color }}>{TECH_STATUS_CONFIG[t.status].label}</p>
              <p style={{ margin: "2px 0", fontSize: 12 }}>{t.truck} · {t.skills.join(", ")}</p>
              <p style={{ margin: "2px 0", fontSize: 12, color: "#6b7280" }}>Last check-in {t.lastCheckIn}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
