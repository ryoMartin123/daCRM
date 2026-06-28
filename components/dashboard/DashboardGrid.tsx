"use client";

// Heavy, interactive widget grid extracted from the dashboard page so it can be
// lazy-loaded. This module owns react-grid-layout (+ react-resizable) and all
// widget components — none of which are needed for the dashboard route shell to
// paint. The parent loads this via next/dynamic, so the library and every widget
// land in a separate chunk fetched after the page frame is visible.

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import React, { memo, useMemo } from "react";
import {
  GridLayout,
  useContainerWidth,
  verticalCompactor,
  type LayoutItem as RGLItem,
} from "react-grid-layout";
import { GripHorizontal, EyeOff } from "lucide-react";

import { resolveWidgetDef, isReportWidget } from "@/lib/dashboard/registry";
import AnalyticsWidget from "@/components/dashboard/AnalyticsWidget";
import { type LayoutItem as DashItem } from "@/lib/dashboard/layouts";

// Memoized widget content — only re-renders when its id changes, NOT on every
// grid re-render. Without this, dragging (which fires layout changes constantly)
// re-renders every widget's heavy content (charts/SVGs) each frame → lag/glitch.
const WidgetContent = memo(function WidgetContent({ id }: { id: string }) {
  return renderWidget(id);
});

// ─── Widget renderer ──────────────────────────────────────
// The dashboard is composed entirely of Analytics report widgets now.
function renderWidget(id: string) {
  if (isReportWidget(id)) return <AnalyticsWidget reportId={id.slice("report:".length)} />;
  return null;
}

export interface DashboardGridProps {
  contextVisible: DashItem[];
  customizing: boolean;
  onLayoutChange: (layout: readonly RGLItem[]) => void;
  onHideWidget: (id: string) => void;
  /** Size (in grid units) of the widget currently being dragged from the
   *  Add-Widgets drawer — drives the drop placeholder. Null when nothing is
   *  being dragged. */
  dragSize: { w: number; h: number } | null;
  /** Fired when a widget is dropped onto the grid; receives the grid cell. */
  onDropWidget: (x: number, y: number) => void;
}

// Id the grid uses internally for the external-drop placeholder.
const DROP_ID = "__dropping-elem__";

export default function DashboardGrid({
  contextVisible, customizing, onLayoutChange, onHideWidget,
  dragSize, onDropWidget,
}: DashboardGridProps) {
  // Convert to react-grid-layout format
  const rglLayout: RGLItem[] = useMemo(() =>
    contextVisible.map(item => {
      const def  = resolveWidgetDef(item.widgetId);
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

  return (
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
        dropConfig={{ enabled: customizing }}
        droppingItem={dragSize
          ? { i: DROP_ID, x: 0, y: 0, w: dragSize.w, h: dragSize.h }
          : undefined}
        onDrop={(_layout, item) => { if (item) onDropWidget(item.x, item.y); }}
        compactor={verticalCompactor}  // stable, deterministic layout (no overlap/jitter)
        onLayoutChange={onLayoutChange}
        autoSize
      >
        {contextVisible.map(item => (
          /* Chromeless cell — the widget owns its own card and fills the cell
             via `h-full`. In customize mode the drag handle floats over the top
             as an absolute overlay so it never changes the widget's height
             (no layout shift between view/edit). */
          <div key={item.widgetId}
            className={["relative", customizing ? "dashboard-widget-editing" : ""].filter(Boolean).join(" ")}
          >
            <WidgetContent id={item.widgetId} />

            {/* ── Drag handle overlay — customize mode only ── */}
            {customizing && (
              <div
                className="widget-drag-handle absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-1.5 select-none"
                style={{
                  backgroundColor: "var(--accent-soft-bg)",
                  borderBottom:    "1px solid var(--accent-soft-border)",
                  borderRadius:    "12px 12px 0 0",
                  cursor:          "grab",
                  minHeight:       "32px",
                }}>
                <GripHorizontal className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--accent-icon)" }} />
                <span className="text-[10px] font-semibold flex-1 truncate" style={{ color: "var(--accent-text)" }}>
                  {resolveWidgetDef(item.widgetId)?.title}
                </span>
                {/* Stop drag from firing when clicking Hide */}
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => onHideWidget(item.widgetId)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "var(--accent-soft-2-bg)", color: "var(--accent-text)" }}
                >
                  <EyeOff className="w-2.5 h-2.5" /> Hide
                </button>
              </div>
            )}
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
