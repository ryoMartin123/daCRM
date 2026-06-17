// Calendar / Dispatch settings — scoped with inheritance.
//
// Settings cascade Organization defaults → Company overrides → Location/Branch
// overrides. The dispatch board always resolves the *most specific* settings for
// the active company/location context.
//
// A scope stores only the sections it explicitly overrides; absent sections are
// inherited from the parent. Dispatch boards are NOT inherited — each board
// belongs to a company + location and is stored once in a flat list.
//
// Persistence is localStorage-only for now (no Supabase). The shape mirrors what
// will become per-organization / per-company / per-location settings rows.

import {
  SERVICE_BLOCKS, CALENDAR_LAYERS, LAYER_CONFIG, DAY_START_HOUR,
  type CalendarItemType, type DispatchMode,
} from "./types";
import { defaultQueueViews, type QueueView } from "./queueViews";
import { companies, locations } from "@/lib/hierarchy/data";
import { toJobTypeKey } from "@/lib/job-config/data";

const STORAGE_KEY = "crm-dispatch-settings";

// ─── Types ────────────────────────────────────────────────
export type CalendarViewMode = "dispatch" | "day" | "week" | "month";
export type HourIncrement = 15 | 30 | 60;
export type HourLabelStyle = "hours" | "all";
export type BoardType = "service" | "install" | "maintenance" | "commercial" | "custom";

export interface SettingsServiceBlock {
  id: string;
  name: string;
  startHour: number;   // 24h, may be fractional (e.g. 8.5 = 8:30)
  endHour: number;
  active: boolean;
  order: number;
}

export interface SettingsLayer {
  type: CalendarItemType;
  enabled: boolean;          // available at all
  visibleByDefault: boolean; // shown on first load
  color: string;
}

// A dispatch board belongs to a company + location.
export interface DispatchBoard {
  id: string;
  name: string;
  companyId: string;
  locationId: string;
  boardType: BoardType;
  dispatchers: string[];
  techNames: string[];                 // specific users assigned to the board
  roleKeys: string[];                  // roles assigned to the board (expand to users)
  jobTypes: string[];
  serviceAreaIds: string[];           // optional narrowing; empty = all
  defaultView?: CalendarViewMode;     // optional per-board view seed
  defaultDispatchMode?: DispatchMode; // optional per-board mode seed
  active: boolean;
  isDefault: boolean;                 // default board within its company+location
}

// The fully-resolved, non-board settings the dispatch board consumes.
export interface DispatchSettings {
  defaultView: CalendarViewMode;
  defaultDispatchMode: DispatchMode;
  hourly: {
    startHour: number;
    endHour: number;
    increment: HourIncrement;
    labelStyle: HourLabelStyle;
  };
  blocks: SettingsServiceBlock[];
  layers: SettingsLayer[];
}

// What a single scope (org / company / location) can override. Only the present
// sections are overrides; absent sections inherit from the parent scope.
export interface ScopedDispatchConfig {
  defaults?: { defaultView: CalendarViewMode; defaultDispatchMode: DispatchMode };
  hourly?: DispatchSettings["hourly"];
  blocks?: SettingsServiceBlock[];
  layers?: SettingsLayer[];
}

export type DispatchSection = "defaults" | "hourly" | "blocks" | "layers";

// Persisted store: per-scope overrides + a flat board list + queue views.
export interface DispatchStore {
  version: 3;
  scopes: Record<string, ScopedDispatchConfig>;
  boards: DispatchBoard[];
  queueViews: QueueView[];   // Unscheduled Queue saved tabs/views (lead time lives per-view)
}

export type ScopeLevel = "org" | "company" | "location";

// ─── Board job types ──────────────────────────────────────
// Dispatchers/technicians for boards now come from the user directory
// (lib/users getDispatcherNames / getTechnicianNames). Board job-type OPTIONS come
// from the configured Job Types (Settings → Job Types) via getJobTypes() — a board
// stores type KEYS, the UI shows labels. There's no hardcoded list here anymore.

export const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  service: "Service", install: "Install", maintenance: "Maintenance", commercial: "Commercial", custom: "Custom",
};

// Choosing a board type auto-adds the matching job type KEY to the board's Job
// Types so the type label and what the board actually claims can't drift apart.
// Only types that exist as a single job-type key are mapped: Install → installation,
// Maintenance → agreement_visit (the canonical Maintenance key, so the board claims
// both ad-hoc maintenance and agreement-generated visits). Service has no single
// job-type key (it's a category spanning repair/inspection), and Commercial/Custom
// are segments, so those leave the Job Types list untouched.
export const BOARD_TYPE_JOB_TYPE: Partial<Record<BoardType, string>> = {
  install: "installation", maintenance: "agreement_visit",
};

