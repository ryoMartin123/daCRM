// ─── Analytics builder — core types ───────────────────────
// Shared platform infrastructure: a report is a small, business-friendly spec
// ("show me METRIC from SOURCE filtered by … grouped by … as VIZ") that the
// engine turns into chart data. Reusable across every Routiqa app.

export type VizType =
  | "kpi" | "trend" | "comparison" | "gauge"
  | "line" | "bar" | "hbar" | "donut" | "pie" | "funnel"
  | "table" | "leaderboard";

export type Grouping =
  | "none" | "day" | "week" | "month" | "quarter" | "year"
  | "technician" | "location" | "company" | "job_type" | "customer_type"
  | "lead_source" | "campaign" | "status" | "service_area";

export type DateRangeKey =
  | "last_7" | "last_30" | "last_90" | "last_12_months"
  | "this_month" | "this_quarter" | "ytd" | "all_time";

export type MetricFormat = "number" | "currency" | "percent" | "duration";

export interface ReportFilter {
  id: string;
  field: string;   // filter-def id (e.g. "location", "invoice_status")
  value: string;   // option value
}

export interface ReportConfig {
  id: string;
  name: string;
  app: string;          // owning app id for "Analytics in <app>" surfaces
  source: string;       // data-source id
  metric: string;       // metric id
  dateRange: DateRangeKey;
  filters: ReportFilter[];
  groupBy: Grouping;
  viz: VizType;
  template?: boolean;   // pre-built CRM starter (vs a user-created "my widget")
  createdAt: string;
  updatedAt: string;
}

// ── Engine output ─────────────────────────────────────────
export interface SeriesPoint { label: string; value: number; secondary?: number }

export interface ReportResult {
  format: MetricFormat;
  total: number;            // headline KPI value
  deltaPct?: number;        // vs previous period (for trend/comparison/kpi)
  previous?: number;
  points: SeriesPoint[];    // grouped series (empty for a pure KPI)
  warnings: Warning[];
  empty: boolean;
}

export interface Warning { level: "info" | "warn" | "error"; text: string }

export const newReportConfig = (app = "crm"): ReportConfig => ({
  id: `rpt-${Date.now().toString(36)}`,
  name: "",
  app,
  source: "invoices",
  metric: "paid_revenue",
  dateRange: "last_12_months",
  filters: [],
  groupBy: "month",
  viz: "line",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});
