"use client";

import { evaluateWidget, type PreviewResult } from "@/lib/dashboard/custom-widgets/evaluate";
import { VIZ_LABELS } from "@/lib/dashboard/custom-widgets/registry";
import type { CustomWidget } from "@/lib/dashboard/custom-widgets/types";

function fmtCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function NumberView({ r }: { r: Extract<PreviewResult, { kind: "number" }> }) {
  const display = r.isCurrency ? fmtCurrency(r.value) : (r.label === "% of total" ? `${r.value}%` : r.value.toLocaleString());
  return (
    <div className="py-6 text-center">
      <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>{display}</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{r.label}</p>
    </div>
  );
}

function ListView({ items }: { items: string[] }) {
  if (items.length === 0) return <EmptyView />;
  return (
    <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
      {items.map((it, i) => (
        <div key={i} className="px-1 py-2 text-sm"
          style={{ color: "var(--text-secondary)", borderTop: i > 0 ? "1px solid var(--border-subtle)" : "none" }}>
          {it}
        </div>
      ))}
    </div>
  );
}

function GroupsView({ rows, isCurrency, viz }: {
  rows: { label: string; value: number }[]; isCurrency: boolean; viz: string;
}) {
  if (rows.length === 0) return <EmptyView />;
  const max = Math.max(...rows.map(r => r.value), 1);
  const PALETTE = ["#4f46e5", "#0891b2", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1"];
  return (
    <div className="space-y-2 py-1">
      {rows.map((r, i) => (
        <div key={r.label} className="flex items-center gap-2">
          <span className="text-xs w-28 truncate shrink-0" style={{ color: "var(--text-secondary)" }}>
            {viz === "leaderboard" && <span className="font-bold mr-1" style={{ color: "var(--text-muted)" }}>{i + 1}.</span>}
            {r.label}
          </span>
          <div className="flex-1 h-4 rounded" style={{ backgroundColor: "var(--bg-input)" }}>
            <div className="h-4 rounded flex items-center justify-end px-1.5"
              style={{ width: `${(r.value / max) * 100}%`, backgroundColor: PALETTE[i % PALETTE.length], minWidth: "20px" }}>
              <span className="text-[10px] font-bold text-white">
                {isCurrency ? fmtCurrency(r.value) : r.value}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyView() {
  return (
    <div className="py-8 text-center">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>No matching records.</p>
    </div>
  );
}

export default function WidgetPreview({ widget }: { widget: CustomWidget }) {
  const result = evaluateWidget(widget);

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
      {/* Preview header — mimics a dashboard widget */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {widget.name || "Untitled Widget"}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          {VIZ_LABELS[widget.visualization]} · live preview
        </p>
      </div>
      <div className="p-4">
        {result.kind === "unavailable" && (
          <div className="py-6 text-center">
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{result.reason}</p>
          </div>
        )}
        {result.kind === "number" && <NumberView r={result} />}
        {result.kind === "list"   && <ListView items={result.items} />}
        {result.kind === "groups" && <GroupsView rows={result.rows} isCurrency={result.isCurrency} viz={widget.visualization} />}
      </div>
    </div>
  );
}