// ─── Defaults ─────────────────────────────────────────────
function defaultBlocks(): SettingsServiceBlock[] {
  return SERVICE_BLOCKS.map((b, i) => ({
    id: b.key, name: b.label, startHour: b.startHour, endHour: b.endHour, active: true, order: i,
  }));
}

function defaultLayers(): SettingsLayer[] {
  const order: CalendarItemType[] = [
    "job", "agreement_visit", "task", "project_milestone", "internal_event", "blocked_time",
  ];
  const hiddenByDefault = new Set<CalendarItemType>(["blocked_time"]);
  return order.map(type => ({
    type, enabled: true, visibleByDefault: !hiddenByDefault.has(type), color: LAYER_CONFIG[type].color,
  }));
}

// The hardcoded organization baseline (before any saved org override).
export function defaultDispatchSettings(): DispatchSettings {
  return {
    defaultView: "dispatch",
    defaultDispatchMode: "hourly",
    hourly: { startHour: DAY_START_HOUR, endHour: 18, increment: 30, labelStyle: "hours" },
    blocks: defaultBlocks(),
    layers: defaultLayers(),
  };
}

// Boards are created per location in Settings → Calendar / Dispatch. None are
// seeded by default — a fresh org starts with no boards (the page falls back to
// the built-in "All Boards" view).
// The CRM always has at least one board, so adding technicians / scheduling
// never hits a "no board" edge case. This default board is org-wide and can't be
// deleted. It's seeded with the field roles so technicians/installers show up on
// it out of the box (dispatchers/CSRs don't — they aren't schedulable rows).
export const DEFAULT_BOARD_ID = "board-default";
const DEFAULT_BOARD_ROLES = ["field_technician", "installer"];
function defaultBoards(): DispatchBoard[] {
  return [{
    id: DEFAULT_BOARD_ID, name: "Main Board", companyId: "", locationId: "", boardType: "custom",
    dispatchers: [], techNames: [], roleKeys: [...DEFAULT_BOARD_ROLES], jobTypes: [], serviceAreaIds: [],
    active: true, isDefault: true,
  }];
}

// Guarantee ≥1 board and exactly one default. Applied to every store read.
// Self-heal: a board whose type implies a job type (Service/Install/Maintenance)
// should carry that job-type chip so the matcher claims the right work. Boards saved
// before board-type→job-type sync get the chip added on load. Additive only — it
// never removes a chip the user set.
function backfillBoardJobType(b: DispatchBoard): DispatchBoard {
  const jt = BOARD_TYPE_JOB_TYPE[b.boardType];
  return jt && !b.jobTypes.includes(jt) ? { ...b, jobTypes: [...b.jobTypes, jt] } : b;
}

// Boards now store job-type KEYS, but boards saved before that stored display names
// ("Maintenance", "Agreement Visit"). Normalize every entry to its key on load —
// idempotent, so keys pass through unchanged.
function normalizeBoardJobTypeKeys(b: DispatchBoard): DispatchBoard {
  const keys = Array.from(new Set(b.jobTypes.map(toJobTypeKey)));
  const changed = keys.length !== b.jobTypes.length || keys.some((k, i) => k !== b.jobTypes[i]);
  return changed ? { ...b, jobTypes: keys } : b;
}

export function ensureBoards(boards: DispatchBoard[] | undefined): DispatchBoard[] {
  if (!boards || boards.length === 0) return defaultBoards();
  const filled = boards.map(normalizeBoardJobTypeKeys).map(backfillBoardJobType);
  if (!filled.some(b => b.isDefault)) return filled.map((b, i) => (i === 0 ? { ...b, isDefault: true } : b));
  return filled;
}

function defaultStore(): DispatchStore {
  return { version: 3, scopes: {}, boards: defaultBoards(), queueViews: defaultQueueViews() };
}

// A custom view's job-type filter stored display names before keys were canonical;
// normalize it the same way boards are. Idempotent.
function normalizeViewJobTypeKeys(v: QueueView): QueueView {
  const jt = v.filters?.jobTypes;
  if (!jt?.length) return v;
  const keys = Array.from(new Set(jt.map(toJobTypeKey)));
  const changed = keys.length !== jt.length || keys.some((k, i) => k !== jt[i]);
  return changed ? { ...v, filters: { ...v.filters, jobTypes: keys } } : v;
}

