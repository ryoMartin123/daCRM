"use client";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import React, { useState, useMemo } from "react";
import {
  GridLayout,
  useContainerWidth,
  verticalCompactor,
  type LayoutItem as RGLItem,
} from "react-grid-layout";
import {
  Settings2, Save, X, RotateCcw, GripHorizontal, EyeOff,
  Plus, Eye, ChevronDown, ChevronUp,
} from "lucide-react";

import StatsOverview        from "@/components/dashboard/StatsOverview";
import TodaysJobs           from "@/components/dashboard/TodaysJobs";
import RecentActivity       from "@/components/dashboard/RecentActivity";
import UrgentPanel          from "@/components/dashboard/UrgentPanel";
import RevenueSnapshot      from "@/components/dashboard/RevenueSnapshot";
import PipelineSnapshot     from "@/components/dashboard/PipelineSnapshot";
import QuotesFollowUp       from "@/components/dashboard/QuotesFollowUp";
import OpenWorkOrders       from "@/components/dashboard/OpenWorkOrders";
import InvoicesDue          from "@/components/dashboard/InvoicesDue";
import LocationPerformance  from "@/components/dashboard/LocationPerformance";
import CompanyPerformance   from "@/components/dashboard/CompanyPerformance";
import LeadsInTerritory     from "@/components/dashboard/LeadsInTerritory";
import JobsInTerritory      from "@/components/dashboard/JobsInTerritory";
import AgreementRenewals    from "@/components/dashboard/AgreementRenewals";
import MissingPhotos        from "@/components/dashboard/MissingPhotos";

import { useHierarchy } from "@/components/providers/HierarchyProvider";
import {
  WIDGET_REGISTRY, WIDGET_MAP, CATEGORY_LABELS, CONTEXT_LABELS,
  getContextLevel, type WidgetCategory, type ContextLevel,
} from "@/lib/dashboard/registry";
import {
  DEFAULT_LAYOUT, loadLayout, saveLayout, nextFreeY,
  type LayoutItem as DashItem,
} from "@/lib/dashboard/layouts";

const GREET_DATE = "Friday, May 30";

// ─── Widget renderer ──────────────────────────────────────
function renderWidget(id: string) {
  switch (id) {
    case "stats_overview":          return <StatsOverview />;
    case "todays_jobs":             return <TodaysJobs />;
    case "urgent_panel":            return <UrgentPanel />;
    case "pipeline_snapshot":       return <PipelineSnapshot />;
    case "quotes_followup":         return <QuotesFollowUp />;
    case "revenue_snapshot":        return <RevenueSnapshot />;
    case "recent_activity":         return <RecentActivity />;
    case "open_work_orders":        return <OpenWorkOrders />;
    case "invoices_due":            return <InvoicesDue />;
    case "location_performance":    return <LocationPerformance />;
    case "company_performance":     return <CompanyPerformance />;
    case "leads_in_territory":      return <LeadsInTerritory />;
    case "jobs_in_territory":       return <JobsInTerritory />;
    case "agreement_renewals":      return <AgreementRenewals />;
    case "missing_required_photos": return <MissingPhotos />;
    default: return null;
  }
}

// ─── Context badge ────────────────────────────────────────
const CTX_COLORS: Record<ContextLevel, { bg: string; color: string }> = {
  org:          { bg: "#ede9fe", color: "#5b21b6" },
  company:      { bg: "#e0e7ff", color: "#3730a3" },
  location:     { bg: "#dbeafe", color: "#1e40af" },
  service_area: { bg: "#d1fae5", color: "#065f46" },
};
function ContextBadge({ level }: { level: ContextLevel }) {
  const c = CTX_COLORS[level];
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ backgroundColor: c.bg, color: c.color }}>
      {CONTEXT_LABELS[level]}
    </span>
  );
}

