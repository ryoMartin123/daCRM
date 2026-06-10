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

// Default layout — mirrors the current dashboard arrangement.
// Hidden widgets carry sensible default positions so they land cleanly when added.
export const DEFAULT_LAYOUT: LayoutItem[] = [
  // ── Visible by default ─────────────────────────────────
  { widgetId: "stats_overview",    visible: true,  order: 1,  x: 0,  y: 0,  w: 12, h: 3,  minW: 6,  minH: 2  },
  { widgetId: "todays_jobs",       visible: true,  order: 2,  x: 0,  y: 3,  w: 8,  h: 7,  minW: 4,  minH: 4  },
  { widgetId: "urgent_panel",      visible: true,  order: 3,  x: 8,  y: 3,  w: 4,  h: 7,  minW: 3,  minH: 3  },
  { widgetId: "pipeline_snapshot", visible: true,  order: 4,  x: 0,  y: 10, w: 4,  h: 6,  minW: 3,  minH: 4  },
  { widgetId: "quotes_followup",   visible: true,  order: 5,  x: 4,  y: 10, w: 4,  h: 6,  minW: 3,  minH: 4  },
  { widgetId: "revenue_snapshot",  visible: true,  order: 6,  x: 8,  y: 10, w: 4,  h: 6,  minW: 3,  minH: 4  },
  { widgetId: "recent_activity",   visible: true,  order: 7,  x: 0,  y: 16, w: 8,  h: 8,  minW: 4,  minH: 4  },
  { widgetId: "open_work_orders",  visible: true,  order: 8,  x: 8,  y: 16, w: 4,  h: 6,  minW: 3,  minH: 4  },
  { widgetId: "visits_to_schedule",visible: true,  order: 9,  x: 8,  y: 22, w: 4,  h: 6,  minW: 3,  minH: 3  },
  // ── Off by default — added via customize panel ─────────
  { widgetId: "invoices_due",              visible: false, order: 9,  x: 0, y: 24, w: 8,  h: 7, minW: 4, minH: 4 },
  { widgetId: "location_performance",      visible: false, order: 10, x: 0, y: 24, w: 8,  h: 5, minW: 6, minH: 4 },
  { widgetId: "company_performance",       visible: false, order: 11, x: 0, y: 24, w: 8,  h: 5, minW: 6, minH: 4 },
  { widgetId: "revenue_by_company",        visible: false, order: 12, x: 8, y: 24, w: 4,  h: 5, minW: 3, minH: 4 },
  { widgetId: "agreement_renewals",        visible: false, order: 13, x: 0, y: 24, w: 4,  h: 6, minW: 3, minH: 4 },
  { widgetId: "missing_required_photos",   visible: false, order: 14, x: 4, y: 24, w: 4,  h: 6, minW: 3, minH: 4 },
  { widgetId: "leads_in_territory",        visible: false, order: 15, x: 0, y: 24, w: 8,  h: 7, minW: 4, minH: 4 },
  { widgetId: "jobs_in_territory",         visible: false, order: 16, x: 8, y: 24, w: 4,  h: 7, minW: 3, minH: 4 },
];

export const LAYOUT_STORAGE_KEY = "crm-dashboard-layout";

const DEFAULTS_MAP = Object.fromEntries(DEFAULT_LAYOUT.map(d => [d.widgetId, d]));

export function loadLayout(): LayoutItem[] {
  if (typeof window === "undefined") return DEFAULT_LAYOUT;
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!raw) return DEFAULT_LAYOUT;

    const saved = JSON.parse(raw) as Partial<LayoutItem>[];
    const normalised: LayoutItem[] = saved
      .filter(s => s.widgetId)
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
