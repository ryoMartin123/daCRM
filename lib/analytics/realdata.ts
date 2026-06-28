// ─── Analytics — real CRM data ────────────────────────────
// Aggregates the actual CRM stores (jobs, invoices, estimates, leads) into the
// ReportResult shape. Each source maps to a normalized record; each metric is a
// reducer over a record subset; the engine filters by date + conditions, groups
// by time or dimension, and computes the headline + previous-period delta.
// Sources/metrics without a wired store return null → the engine falls back to
// the deterministic mock. This is where Supabase queries slot in later.

import { getAllJobs } from "@/lib/jobs/data";
import { getAllInvoices, getAllQuotes } from "@/lib/quotes/data";
import { getAllLeads } from "@/lib/leads/data";
import { METRICS, GROUPINGS, FILTER_DEFS } from "./catalog";
import type { ReportConfig, ReportResult, SeriesPoint, Grouping, DateRangeKey } from "./types";

const money = (v: unknown) => Number(String(v ?? "").replace(/[^0-9.-]/g, "")) || 0;
const parseDate = (s?: string): Date | null => { if (!s) return null; const d = new Date(s); return isNaN(d.getTime()) ? null : d; };
const pretty = (s: string) => String(s).replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const sum = (r: Rec[], f: (x: Rec) => number) => r.reduce((a, x) => a + f(x), 0);
const avg = (vals: number[]) => vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;

interface Rec {
  date: Date | null;
  amount: number;
  paid?: number; balance?: number; overdue?: boolean;
  completed?: boolean; canceled?: boolean; emergency?: boolean; maintenance?: boolean; durationMin?: number;
  won?: boolean; decided?: boolean; lost?: boolean;
  dims: Partial<Record<Grouping, string>>;
}

// ── Source loaders ──
const jobRecs = (): Rec[] => getAllJobs().map(j => ({
  date: parseDate(j.scheduledDate),
  amount: money(j.actualAmount ?? j.estimatedAmount),
  completed: ["completed", "invoiced", "closed"].includes(j.status),
  canceled: ["canceled", "no_show"].includes(j.status),
  emergency: j.type === "emergency" || j.priority === "urgent",
  maintenance: j.type === "maintenance" || j.type === "agreement_visit",
  durationMin: j.durationMinutes,
  dims: { technician: j.assignedTo || "Unassigned", location: j.locationName, job_type: pretty(j.type), status: pretty(j.status) },
}));

const invoiceRecs = (): Rec[] => getAllInvoices().filter(i => !i.deleted).map(i => ({
  date: parseDate(i.paidAt ?? i.dueDate),
  amount: i.total,
  paid: i.total - i.balanceDue,
  balance: i.balanceDue,
  overdue: i.status === "past_due" || (i.balanceDue > 0 && (parseDate(i.dueDate)?.getTime() ?? Infinity) < Date.now()),
  dims: { location: i.locationName, status: pretty(i.status) },
}));

const quoteRecs = (): Rec[] => getAllQuotes().filter(q => !q.deleted && !q.archived).map(q => {
  const won = ["approved", "converted"].includes(q.status);
  return {
    date: parseDate((q as { createdAt?: string }).createdAt ?? q.approvedAt ?? q.expiresAt),
    amount: q.total,
    won, decided: ["approved", "converted", "rejected", "expired"].includes(q.status), lost: ["rejected", "expired"].includes(q.status),
    dims: { technician: q.assignedTo || "Unassigned", location: q.locationName, status: pretty(q.status) },
  };
});

const leadRecs = (): Rec[] => getAllLeads().map(l => ({
  date: parseDate(l.createdAt),
  amount: money(l.estimatedValue),
  dims: { lead_source: pretty(String(l.source)), location: l.locationName },
}));

