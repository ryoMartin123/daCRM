// Dispatch & Routing — a faithful recreation of the live dispatch board: a map
// rail with route pins beside technician columns of scheduled job cards.

const TECHS = [
  { name: "Marcus R.", initials: "MR", jobs: [
    { t: "8:00", title: "AC Tune-up", who: "Bristow Residence", color: "#4f46e5", h: 46 },
    { t: "10:30", title: "Compressor Repair", who: "Kellerman HVAC", color: "#ef4444", h: 64 },
    { t: "1:00", title: "Install Estimate", who: "Vance Property", color: "#8b5cf6", h: 46 },
  ] },
  { name: "Dana W.", initials: "DW", jobs: [
    { t: "8:30", title: "Maintenance Visit", who: "Atlas Plaza", color: "#6366f1", h: 46 },
    { t: "11:00", title: "No-Cool Service", who: "Okafor Home", color: "#f59e0b", h: 56 },
  ] },
  { name: "Priya S.", initials: "PS", jobs: [
    { t: "9:00", title: "Filter Replacement", who: "Lindgren Bldg", color: "#10b981", h: 46 },
    { t: "12:30", title: "Thermostat Install", who: "Reyes Residence", color: "#0891b2", h: 50 },
  ] },
];

export default function DispatchMockup() {
  return (
    <div className="flex h-[400px] text-left" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* Map rail */}
      <div className="hidden sm:block w-[34%] relative site-grid-bg border-r" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(40% 40% at 30% 30%, rgba(79,70,229,0.18), transparent 70%)" }} />
        {/* route line */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 400" fill="none" preserveAspectRatio="none">
          <path d="M40 70 C 90 120, 60 200, 130 230 S 120 330, 70 350" stroke="#4f46e5" strokeWidth="2.5" strokeDasharray="6 6" opacity="0.7" />
        </svg>
        {[["18%", "20%", "#4f46e5"], ["62%", "55%", "#ef4444"], ["32%", "84%", "#10b981"], ["70%", "30%", "#f59e0b"]].map(([l, t, c], i) => (
          <span key={i} className="absolute w-3.5 h-3.5 rounded-full" style={{ left: l as string, top: t as string, backgroundColor: c as string, boxShadow: `0 0 0 4px ${c}33` }} />
        ))}
        <div className="absolute bottom-3 left-3 right-3 rounded-lg px-3 py-2 text-[11px]" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
          <span style={{ color: "var(--text-primary)" }} className="font-semibold">3 routes</span> · 18 stops · optimized
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between px-4 h-11 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Tuesday, Jun 24</span>
          <span className="flex gap-1">
            {["Board", "Map", "Week"].map((t, i) => (
              <span key={t} className="px-2.5 py-1 rounded-md text-[11px] font-medium" style={i === 0 ? { backgroundColor: "var(--accent-soft-2-bg)", color: "var(--accent-text-strong)" } : { color: "var(--text-muted)" }}>{t}</span>
            ))}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-px h-[calc(400px-2.75rem)]" style={{ backgroundColor: "var(--border-subtle)" }}>
          {TECHS.map(tech => (
            <div key={tech.name} className="px-2 pt-2 overflow-hidden" style={{ backgroundColor: "var(--bg-page)" }}>
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: "#4f46e5" }}>{tech.initials}</span>
                <span className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{tech.name}</span>
              </div>
              <div className="space-y-1.5">
                {tech.jobs.map((j, i) => (
                  <div key={i} className="rounded-lg px-2.5 py-1.5 overflow-hidden" style={{ height: j.h, backgroundColor: j.color + "1a", borderLeft: `3px solid ${j.color}` }}>
                    <div className="text-[10px] font-semibold" style={{ color: "var(--text-muted)" }}>{j.t}</div>
                    <div className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>{j.title}</div>
                    <div className="text-[10px] truncate" style={{ color: "var(--text-secondary)" }}>{j.who}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
