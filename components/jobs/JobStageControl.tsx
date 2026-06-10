"use client";

// ─── Job stage control ────────────────────────────────────
// A prominent stage-icon badge for a job (used on dispatch cards). Click it to
// open a dropdown and set the job to ANY status — handy for testing and quick
// dispatch overrides. The menu is rendered with fixed positioning so it isn't
// clipped by the card's overflow. Non-job items just show a static icon.

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CircleDashed, Send, Truck, Wrench, Package, Hourglass, CheckCircle2, Receipt,
  CheckCheck, Ban, UserX, Briefcase, CalendarClock,
} from "lucide-react";
import { usePermissions } from "@/components/providers/PermissionProvider";
import { getJob } from "@/lib/jobs/data";
import { getJobStatuses } from "@/lib/job-config/data";
import { transitionJobStatus, type TransitionActor } from "@/lib/jobs/lifecycle";

// Each lifecycle stage → an icon, so a card shows at a glance where the job is.
export const JOB_STAGE_ICON: Record<string, typeof Briefcase> = {
  new:                 CircleDashed,
  scheduled:           CalendarClock,
  dispatched:          Send,
  en_route:            Truck,
  in_progress:         Wrench,
  waiting_on_parts:    Package,
  waiting_on_customer: Hourglass,
  waiting_on_approval: Hourglass,
  completed:           CheckCircle2,
  invoiced:            Receipt,
  closed:              CheckCheck,
  canceled:            Ban,
  no_show:             UserX,
};
export function stageIcon(key?: string): typeof Briefcase {
  return (key && JOB_STAGE_ICON[key]) || Briefcase;
}

export default function JobStageControl({ jobId, statusKey, onChanged, size = 18, variant = "badge", barColor }: {
  jobId: string;
  statusKey?: string;        // fallback status for non-job items (static icon)
  onChanged?: () => void;
  size?: number;
  variant?: "badge" | "bar"; // "bar" = full-height colored left section on a card
  barColor?: string;         // bar background (defaults to the status color)
}) {
  const { principal, me } = usePermissions();
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  const job = getJob(jobId);
  const status = job?.status ?? statusKey;
  const statuses = getJobStatuses().filter(s => s.active);
  const meta = statuses.find(s => s.key === status);
  const Icon = stageIcon(status);
  const color = meta?.color ?? "#6b7280";
  const badge = size + 6;
  const isBar = variant === "bar";

  const wrapCls = isBar ? "relative flex self-stretch shrink-0" : "relative inline-flex shrink-0";
  const btnCls = isBar
    ? "flex items-center justify-center h-full transition-opacity hover:opacity-90"
    : "inline-flex items-center justify-center rounded transition-transform hover:scale-105";
  const btnStyle: React.CSSProperties = isBar
    ? { width: badge + 8, backgroundColor: barColor ?? color }
    : { width: badge, height: badge, backgroundColor: color + "22" };
  const iconColor = isBar ? "#fff" : color;

  // Non-job item → static icon only (no lifecycle to drive).
  if (!job) {
    return (
      <span className={isBar ? "flex items-center justify-center self-stretch shrink-0" : "inline-flex items-center justify-center rounded shrink-0"}
        title={meta?.name ?? status} style={btnStyle}>
        <Icon style={{ width: size, height: size, color: iconColor }} />
      </span>
    );
  }

  const actor: TransitionActor = { principal, ownedByMe: job.assignedTo === me };

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (menuPos) { setMenuPos(null); return; }
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setMenuPos({ x: Math.min(r.left, window.innerWidth - 188), y: Math.min(r.bottom + 4, window.innerHeight - 320) });
  }

  function set(to: string) {
    // Override lets a dispatcher/admin jump to any status (bypasses the graph + gate).
    transitionJobStatus(job!.id, to, { actor, override: true, reason: "Set from board" });
    setMenuPos(null);
    onChanged?.();
  }

  return (
    <span className={wrapCls} onMouseDown={e => e.stopPropagation()}>
      <button ref={btnRef} onClick={toggle} title={`${meta?.name ?? status} — click to change`}
        className={btnCls} style={btnStyle}>
        <Icon style={{ width: size, height: size, color: iconColor }} />
      </button>

      {menuPos && typeof document !== "undefined" && createPortal(
        <>
          {/* Body-level portal so the menu can't be clipped by the card's overflow
              or mis-positioned by a transformed ancestor. */}
          <div className="fixed inset-0 z-[80]" onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setMenuPos(null); }} />
          <div className="fixed z-[81] w-44 rounded-lg py-1 max-h-72 overflow-y-auto"
            onMouseDown={e => e.stopPropagation()}
            style={{ left: menuPos.x, top: menuPos.y, backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 12px 32px rgba(0,0,0,0.22)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1" style={{ color: "var(--text-muted)" }}>Set status</p>
            {statuses.map(s => {
              const SI = stageIcon(s.key);
              const on = s.key === status;
              return (
                <button key={s.key} onClick={e => { e.stopPropagation(); set(s.key); }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-[var(--bg-surface-2)]"
                  style={{ color: "var(--text-primary)", backgroundColor: on ? "var(--bg-surface-2)" : "transparent" }}>
                  <SI style={{ width: 14, height: 14, color: s.color }} />
                  <span className="flex-1 truncate">{s.name}</span>
                </button>
              );
            })}
          </div>
        </>,
        document.body,
      )}
    </span>
  );
}
