// Technician Mobile — the field "Today" screen: current job, quick stats, and the
// day's stops with status chips. Rendered inside a PhoneFrame on the site.

import { Navigation, Phone, Clock, CheckCircle2, MapPin, Home } from "lucide-react";

const JOBS = [
  { time: "8:00", title: "AC Tune-up", who: "Bristow Residence", status: "Done", color: "#16a34a" },
  { time: "10:30", title: "Compressor Repair", who: "Kellerman HVAC", status: "En route", color: "#0891b2" },
  { time: "1:00", title: "Install Estimate", who: "Vance Property", status: "Scheduled", color: "#2563eb" },
];

export default function MobileAppMockup() {
  return (
    <div className="w-[270px] h-[560px] flex flex-col text-left" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* status bar space */}
      <div className="h-9" />
      <div className="px-4 pb-3">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>Tuesday · 3 stops left</p>
        <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Good morning, Marcus</p>
      </div>

      {/* Current job */}
      <div className="px-4">
        <div className="rounded-2xl p-3.5 text-white" style={{ background: "linear-gradient(135deg, #4f46e5, #6366f1)" }}>
          <p className="text-[11px] opacity-80">Next stop · 10:30 AM</p>
          <p className="text-base font-bold mt-0.5">Compressor Repair</p>
          <p className="text-xs opacity-90">Kellerman HVAC · 4.2 mi</p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <span className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.16)" }}><Navigation className="w-4 h-4" /> Navigate</span>
            <span className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold" style={{ backgroundColor: "rgba(255,255,255,0.16)" }}><Phone className="w-4 h-4" /> Call</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2.5 px-4 mt-3">
        {[{ i: Clock, l: "Hours today", v: "5.2h" }, { i: CheckCircle2, l: "Completed", v: "1 / 4" }].map((k, idx) => (
          <div key={idx} className="rounded-xl p-3" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <k.i className="w-4 h-4 mb-1.5" style={{ color: "var(--accent-text)" }} />
            <p className="text-lg font-bold leading-none" style={{ color: "var(--text-primary)" }}>{k.v}</p>
            <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{k.l}</p>
          </div>
        ))}
      </div>

      {/* Job list */}
      <div className="px-4 mt-4 space-y-2 flex-1 overflow-hidden">
        <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Today's route</p>
        {JOBS.map((j, i) => (
          <div key={i} className="rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <div className="text-center w-9 shrink-0">
              <p className="text-[11px] font-bold" style={{ color: "var(--text-primary)" }}>{j.time}</p>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{j.title}</p>
              <p className="text-[10px] truncate flex items-center gap-1" style={{ color: "var(--text-muted)" }}><MapPin className="w-3 h-3" />{j.who}</p>
            </div>
            <span className="text-[9px] font-semibold px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: j.color + "22", color: j.color }}>{j.status}</span>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-around px-2 py-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        {[Home, MapPin, CheckCircle2, Clock].map((Icon, i) => (
          <Icon key={i} className="w-5 h-5" style={{ color: i === 0 ? "#4f46e5" : "var(--text-muted)" }} />
        ))}
      </div>
    </div>
  );
}
