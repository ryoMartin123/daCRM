"use client";

// ─── Work Order detail ────────────────────────────────────
// A Work Order is a real operational record — the field-execution packet — NOT a
// shortcut to its job. It stays linked to the parent Job (why/revenue) and shows
// its Visits (appointments), but it owns its own scope, checklist, materials,
// photos and completion state. See the Jobs → Work Orders → Visits/Appointments
// model (Appointment = Visit).

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ClipboardList, CheckCircle2, Circle, Play, RotateCcw, Repeat,
  Briefcase, User, MapPin, Phone, Mail, Calendar, Clock, Users, FileText, ExternalLink,
} from "lucide-react";
import {
  getWorkOrderById, updateWorkOrderById, getJob, JOB_STATUS_CONFIG, resolveJobTypeColor,
  type WorkOrderStatus,
} from "@/lib/jobs/data";
import { getAppointmentsForWorkOrder, VISIT_TYPE_CONFIG, type AppointmentStatus } from "@/lib/appointments/data";
import { getCustomer } from "@/lib/customers/data";
import { getFiles } from "@/lib/files/data";
import { useDataVersion } from "@/lib/sync/useDataVersion";
import StatusBadge from "@/components/shared/StatusBadge";
import ActionsMenu from "@/components/shared/ActionsMenu";
import DetailTabs from "@/components/shared/DetailTabs";
import WorkOrderBilling from "@/components/jobs/WorkOrderBilling";
import PhotoGallery from "@/components/files/PhotoGallery";
import ReturnVisitModal from "@/components/jobs/ReturnVisitModal";

const TABS = ["Details", "Photos & Files", "History"];

const WO_STATUS: Record<WorkOrderStatus, { label: string; color: string }> = {
  pending:     { label: "Pending",     color: "#9ca3af" },
  in_progress: { label: "In Progress", color: "#f59e0b" },
  completed:   { label: "Completed",   color: "#16a34a" },
};

const APPT_STATUS: Record<AppointmentStatus, { label: string; color: string }> = {
  scheduled:   { label: "Scheduled",   color: "#0891b2" },
  en_route:    { label: "En route",    color: "#2563eb" },
  in_progress: { label: "In progress", color: "#f59e0b" },
  completed:   { label: "Completed",   color: "#16a34a" },
  canceled:    { label: "Canceled",    color: "#9ca3af" },
  no_show:     { label: "No show",     color: "#dc2626" },
};

