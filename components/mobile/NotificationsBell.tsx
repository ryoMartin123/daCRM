"use client";

// ─── Notifications bell + glossy popup ────────────────────
// Replaces the inbox in the full-view header. Tapping the bell opens a frosted,
// Apple-style popup that scales out from the header bubble (transform-origin
// top-right). Fed by real activity events.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import type { ActivityEvent } from "@/lib/activity/types";
import { activityMeta, activityLabel } from "@/lib/mobile/activityMeta";

// Frosted surface — mostly opaque with a strong blur so the activity cards
// behind read as soft frost, not sharp icons. The header lifts this above them
// (z-index), so there's no hard bleed-through.
const PANEL: React.CSSProperties = {
  backgroundColor: "color-mix(in srgb, var(--bg-surface) 93%, transparent)",
  backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)",
  border: "1px solid var(--border)",
  boxShadow: "0 24px 60px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
};

export default function NotificationsBell({ events }: { events: ActivityEvent[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = events.slice(0, 10);
  const unread = Math.min(items.length, 3); // newest few count as unread

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} aria-label="Notifications" aria-expanded={open}
        className="relative w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform">
        <Bell className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: "#ef4444", border: "2px solid var(--bg-surface)" }}>{unread}</span>
        )}
      </button>

      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

      <div className="absolute right-0 top-full mt-2 z-50 w-[19rem] rounded-2xl overflow-hidden origin-top-right"
        style={{
          ...PANEL,
          transform: open ? "scale(1)" : "scale(0.85)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "transform 0.26s cubic-bezier(0.22,1,0.36,1), opacity 0.18s ease",
        }}>
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Notifications</p>
          {unread > 0 && <button onClick={() => setOpen(false)} className="text-[11px] font-semibold" style={{ color: "#4f46e5" }}>Mark all read</button>}
        </div>
        <div className="max-h-[60vh] overflow-y-auto pb-1">
          {items.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: "var(--text-muted)" }}>You’re all caught up.</p>
          ) : items.map((e, i) => {
            const m = activityMeta(e.eventType); const Icon = m.icon;
            return (
              <button key={e.id} onClick={() => { setOpen(false); router.push(`/mobile/customers/${e.customerId}`); }}
                className="w-full flex items-start gap-3 px-4 py-2.5 text-left active:bg-[var(--bg-surface-2)]" style={{ borderTop: "1px solid color-mix(in srgb, var(--border-subtle) 60%, transparent)" }}>
                <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: m.color + "22" }}><Icon className="w-4 h-4" style={{ color: m.color }} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{activityLabel(e.eventType)}</p>
                    {i < unread && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: "#ef4444" }} />}
                  </div>
                  <p className="text-xs leading-snug truncate" style={{ color: "var(--text-muted)" }}>{e.title}</p>
                </div>
                <span className="text-[10px] shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }}>{e.displayDate}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