// ─── Sticky customize toolbar ─────────────────────────────
function CustomizeToolbar({
  contextLevel, showAddPanel,
  onToggleAdd, onSave, onCancel, onReset,
}: {
  contextLevel: ContextLevel;
  showAddPanel: boolean;
  onToggleAdd: () => void;
  onSave:      () => void;
  onCancel:    () => void;
  onReset:     () => void;
}) {
  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-xl"
      style={{
        backgroundColor: "rgba(238,242,255,0.96)",
        border:          "1.5px solid #a5b4fc",
        backdropFilter:  "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 4px 24px rgba(79,70,229,0.10)",
      }}>

      {/* Left — mode indicator */}
      <div className="flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ backgroundColor: "#4f46e5" }} />
          <span className="relative inline-flex rounded-full h-2 w-2"
            style={{ backgroundColor: "#4f46e5" }} />
        </span>
        <p className="text-sm font-semibold" style={{ color: "#3730a3" }}>Customize Mode</p>
        <ContextBadge level={contextLevel} />
        <span className="text-xs hidden xl:block" style={{ color: "#6366f1" }}>
          Drag handle to move · drag corner to resize
        </span>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* Add Widget — toggles the panel below */}
        <button onClick={onToggleAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            backgroundColor: showAddPanel ? "#4f46e5" : "transparent",
            border:          `1px solid ${showAddPanel ? "#4f46e5" : "#6366f1"}`,
            color:            showAddPanel ? "#fff" : "#4f46e5",
          }}>
          <Plus className="w-3 h-3" />
          Add Widget
          {showAddPanel
            ? <ChevronUp   className="w-3 h-3" />
            : <ChevronDown className="w-3 h-3" />}
        </button>

        <div className="w-px h-4" style={{ backgroundColor: "#c7d2fe" }} />

        <button onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
          style={{ border: "1px solid #c7d2fe", color: "#4f46e5" }}
          title="Reset to default layout">
          <RotateCcw className="w-3 h-3" /> Reset Default
        </button>
        <button onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors"
          style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}>
          <X className="w-3 h-3" /> Cancel
        </button>
        <button onClick={onSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
          style={{ backgroundColor: "#4f46e5" }}>
          <Save className="w-3 h-3" /> Save Layout
        </button>
      </div>
    </div>
  );
}

