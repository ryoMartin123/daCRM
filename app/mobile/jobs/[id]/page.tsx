"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Phone, MessageSquare, Navigation, Camera, User, Clock, MapPin, AlertTriangle,
  FileText, ClipboardCheck, Wrench, ChevronRight, Briefcase, CheckCircle2, Circle,
} from "lucide-react";
import MobileHeader from "@/components/mobile/MobileHeader";
import { Section, Card, DetailRow, StatusChip, BigButton, QuickAction, EmptyState, prettyType, ACCENT } from "@/components/mobile/ui";
import { getJob } from "@/lib/jobs/data";
import { getTasksForJob } from "@/lib/tasks/data";
import { getCustomer } from "@/lib/customers/data";
import { getFiles } from "@/lib/files/data";
import { getJobPhotoChecklist, checklistProgress } from "@/lib/files/checklist";
import PhotoCapture from "@/components/mobile/PhotoCapture";
import { primaryAction, secondaryActions, setMyJobStatus } from "@/lib/mobile/data";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tick, setTick] = useState(0);
  const [capture, setCapture] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- tick forces a re-read after a status change
  const job = useMemo(() => getJob(id), [id, tick]);
  const customer = useMemo(() => (job ? getCustomer(job.accountId) : undefined), [job]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tasks = useMemo(() => (job ? getTasksForJob(job.id) : []), [job, tick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- tick refreshes after capture
  const photos = useMemo(() => (job ? getFiles({ jobId: job.id }) : []), [job, tick]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checklist = useMemo(() => (job ? getJobPhotoChecklist(job.id, job.type) : []), [job, tick]);

  if (!job) {
    return (<div><MobileHeader title="Job" back /><EmptyState icon={Briefcase} title="Job not found" hint="It may have been removed or reassigned." /></div>);
  }

  const primary = primaryAction(job.status);
  const secondary = secondaryActions(job.status);
  const go = (to: Parameters<typeof setMyJobStatus>[1]) => { setMyJobStatus(job.id, to); setTick(t => t + 1); };
  const mapsHref = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.propertyAddress || job.customerName)}`;

  return (
    <div>
      <MobileHeader title={job.customerName} subtitle={prettyType(job.type)} back right={<StatusChip status={job.status} />} />

      <div className="px-4 space-y-5" style={{ paddingBottom: primary || secondary.length ? 96 : 8 }}>
        {/* Quick actions */}
        <div className="flex gap-2.5">
          <QuickAction icon={Phone} label="Call" href={customer?.phone ? `tel:${customer.phone}` : undefined} />
          <QuickAction icon={MessageSquare} label="Message" href={customer?.phone ? `sms:${customer.phone}` : undefined} />
          <QuickAction icon={Navigation} label="Directions" href={mapsHref} />
        </div>

        {/* Appointment */}
        <Section title="Appointment">
          <Card>
            <div className="px-4 pt-3 pb-1 flex items-center gap-2">
              {(job.priority === "urgent" || job.priority === "high") && <AlertTriangle className="w-4 h-4" style={{ color: job.priority === "urgent" ? "#dc2626" : "#f59e0b" }} />}
              <span className="text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>{job.priority} priority</span>
            </div>
            <DetailRow icon={Clock} label="Window" value={`${job.scheduledDate}${job.scheduledTime ? ` · ${job.scheduledTime}` : ""} (${job.durationMinutes} min)`} />
            <DetailRow icon={MapPin} label="Address" value={<a href={mapsHref} target="_blank" rel="noreferrer" style={{ color: ACCENT }}>{job.propertyAddress || "No address on file"}</a>} />
            <DetailRow icon={User} label="Assigned to" value={job.assignedTo} />
          </Card>
        </Section>

        {/* Notes */}
        {(job.description || customer?.notes) && (
          <Section title="Notes">
            <Card className="p-4 space-y-3">
              {job.description && <div><p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Job</p><p className="text-sm" style={{ color: "var(--text-primary)" }}>{job.description}</p></div>}
              {customer?.notes && <div><p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Customer</p><p className="text-sm" style={{ color: "var(--text-secondary)" }}>{customer.notes}</p></div>}
            </Card>
          </Section>
        )}

        {/* Photos — required checklist + gallery, CompanyCam-style capture */}
        <Section title="Photos" action={<span className="text-xs" style={{ color: "var(--text-muted)" }}>{checklistProgress(checklist).done}/{checklistProgress(checklist).total} required</span>}>
          {checklist.length > 0 && (
            <Card className="p-3 mb-2.5">
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {checklist.map(c => (
                  <span key={c.key} className="inline-flex items-center gap-1.5 text-xs">
                    {c.captured ? <CheckCircle2 className="w-4 h-4" style={{ color: "#16a34a" }} /> : <Circle className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
                    <span style={{ color: c.captured ? "var(--text-secondary)" : "var(--text-muted)" }}>{c.name}</span>
                  </span>
                ))}
              </div>
            </Card>
          )}
          <div className="grid grid-cols-3 gap-2.5">
            <button onClick={() => setCapture(true)} className="aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 active:scale-[0.98] transition-transform"
              style={{ border: `1.5px dashed ${ACCENT}66`, backgroundColor: ACCENT + "0d" }}>
              <Camera className="w-6 h-6" style={{ color: ACCENT }} />
              <span className="text-[11px] font-medium" style={{ color: ACCENT }}>Add</span>
            </button>
            {photos.map(p => (
              <div key={p.id} className="relative aspect-square rounded-2xl flex items-center justify-center overflow-hidden" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
                {p.previewUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={p.previewUrl} alt="" className="w-full h-full object-cover" />
                  : <Camera className="w-5 h-5" style={{ color: "var(--text-muted)" }} />}
                {p.phase && <span className="absolute top-1 left-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full text-white capitalize" style={{ backgroundColor: p.phase === "before" ? "#6366f1" : p.phase === "during" ? "#3b82f6" : "#10b981" }}>{p.phase}</span>}
              </div>
            ))}
          </div>
        </Section>

        {/* Checklist / job tasks */}
        <Section title="Checklist & tasks">
          {tasks.length === 0 ? (
            <Card className="px-4 py-5"><p className="text-sm text-center" style={{ color: "var(--text-muted)" }}>No checklist items for this job.</p></Card>
          ) : (
            <Card>
              {tasks.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
                  <ClipboardCheck className="w-4 h-4 shrink-0" style={{ color: t.status === "completed" ? "#16a34a" : "var(--text-muted)" }} />
                  <span className="text-sm flex-1" style={{ color: "var(--text-primary)", textDecoration: t.status === "completed" ? "line-through" : "none" }}>{t.title}</span>
                </div>
              ))}
            </Card>
          )}
        </Section>

        {/* Materials (foundation placeholder) */}
        <Section title="Materials & equipment">
          <Card>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-[var(--bg-surface-2)]">
              <Wrench className="w-4 h-4" style={{ color: "var(--text-muted)" }} /><span className="text-sm flex-1 text-left" style={{ color: "var(--text-primary)" }}>Log materials used</span><ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-[var(--bg-surface-2)]" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <FileText className="w-4 h-4" style={{ color: "var(--text-muted)" }} /><span className="text-sm flex-1 text-left" style={{ color: "var(--text-primary)" }}>System / equipment info</span><ChevronRight className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            </button>
          </Card>
        </Section>
      </div>

      {/* Sticky status action bar — sits above the bottom nav */}
      {(primary || secondary.length > 0) && (
        <div className="fixed left-0 right-0 z-40 px-4 pt-3 pb-3 space-y-2"
          style={{ bottom: "calc(68px + env(safe-area-inset-bottom))", backgroundColor: "var(--bg-page)", borderTop: "1px solid var(--border-subtle)" }}>
          {primary && <BigButton label={primary.label} tone="primary" onClick={() => go(primary.to)} />}
          {secondary.length > 0 && (
            <div className="flex gap-2">
              {secondary.map(s => (
                <button key={s.to} onClick={() => go(s.to)} className="flex-1 min-h-[44px] rounded-xl text-sm font-semibold active:scale-[0.99] transition-transform"
                  style={{ border: `1px solid ${s.tone === "warn" ? "#f59e0b55" : "var(--border)"}`, color: s.tone === "warn" ? "#b45309" : "var(--text-primary)", backgroundColor: "var(--bg-surface)" }}>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <PhotoCapture open={capture} onClose={() => setCapture(false)} accountId={job.accountId} accountName={job.customerName}
        jobId={job.id} defaultCategory={checklist.find(c => !c.captured)?.key}
        onSaved={() => setTick(t => t + 1)} />
    </div>
  );
}