// System (source-category) views are constant: always present, always active +
// visible, with their canonical name/filters — users can't edit, hide, or delete
// them. Their per-view settings (e.g. the Agreements lead time) and tab order ARE
// kept. Custom views are preserved as-is.
function reconcileQueueViews(saved: QueueView[] | undefined): QueueView[] {
  const defaults = defaultQueueViews();
  const list = saved?.length ? saved : defaults;
  const out: QueueView[] = [];
  for (const v of list) {
    if (v.system) {
      const def = defaults.find(d => d.key === v.key);
      if (def) out.push({ ...def, order: v.order, leadDays: v.leadDays ?? def.leadDays });   // lock identity, keep order + settings
    } else {
      out.push(normalizeViewJobTypeKeys(v));             // custom view untouched (but job-type filter normalized to keys)
    }
  }
  for (const def of defaults) {
    if (!out.some(v => v.key === def.key)) out.push({ ...def });
  }
  return out;
}

// ─── Persistence + migration ──────────────────────────────
// Map a legacy board's free-text `location` label to a location id.
function locationIdFromLabel(label: string): { companyId: string; locationId: string } {
  const norm = (label ?? "").replace(/ Branch$/i, "").trim().toLowerCase();
  const loc = locations.find(l => l.name.replace(/ Branch$/i, "").trim().toLowerCase() === norm)
    ?? locations.find(l => (l.city ?? "").toLowerCase() === norm);
  if (loc) return { companyId: loc.companyId, locationId: loc.id };
  const first = locations[0];
  return { companyId: first.companyId, locationId: first.id };
}

// Convert the old flat v1 shape into the scoped v2 store.
function migrateV1(parsed: Record<string, unknown>): DispatchStore {
  const org: ScopedDispatchConfig = {};
  if (parsed.defaultView || parsed.defaultDispatchMode) {
    org.defaults = {
      defaultView: (parsed.defaultView as CalendarViewMode) ?? "dispatch",
      defaultDispatchMode: (parsed.defaultDispatchMode as DispatchMode) ?? "hourly",
    };
  }
  if (parsed.hourly) org.hourly = parsed.hourly as DispatchSettings["hourly"];
  if (parsed.blocks) org.blocks = parsed.blocks as SettingsServiceBlock[];
  if (parsed.layers) org.layers = parsed.layers as SettingsLayer[];

  let boards = defaultBoards();
  const legacy = parsed.boards as Array<Record<string, unknown>> | undefined;
  if (Array.isArray(legacy) && legacy.length) {
    boards = legacy.map((b, i) => {
      const { companyId, locationId } = locationIdFromLabel(String(b.location ?? ""));
      return {
        id: String(b.id ?? `brd-${i}`),
        name: String(b.name ?? "Board"),
        companyId, locationId,
        boardType: "custom" as BoardType,
        dispatchers: (b.dispatchers as string[]) ?? [],
        techNames: (b.techNames as string[]) ?? [],
        roleKeys: (b.roleKeys as string[]) ?? [],
        jobTypes: (b.jobTypes as string[]) ?? [],
        serviceAreaIds: [],
        active: b.active !== false,
        isDefault: !!b.isDefault,
      };
    });
  }
  return { version: 3, scopes: { org }, boards: ensureBoards(boards), queueViews: defaultQueueViews() };
}

export function getStore(): DispatchStore {
  if (typeof window === "undefined") return defaultStore();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed.version === 3) {
      const store = parsed as unknown as DispatchStore;
      return {
        version: 3,
        scopes: store.scopes ?? {},
        boards: ensureBoards(store.boards),
        queueViews: reconcileQueueViews(store.queueViews),
      };
    }
    if (parsed.version === 2) {
      // v2 → v3: keep scopes/boards, seed default queue views (and persist).
      const store = parsed as unknown as DispatchStore;
      const upgraded: DispatchStore = {
        version: 3,
        scopes: store.scopes ?? {},
        boards: ensureBoards(store.boards),
        queueViews: defaultQueueViews(),
      };
      saveStore(upgraded);
      return upgraded;
    }
    // Legacy v1 → migrate (and persist the upgrade).
    const migrated = migrateV1(parsed);
    saveStore(migrated);
    return migrated;
  } catch {
    return defaultStore();
  }
}

export function saveStore(store: DispatchStore): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* ignore */ }
}

export function resetStore(): DispatchStore {
  const d = defaultStore();
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  return d;
}