export default function WorkOrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const router = useRouter();
  const rev = useDataVersion();
  const [tab, setTab] = useState("Details");
  const [returnOpen, setReturnOpen] = useState(false);

  const wo   = useMemo(() => getWorkOrderById(id), [id, rev]);
  const job  = useMemo(() => (wo?.jobId ? getJob(wo.jobId) : undefined), [wo?.jobId, rev]);
  const visits = useMemo(() => getAppointmentsForWorkOrder(id), [id, rev]);
  const customer = useMemo(() => (job ? getCustomer(job.accountId) : undefined), [job?.accountId, rev]);
  const images = useMemo(() => getFiles({ workOrderId: id }).filter(f => f.fileType === "image"), [id, rev]);

  if (!wo) {
    return (
      <div className="p-6">
        <Link href="/work-orders" className="flex items-center gap-1.5 text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft className="w-4 h-4" /> Work Orders
        </Link>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Work order not found.</p>
      </div>
    );
  }

  const st = WO_STATUS[wo.status];
  const reqItems  = wo.checklist.filter(c => c.required);
  const reqDone   = reqItems.filter(c => c.isComplete).length;
  const toggle    = (ciId: string) => updateWorkOrderById(id, { checklist: wo.checklist.map(c => c.id === ciId ? { ...c, isComplete: !c.isComplete } : c) });
  const setStatus = (status: WorkOrderStatus) => updateWorkOrderById(id, { status, completedAt: status === "completed" ? new Date().toISOString() : undefined });

  // Completion requirements: required checklist done + at least one photo.
  const checklistMet = reqItems.length === 0 || reqDone === reqItems.length;
  const photosMet    = images.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div style={{ backgroundColor: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/work-orders" className="flex items-center gap-1.5 text-sm shrink-0" style={{ color: "var(--text-secondary)" }}>
              <ArrowLeft className="w-4 h-4" /> Work Orders
            </Link>
            <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--border)" }} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>{wo.title}</h1>
                <StatusBadge label={st.label} color={st.color} />
              </div>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {job ? job.customerName : "—"}{job ? ` · ${job.title}` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {wo.status === "pending" && (
              <button onClick={() => setStatus("in_progress")} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: "#4f46e5" }}>
                <Play className="w-4 h-4" /> Start work
              </button>
            )}
            {wo.status === "in_progress" && (
              <button onClick={() => setStatus("completed")} disabled={!checklistMet} title={checklistMet ? "" : "Complete required checklist items first"}
                className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-white disabled:opacity-40" style={{ backgroundColor: "#16a34a" }}>
                <CheckCircle2 className="w-4 h-4" /> Mark complete
              </button>
            )}
            <ActionsMenu actions={[
              job && { label: "Open job", icon: Briefcase, onClick: () => router.push(`/jobs/${job.id}`) },
              job && { label: "Open customer", icon: User, onClick: () => router.push(`/customers/${job.accountId}`) },
              job && { label: "Schedule return visit", icon: Repeat, onClick: () => setReturnOpen(true) },
              wo.status === "completed" && { label: "Reopen work order", icon: RotateCcw, onClick: () => setStatus("in_progress"), separated: true },
            ]} />
          </div>
        </div>
        <DetailTabs tabs={TABS} active={tab} onChange={setTab} className="px-6 py-2" />
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: "var(--bg-page)" }}>
        {tab === "Details" && (
          <div className="grid grid-cols-3 gap-6">
            {/* Main column */}
            <div className="col-span-2 space-y-4">
              {/* Scope / instructions */}
              <Card title="Scope & Instructions" icon={FileText}>
                {wo.instructions?.trim()
                  ? <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text-secondary)" }}>{wo.instructions}</p>
                  : <p className="text-sm" style={{ color: "var(--text-muted)" }}>No instructions on this work order yet.</p>}
              </Card>

              {/* Checklist */}
              <Card title="Checklist" icon={CheckCircle2} right={wo.checklist.length > 0 ? `${wo.checklist.filter(c => c.isComplete).length}/${wo.checklist.length}` : undefined}>
                {wo.checklist.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No checklist items.</p>
                ) : (
                  <div className="space-y-1.5">
                    {[...wo.checklist].sort((a, b) => a.sortOrder - b.sortOrder).map(c => (
                      <button key={c.id} onClick={() => toggle(c.id)} className="flex items-start gap-2 w-full text-left group">
                        {c.isComplete
                          ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#16a34a" }} />
                          : <Circle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />}
                        <span className="text-sm" style={{ color: c.isComplete ? "var(--text-muted)" : "var(--text-secondary)", textDecoration: c.isComplete ? "line-through" : "none" }}>
                          {c.label}
                          {c.required && <span className="ml-1.5 text-[10px] font-semibold" style={{ color: "#dc2626" }}>Required</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </Card>

              {/* Materials / line items → invoice source */}
              <WorkOrderBilling workOrderId={wo.id} />

              {/* Field record */}
              {(wo.findings || wo.recommendations) && (
                <Card title="Field Notes" icon={FileText}>
                  {wo.findings && <div className="mb-2"><p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>Findings</p><p className="text-sm" style={{ color: "var(--text-secondary)" }}>{wo.findings}</p></div>}
                  {wo.recommendations && <div><p className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>Recommendations</p><p className="text-sm" style={{ color: "var(--text-secondary)" }}>{wo.recommendations}</p></div>}
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Linked job — the clear parent context card */}
              {job && (
                <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Linked Job</p>
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: resolveJobTypeColor(job.type) }} />
                  </div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{job.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusBadge label={JOB_STATUS_CONFIG[job.status]?.label ?? job.status} color={JOB_STATUS_CONFIG[job.status]?.color ?? "#9ca3af"} size="sm" />
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>· {job.type.charAt(0).toUpperCase() + job.type.slice(1)}</span>
                  </div>
                  {(job.estimatedAmount || job.actualAmount) && (
                    <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>
                      {job.actualAmount ? `Invoiced ${job.actualAmount}` : `Estimate ${job.estimatedAmount}`}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Link href={`/jobs/${job.id}`} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                      <Briefcase className="w-3.5 h-3.5" /> Open Job
                    </Link>
                    <Link href={`/customers/${job.accountId}`} className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                      <User className="w-3.5 h-3.5" /> Open Customer
                    </Link>
                  </div>
                </div>
              )}

              {/* Visits (appointments) on this work order */}
              <Card title="Visits" icon={Calendar} right={visits.length ? String(visits.length) : undefined}>
                {visits.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>No visit scheduled.</p>
                ) : (
                  <div className="space-y-2.5">
                    {visits.map(v => {
                      const vt = v.visitType ? VISIT_TYPE_CONFIG[v.visitType] : undefined;
                      const as = APPT_STATUS[v.status];
                      return (
                        <div key={v.id} className="pb-2.5 last:pb-0" style={{ borderBottom: visits.length > 1 ? "1px solid var(--border-subtle)" : "none" }}>
                          <div className="flex items-center gap-2 flex-wrap">
                            {vt && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: vt.color + "22", color: vt.color }}>{vt.short}</span>}
                            <StatusBadge label={as.label} color={as.color} size="sm" />
                          </div>
                          <div className="flex flex-col gap-1 mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                            <span className="inline-flex items-center gap-1.5"><Clock className="w-3 h-3" /> {v.scheduledDate || "Unscheduled"}{v.scheduledTime ? ` · ${v.scheduledTime}` : ""} · {v.durationMinutes} min</span>
                            <span className="inline-flex items-center gap-1.5"><Users className="w-3 h-3" /> {v.techIds.length ? v.techIds.join(", ") : "Unassigned"}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Customer */}
              {customer && (
                <Card title="Customer" icon={User}>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{customer.name}</p>
                  <div className="flex flex-col gap-1 mt-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    {job?.propertyAddress && <span className="inline-flex items-start gap-1.5"><MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {job.propertyAddress}</span>}
                    {customer.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-3 h-3" /> {customer.phone}</span>}
                    {customer.email && <span className="inline-flex items-center gap-1.5"><Mail className="w-3 h-3" /> {customer.email}</span>}
                  </div>
                </Card>
              )}

              {/* Completion requirements */}
              <Card title="Completion Requirements" icon={ClipboardList}>
                <div className="space-y-1.5">
                  <ReqRow met={checklistMet} label={reqItems.length ? `Required checklist (${reqDone}/${reqItems.length})` : "No required checklist items"} />
                  <ReqRow met={photosMet} label={photosMet ? `${images.length} photo${images.length === 1 ? "" : "s"} attached` : "Required photos"} />
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === "Photos & Files" && job && (
          <PhotoGallery recordLevel="work_order" scope={{ workOrderId: wo.id, jobId: job.id, accountId: job.accountId }} accountName={job.customerName} />
        )}

        {tab === "History" && (
          <div className="max-w-2xl">
            {job?.statusHistory?.length ? (
              <div className="space-y-3">
                {[...job.statusHistory].reverse().map(e => (
                  <div key={e.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: JOB_STATUS_CONFIG[e.to as keyof typeof JOB_STATUS_CONFIG]?.color ?? "#9ca3af" }} />
                    <div>
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                        {JOB_STATUS_CONFIG[e.from as keyof typeof JOB_STATUS_CONFIG]?.label ?? e.from} → {JOB_STATUS_CONFIG[e.to as keyof typeof JOB_STATUS_CONFIG]?.label ?? e.to}
                        {e.override && <span className="ml-1.5 text-[10px] font-semibold" style={{ color: "#dc2626" }}>OVERRIDE</span>}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{e.byName} · {new Date(e.at).toLocaleString()}{e.reason ? ` · ${e.reason}` : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No activity recorded yet. Job-level status changes appear here.{job && <> <Link href={`/jobs/${job.id}?tab=History`} className="inline-flex items-center gap-1" style={{ color: "var(--accent-text)" }}>Open job history <ExternalLink className="w-3 h-3" /></Link></>}</p>
            )}
          </div>
        )}
      </div>

      {returnOpen && job && <ReturnVisitModal job={job} onClose={() => setReturnOpen(false)} onScheduled={() => setReturnOpen(false)} />}
    </div>
  );
}

// ─── Local building blocks ────────────────────────────────
function Card({ title, icon: Icon, right, children }: { title: string; icon?: React.ComponentType<{ className?: string }>; right?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5" />}
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
        </div>
        {right && <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{right}</span>}
      </div>
      {children}
    </div>
  );
}

function ReqRow({ met, label }: { met: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {met
        ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#16a34a" }} />
        : <Circle className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />}
      <span className="text-sm" style={{ color: met ? "var(--text-secondary)" : "var(--text-muted)" }}>{label}</span>
    </div>
  );
}
