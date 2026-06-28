"use client";

// ─── Analytics report as a dashboard widget ───────────────
// Renders a saved Analytics report inside a CRM dashboard cell — the bridge that
// lets any report built in the composer live on the dashboard grid.

import { useMemo } from "react";
import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { getReport } from "@/lib/analytics/store";
import { runReport } from "@/lib/analytics/engine";
import { metricById, sourceById } from "@/lib/analytics/catalog";
import ChartView from "@/components/analytics/ChartView";

export default function AnalyticsWidget({ reportId }: { reportId: string }) {
  const cfg = useMemo(() => getReport(reportId), [reportId]);
  const result = useMemo(() => (cfg ? runReport(cfg) : null), [cfg]);

  if (!cfg || !result) {
    return (
      <div className="rounded-xl p-4 h-full flex flex-col items-center justify-center text-center" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <BarChart3 className="w-6 h-6 mb-2" style={{ color: "var(--text-muted)" }} />
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>This report was removed.</p>
      </div>
    );
  }
  const metric = metricById(cfg.metric); const source = sourceById(cfg.source);
  return (
    <div className="rounded-xl p-4 h-full min-h-0 flex flex-col" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
      <Link href={`/analytics/builder?id=${cfg.id}`} className="flex items-start justify-between gap-2 mb-3 group">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold truncate group-hover:underline" style={{ color: "var(--text-primary)" }}>{cfg.name || "Untitled report"}</h2>
          <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{metric?.label} · {source?.label}</p>
        </div>
      </Link>
      <div className="flex-1 min-h-0"><ChartView result={result} viz={cfg.viz} metricLabel={metric?.label ?? ""} /></div>
    </div>
  );
}