// ─── Scope keys ───────────────────────────────────────────
export function scopeKeyOf(level: ScopeLevel, companyId?: string, locationId?: string): string {
  if (level === "company") return `company:${companyId}`;
  if (level === "location") return `location:${locationId}`;
  return "org";
}

// ─── Resolution (Org → Company → Location) ────────────────
function mergeInto(base: DispatchSettings, c?: ScopedDispatchConfig): DispatchSettings {
  if (!c) return base;
  return {
    defaultView:         c.defaults?.defaultView ?? base.defaultView,
    defaultDispatchMode: c.defaults?.defaultDispatchMode ?? base.defaultDispatchMode,
    hourly:              c.hourly ?? base.hourly,
    blocks:              c.blocks ?? base.blocks,
    layers:              c.layers ?? base.layers,
  };
}

// Resolve against a given store (used by the Settings UI with unsaved edits).
export function resolveFromStore(store: DispatchStore, companyId?: string, locationId?: string): DispatchSettings {
  let out = defaultDispatchSettings();
  out = mergeInto(out, store.scopes["org"]);
  if (companyId) out = mergeInto(out, store.scopes[`company:${companyId}`]);
  if (locationId) out = mergeInto(out, store.scopes[`location:${locationId}`]);
  return out;
}

// Resolve the most-specific settings for the active context.
export function resolveDispatchSettings(companyId?: string, locationId?: string): DispatchSettings {
  return resolveFromStore(getStore(), companyId, locationId);
}

// The resolved *parent* settings a scope inherits from (for the Settings UI).
export function resolveParent(store: DispatchStore, level: ScopeLevel, companyId?: string, locationId?: string): DispatchSettings {
  if (level === "org") return defaultDispatchSettings();
  if (level === "company") return resolveFromStore(store, undefined, undefined); // base + org
  const loc = locations.find(l => l.id === locationId);
  return resolveFromStore(store, loc?.companyId, undefined);                      // base + org + company
}

// ─── Boards ───────────────────────────────────────────────
// Boards visible for the active hierarchy scope: you see boards AT your scope and
// everything BELOW it, never above. So a location sees only its own boards; a
// company sees its company-level boards plus all its locations'; org sees all.
export function getBoardsForContext(companyId?: string, locationId?: string): DispatchBoard[] {
  const boards = getStore().boards.filter(b => b.active);
  if (locationId) return boards.filter(b => b.locationId === locationId);  // this location only
  if (companyId)  return boards.filter(b => b.companyId === companyId);     // company + its locations
  return boards;                                                            // org / "All" → every board
}

// Item shape used by board matching — every CalendarItem and UnscheduledItem
// carries these fields.
type BoardMatchItem = { assignedTo?: string; jobType?: string; serviceAreaId?: string; companyId?: string; locationId?: string };

// Is an item inside a board's branch scope? Location is the primary lens: a
// location board only owns its own branch; a company board owns its company; an
// org-wide board (no company/location) owns everything. An item with no
// company/location set is treated as in-scope (better surfaced than hidden).
function boardScopeOwns(item: BoardMatchItem, board: DispatchBoard): boolean {
  if (board.locationId) return !item.locationId || item.locationId === board.locationId;
  if (board.companyId)  return !item.companyId  || item.companyId  === board.companyId;
  return true;
}

// A board's resolved member set, keyed by board id. Members = the board's named
// techs PLUS everyone holding its assigned roles (the role expansion lives in the
// user directory, so callers resolve it and pass it in). Falls back to the board's
// raw techNames when no resolved set is supplied.
export type BoardMembers = Record<string, Set<string>>;
function memberSet(board: DispatchBoard, members?: BoardMembers): Set<string> {
  return members?.[board.id] ?? new Set(board.techNames);
}

// Does a board DIRECTLY claim an UNASSIGNED item — by job type or territory, within
// its branch scope? This is what routes new/queued work to the right board (Install
// vs Service) before anyone is assigned. Job type and service area are OR'd: an item
// belongs if it matches ANY. Service area is inclusive (a territory the board covers),
// never an exclusive veto. A board naming neither relies on the branch catch-all
// (isDefault) instead. NOTE: assigned items are NOT routed here — see itemMatchesBoard.
function boardDirectlyClaims(item: BoardMatchItem, board: DispatchBoard): boolean {
  if (!boardScopeOwns(item, board)) return false;
  const typeMatch = !!item.jobType && board.jobTypes.includes(item.jobType);
  const areaMatch = !!item.serviceAreaId && board.serviceAreaIds.includes(item.serviceAreaId);
  return typeMatch || areaMatch;
}

