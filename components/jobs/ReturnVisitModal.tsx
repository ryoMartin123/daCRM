"use client";

// ─── Schedule a return visit ──────────────────────────────
// A second (or third…) visit on the SAME job — e.g. a part was back-ordered.
// Creates a NEW work order + a NEW appointment under the job (addReturnVisit),
// leaving the first visit's record intact, and reflects the upcoming visit on
// the job. The job's status is left as-is (it stays "on hold" until the tech
// starts the return).
//
// Two entry points:
//   • From a job detail — `job` is passed, so it's pre-tied to that job.
//   • From the dispatch board "+" — no `job`, so a picker requires you to tie
//     the return to an existing job (and it always creates the work order).

import { useMemo, useState, type CSSProperties } from "react";
import { RotateCcw, X } from "lucide-react";
import DatePicker from "@/components/ui/DatePicker";
import TimePicker from "@/components/ui/TimePicker";
import { getTechnicianNames, initialsOf } from "@/lib/users/data";
import { getAllJobs, getJob, updateJob, type Job } from "@/lib/jobs/data";
import { getAppointmentsForJob, VISIT_TYPE_CONFIG, RETURN_VISIT_TYPES, type VisitType } from "@/lib/appointments/data";
import { addReturnVisit } from "@/lib/jobs/serviceCall";

const HOLD = new Set(["waiting_on_parts", "waiting_on_customer", "waiting_on_approval"]);
const pad = (n: number) => String(n).padStart(2, "0");
const todayYMD = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

