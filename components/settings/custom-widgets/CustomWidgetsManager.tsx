"use client";

import { useEffect, useState } from "react";
import {
  Plus, Pencil, Trash2, Sparkles, CheckCircle, Clock,
  Eye, Archive, RotateCcw,
} from "lucide-react";
import CustomWidgetBuilder from "./CustomWidgetBuilder";
import {
  getWidgets, saveWidget, deleteWidget, setWidgetStatus,
  blankWidget, newWidgetId, now, WIDGET_TEMPLATES,
} from "@/lib/dashboard/custom-widgets/store";
import {
  DATA_SOURCE_LABELS, CALC_LABELS, VIZ_LABELS, STATUS_STYLE,
} from "@/lib/dashboard/custom-widgets/registry";
import type { CustomWidget, WidgetStatus } from "@/lib/dashboard/custom-widgets/types";

export default function CustomWidgetsManager() {
  const [widgets, setWidgets] = useState<CustomWidget[]>([]);
  const [editing, setEditing] = useState<CustomWidget | null>(null);

  useEffect(() => { setWidgets(getWidgets()); }, []);

  // ── Open builder ──
  function startNew() { setEditing(blankWidget()); }

  function startFromTemplate(i: number) {
    const t = WIDGET_TEMPLATES[i];
    setEditing({ ...t, id: newWidgetId(), status: "draft", createdAt: now(), updatedAt: now() });
  }

  function handleSave(widget: CustomWidget) {
    setWidgets(saveWidget(widget));
    setEditing(null);
  }

  function handleStatus(id: string, status: WidgetStatus) {
    setWidgets(setWidgetStatus(id, status));
  }

  function handleDelete(id: string) {
    setWidgets(deleteWidget(id));
  }

  // ── Builder view ──
  if (editing) {
    return (
      <CustomWidgetBuilder
        initial={editing}
        onSave={(w) => handleSave(w)}
        onCancel={() => setEditing(null)}
      />
    );
  }

  // ── Manager view ──
  return (
    <div className="space-y-5">
      {/* Admin confirmation */}
      <div className="rounded-xl px-4 py-3 flex items-start gap-3"
        style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
        <div className="flex-1">
          <p className="text-xs font-semibold" style={{ color: "#065f46" }}>
            You can create and publish custom widgets as Organization Admin
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#047857" }}>
            Build widgets here, then publish them to the Widget Library. Dashboard users
            can only add approved widgets — they can&apos;t build their own.
          </p>
        </div>
        <button onClick={startNew}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white shrink-0 transition-colors"
          style={{ backgroundColor: "#4f46e5" }}>
          <Plus className="w-3.5 h-3.5" /> New Custom Widget
        </button>
      </div>

      {/* Existing widgets */}
      <div className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Your Custom Widgets
            {widgets.length > 0 && (
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}>{widgets.length}</span>
            )}
          </p>
        </div>

        {widgets.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No custom widgets yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Create one from scratch or start from a template below.
            </p>
          </div>
        ) : (
          <>
            <div className="grid px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
              style={{ gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr auto", color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" }}>
              <span>Widget</span><span>Source / Calc</span><span>Visualization</span><span>Status</span><span />
            </div>
            {widgets.map((wd, i) => {
              const s = STATUS_STYLE[wd.status];
              return (
                <div key={wd.id}
                  className="grid px-4 py-3 items-center hover:bg-[var(--bg-surface-2)] transition-colors"
                  style={{ gridTemplateColumns: "2fr 1.5fr 1.2fr 1fr auto", borderBottom: i < widgets.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{wd.name}</p>
                    {wd.description && <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{wd.description}</p>}
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {DATA_SOURCE_LABELS[wd.dataSource]} · {CALC_LABELS[wd.calculation.type]}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{VIZ_LABELS[wd.visualization]}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block w-fit"
                    style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setEditing(wd)} title="Edit"
                      className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]" style={{ color: "var(--text-muted)" }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {wd.status === "draft" && (
                      <button onClick={() => handleStatus(wd.id, "published")} title="Publish"
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]" style={{ color: "#10b981" }}>
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {wd.status === "published" && (
                      <button onClick={() => handleStatus(wd.id, "disabled")} title="Disable"
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]" style={{ color: "#d97706" }}>
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(wd.status === "disabled" || wd.status === "draft") && (
                      <button onClick={() => handleStatus(wd.id, "archived")} title="Archive"
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]" style={{ color: "var(--text-muted)" }}>
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {wd.status === "archived" && (
                      <button onClick={() => handleStatus(wd.id, "draft")} title="Restore to draft"
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]" style={{ color: "#4f46e5" }}>
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(wd.id)} title="Delete"
                      className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: "#d1d5db" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                      onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Templates */}
      <div className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center gap-2 px-4 py-3"
          style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
          <Sparkles className="w-4 h-4" style={{ color: "#4f46e5" }} />
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Start From a Template</p>
        </div>
        <div className="p-4 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {WIDGET_TEMPLATES.map((t, i) => (
            <button key={t.name} onClick={() => startFromTemplate(i)}
              className="rounded-xl p-3 text-left transition-all hover:shadow-md"
              style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t.name}</p>
              <p className="text-[11px] leading-snug mt-0.5" style={{ color: "var(--text-muted)" }}>{t.description}</p>
              <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                style={{ backgroundColor: "#e0e7ff", color: "#4f46e5" }}>{VIZ_LABELS[t.visualization]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