interface SourceDef { recs: () => Rec[]; dims: Grouping[] }
const SOURCES: Record<string, SourceDef> = {
  jobs:        { recs: jobRecs, dims: ["technician", "location", "job_type", "status"] },
  work_orders: { recs: jobRecs, dims: ["technician", "location", "status"] },
  technicians: { recs: jobRecs, dims: ["technician", "location"] },
  invoices:    { recs: invoiceRecs, dims: ["location", "status"] },
  payments:    { recs: invoiceRecs, dims: ["location", "status"] },
  estimates:   { recs: quoteRecs, dims: ["technician", "location", "status"] },
  leads:       { recs: leadRecs, dims: ["lead_source", "location"] },
};

// ── Metric reducers ──
type Reducer = (r: Rec[]) => number;
const METRIC_CALC: Record<string, Reducer> = {
  job_count: r => r.length,
  completed_jobs: r => r.filter(x => x.completed).length,
  tech_jobs_completed: r => r.filter(x => x.completed).length,
  canceled_jobs: r => r.filter(x => x.canceled).length,
  emergency_jobs: r => r.filter(x => x.emergency).length,
  maintenance_visits: r => r.filter(x => x.maintenance).length,
  avg_job_duration: r => avg(r.map(x => x.durationMin ?? 0)),
  avg_ticket: r => { const c = r.filter(x => x.completed && x.amount > 0); return c.length ? Math.round(sum(c, x => x.amount) / c.length) : 0; },
  tech_revenue: r => Math.round(sum(r.filter(x => x.completed), x => x.amount)),
  invoice_revenue: r => Math.round(sum(r, x => x.amount)),
  paid_revenue: r => Math.round(sum(r, x => x.paid ?? 0)),
  payments_collected: r => Math.round(sum(r, x => x.paid ?? 0)),
  outstanding_ar: r => Math.round(sum(r, x => x.balance ?? 0)),
  overdue_invoices: r => r.filter(x => x.overdue).length,
  avg_invoice: r => r.length ? Math.round(sum(r, x => x.amount) / r.length) : 0,
  estimate_count: r => r.length,
  estimate_total: r => Math.round(sum(r, x => x.amount)),
  conversion_rate: r => r.length ? Math.round((r.filter(x => x.won).length / r.length) * 100) : 0,
  estimate_approval_rate: r => { const d = r.filter(x => x.decided).length; return d ? Math.round((r.filter(x => x.won).length / d) * 100) : 0; },
  avg_estimate_value: r => r.length ? Math.round(sum(r, x => x.amount) / r.length) : 0,
  lost_estimate_value: r => Math.round(sum(r.filter(x => x.lost), x => x.amount)),
  lead_count: r => r.length,
  revenue_by_source: r => Math.round(sum(r, x => x.amount)),
};

// ── Date ranges + time buckets ──
function rangeBounds(key: DateRangeKey): { start: Date; end: Date } {
  const end = new Date(); const start = new Date(end);
  switch (key) {
    case "last_7": start.setDate(end.getDate() - 7); break;
    case "last_30": start.setDate(end.getDate() - 30); break;
    case "last_90": start.setDate(end.getDate() - 90); break;
    case "last_12_months": start.setMonth(end.getMonth() - 12); break;
    case "this_month": start.setDate(1); break;
    case "this_quarter": start.setMonth(Math.floor(end.getMonth() / 3) * 3, 1); break;
    case "ytd": start.setMonth(0, 1); break;
    case "all_time": start.setFullYear(2000, 0, 1); break;
  }
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
interface Bucket { label: string; start: number; end: number }
function buckets(start: Date, end: Date, unit: Grouping): Bucket[] {
  const out: Bucket[] = [];
  const d = new Date(start);
  const push = (s: Date, e: Date, label: string) => out.push({ label, start: s.getTime(), end: e.getTime() });
  if (unit === "day") { d.setHours(0, 0, 0, 0); while (d <= end) { const e = new Date(d); e.setDate(d.getDate() + 1); push(new Date(d), e, `${d.getMonth() + 1}/${d.getDate()}`); d.setDate(d.getDate() + 1); } return out.slice(-31); }
  if (unit === "week") { d.setHours(0, 0, 0, 0); let i = 1; while (d <= end) { const e = new Date(d); e.setDate(d.getDate() + 7); push(new Date(d), e, `Wk ${i++}`); d.setDate(d.getDate() + 7); } return out.slice(-14); }
  if (unit === "quarter") { d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1); d.setHours(0, 0, 0, 0); while (d <= end) { const e = new Date(d); e.setMonth(d.getMonth() + 3); push(new Date(d), e, `Q${Math.floor(d.getMonth() / 3) + 1} '${String(d.getFullYear()).slice(2)}`); d.setMonth(d.getMonth() + 3); } return out; }
  if (unit === "year") { d.setMonth(0, 1); d.setHours(0, 0, 0, 0); while (d <= end) { const e = new Date(d); e.setFullYear(d.getFullYear() + 1); push(new Date(d), e, `${d.getFullYear()}`); d.setFullYear(d.getFullYear() + 1); } return out; }
  // month (default)
  d.setDate(1); d.setHours(0, 0, 0, 0);
  while (d <= end) { const e = new Date(d.getFullYear(), d.getMonth() + 1, 1); push(new Date(d), e, MONTHS[d.getMonth()]); d.setMonth(d.getMonth() + 1); }
  return out.slice(-12);
}

