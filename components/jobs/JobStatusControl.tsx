"use client";

// ─── Job status control + history ─────────────────────────
// The interactive status surface on the job detail page. Reads the lifecycle
// engine (lib/jobs/lifecycle) so what a user can do depends on their role:
//   • Field/sales (jobs.edit own) get the real-world "next step" buttons on their
//     own job — En Route, Start, Waiting, Complete (Complete is gated on required
//     checklist items).
//   • Dispatch/managers (jobs.edit all) additionally get the office steps and,
//     if they hold the override flag, an "Override" menu that can force ANY
//     status with a logged reason.
// Every change is written through transitionJobStatus, which records the audit
// event JobHistoryList renders.

import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, ShieldAlert } from "lucide-react";
import { usePermissions } from "@/components/providers/PermissionProvider";
import { resolveJobStatus, type Job } from "@/lib/jobs/data";
import { getJobStatuses } from "@/lib/job-config/data";
import { nextTransitions, transitionJobStatus, type TransitionActor } from "@/lib/jobs/lifecycle";
import StatusBadge from "@/components/shared/StatusBadge";

export function JobStatusBar({ job, onChanged, className = "px-6 pb-3" }: { job: Job; onChanged: () => void; className?: string }) {
  const { principal, me, can, hasFlag } = usePermissions();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [overrideKey, setOverride] = useState<string | null>(null);
  const [reason, setReason]       = useState("");
  const [err, setErr]             = useState<string | null>(null);

  const statuses = useMemo(() => getJobStatuses().filter(s => s.active), []);
  const labelOf  = (k: string) => statuses.find(s => s.key === k)?.name ?? k;
  const colorOf  = (k: string) => statuses.find(s => s.key === k)?.color ?? "#6b7280";

  const ownedByMe = job.assignedTo === me;
  const actor: TransitionActor = { principal, ownedByMe };
  const ctx = { companyId: job.companyId, locationId: job.locationId, ownedByMe };
  const canEditThis = can("jobs", "edit", ctx);
  const canOverride = hasFlag("jobs_status_override", ctx);

  const steps = nextTransitions(job, actor);
  // Show steps the user can take now, plus their own field steps that are
  // blocked (e.g. Complete pending checklist) as disabled buttons with a reason.
  const shown = steps.filter(s => s.allowed || (s.scope === "field" && canEditThis));

  const cur = resolveJobStatus(job.status, statuses);

  function apply(to: string, override = false, why = "") {
    const res = transitionJobStatus(job.id, to, { actor, override, reason: why });
    if (!res.ok) { setErr(res.error ?? "Could not change status."); return; }
    setErr(null); setMenuOpen(false); setOverride(null); setReason("");
    onChanged();
  }

  function pickFromMenu(key: string) {
    const step = steps.find(s => s.to === key);
    if (step?.allowed) { apply(key); return; }
    setMenuOpen(false);
    setOverride(key);   // non-graph or gated → confirm with a reason
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Status</span>
        <StatusBadge label={cur.label} color={cur.color} />
        {shown.length > 0 && <ArrowRight className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}

        {shown.map(s => (
          <button key={s.to} onClick={() => s.allowed && apply(s.to)} disabled={!s.allowed}
            title={!s.allowed ? s.reason : undefined}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
            style={{ backgroundColor: colorOf(s.to) + "1a", color: colorOf(s.to), border: `1px solid ${colorOf(s.to)}55` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorOf(s.to) }} />
            {labelOf(s.to)}
          </button>
        ))}

        {shown.length === 0 && !canOverride && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>No status changes available for your role.</span>
        )}

        {canOverride && (
          <div className="relative ml-1">
            <button onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-surface-2)]"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <ShieldAlert className="w-3.5 h-3.5" /> Override <ChevronDown className="w-3 h-3" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-40 w-52 rounded-xl py-1 max-h-72 overflow-y-auto"
                  style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5" style={{ color: "var(--text-muted)" }}>Set status to…</p>
                  {statuses.filter(s => s.key !== job.status).map(s => {
                    const isNormal = steps.find(x => x.to === s.key)?.allowed;
                    return (
                      <button key={s.key} onClick={() => pickFromMenu(s.key)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-[var(--bg-surface-2)]"
                        style={{ color: "var(--text-primary)" }}>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="flex-1 truncate">{s.name}</span>
                        {!isNormal && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ backgroundColor: "var(--warning-soft-bg)", color: "var(--warning-text)" }}>override</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {err && <p className="text-[11px] mt-1.5" style={{ color: "#dc2626" }}>{err}</p>}

      {/* Override-reason confirmation */}
      {overrideKey && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOverride(null)}>
          <div className="w-full max-w-sm rounded-2xl p-5" onClick={e => e.stopPropagation()}
            style={{ backgroundColor: "var(--bg-surface)", boxShadow: "0 16px 48px rgba(0,0,0,0.24)" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldAlert className="w-4 h-4" style={{ color: "var(--warning-icon)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Override status</p>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
              Forcing <span className="font-medium">{labelOf(overrideKey)}</span> outside the normal flow. This is recorded in the job history.
            </p>
            <input value={reason} onChange={e => setReason(e.target.value)} autoFocus placeholder="Reason (recommended)"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-4"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }} />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setOverride(null); setReason(""); }} className="px-3 py-1.5 rounded-lg text-sm"
                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Cancel</button>
              <button onClick={() => apply(overrideKey, true, reason)} className="px-4 py-1.5 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: "var(--warning-icon)" }}>Override</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── History tab — the status audit trail ─────────────────
function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function JobHistoryList({ job }: { job: Job }) {
  const statuses = useMemo(() => getJobStatuses(), []);
  const labelOf  = (k: string) => statuses.find(s => s.key === k)?.name ?? k;
  const colorOf  = (k: string) => statuses.find(s => s.key === k)?.color ?? "#6b7280";
  const events = [...(job.statusHistory ?? [])].reverse();

  if (events.length === 0) {
    return (
      <div className="rounded-xl py-12 text-center" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No status changes recorded yet.</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Every status update — by a tech, salesperson, or dispatcher — will be logged here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-2">
      {events.map(e => (
        <div key={e.id} className="rounded-xl p-3.5" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge label={labelOf(e.from)} color={colorOf(e.from)} />
            <ArrowRight className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            <StatusBadge label={labelOf(e.to)} color={colorOf(e.to)} />
            {e.override && (
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--warning-soft-bg)", color: "var(--warning-text)" }}>Override</span>
            )}
            <span className="ml-auto text-[11px]" style={{ color: "var(--text-muted)" }}>{fmtDateTime(e.at)}</span>
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--text-secondary)" }}>
            {e.byName}{e.byRole ? ` · ${e.byRole}` : ""}
          </p>
          {e.reason && <p className="text-xs mt-1 italic" style={{ color: "var(--text-muted)" }}>&ldquo;{e.reason}&rdquo;</p>}
        </div>
      ))}
    </div>
  );
}
