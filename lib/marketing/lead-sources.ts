// ─── Lead sources ─────────────────────────────────────────
// Where leads come from and what each source actually produces. Stores the raw
// counts (leads, booked jobs, revenue, spend); the section derives conversion,
// cost-per-lead, and ROI. localStorage-backed with a seed so it isn't empty.

export type SourceCategory = "digital" | "referral" | "offline" | "repeat";

export interface LeadSource {
  id: string;
  name: string;
  category: SourceCategory;
  active: boolean;
  leads: number;        // last 90 days
  bookedJobs: number;
  revenue: number;      // attributed
  cost: number;         // marketing spend over the period (0 for organic)
}

export const CATEGORY_META: Record<SourceCategory, { label: string; color: string }> = {
  digital:  { label: "Digital",  color: "#2563eb" },
  referral: { label: "Referral", color: "#16a34a" },
  offline:  { label: "Offline",  color: "#f59e0b" },
  repeat:   { label: "Repeat",   color: "#a855f7" },
};

const KEY = "routiqa-marketing-lead-sources";

function seed(): LeadSource[] {
  return [
    { id: "ls-1", name: "Google Ads",              category: "digital",  active: true,  leads: 142, bookedJobs: 58, revenue: 86400, cost: 9200 },
    { id: "ls-2", name: "Google LSA",              category: "digital",  active: true,  leads: 96,  bookedJobs: 51, revenue: 71800, cost: 6100 },
    { id: "ls-3", name: "Google Business Profile", category: "digital",  active: true,  leads: 78,  bookedJobs: 34, revenue: 41200, cost: 0 },
    { id: "ls-4", name: "Website form",            category: "digital",  active: true,  leads: 64,  bookedJobs: 22, revenue: 33500, cost: 0 },
    { id: "ls-5", name: "Customer referral",       category: "referral", active: true,  leads: 53,  bookedJobs: 39, revenue: 68900, cost: 0 },
    { id: "ls-6", name: "Facebook",                category: "digital",  active: true,  leads: 47,  bookedJobs: 12, revenue: 14800, cost: 3400 },
    { id: "ls-7", name: "Yard sign",               category: "offline",  active: true,  leads: 21,  bookedJobs: 9,  revenue: 12600, cost: 450 },
    { id: "ls-8", name: "Repeat customer",         category: "repeat",   active: true,  leads: 88,  bookedJobs: 71, revenue: 119400, cost: 0 },
    { id: "ls-9", name: "Direct mail",             category: "offline",  active: false, leads: 12,  bookedJobs: 3,  revenue: 4100, cost: 1800 },
  ];
}

let cache: LeadSource[] | null = null;
function load(): LeadSource[] {
  if (cache) return cache;
  if (typeof window === "undefined") return seed();
  try { const raw = localStorage.getItem(KEY); cache = raw ? JSON.parse(raw) : seed(); }
  catch { cache = seed(); }
  return cache!;
}
function persist() { if (typeof window !== "undefined") try { localStorage.setItem(KEY, JSON.stringify(cache ?? [])); } catch { /* quota */ } }

export function getLeadSources(): LeadSource[] { return [...load()]; }

export function addLeadSource(name: string, category: SourceCategory): LeadSource {
  const s: LeadSource = { id: `ls-${Date.now().toString(36)}`, name: name.trim(), category, active: true, leads: 0, bookedJobs: 0, revenue: 0, cost: 0 };
  cache = [s, ...load()]; persist(); return s;
}
export function toggleLeadSource(id: string) { cache = load().map(s => s.id === id ? { ...s, active: !s.active } : s); persist(); }
export function deleteLeadSource(id: string) { cache = load().filter(s => s.id !== id); persist(); }

// ── Derived metrics ──
export const conversion = (s: LeadSource) => (s.leads ? s.bookedJobs / s.leads : 0);
export const cpl = (s: LeadSource) => (s.leads && s.cost ? s.cost / s.leads : 0);
export const roi = (s: LeadSource) => (s.cost ? (s.revenue - s.cost) / s.cost : null); // null = organic (no spend)
export const revenuePerLead = (s: LeadSource) => (s.leads ? s.revenue / s.leads : 0);

export interface SourceTotals { leads: number; bookedJobs: number; revenue: number; cost: number; conversion: number; cpl: number; roi: number }
export function totals(list: LeadSource[]): SourceTotals {
  const leads = list.reduce((a, s) => a + s.leads, 0);
  const bookedJobs = list.reduce((a, s) => a + s.bookedJobs, 0);
  const revenue = list.reduce((a, s) => a + s.revenue, 0);
  const cost = list.reduce((a, s) => a + s.cost, 0);
  return {
    leads, bookedJobs, revenue, cost,
    conversion: leads ? bookedJobs / leads : 0,
    cpl: leads && cost ? cost / leads : 0,
    roi: cost ? (revenue - cost) / cost : 0,
  };
}
