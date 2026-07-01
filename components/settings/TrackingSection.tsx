"use client";

// ─── Settings → Tracking ──────────────────────────────────
// Review a technician's past GPS routes for any day in the 30-day retention
// window: pick a tech + date, see the breadcrumb on the map plus a summary
// (distance, active window, time on the move, stops). Read-only.

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Navigation, MapPin, Clock, Route as RouteIcon, Gauge, Flag } from "lucide-react";
import UiSelect from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import {
  fetchTrackedTechs, fetchTechHistory, summarizeTrail, dayBoundsISO, retentionMinDate,
  type TechLocation, type TrailSummary,
} from "@/lib/tech-tracking/data";

const GoogleMapView = dynamic(() => import("@/components/map/GoogleMapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>Loading map…</div>,
});

const pad = (n: number) => String(n).padStart(2, "0");
const localYMD = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtTime = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—");
const fmtDuration = (min: number) => { const h = Math.floor(min / 60), m = min % 60; return h > 0 ? `${h}h ${m}m` : `${m}m`; };

export default function TrackingSection() {
  const [techs, setTechs] = useState<string[]>([]);
  const [tech, setTech] = useState<string>("");
  const [date, setDate] = useState<string>(localYMD());
  const [points, setPoints] = useState<TechLocation[]>([]);
  const [loading, setLoading] = useState(false);

  // Tech list (one row per tech in the latest table) — loaded once.
  useEffect(() => {
    let cancelled = false;
    fetchTrackedTechs().then(list => {
      if (cancelled) return;
      setTechs(list);
      setTech(prev => prev || list[0] || "");
    });
    return () => { cancelled = true; };
  }, []);

  // Selected tech's route for the selected day.
  useEffect(() => {
    if (!tech) { setPoints([]); return; }
    let cancelled = false;
    setLoading(true);
    const { fromISO, toISO } = dayBoundsISO(date);
    fetchTechHistory(tech, fromISO, toISO).then(pts => { if (!cancelled) { setPoints(pts); setLoading(false); } });
    return () => { cancelled = true; };
  }, [tech, date]);

  const summary = useMemo<TrailSummary>(() => summarizeTrail(points), [points]);
  const trail = useMemo(() => points.map(p => ({ lat: p.lat, lng: p.lng })), [points]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="rounded-xl p-4 flex flex-wrap items-end gap-3" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <div className="min-w-[200px]">
          <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Technician</label>
          {techs.length ? (
            <UiSelect value={tech} onChange={setTech} options={techs.map(n => ({ value: n, label: n }))} />
          ) : (
            <p className="text-sm py-1.5" style={{ color: "var(--text-muted)" }}>No tracked technicians yet.</p>
          )}
        </div>
        <div className="min-w-[170px]">
          <label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Date</label>
          <DatePicker value={date} onChange={v => v && setDate(v)} min={retentionMinDate()} max={localYMD()} clearable={false} />
        </div>
        <p className="text-[11px] ml-auto flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
          <Navigation className="w-3.5 h-3.5" /> History retained for 30 days
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat icon={RouteIcon} label="Distance" value={`${summary.distanceMi} mi`} />
        <Stat icon={Clock} label="Active window" value={summary.firstAt ? `${fmtTime(summary.firstAt)} – ${fmtTime(summary.lastAt)}` : "—"} />
        <Stat icon={Gauge} label="On the move" value={fmtDuration(summary.durationMin)} />
        <Stat icon={Flag} label="Stops" value={String(summary.stops)} />
      </div>

      {/* Route map */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", height: 460 }}>
        {loading ? (
          <div className="h-full w-full flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>Loading route…</div>
        ) : trail.length >= 2 ? (
          <GoogleMapView jobs={[]} techs={[]} trail={trail} fitTrail showTechs={false} />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-center px-6" style={{ color: "var(--text-muted)" }}>
            <MapPin className="w-6 h-6" />
            <p className="text-sm">No route recorded{tech ? ` for ${tech}` : ""} on this day.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Navigation; label: string; value: string }) {
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p>
      </div>
      <p className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}