export default function ReturnVisitModal({ job: jobProp, onClose, onScheduled }: {
  job?: Job | null;
  onClose: () => void;
  onScheduled?: (jobId: string) => void;
}) {
  const techs = getTechnicianNames();
  // Board flow: choose the existing job — on-hold jobs first (likely returns).
  const pickable = useMemo(() => jobProp ? [] : getAllJobs()
    .filter(j => !["canceled", "closed", "no_show"].includes(j.status))
    .sort((a, b) => (HOLD.has(b.status) ? 1 : 0) - (HOLD.has(a.status) ? 1 : 0) || a.customerName.localeCompare(b.customerName)),
    [jobProp]);
  const [jobId, setJobId] = useState(jobProp?.id ?? "");
  const job = jobProp ?? (jobId ? getJob(jobId) : undefined);

  const [visitType, setVisitType] = useState<VisitType>("return");
  const [title, setTitle] = useState("Return visit");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(jobProp?.durationMinutes || 120);
  const [tech, setTech] = useState(jobProp?.assignedTo || techs[0] || "");
  const [instructions, setInstructions] = useState("");

  // Validate against the job's existing visits: a return can't be in the past,
  // overlap another visit, or start before the previous visit has ended.
  const existing = useMemo(
    () => (job ? getAppointmentsForJob(job.id).filter(a => a.scheduledDate && a.scheduledTime && a.status !== "canceled") : []),
    [job?.id], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const toMs = (d: string, t: string) => new Date(`${d}T${t || "00:00"}`).getTime();
  const latestEndMs = existing.reduce((m, a) => Math.max(m, toMs(a.scheduledDate, a.scheduledTime) + a.durationMinutes * 60_000), 0);
  const startMs = date && time ? toMs(date, time) : NaN;
  const endMs = Number.isFinite(startMs) ? startMs + (duration || 0) * 60_000 : NaN;
  const overlaps = existing.some(a => { const s = toMs(a.scheduledDate, a.scheduledTime); const e = s + a.durationMinutes * 60_000; return startMs < e && endMs > s; });
  const fmtWhen = (ms: number) => new Date(ms).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  let timeError: string | null = null;
  if (date && time) {
    if (!Number.isFinite(startMs)) timeError = "Pick a valid date and time.";
    else if (startMs < Date.now() - 60_000) timeError = "That time is in the past.";
    else if (overlaps) timeError = "That overlaps another visit on this job.";
    else if (latestEndMs && startMs < latestEndMs) timeError = `Must start after the previous visit ends (${fmtWhen(latestEndMs)}).`;
  }
  const valid = !!job && !!title.trim() && !!date && !!time && !timeError;

  const schedule = () => {
    if (!job || !valid) return;
    addReturnVisit(job.id, {
      workOrderTitle: title.trim(),
      instructions: instructions.trim() || undefined,
      visitType,
      scheduledDate: date, scheduledTime: time, durationMinutes: duration,
      techIds: tech ? [tech] : [],
    });
    updateJob(job.id, { scheduledDate: date, scheduledTime: time, assignedTo: tech, assignedToInitials: tech ? initialsOf(tech) : "" });
    onScheduled?.(job.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()} style={{ backgroundColor: "var(--bg-surface)", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
        <div className="flex items-center gap-2.5 px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-soft-bg)" }}><RotateCcw className="w-4 h-4" style={{ color: "var(--accent-text)" }} /></div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Schedule return visit</p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Creates a new work order + appointment on the job — the first visit stays intact.</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-[var(--bg-surface-2)]" style={{ color: "var(--text-muted)" }}><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-3">
          {/* Board flow: tie the return to an existing job. */}
          {!jobProp && (
            <Field label="Job">
              <select value={jobId} onChange={e => setJobId(e.target.value)} className={inp} style={inpStyle}>
                <option value="">Select the job this is a return for…</option>
                {pickable.map(j => <option key={j.id} value={j.id}>{j.customerName} — {j.title}{HOLD.has(j.status) ? " · on hold" : ""}</option>)}
              </select>
            </Field>
          )}
          {jobProp && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Return for <span className="font-medium" style={{ color: "var(--text-secondary)" }}>{jobProp.customerName} — {jobProp.title}</span></p>}

          <Field label="Visit type">
            <select value={visitType} onChange={e => setVisitType(e.target.value as VisitType)} className={inp} style={inpStyle}>
              {RETURN_VISIT_TYPES.map(t => <option key={t} value={t}>{VISIT_TYPE_CONFIG[t].label}</option>)}
            </select>
          </Field>
          <Field label="Work order for this visit">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Install compressor (back-ordered part)" className={inp} style={inpStyle} autoFocus={!!jobProp} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date"><DatePicker value={date} onChange={v => setDate(v || "")} min={todayYMD()} clearable={false} /></Field>
            <Field label="Time"><TimePicker value={time} onChange={setTime} /></Field>
          </div>
          {timeError
            ? <p className="text-xs" style={{ color: "#dc2626" }}>{timeError}</p>
            : (latestEndMs > 0 && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Earliest available: after {fmtWhen(latestEndMs)} (the previous visit).</p>)}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Technician">
              <select value={tech} onChange={e => setTech(e.target.value)} className={inp} style={inpStyle}>
                {techs.length === 0 && <option value="">Unassigned</option>}
                {techs.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Duration (min)"><input type="number" min={15} step={15} value={duration} onChange={e => setDuration(Number(e.target.value) || 0)} className={inp} style={inpStyle} /></Field>
          </div>
          <Field label="Instructions (optional)"><textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={2} placeholder="e.g. Bring the ordered compressor; customer prefers mornings." className={`${inp} resize-none`} style={inpStyle} /></Field>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={onClose} className="text-sm font-medium px-3 py-2 rounded-lg" style={{ color: "var(--text-secondary)" }}>Cancel</button>
          <button onClick={schedule} disabled={!valid} className="text-sm font-semibold px-4 py-2 rounded-lg text-white disabled:opacity-40" style={{ backgroundColor: "#4f46e5" }}>Schedule visit</button>
        </div>
      </div>
    </div>
  );
}

const inp = "w-full rounded-lg px-2.5 py-1.5 text-sm outline-none";
const inpStyle: CSSProperties = { border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" };
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-[11px] font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{label}</label>{children}</div>;
}
