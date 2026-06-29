"use client";

// ─── Hero product stage ───────────────────────────────────
// The centerpiece "product reel": a browser stage that auto-cycles through real
// module scenes with a crossfade, a live-updating address bar, and a clickable
// module tab strip. This is what makes the hero feel like a connected platform
// reveal rather than a single static screenshot.

import { useEffect, useState } from "react";
import { Users, CalendarRange, BarChart3, Megaphone, type LucideIcon } from "lucide-react";
import DispatchMockup from "./mockups/DispatchMockup";
import CrmMockup from "./mockups/CrmMockup";
import AnalyticsMockup from "./mockups/AnalyticsMockup";
import AutomationMockup from "./mockups/AutomationMockup";

interface Scene { id: string; label: string; url: string; icon: LucideIcon; node: React.ReactNode }

const SCENES: Scene[] = [
  { id: "dispatch", label: "Dispatch", url: "app.routiqa.com/dispatching", icon: CalendarRange, node: <DispatchMockup /> },
  { id: "crm",      label: "CRM & Jobs", url: "app.routiqa.com/customers", icon: Users, node: <CrmMockup /> },
  { id: "analytics",label: "Analytics", url: "app.routiqa.com/analytics", icon: BarChart3, node: <AnalyticsMockup /> },
  { id: "marketing",label: "Automation", url: "app.routiqa.com/marketing", icon: Megaphone, node: <AutomationMockup /> },
];

export default function HeroStage() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI(x => (x + 1) % SCENES.length), 3400);
    return () => clearInterval(t);
  }, [paused]);

  const active = SCENES[i];

  return (
    <div
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      className="rounded-2xl overflow-hidden w-full"
      style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 40px 100px -30px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.05)" }}
    >
      {/* chrome */}
      <div className="flex items-center gap-2 px-3.5 h-10 border-b" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
        <span className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#22c55e" }} />
        </span>
        <span className="mx-auto px-3 h-6 rounded-md text-[11px] flex items-center gap-1.5 transition-all" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#22c55e" }} />
          {active.url}
        </span>
      </div>

      {/* module tab strip */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b overflow-x-auto" style={{ borderColor: "var(--border-subtle)" }}>
        {SCENES.map((s, idx) => {
          const on = idx === i;
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setI(idx)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
              style={on ? { backgroundColor: "var(--accent-soft-2-bg)", color: "var(--accent-text-strong)" } : { color: "var(--text-muted)" }}>
              <Icon className="w-3.5 h-3.5" /> {s.label}
            </button>
          );
        })}
      </div>

      {/* crossfading scene area */}
      <div className="relative" style={{ height: 400 }}>
        {SCENES.map((s, idx) => (
          <div key={s.id} className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: idx === i ? 1 : 0, pointerEvents: idx === i ? "auto" : "none" }} aria-hidden={idx !== i}>
            {s.node}
          </div>
        ))}
        {/* progress ticks */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {SCENES.map((s, idx) => (
            <span key={s.id} className="h-1 rounded-full transition-all" style={{ width: idx === i ? 22 : 6, backgroundColor: idx === i ? "#4f46e5" : "var(--border)" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
