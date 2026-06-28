// ─── Saved reports store ──────────────────────────────────
// localStorage-backed CRUD for reports built in the composer. Seeded with a few
// examples so the Analytics landing isn't empty. Swap for Supabase later.

import type { ReportConfig } from "./types";
import { newReportConfig } from "./types";

const KEY = "routiqa-analytics-reports-v2";

// Seeds ship as CRM templates — starter reports users can drop onto a dashboard
// or duplicate into their own widgets.
function seed(): ReportConfig[] {
  const now = new Date().toISOString();
  const t = (cfg: Partial<ReportConfig> & { id: string }): ReportConfig => ({ ...newReportConfig(cfg.app ?? "crm"), template: true, createdAt: now, updatedAt: now, ...cfg } as ReportConfig);
  return [
    t({ id: "rpt-seed-1", app: "accounting", name: "Paid revenue by month", source: "invoices", metric: "paid_revenue", dateRange: "last_12_months", groupBy: "month", viz: "line" }),
    t({ id: "rpt-seed-2", name: "Estimate conversion by technician", source: "estimates", metric: "conversion_rate", dateRange: "last_90", groupBy: "technician", viz: "bar" }),
    t({ id: "rpt-seed-3", name: "Jobs by type", source: "jobs", metric: "job_count", dateRange: "last_30", groupBy: "job_type", viz: "donut" }),
    t({ id: "rpt-seed-4", name: "Revenue leaderboard", source: "technicians", metric: "tech_revenue", dateRange: "this_quarter", groupBy: "technician", viz: "leaderboard" }),
    t({ id: "rpt-seed-5", app: "accounting", name: "Outstanding AR", source: "invoices", metric: "outstanding_ar", dateRange: "all_time", groupBy: "none", viz: "kpi" }),
    t({ id: "rpt-seed-6", name: "Jobs completed by month", source: "jobs", metric: "completed_jobs", dateRange: "last_12_months", groupBy: "month", viz: "bar" }),
    t({ id: "rpt-seed-7", name: "Leads by source", source: "leads", metric: "lead_count", dateRange: "last_90", groupBy: "lead_source", viz: "hbar" }),
    t({ id: "rpt-seed-8", name: "Average ticket", source: "jobs", metric: "avg_ticket", dateRange: "last_90", groupBy: "none", viz: "gauge" }),
  ];
}

let cache: ReportConfig[] | null = null;
function load(): ReportConfig[] {
  if (cache) return cache;
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? JSON.parse(raw) : seed();
  } catch { cache = seed(); }
  return cache!;
}
function persist() { if (typeof window !== "undefined") try { localStorage.setItem(KEY, JSON.stringify(cache ?? [])); } catch { /* quota */ } }

export function getReports(): ReportConfig[] { return [...load()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
export function getReport(id: string): ReportConfig | undefined { return load().find(r => r.id === id); }

export function saveReport(cfg: ReportConfig): ReportConfig {
  const list = load();
  const idx = list.findIndex(r => r.id === cfg.id);
  const next = { ...cfg, updatedAt: new Date().toISOString() };
  if (idx >= 0) list[idx] = next; else list.unshift(next);
  cache = list; persist();
  return next;
}
export function deleteReport(id: string) { cache = load().filter(r => r.id !== id); persist(); }
export function duplicateReport(id: string): ReportConfig | undefined {
  const r = getReport(id); if (!r) return;
  return saveReport({ ...r, id: `rpt-${Date.now().toString(36)}`, name: `${r.name} (copy)`, createdAt: new Date().toISOString() });
}