// ─── Add widgets panel ────────────────────────────────────
function AddWidgetsPanel({
  hiddenIds, contextLevel, onAdd,
}: {
  hiddenIds: string[]; contextLevel: ContextLevel; onAdd: (id: string) => void;
}) {
  const available = WIDGET_REGISTRY.filter(
    w => hiddenIds.includes(w.id) && w.allowedContexts.includes(contextLevel)
  );
  const otherCtx = WIDGET_REGISTRY.filter(
    w => hiddenIds.includes(w.id) && !w.allowedContexts.includes(contextLevel)
  );

  if (available.length === 0 && otherCtx.length === 0) return (
    <div className="rounded-xl p-4 text-center" style={{ border: "1.5px dashed var(--border)", backgroundColor: "var(--bg-surface-2)" }}>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>All widgets for this context are already visible.</p>
    </div>
  );

  const grouped = available.reduce<Partial<Record<WidgetCategory, typeof WIDGET_REGISTRY>>>((acc, w) => {
    if (!acc[w.category]) acc[w.category] = [];
    acc[w.category]!.push(w);
    return acc;
  }, {});

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: "1.5px solid #c7d2fe", backgroundColor: "var(--bg-surface)", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: "1px solid #e0e7ff", backgroundColor: "#f5f3ff" }}>
        <Plus className="w-4 h-4" style={{ color: "#4f46e5" }} />
        <p className="text-sm font-semibold" style={{ color: "#3730a3" }}>Add Widgets</p>
        <ContextBadge level={contextLevel} />
        <span className="text-xs ml-1" style={{ color: "#6366f1" }}>
          — click a widget to add it to your dashboard
        </span>
      </div>
      <div className="p-4 space-y-4">
        {available.length > 0 ? (
          (Object.entries(grouped) as [WidgetCategory, typeof WIDGET_REGISTRY][]).map(([cat, widgets]) => (
            <div key={cat}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#6366f1" }}>
                {CATEGORY_LABELS[cat]}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {widgets.map(w => (
                  <button key={w.id} onClick={() => onAdd(w.id)}
                    className="flex items-start gap-3 text-left p-3 rounded-xl transition-all hover:shadow-sm group"
                    style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: "#e0e7ff" }}>
                      <Eye className="w-3.5 h-3.5" style={{ color: "#4f46e5" }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{w.title}</p>
                      <p className="text-[10px] leading-snug mt-0.5" style={{ color: "var(--text-muted)" }}>{w.description}</p>
                      <span className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: "#e0e7ff", color: "#4f46e5" }}>
                        {w.defaultSize === "full" ? "Full width" : w.defaultSize === "wide" ? "Wide (⅔)" : "Narrow (⅓)"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-center py-2" style={{ color: "var(--text-muted)" }}>
            No hidden widgets available for this context level.
          </p>
        )}

        {otherCtx.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
              Available at other context levels
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 opacity-50">
              {otherCtx.map(w => (
                <div key={w.id} className="flex flex-col p-3 rounded-xl"
                  style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{w.title}</p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                    {w.allowedContexts.map(c => CONTEXT_LABELS[c]).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function DashboardPage() {
  const {
    userName, activeScopeLabel,
    effectiveCompanyId, effectiveLocationId, effectiveServiceAreaId,
  } = useHierarchy();

  const contextLevel = getContextLevel(effectiveCompanyId, effectiveLocationId, effectiveServiceAreaId);

  const [layout,       setLayout]       = useState<DashItem[]>(() => loadLayout());
  const [draft,        setDraft]        = useState<DashItem[]>(layout);
  const [customizing,  setCustomizing]  = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Widgets visible + allowed at current context level, sorted by y then x
  const contextVisible = useMemo(() =>
    draft
      .filter(i => i.visible && (WIDGET_MAP[i.widgetId]?.allowedContexts.includes(contextLevel) ?? false))
      .sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x),
    [draft, contextLevel]
  );

  const hiddenIds = draft.filter(i => !i.visible).map(i => i.widgetId);

  // Convert to react-grid-layout format
  const rglLayout: RGLItem[] = useMemo(() =>
    contextVisible.map(item => {
      const def  = WIDGET_MAP[item.widgetId];
      // maxW: full-width widget can still be narrowed to half; narrow widgets cap at 8 cols
      const maxW = def?.defaultSize === "narrow" ? 8 : 12;
      return {
        i:    item.widgetId,
        x:    item.x,
        y:    item.y,
        w:    item.w,
        h:    item.h,
        minW: item.minW,
        minH: item.minH,
        maxW,
        maxH: 24,
      };
    }),
    [contextVisible]
  );

  // Container width measurement
  const { width, containerRef } = useContainerWidth();
  const gridWidth = width > 0 ? width : 1280;

  function startCustomize() {
    setDraft(layout);
    setCustomizing(true);
    setShowAddPanel(false);
  }

  // Sync positions from RGL after drag/resize (only during customizing)
  function handleLayoutChange(newLayout: readonly RGLItem[]) {
    if (!customizing) return;
    setDraft(prev => prev.map(item => {
      const upd = newLayout.find(l => l.i === item.widgetId);
      if (!upd) return item;
      return { ...item, x: upd.x, y: upd.y, w: upd.w, h: upd.h };
    }));
  }

  function hideWidget(id: string) {
    setDraft(prev => prev.map(i => i.widgetId === id ? { ...i, visible: false } : i));
  }

  function addWidget(id: string) {
    const ctxVisible = draft.filter(i =>
      i.visible && (WIDGET_MAP[i.widgetId]?.allowedContexts.includes(contextLevel) ?? false)
    );
    const y   = nextFreeY(ctxVisible);
    const def = WIDGET_MAP[id];
    const w   = def.defaultSize === "full" ? 12 : def.defaultSize === "wide" ? 8 : 4;
    setDraft(prev => prev.map(i =>
      i.widgetId === id ? { ...i, visible: true, x: 0, y, w, h: i.h } : i
    ));
  }

  function handleSave() {
    saveLayout(draft);
    setLayout(draft);
    setCustomizing(false);
    setShowAddPanel(false);
  }

  function handleCancel() {
    setDraft(layout);
    setCustomizing(false);
    setShowAddPanel(false);
  }

  function handleReset() {
    setDraft(DEFAULT_LAYOUT);
  }

  return (
    <div className="p-6 space-y-4 transition-colors duration-300"
      style={customizing
        ? { backgroundColor: "rgba(79,70,229,0.018)" }
        : {}}>

      {/* ── Page header ────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {GREET_DATE} — good morning, {userName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
            <ContextBadge level={contextLevel} />
            {activeScopeLabel !== "All locations" && (
              <span className="text-base font-normal" style={{ color: "var(--text-muted)" }}>
                · {activeScopeLabel}
              </span>
            )}
          </div>
        </div>
        {!customizing && (
          <button onClick={startCustomize}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--bg-surface-2)]"
            style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}>
            <Settings2 className="w-3.5 h-3.5" /> Customize
          </button>
        )}
      </div>

      {/* ── Sticky customize toolbar ────────────────────── */}
      {customizing && (
        <CustomizeToolbar
          contextLevel={contextLevel}
          showAddPanel={showAddPanel}
          onToggleAdd={() => setShowAddPanel(v => !v)}
          onSave={handleSave}
          onCancel={handleCancel}
          onReset={handleReset}
        />
      )}

      {/* ── Add widgets panel (collapsible, right below toolbar) ── */}
      {customizing && showAddPanel && (
        <AddWidgetsPanel
          hiddenIds={hiddenIds}
          contextLevel={contextLevel}
          onAdd={addWidget}
        />
      )}

      {/* ── Widget grid ─────────────────────────────────── */}
      {contextVisible.length === 0 ? (
        <div className="rounded-xl p-12 text-center"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            No widgets for this context level
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Click Customize → Add Widget to set up your {CONTEXT_LABELS[contextLevel]} dashboard.
          </p>
          {!customizing && (
            <button onClick={startCustomize}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface-2)" }}>
              <Settings2 className="w-3.5 h-3.5" /> Customize Dashboard
            </button>
          )}
        </div>
      ) : (
        /* The dashboard-grid-editing class gates resize handle visibility via CSS */
        <div ref={containerRef as React.RefObject<HTMLDivElement>}
          className={customizing ? "dashboard-grid-editing" : ""}>
          <GridLayout
            width={gridWidth}
            layout={rglLayout}
            gridConfig={{
              cols:             12,
              rowHeight:        50,
              margin:           [16, 16],
              containerPadding: [0, 0],
            }}
            dragConfig={{
              enabled: customizing,
              bounded: true,               // prevent dragging outside grid bounds
              handle:  ".widget-drag-handle",
            }}
            resizeConfig={{
              enabled: customizing,
              handles: ["se"],
            }}
            compactor={verticalCompactor}  // auto-fill gaps for cleaner layouts
            onLayoutChange={handleLayoutChange}
            autoSize
          >
            {contextVisible.map(item => (
              <div key={item.widgetId}
                className={[
                  "flex flex-col",
                  customizing ? "dashboard-widget-editing" : "",
                ].filter(Boolean).join(" ")}
                style={{
                  overflow:        "hidden",
                  borderRadius:    "12px",
                  backgroundColor: "var(--bg-surface)",
                  boxShadow:       "var(--shadow-card)",
                }}
              >
                {/* ── Drag handle — customize mode only ── */}
                {customizing && (
                  <div
                    className="widget-drag-handle flex items-center gap-2 px-3 py-1.5 shrink-0 select-none"
                    style={{
                      backgroundColor: "#eef2ff",
                      borderBottom:    "1px solid #c7d2fe",
                      borderRadius:    "12px 12px 0 0",
                      cursor:          "grab",
                      minHeight:       "32px",
                    }}>
                    <GripHorizontal className="w-3.5 h-3.5 shrink-0" style={{ color: "#6366f1" }} />
                    <span className="text-[10px] font-semibold flex-1 truncate" style={{ color: "#4f46e5" }}>
                      {WIDGET_MAP[item.widgetId]?.title}
                    </span>
                    {/* Stop drag from firing when clicking Hide */}
                    <button
                      onMouseDown={e => e.stopPropagation()}
                      onClick={() => hideWidget(item.widgetId)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-colors hover:bg-indigo-200"
                      style={{ backgroundColor: "#e0e7ff", color: "#4f46e5" }}
                    >
                      <EyeOff className="w-2.5 h-2.5" /> Hide
                    </button>
                  </div>
                )}

                {/* ── Widget content — scrollable so nothing is lost ── */}
                <div
                  className="flex-1 min-h-0 overflow-y-auto dashboard-widget-content"
                  style={{ borderRadius: customizing ? "0 0 12px 12px" : "12px" }}
                >
                  {renderWidget(item.widgetId)}
                </div>
              </div>
            ))}
          </GridLayout>
        </div>
      )}
    </div>
  );
}
