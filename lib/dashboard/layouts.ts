// Dashboard layout — ordered list of widgets with position data.
// User-editable; registry.ts is read-only.
// Persisted in localStorage under LAYOUT_STORAGE_KEY.
//
// Uses react-grid-layout coordinates:
//   x, y = column / row position in a 12-column grid
//   w, h = width in columns / height in row units (rowHeight=50px)

export interface LayoutItem {
  widgetId: string;
  visible:  boolean;
  order:    number;
  // react-grid-layout position
  x: number;
  y: number;
  w: number;
  h: number;
  minW: number;
  minH: number;
}

// Default dashboard — a grid of prebuilt Analytics template widgets (seeded in
// lib/analytics/store). Users add/remove more via Add Widget → From Analytics.
export const DEFAULT_LAYOUT: LayoutItem[] = [
  { widgetId: "report:rpt-seed-1", visible: true, order: 1, x: 0, y: 0,  w: 8, h: 6, minW: 4, minH: 4 }, // Paid revenue by month (line)
  { widgetId: "report:rpt-seed-5", visible: true, order: 2, x: 8, y: 0,  w: 4, h: 3, minW: 3, minH: 3 }, // Outstanding AR (KPI)
  { widgetId: "report:rpt-seed-8", visible: true, order: 3, x: 8, y: 3,  w: 4, h: 3, minW: 3, minH: 3 }, // Average ticket (gauge)
  { widgetId: "report:rpt-seed-6", visible: true, order: 4, x: 0, y: 6,  w: 8, h: 6, minW: 4, minH: 4 }, // Jobs completed by month (bar)
  { widgetId: "report:rpt-seed-3", visible: true, order: 5, x: 8, y: 6,  w: 4, h: 6, minW: 3, minH: 4 }, // Jobs by type (donut)
  { widgetId: "report:rpt-seed-2", visible: true, order: 6, x: 0, y: 12, w: 6, h: 6, minW: 3, minH: 4 }, // Estimate conversion by tech (bar)
  { widgetId: "report:rpt-seed-7", visible: true, order: 7, x: 6, y: 12, w: 6, h: 6, minW: 3, minH: 4 }, // Leads by source (h-bar)
  { widgetId: "report:rpt-seed-4", visible: true, order: 8, x: 0, y: 18, w: 6, h: 6, minW: 3, minH: 4 }, // Revenue leaderboard
];

// Bumped to v2 when the dashboard switched to analytics widgets — old saved
// layouts (built-in widget ids) are ignored so everyone gets the new default.
export const LAYOUT_STORAGE_KEY = "crm-dashboard-layout-v2";

const DEFAULTS_MAP = Object.fromEntries(DEFAULT_LAYOUT.map(d => [d.widgetId, d]));

export function loadLayout(): LayoutItem[] {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;

    const saved = JSON.parse(raw) as Partial<LayoutItem>[];
    const normalised: LayoutItem[] = saved
      // Keep only known widgets + saved analytics-report widgets; drop stale ids
      // (e.g. widgets that have since been removed) so they don't leave blank cells.
      .filter(s => !!s.widgetId && (!!DEFAULTS_MAP[s.widgetId] || s.widgetId.startsWith("report:")))
      .map(s => {
        const def = DEFAULTS_MAP[s.widgetId!] ?? DEFAULT_LAYOUT[0];
        return {
          widgetId: s.widgetId!,
          visible:  s.visible  ?? def.visible,
          order:    s.order    ?? def.order,
          x:        s.x        ?? def.x,
          y:        s.y        ?? def.y,
          w:        s.w        ?? def.w,
          h:        s.h        ?? def.h,
          minW:     s.minW     ?? def.minW,
          minH:     s.minH     ?? def.minH,
        };
      });

    // Merge new widgets added to DEFAULT_LAYOUT since last save
    const savedIds = new Set(normalised.map(i => i.widgetId));
    DEFAULT_LAYOUT.forEach(d => {
      if (!savedIds.has(d.widgetId)) normalised.push({ ...d });
    });

    return normalised.sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_LAYOUT;
  }
}

export function saveLayout(layout: LayoutItem[]): void {
  try { localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout)); } catch { /* ignore */ }
}

// Returns the next free y position (below all currently visible items).
export function nextFreeY(layout: LayoutItem[]): number {
  const visible = layout.filter(i => i.visible);
  if (visible.length === 0) return 0;
  return Math.max(...visible.map(i => i.y + i.h));
}