// Does an item belong on a board?
//
// The model: a technician has ONE schedule, and a board is a lens onto a set of
// technicians. So routing splits on whether the item is assigned yet:
//
//   • ASSIGNED  → it belongs to a board iff that board's MEMBERS include the
//     assignee. The job follows the tech: if they're on three boards, it shows on
//     all three (same single schedule). Job type is only a within-board filter here,
//     never a claim — this is why an estimate assigned to a service tech no longer
//     lands "unassigned" on the Sales board the tech isn't a member of.
//   • UNASSIGNED → routed by job type / service area / scope, so queued work surfaces
//     on the board that handles that kind of work, to be picked up and assigned.
//
// Pass `allBoards` (boards for the current context) to enable the branch catch-all,
// and `members` (resolved member sets per board) so membership matches the rows the
// board actually shows. Without `members`, membership falls back to raw techNames.
export function itemMatchesBoard(
  item: BoardMatchItem,
  board: DispatchBoard,
  allBoards?: DispatchBoard[],
  members?: BoardMembers,
): boolean {
  // ── Assigned: route purely by board membership (the tech's one schedule) ──
  if (item.assignedTo) {
    if (!boardScopeOwns(item, board)) return false;
    if (memberSet(board, members).has(item.assignedTo)) return true;
    // Assignee belongs to NO board in this branch (e.g. a removed tech) → the branch
    // default board catches the job so it stays visible in its Unassigned lane.
    if (board.isDefault && allBoards) {
      const inScope = allBoards.filter(b =>
        b.active && b.companyId === board.companyId && b.locationId === board.locationId);
      if (!inScope.some(b => memberSet(b, members).has(item.assignedTo!))) return true;
    }
    return false;
  }

  // ── Unassigned: route by job type / service area, with the branch catch-all ──
  if (boardDirectlyClaims(item, board)) return true;
  if (!boardScopeOwns(item, board)) return false;

  // Branch catch-all — the default board for this company+location claims any
  // unassigned item its siblings don't directly claim.
  if (board.isDefault && allBoards) {
    const siblings = allBoards.filter(b =>
      b.id !== board.id && b.active &&
      b.companyId === board.companyId && b.locationId === board.locationId,
    );
    if (!siblings.some(b => boardDirectlyClaims(item, b))) return true;
  }

  // Legacy: a board naming neither crew nor job types behaves as an "all in scope"
  // board (covers the org-wide Main Board and boards still being configured).
  if (board.techNames.length === 0 && board.jobTypes.length === 0) return true;

  return false;
}

// ─── Agreement visit lead time ────────────────────────────
// How many days ahead an agreement's planned visit starts appearing in the
// Unscheduled Queue. Lives on the (locked) "Agreement Visits" queue view, edited
// in Settings → Calendar / Dispatch → Queue Views. Default 30.
export function getAgreementLeadDays(): number {
  return getQueueViews().find(v => v.key === "agreement_visits")?.leadDays ?? 30;
}

// ─── Queue views ──────────────────────────────────────────
// All saved Unscheduled Queue views, ordered. Inactive views are kept (the
// Settings editor still lists them) — the board filters to active+visible.
export function getQueueViews(): QueueView[] {
  return [...getStore().queueViews].sort((a, b) => a.order - b.order);
}

// The views the dispatch board should render as tabs: active and visible by
// default, in order. "All" is guaranteed present even if it was deactivated.
export function getVisibleQueueViews(): QueueView[] {
  const all = getQueueViews();
  const visible = all.filter(v => v.active && v.defaultVisible);
  if (!visible.some(v => v.key === "all")) {
    const allView = all.find(v => v.key === "all") ?? defaultQueueViews()[0];
    return [allView, ...visible];
  }
  return visible;
}

// ─── Helpers ──────────────────────────────────────────────
export function formatHour(h: number): string {
  const whole = Math.floor(h);
  const mins = Math.round((h - whole) * 60);
  const period = whole >= 12 ? "PM" : "AM";
  const h12 = whole % 12 === 0 ? 12 : whole % 12;
  return `${h12}:${mins.toString().padStart(2, "0")} ${period}`;
}

export function newBlockId(): string { return `blk-${Math.random().toString(36).slice(2, 8)}`; }
export function newBoardId(): string { return `brd-${Math.random().toString(36).slice(2, 8)}`; }

export const LAYER_LABEL = (type: CalendarItemType): string => LAYER_CONFIG[type].label;
export { CALENDAR_LAYERS };
