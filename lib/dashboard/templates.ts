// ─── Dashboard layout templates ───────────────────────────
// Save a whole dashboard arrangement (which widgets + their grid positions) as a
// reusable, named template, then apply it back to the live dashboard — handy for
// swapping layouts when you change scope. Templates are built from the same
// widgets as the dashboard/widget builder; this just stores the arrangement.
// localStorage-backed, same as the layout itself.

import { notifyDataChanged } from "@/lib/sync/liveData";
import { type LayoutItem, loadLayout, saveLayout, loadScopedLayout, saveLayoutForScope } from "./layouts";

export interface DashboardTemplate {
  id: string;
  name: string;
  createdAt: string;   // ISO
  items: LayoutItem[];
}

const KEY = "crm-dashboard-templates";

function read(): DashboardTemplate[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(list: DashboardTemplate[]): void {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(list));
  notifyDataChanged();
}
const uid = () => `dl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const clone = (items: LayoutItem[]): LayoutItem[] => items.map(i => ({ ...i }));

export function getTemplates(): DashboardTemplate[] {
  return read().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createTemplate(name: string, items: LayoutItem[]): DashboardTemplate {
  const t: DashboardTemplate = { id: uid(), name: name.trim() || "Untitled layout", createdAt: new Date().toISOString(), items: clone(items) };
  write([t, ...read()]);
  return t;
}

// Snapshot the CURRENT live dashboard as a new template.
export function saveCurrentAsTemplate(name: string): DashboardTemplate {
  return createTemplate(name, loadLayout());
}

export function renameTemplate(id: string, name: string): void {
  write(read().map(t => (t.id === id ? { ...t, name: name.trim() || t.name } : t)));
}
// Edit an existing template's name and/or widget arrangement.
export function updateTemplate(id: string, patch: { name?: string; items?: LayoutItem[] }): void {
  write(read().map(t => (t.id === id ? {
    ...t,
    name: patch.name !== undefined ? (patch.name.trim() || t.name) : t.name,
    items: patch.items ? clone(patch.items) : t.items,
  } : t)));
}
export function deleteTemplate(id: string): void {
  write(read().filter(t => t.id !== id));
  // Drop any scope assignments that pointed at this template.
  const defs = readDefaults();
  let changed = false;
  for (const [k, tid] of Object.entries(defs)) if (tid === id) { delete defs[k]; changed = true; }
  if (changed) writeDefaults(defs);
}
export function duplicateTemplate(id: string): DashboardTemplate | null {
  const src = read().find(t => t.id === id);
  if (!src) return null;
  return createTemplate(`${src.name} copy`, src.items);
}

// Apply a template to the live dashboard's global layout (replaces it).
export function applyTemplate(id: string): boolean {
  const t = read().find(x => x.id === id);
  if (!t) return false;
  saveLayout(clone(t.items));
  notifyDataChanged();
  return true;
}

// Apply a template to a specific scope's layout right now (no default assignment).
export function applyTemplateHere(id: string, scopeKey: string): boolean {
  const t = read().find(x => x.id === id);
  if (!t) return false;
  saveLayoutForScope(scopeKey, clone(t.items));
  notifyDataChanged();
  return true;
}

// ── Per-scope defaults (auto-apply on scope change) ───────
const SCOPE_DEFAULTS_KEY = "crm-dashboard-scope-defaults"; // Record<scopeKey, templateId>

function readDefaults(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(SCOPE_DEFAULTS_KEY) || "{}"); } catch { return {}; }
}
function writeDefaults(map: Record<string, string>): void {
  if (typeof window !== "undefined") localStorage.setItem(SCOPE_DEFAULTS_KEY, JSON.stringify(map));
  notifyDataChanged();
}
export function getScopeDefaultsMap(): Record<string, string> { return readDefaults(); }
export function getScopeDefault(scopeKey: string): string | null { return readDefaults()[scopeKey] ?? null; }
export function scopesForTemplate(id: string): string[] {
  return Object.entries(readDefaults()).filter(([, tid]) => tid === id).map(([k]) => k);
}
export function setScopeDefault(scopeKey: string, templateId: string | null): void {
  const map = readDefaults();
  if (templateId) map[scopeKey] = templateId; else delete map[scopeKey];
  writeDefaults(map);
}

// Assign a template to a scope: record it as the default AND seed that scope's
// layout so switching to the scope shows it immediately.
export function applyTemplateToScope(templateId: string, scopeKey: string): boolean {
  const t = read().find(x => x.id === templateId);
  if (!t) return false;
  setScopeDefault(scopeKey, templateId);
  saveLayoutForScope(scopeKey, clone(t.items));
  return true;
}

// The layout a scope should show: its own saved layout, else its assigned default
// template, else the global/org layout (back-compat).
export function resolveLayoutForScope(scopeKey: string): LayoutItem[] {
  const scoped = loadScopedLayout(scopeKey);
  if (scoped) return clone(scoped);
  const tid = getScopeDefault(scopeKey);
  if (tid) { const t = read().find(x => x.id === tid); if (t) return clone(t.items); }
  return loadLayout();
}

// ── Import / export (upload / download JSON) ──────────────
export function exportJSON(id: string): string | null {
  const t = read().find(x => x.id === id);
  return t ? JSON.stringify({ name: t.name, items: t.items }, null, 2) : null;
}

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
function validItems(raw: unknown): LayoutItem[] | null {
  if (!Array.isArray(raw)) return null;
  const items: LayoutItem[] = [];
  for (const s of raw as Partial<LayoutItem>[]) {
    if (!s || typeof s.widgetId !== "string") return null;
    if (![s.x, s.y, s.w, s.h].every(isNum)) return null;
    items.push({
      widgetId: s.widgetId, visible: s.visible ?? true, order: isNum(s.order) ? s.order : items.length + 1,
      x: s.x!, y: s.y!, w: s.w!, h: s.h!, minW: isNum(s.minW) ? s.minW : 3, minH: isNum(s.minH) ? s.minH : 3,
    });
  }
  return items;
}

// Accepts either a full template object ({ name, items }) or a raw LayoutItem[].
export function importJSON(text: string, fallbackName = "Imported layout"): DashboardTemplate | { error: string } {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return { error: "That file isn't valid JSON." }; }
  const rawItems = Array.isArray(parsed) ? parsed : (parsed as { items?: unknown })?.items;
  const items = validItems(rawItems);
  if (!items || items.length === 0) return { error: "No valid dashboard widgets found in that file." };
  const name = (!Array.isArray(parsed) && typeof (parsed as { name?: unknown }).name === "string")
    ? String((parsed as { name: string }).name) : fallbackName;
  return createTemplate(name, items);
}
