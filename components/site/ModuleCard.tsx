// ─── Floating module card ─────────────────────────────────
// A small, premium glass card representing a platform module in the hero's
// orbit. Positioned absolutely (center anchored) and gently floated. The mini
// visual (children) hints at the module without a full mockup.

import type { LucideIcon } from "lucide-react";

export default function ModuleCard({
  icon: Icon, title, left, top, delay = 0, children,
}: {
  icon: LucideIcon; title: string; left: string; top: string; delay?: number; children?: React.ReactNode;
}) {
  return (
    <div
      className="site-float absolute z-20 w-[156px] rounded-2xl p-3"
      style={{
        left, top, animationDelay: `${delay}s`, animationDuration: `${6.5 + delay}s`,
        backgroundColor: "color-mix(in srgb, var(--bg-surface) 88%, transparent)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        border: "1px solid var(--border)",
        boxShadow: "0 18px 44px -16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-soft-bg)" }}>
          <Icon className="w-3.5 h-3.5" style={{ color: "var(--accent-text)" }} />
        </span>
        <span className="text-[11px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}
