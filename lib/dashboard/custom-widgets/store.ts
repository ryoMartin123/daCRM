// Custom Widget store — localStorage CRUD + starter templates.
// Replace with Supabase (custom_widgets table) when connected.

import type { CustomWidget } from "./types";

const STORAGE_KEY = "crm-custom-widgets";

// ─── Starter templates ────────────────────────────────────
// Pre-built widget definitions a user can clone as a starting point.
export const WIDGET_TEMPLATES: Omit<CustomWidget, "id" | "createdAt" | "updatedAt" | "status">[] = [
  {
    name: "Revenue (Paid Invoices)", description: "Sum of all paid invoice totals",
    dataSource: "invoices", filters: [{ id: "t1", field: "status", operator: "is", value: "paid" }],
    calculation: { type: "sum", field: "total" }, visualization: "number_card",
    context: "follow", visibility: ["admin", "accounting"],
  },
  {
    name: "Jobs by Status", description: "Count of jobs grouped by status",
    dataSource: "jobs", filters: [],
    calculation: { type: "group_by", field: "status" }, visualization: "bar",
    context: "follow", visibility: ["admin", "manager"],
  },
  {
    name: "Leads by Stage", description: "Pipeline lead count per stage",
    dataSource: "leads", filters: [],
    calculation: { type: "group_by", field: "stage" }, visualization: "funnel",
    context: "follow", visibility: ["admin", "manager", "sales"],
  },
  {
    name: "Overdue Invoices", description: "List of invoices past due",
    dataSource: "invoices", filters: [{ id: "t2", field: "status", operator: "is", value: "past_due" }],
    calculation: { type: "list" }, visualization: "table",
    context: "follow", visibility: ["admin", "accounting"],
  },
  {
    name: "Open Quotes Value", description: "Sum of sent quotes not yet approved",
    dataSource: "quotes", filters: [{ id: "t3", field: "status", operator: "is", value: "sent" }],
    calculation: { type: "sum", field: "total" }, visualization: "number_card",
    context: "follow", visibility: ["admin", "sales"],
  },
];

// ─── Runtime store ────────────────────────────────────────
let _widgets: CustomWidget[] | null = null;

function init(): CustomWidget[] {
  if (_widgets) return _widgets;
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    _widgets = raw ? (JSON.parse(raw) as CustomWidget[]) : [];
  } catch {
    _widgets = [];
  }
  return _widgets;
}

function persist(list: CustomWidget[]) {
  _widgets = list;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export function getWidgets(): CustomWidget[] {
  return [...init()];
}

export function saveWidget(widget: CustomWidget): CustomWidget[] {
  const list = init();
  const idx = list.findIndex(w => w.id === widget.id);
  const next = idx >= 0
    ? list.map(w => w.id === widget.id ? { ...widget, updatedAt: now() } : w)
    : [...list, widget];
  persist(next);
  return [...next];
}

export function deleteWidget(id: string): CustomWidget[] {
  const next = init().filter(w => w.id !== id);
  persist(next);
  return [...next];
}

export function setWidgetStatus(id: string, status: CustomWidget["status"]): CustomWidget[] {
  const next = init().map(w => w.id === id ? { ...w, status, updatedAt: now() } : w);
  persist(next);
  return [...next];
}

// ─── Helpers ──────────────────────────────────────────────
export function newWidgetId(): string {
  return `cw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function now(): string {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function blankWidget(): CustomWidget {
  return {
    id: newWidgetId(), name: "", description: "",
    dataSource: "jobs", filters: [],
    calculation: { type: "count" }, visualization: "number_card",
    context: "follow", visibility: ["admin"],
    status: "draft", createdAt: now(), updatedAt: now(),
  };
}
