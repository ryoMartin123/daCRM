// ─── Analytics engine ─────────────────────────────────────
// Turns a ReportConfig into a ReportResult (headline number, grouped series,
// warnings). v1 generates DETERMINISTIC mock data seeded by the config, so the
// live preview is always meaningful and stable. The shape is the real contract —
// swap the generators for queries against CRM stores later, callers don't change.

import type { ReportConfig, ReportResult, SeriesPoint, Grouping, Warning } from "./types";
import { METRICS, GROUPINGS, GROUP_MEMBERS, vizById } from "./catalog";
import { computeReal } from "./realdata";

function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
function rng(seed: number) { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function timeLabels(g: Grouping): string[] {
  const now = new Date();
  switch (g) {
    case "day": return Array.from({ length: 14 }, (_, i) => { const d = new Date(now); d.setDate(now.getDate() - (13 - i)); return `${d.getMonth() + 1}/${d.getDate()}`; });
    case "week": return Array.from({ length: 10 }, (_, i) => `Wk ${i + 1}`);
    case "quarter": return Array.from({ length: 6 }, (_, i) => { const q = ((now.getMonth() / 3 | 0) - (5 - i)); const yr = now.getFullYear() + Math.floor(q / 4); const qq = ((q % 4) + 4) % 4; return `Q${qq + 1} '${String(yr).slice(2)}`; });
    case "year": return Array.from({ length: 4 }, (_, i) => `${now.getFullYear() - 3 + i}`);
    default: return Array.from({ length: 12 }, (_, i) => MONTHS[(now.getMonth() - 11 + i + 12) % 12]); // month
  }
}

function baseScale(format: string): number {
  switch (format) {
    case "currency": return 18000;
    case "percent": return 60;
    case "duration": return 95;       // minutes
    default: return 120;
  }
}

// Real CRM data where the source/metric is wired (realdata.ts); deterministic
// mock everywhere else. Warnings are layered on the final points either way.
export function runReport(cfg: ReportConfig): ReportResult {
  const base = computeReal(cfg) ?? mockResult(cfg);
  return { ...base, warnings: warningsFor(cfg, base.points) };
}

function mockResult(cfg: ReportConfig): ReportResult {
  const metric = METRICS[cfg.metric];
  const format = metric?.format ?? "number";
  const viz = vizById(cfg.viz);
  const seed = hash(`${cfg.source}|${cfg.metric}|${cfg.groupBy}|${cfg.dateRange}|${cfg.filters.map(f => f.field + f.value).join(",")}`);
  const rand = rng(seed);
  const isTime = !!GROUPINGS[cfg.groupBy]?.time;
  const scale = baseScale(format) * (0.6 + rand() * 0.9);

  // Labels for the grouping.
  let labels: string[];
  if (cfg.groupBy === "none") labels = [];
  else if (isTime) labels = timeLabels(cfg.groupBy);
  else labels = GROUP_MEMBERS[cfg.groupBy] ?? ["A", "B", "C", "D"];

  const cap = (v: number) => format === "percent" ? Math.min(99, Math.max(1, Math.round(v))) : Math.max(0, Math.round(v));

  // Build points.
  let points: SeriesPoint[] = [];
  if (labels.length) {
    let trend = scale * (0.7 + rand() * 0.3);
    points = labels.map((label, i) => {
      if (isTime) { trend *= 0.95 + rand() * 0.16; return { label, value: cap(trend) }; }      // gentle drift over time
      return { label, value: cap(scale * (0.35 + rand() * 1.1)) };                              // varied categories
    });
    if (!isTime && (viz.id === "leaderboard" || viz.id === "hbar")) points.sort((a, b) => b.value - a.value);
  }

  // Headline total: average for rate/duration metrics, else sum (or a single draw for "none").
  const agg = (vals: number[]) => format === "percent" || format === "duration"
    ? Math.round(vals.reduce((s, v) => s + v, 0) / Math.max(1, vals.length))
    : Math.round(vals.reduce((s, v) => s + v, 0));
  const total = points.length ? agg(points.map(p => p.value)) : cap(scale);
  const previous = Math.round(total * (0.78 + rand() * 0.4));
  const deltaPct = previous ? Math.round(((total - previous) / previous) * 100) : 0;

  return { format, total, previous, deltaPct, points, warnings: [], empty: labels.length > 0 && points.length === 0 };
}

// ── Validation / data warnings ────────────────────────────
function warningsFor(cfg: ReportConfig, points: SeriesPoint[]): Warning[] {
  const out: Warning[] = [];
  const viz = vizById(cfg.viz);
  const isTime = !!GROUPINGS[cfg.groupBy]?.time;
  const singleValue = viz.id === "kpi" || viz.id === "comparison" || viz.id === "gauge";

  if (cfg.dateRange === "all_time") out.push({ level: "info", text: "All-time ranges can be slow on large accounts — consider narrowing the date range." });
  if (viz.timeOnly && !isTime && !singleValue) out.push({ level: "warn", text: `${viz.label}s read best grouped by a time period (month, week, …).` });
  if (viz.needsCategories && cfg.groupBy === "none") out.push({ level: "warn", text: `${viz.label}s need a "Group by" — pick a dimension like technician or job type.` });
  if ((viz.id === "donut" || viz.id === "pie") && points.length > 6) out.push({ level: "warn", text: `${viz.label}s work best with fewer than 6 categories — try a bar chart or leaderboard.` });
  if (!singleValue && cfg.groupBy === "none") out.push({ level: "warn", text: "This visualization needs a grouping to plot — add a “Group by”." });
  if (points.length === 0 && !singleValue && cfg.groupBy !== "none") out.push({ level: "error", text: "No matching data for these filters." });
  return out;
}

// ── Plain-English summary ─────────────────────────────────
export function summarize(cfg: ReportConfig, dateRangeLabel: string, sourceLabel: string, metricLabel: string): string {
  const grp = GROUPINGS[cfg.groupBy]?.label.toLowerCase();
  const filt = cfg.filters.length ? ` filtered by ${cfg.filters.length} condition${cfg.filters.length > 1 ? "s" : ""}` : "";
  const by = cfg.groupBy === "none" ? "" : ` grouped by ${grp}`;
  return `Showing ${metricLabel.toLowerCase()} from ${sourceLabel.toLowerCase()}${filt}${by} over ${dateRangeLabel.toLowerCase()}.`;
}

// ── Value formatting ──────────────────────────────────────
export function formatValue(v: number, format: string): string {
  switch (format) {
    case "currency": return v >= 1000 ? `$${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `$${v}`;
    case "percent": return `${v}%`;
    case "duration": return v >= 60 ? `${Math.floor(v / 60)}h ${v % 60}m` : `${v}m`;
    default: return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`;
  }
}
export function formatFull(v: number, format: string): string {
  if (format === "currency") return `$${v.toLocaleString()}`;
  if (format === "percent") return `${v}%`;
  if (format === "duration") return v >= 60 ? `${Math.floor(v / 60)}h ${v % 60}m` : `${v}m`;
  return v.toLocaleString();
}
