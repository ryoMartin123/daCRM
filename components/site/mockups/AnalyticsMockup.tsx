// Analytics & Reporting — a report canvas with KPI tiles, a revenue bar chart,
// and a booked-jobs trend line, the way an owner's dashboard is composed.

import { TrendingUp, DollarSign, Briefcase, Star } from "lucide-react";

const BARS = [42, 55, 48, 67, 60, 78, 71, 88];
const KPIS = [
  { i: DollarSign, l: "Revenue (MTD)", v: "$248,910", d: "+12.4%", up: true },
  { i: Briefcase, l: "Jobs completed", v: "1,284", d: "+6.1%", up: true },
  { i: Star, l: "Avg. review", v: "4.9", d: "+0.2", up: true },
];

export default function AnalyticsMockup() {
  return (
    <div className="h-[400px] p-4 overflow-hidden text-left" style={{ backgroundColor: "var(--bg-page)" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Operations Overview</p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Last 8 months · all locations</p>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md" style={{ backgroundColor: "var(--accent-soft-2-bg)", color: "var(--accent-text-strong)" }}>+ New widget</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-2.5">
        {KPIS.map((k, i) => (
          <div key={i} className="rounded-xl p-3" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <k.i className="w-4 h-4 mb-1.5" style={{ color: "var(--accent-text)" }} />
            <p className="text-lg font-bold leading-none" style={{ color: "var(--text-primary)" }}>{k.v}</p>
            <p className="text-[10px] mt-1 flex items-center gap-1" style={{ color: "#22c55e" }}><TrendingUp className="w-3 h-3" />{k.d}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-2.5">
        {/* Bar chart */}
        <div className="col-span-3 rounded-xl p-3" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Monthly revenue</p>
          <div className="flex items-end gap-2 h-[150px]">
            {BARS.map((h, i) => (
              <div key={i} className="flex-1 rounded-t-md" style={{ height: `${h}%`, background: i === BARS.length - 1 ? "linear-gradient(180deg,#6366f1,#4f46e5)" : "var(--bg-surface-2)" }} />
            ))}
          </div>
        </div>
        {/* Line trend */}
        <div className="col-span-2 rounded-xl p-3" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Booked jobs</p>
          <svg viewBox="0 0 160 110" className="w-full h-[150px]" fill="none" preserveAspectRatio="none">
            <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4f46e5" stopOpacity="0.3" /><stop offset="1" stopColor="#4f46e5" stopOpacity="0" /></linearGradient></defs>
            <path d="M5 85 L30 70 L55 78 L80 50 L105 56 L130 34 L155 20" stroke="#4f46e5" strokeWidth="2.5" />
            <path d="M5 85 L30 70 L55 78 L80 50 L105 56 L130 34 L155 20 L155 110 L5 110 Z" fill="url(#ag)" />
          </svg>
        </div>
      </div>
    </div>
  );
}