// ── Filters ──
const FILTER_TO_DIM: Record<string, Grouping> = {
  location: "location", technician: "technician", job_type: "job_type",
  lead_source: "lead_source", invoice_status: "status", estimate_status: "status",
};
function applyFilters(recs: Rec[], cfg: ReportConfig): Rec[] {
  if (!cfg.filters.length) return recs;
  return recs.filter(r => cfg.filters.every(f => {
    const dim = FILTER_TO_DIM[f.field]; if (!dim) return true; // unmapped filter → no-op
    const val = r.dims[dim]; if (val == null) return true;
    const label = FILTER_DEFS[f.field]?.options.find(o => o.value === f.value)?.label ?? f.value;
    return val.toLowerCase() === label.toLowerCase();
  }));
}

// ── Main ──
export function computeReal(cfg: ReportConfig): ReportResult | null {
  const def = SOURCES[cfg.source];
  const reducer = METRIC_CALC[cfg.metric];
  if (!def || !reducer) return null;
  const isTime = !!GROUPINGS[cfg.groupBy]?.time;
  if (cfg.groupBy !== "none" && !isTime && !def.dims.includes(cfg.groupBy)) return null; // unsupported dimension → mock

  const { start, end } = rangeBounds(cfg.dateRange);
  const inRange = (r: Rec) => r.date && r.date >= start && r.date <= end;
  const recs = applyFilters(def.recs().filter(inRange), cfg);
  const format = METRICS[cfg.metric]?.format ?? "number";

  let points: SeriesPoint[] = [];
  if (cfg.groupBy !== "none") {
    if (isTime) {
      points = buckets(start, end, cfg.groupBy).map(b => ({ label: b.label, value: reducer(recs.filter(r => { const t = r.date!.getTime(); return t >= b.start && t < b.end; })) }));
    } else {
      const groups = new Map<string, Rec[]>();
      for (const r of recs) { const k = r.dims[cfg.groupBy] ?? "—"; (groups.get(k) ?? groups.set(k, []).get(k)!).push(r); }
      points = [...groups.entries()].map(([label, rs]) => ({ label, value: reducer(rs) })).sort((a, b) => b.value - a.value);
    }
  }

  const total = reducer(recs);
  const span = end.getTime() - start.getTime();
  const prevStart = new Date(start.getTime() - span);
  const prev = applyFilters(def.recs().filter(r => r.date && r.date >= prevStart && r.date < start), cfg);
  const previous = reducer(prev);
  const deltaPct = previous ? Math.round(((total - previous) / previous) * 100) : 0;

  return { format, total, previous, deltaPct, points, warnings: [], empty: recs.length === 0 };
}
