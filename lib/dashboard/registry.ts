// Dashboard widget registry.
// Read-only — never changes at runtime. Visibility/order live in layouts.ts.

import type { RoleKey } from "@/lib/roles/types";

export type WidgetSize     = "full" | "wide" | "narrow";
export type ContextLevel   = "org" | "company" | "location" | "service_area";
export type WidgetCategory = "operations" | "sales" | "financial" | "activity";

export interface WidgetDef {
  id:              string;
  title:           string;
  description:     string;
  category:        WidgetCategory;
  defaultSize:     WidgetSize;
  // Context levels where this widget is meaningful.
  allowedContexts: ContextLevel[];
  // Roles that can see this widget. Empty = all roles.
  allowedRoles:    RoleKey[];
}

// The CRM dashboard is now composed entirely of Analytics report widgets — the
// old built-in operational widgets have been retired. New widgets are added from
// Analytics (Add Widget → From Analytics). Kept as an (empty) array so all the
// registry lookups + the customize flow keep working.
export const WIDGET_REGISTRY: WidgetDef[] = [];

// ── Lookups ───────────────────────────────────────────────
export const WIDGET_MAP: Record<string, WidgetDef> =
  Object.fromEntries(WIDGET_REGISTRY.map(w => [w.id, w]));

// Saved Analytics reports surface as dashboard widgets under a "report:<id>"
// widgetId. They're context-agnostic (their own filters scope them) and default
// to a wide cell; the real title/chart is rendered by AnalyticsWidget.
export const REPORT_WIDGET_PREFIX = "report:";
export const isReportWidget = (id: string) => id.startsWith(REPORT_WIDGET_PREFIX);
export function resolveWidgetDef(id: string): WidgetDef | undefined {
  if (isReportWidget(id)) return {
    id, title: "Report", description: "Saved analytics report.",
    category: "activity", defaultSize: "wide",
    allowedContexts: ["org", "company", "location", "service_area"], allowedRoles: [],
  };
  return WIDGET_MAP[id];
}

export const CATEGORY_LABELS: Record<WidgetCategory, string> = {
  operations: "Operations",
  sales:      "Sales",
  financial:  "Financial",
  activity:   "Activity",
};

export const CONTEXT_LABELS: Record<ContextLevel, string> = {
  org:          "Organization",
  company:      "Company",
  location:     "Location",
  service_area: "Service Area",
};

export const SIZE_COLS: Record<WidgetSize, string> = {
  full:   "col-span-3",
  wide:   "col-span-2",
  narrow: "col-span-1",
};

export function getContextLevel(
  effectiveCompanyId?: string,
  effectiveLocationId?: string,
  effectiveServiceAreaId?: string,
): ContextLevel {
  if (effectiveServiceAreaId) return "service_area";
  if (effectiveLocationId)    return "location";
  if (effectiveCompanyId)     return "company";
  return "org";
}
