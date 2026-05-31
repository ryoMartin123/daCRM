// Job Types & Statuses — settings model + localStorage CRUD.
// Future: lives at the Company layer; companies start from industry defaults.
// Will drive the Jobs page, Work Orders, scheduling, reports, and dashboards.

// ─── Job Types ────────────────────────────────────────────
export type JobTypeCategory =
  | "service" | "maintenance" | "install" | "sales" | "warranty" | "emergency" | "project";

export interface JobTypeDef {
  id:          string;
  name:        string;
  key:         string;
  description: string;
  duration:    number;            // default duration in minutes
  category:    JobTypeCategory;
  active:      boolean;
  order:       number;
}

export const JOB_TYPE_CATEGORY_LABELS: Record<JobTypeCategory, string> = {
  service: "Service", maintenance: "Maintenance", install: "Install", sales: "Sales",
  warranty: "Warranty", emergency: "Emergency", project: "Project",
};

const DEFAULT_JOB_TYPES: JobTypeDef[] = [
  { id: "jt-1",  name: "Service Call",          key: "service_call",       description: "General service visit",            duration: 60,  category: "service",     active: true, order: 1 },
  { id: "jt-2",  name: "Maintenance Visit",     key: "maintenance_visit",  description: "Scheduled maintenance",            duration: 90,  category: "maintenance", active: true, order: 2 },
  { id: "jt-3",  name: "Installation",          key: "installation",       description: "New equipment install",            duration: 240, category: "install",     active: true, order: 3 },
  { id: "jt-4",  name: "Inspection",            key: "inspection",         description: "Site or equipment inspection",     duration: 60,  category: "service",     active: true, order: 4 },
  { id: "jt-5",  name: "Estimate / Consultation",key: "estimate",          description: "On-site estimate or consult",      duration: 45,  category: "sales",       active: true, order: 5 },
  { id: "jt-6",  name: "Callback",              key: "callback",           description: "Return visit on prior work",       duration: 60,  category: "service",     active: true, order: 6 },
  { id: "jt-7",  name: "Warranty",              key: "warranty",           description: "Warranty-covered work",            duration: 90,  category: "warranty",    active: true, order: 7 },
  { id: "jt-8",  name: "Emergency",             key: "emergency",          description: "Urgent / after-hours dispatch",    duration: 120, category: "emergency",   active: true, order: 8 },
  { id: "jt-9",  name: "Commercial PM",         key: "commercial_pm",      description: "Commercial preventive maintenance",duration: 180, category: "maintenance", active: true, order: 9 },
  { id: "jt-10", name: "Project Work",          key: "project_work",       description: "Multi-day project task",           duration: 480, category: "project",     active: true, order: 10 },
];

// ─── Job Statuses ─────────────────────────────────────────
export type JobStatusCategory =
  | "open" | "scheduled" | "active" | "waiting" | "completed" | "canceled";

export interface JobStatusDef {
  id:       string;
  name:     string;
  key:      string;
  order:    number;
  color:    string;
  category: JobStatusCategory;
  active:   boolean;
}

export const JOB_STATUS_CATEGORY_LABELS: Record<JobStatusCategory, string> = {
  open: "Open", scheduled: "Scheduled", active: "Active",
  waiting: "Waiting", completed: "Completed", canceled: "Canceled",
};

export const STATUS_COLORS = [
  "#6366f1", "#3b82f6", "#0891b2", "#8b5cf6",
  "#f59e0b", "#ec4899", "#10b981", "#ef4444", "#6b7280",
];

const DEFAULT_JOB_STATUSES: JobStatusDef[] = [
  { id: "js-1",  name: "New",                 key: "new",                  order: 1,  color: "#6b7280", category: "open",      active: true },
  { id: "js-2",  name: "Scheduled",           key: "scheduled",            order: 2,  color: "#6366f1", category: "scheduled", active: true },
  { id: "js-3",  name: "Dispatched",          key: "dispatched",           order: 3,  color: "#3b82f6", category: "scheduled", active: true },
  { id: "js-4",  name: "In Progress",         key: "in_progress",          order: 4,  color: "#0891b2", category: "active",    active: true },
  { id: "js-5",  name: "Waiting on Parts",    key: "waiting_on_parts",     order: 5,  color: "#f59e0b", category: "waiting",   active: true },
  { id: "js-6",  name: "Waiting on Customer", key: "waiting_on_customer",  order: 6,  color: "#f59e0b", category: "waiting",   active: true },
  { id: "js-7",  name: "Waiting on Approval", key: "waiting_on_approval",  order: 7,  color: "#f59e0b", category: "waiting",   active: true },
  { id: "js-8",  name: "Completed",           key: "completed",            order: 8,  color: "#10b981", category: "completed", active: true },
  { id: "js-9",  name: "Invoiced",            key: "invoiced",             order: 9,  color: "#8b5cf6", category: "completed", active: true },
  { id: "js-10", name: "Closed",              key: "closed",               order: 10, color: "#6b7280", category: "completed", active: true },
  { id: "js-11", name: "Canceled",            key: "canceled",             order: 11, color: "#ef4444", category: "canceled",  active: true },
];

// ─── Storage ──────────────────────────────────────────────
const TYPES_KEY    = "crm-job-types";
const STATUSES_KEY = "crm-job-statuses";

let _types: JobTypeDef[] | null = null;
let _statuses: JobStatusDef[] | null = null;

function load<T>(key: string, fallback: T[], cacheSetter: (v: T[]) => void): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    const v = raw ? (JSON.parse(raw) as T[]) : [...fallback];
    cacheSetter(v);
    return v;
  } catch {
    cacheSetter([...fallback]);
    return [...fallback];
  }
}

export function getJobTypes(): JobTypeDef[] {
  if (!_types) _types = load(TYPES_KEY, DEFAULT_JOB_TYPES, v => { _types = v; });
  return [..._types].sort((a, b) => a.order - b.order);
}
export function saveJobTypes(list: JobTypeDef[]): void {
  const ordered = [...list].sort((a, b) => a.order - b.order).map((t, i) => ({ ...t, order: i + 1 }));
  _types = ordered;
  try { localStorage.setItem(TYPES_KEY, JSON.stringify(ordered)); } catch { /* ignore */ }
}
export function resetJobTypes(): JobTypeDef[] {
  _types = [...DEFAULT_JOB_TYPES];
  try { localStorage.setItem(TYPES_KEY, JSON.stringify(_types)); } catch { /* ignore */ }
  return [...DEFAULT_JOB_TYPES];
}

export function getJobStatuses(): JobStatusDef[] {
  if (!_statuses) _statuses = load(STATUSES_KEY, DEFAULT_JOB_STATUSES, v => { _statuses = v; });
  return [..._statuses].sort((a, b) => a.order - b.order);
}
export function saveJobStatuses(list: JobStatusDef[]): void {
  const ordered = [...list].sort((a, b) => a.order - b.order).map((s, i) => ({ ...s, order: i + 1 }));
  _statuses = ordered;
  try { localStorage.setItem(STATUSES_KEY, JSON.stringify(ordered)); } catch { /* ignore */ }
}
export function resetJobStatuses(): JobStatusDef[] {
  _statuses = [...DEFAULT_JOB_STATUSES];
  try { localStorage.setItem(STATUSES_KEY, JSON.stringify(_statuses)); } catch { /* ignore */ }
  return [...DEFAULT_JOB_STATUSES];
}

export function jcId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
}
export function jcSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 48);
}
