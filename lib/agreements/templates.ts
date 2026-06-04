// Agreement (Plan) Templates — the rich, reusable template model that the
// Agreement Builder copies into each customer agreement. localStorage-backed
// CRUD mirroring the rest of the agreements settings.
//
// Templates are DEFAULTS. createAgreement() snapshots the relevant fields onto
// the customer agreement, so editing a template later never mutates existing
// active/signed agreements.

import type { Industry } from "./data";
import { agrId, agrSlug } from "./settings";

// ─── Document sections (Step 7 — customer-facing) ─────────
export type SectionKey =
  | "header" | "customer" | "coverage" | "included_services"
  | "visit_schedule" | "billing_terms" | "benefits"
  | "exclusions" | "cancellation" | "renewal" | "signature";

export const ALL_SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "header",            label: "Header" },
  { key: "customer",          label: "Customer Info" },
  { key: "coverage",          label: "Coverage" },
  { key: "included_services", label: "Included Services" },
  { key: "visit_schedule",    label: "Visit Schedule" },
  { key: "billing_terms",     label: "Billing Terms" },
  { key: "benefits",          label: "Benefits" },
  { key: "exclusions",        label: "Exclusions" },
  { key: "cancellation",      label: "Cancellation Terms" },
  { key: "renewal",           label: "Renewal Terms" },
  { key: "signature",         label: "Approval / Signature" },
];

// ─── Building blocks ──────────────────────────────────────
export interface TemplateService {
  id: string; name: string; description?: string;
  quantity: number;
  included: boolean;            // included vs. discounted add-on
  discountPct?: number;        // when not fully included
  workOrderTemplateId?: string;
}

export interface TemplateVisit {
  id: string; name: string;
  frequencyKey: string;        // → VisitRule.key (lib/agreements/settings)
  preferredWindow?: string;    // e.g. "Spring", "March", "Q1"
  durationMin: number;
  jobTypeKey?: string;         // job type created when scheduled
  workOrderTemplateId?: string;
}

export interface TemplateBilling {
  frequencyKey: string;        // → BillingRule.key
  amount: number;              // amount per billing period
  taxable: boolean;
}

export interface TemplateTerm { title: string; body: string }

export interface PlanTemplate {
  id: string; name: string; key: string;
  industry: Industry; typeKey: string;
  description: string;
  planLevel?: string;          // e.g. "Silver" / "Gold" (optional)
  services: TemplateService[];
  visits: TemplateVisit[];
  billing: TemplateBilling;
  benefits: string[];          // benefit labels (snapshot-friendly)
  terms: TemplateTerm[];       // snapshot of terms blocks
  renewal: { autoRenew: boolean; termMonths: number; noticeDays: number; priceIncreasePct: number };
  exclusions?: string;
  sections: SectionKey[];      // enabled customer-facing sections (in order)
  status: "active" | "draft" | "archived";
  active: boolean;
  order: number;
}

const DEFAULT_SECTIONS: SectionKey[] = ALL_SECTIONS.map(s => s.key);
const svc = (name: string, included = true, quantity = 1, discountPct?: number): TemplateService =>
  ({ id: agrId("ts"), name, quantity, included, discountPct });
const vis = (name: string, frequencyKey: string, durationMin: number, preferredWindow?: string, jobTypeKey = "maintenance"): TemplateVisit =>
  ({ id: agrId("tv"), name, frequencyKey, durationMin, preferredWindow, jobTypeKey });

const STD_TERMS: TemplateTerm[] = [
  { title: "Scope of Coverage", body: "This agreement covers the services and visits listed for the covered equipment/systems at the service location." },
  { title: "Exclusions",        body: "Parts and repairs beyond the included scope are billed at the member discount rate. Pre-existing conditions excluded." },
  { title: "Cancellation",      body: "Either party may cancel with 30 days written notice. Prepaid unused visits are refunded pro-rata." },
  { title: "Renewal",           body: "Renews automatically for successive terms unless canceled. Pricing may be adjusted at renewal." },
];
const STD_RENEWAL = { autoRenew: true, termMonths: 12, noticeDays: 30, priceIncreasePct: 0 };

// ─── 7 industry seed templates ────────────────────────────
export const DEFAULT_PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: "pt-1", name: "HVAC Residential Maintenance", key: "hvac_residential_maintenance",
    industry: "HVAC", typeKey: "residential_maintenance",
    description: "Spring and fall tune-ups with filter changes and priority dispatch for residential HVAC systems.",
    services: [svc("Spring tune-up"), svc("Fall tune-up"), svc("Filter replacement"), svc("Repair discount", false, 1, 15)],
    visits: [vis("Spring Tune-up", "semi_annual", 90, "Spring"), vis("Fall Tune-up", "semi_annual", 90, "Fall")],
    billing: { frequencyKey: "annual", amount: 349, taxable: false },
    benefits: ["Priority Scheduling", "Repair Discount", "No Overtime Fee"],
    terms: STD_TERMS, renewal: STD_RENEWAL,
    exclusions: "Refrigerant, parts, and major repairs are billed separately at the member rate.",
    sections: DEFAULT_SECTIONS, status: "active", active: true, order: 1,
  },
  {
    id: "pt-2", name: "HVAC Commercial Quarterly PM", key: "hvac_commercial_quarterly_pm",
    industry: "HVAC", typeKey: "commercial_pm",
    description: "Quarterly preventive maintenance for commercial HVAC systems with detailed service reports.",
    services: [svc("Quarterly inspection"), svc("Filter changes"), svc("Coil cleaning"), svc("Refrigerant check"), svc("Service reporting")],
    visits: [vis("Quarterly PM", "quarterly", 120, "Each quarter")],
    billing: { frequencyKey: "quarterly", amount: 300, taxable: false },
    benefits: ["Priority Scheduling", "No Overtime Fee", "Repair Discount"],
    terms: STD_TERMS, renewal: STD_RENEWAL,
    exclusions: "Compressor and major component replacement billed separately.",
    sections: DEFAULT_SECTIONS, status: "active", active: true, order: 2,
  },
  {
    id: "pt-3", name: "Roofing Annual Inspection", key: "roofing_annual_inspection",
    industry: "Roofing", typeKey: "inspection_plan",
    description: "Annual roof inspection with gutter cleaning, a photo report, and minor repair coverage.",
    services: [svc("Annual inspection"), svc("Gutter cleaning"), svc("Photo report"), svc("Minor repairs (1 hr)")],
    visits: [vis("Annual Inspection", "annual", 120, "Spring", "inspection")],
    billing: { frequencyKey: "annual", amount: 599, taxable: false },
    benefits: ["Storm Damage Priority", "Repair Discount"],
    terms: STD_TERMS, renewal: STD_RENEWAL,
    exclusions: "Full roof replacement and structural repairs are excluded.",
    sections: DEFAULT_SECTIONS, status: "active", active: true, order: 3,
  },
  {
    id: "pt-4", name: "Plumbing Membership", key: "plumbing_membership",
    industry: "Plumbing", typeKey: "membership",
    description: "Quarterly plumbing inspections, drain cleaning, and water-heater checks with emergency priority.",
    services: [svc("Quarterly inspection"), svc("Drain cleaning"), svc("Water heater check"), svc("Repair discount", false, 1, 15)],
    visits: [vis("Quarterly Inspection", "quarterly", 60, "Each quarter", "inspection")],
    billing: { frequencyKey: "quarterly", amount: 75, taxable: false },
    benefits: ["Emergency Priority", "Repair Discount", "Waived Trip Charge"],
    terms: STD_TERMS, renewal: STD_RENEWAL,
    sections: DEFAULT_SECTIONS, status: "active", active: true, order: 4,
  },
  {
    id: "pt-5", name: "Property Maintenance Agreement", key: "property_maintenance_agreement",
    industry: "Property Maintenance", typeKey: "maintenance_contract",
    description: "Monthly property walkthroughs, minor repairs, seasonal prep, and a 24-hour emergency line.",
    services: [svc("Monthly walkthrough"), svc("Minor repairs included"), svc("Seasonal prep"), svc("Quarterly property report")],
    visits: [vis("Monthly Walkthrough", "monthly", 60, "Each month")],
    billing: { frequencyKey: "monthly", amount: 200, taxable: false },
    benefits: ["24hr Emergency Line", "Dedicated Account Manager", "Priority Scheduling"],
    terms: STD_TERMS, renewal: STD_RENEWAL,
    sections: DEFAULT_SECTIONS, status: "active", active: true, order: 5,
  },
  {
    id: "pt-6", name: "General Service Agreement", key: "general_service_agreement",
    industry: "General", typeKey: "service_agreement",
    description: "A flexible recurring service agreement for any trade — configure visits, billing, and benefits.",
    services: [svc("Scheduled service visit")],
    visits: [vis("Service Visit", "quarterly", 90, "Each quarter", "maintenance")],
    billing: { frequencyKey: "quarterly", amount: 150, taxable: false },
    benefits: ["Priority Scheduling", "Repair Discount"],
    terms: STD_TERMS, renewal: STD_RENEWAL,
    sections: DEFAULT_SECTIONS, status: "active", active: true, order: 6,
  },
  {
    id: "pt-7", name: "Custom Agreement", key: "custom_agreement",
    industry: "General", typeKey: "service_agreement",
    description: "Start from a blank structure and build the agreement from scratch.",
    services: [], visits: [],
    billing: { frequencyKey: "annual", amount: 0, taxable: false },
    benefits: [], terms: STD_TERMS, renewal: STD_RENEWAL,
    sections: DEFAULT_SECTIONS, status: "active", active: true, order: 7,
  },
];

// ─── Storage ──────────────────────────────────────────────
const PT_KEY = "crm-agr-plan-templates";
let _templates: PlanTemplate[] | null = null;

function read(): PlanTemplate[] {
  if (typeof window === "undefined") return [...DEFAULT_PLAN_TEMPLATES];
  try { const raw = localStorage.getItem(PT_KEY); return raw ? (JSON.parse(raw) as PlanTemplate[]) : [...DEFAULT_PLAN_TEMPLATES]; }
  catch { return [...DEFAULT_PLAN_TEMPLATES]; }
}
function write(list: PlanTemplate[]): void {
  try { localStorage.setItem(PT_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export function getPlanTemplates(): PlanTemplate[] {
  if (!_templates) _templates = read();
  return [..._templates].sort((a, b) => a.order - b.order);
}
export function getPlanTemplate(id: string): PlanTemplate | undefined {
  return getPlanTemplates().find(t => t.id === id);
}
export function savePlanTemplates(list: PlanTemplate[]): void {
  const ordered = [...list].sort((a, b) => a.order - b.order).map((t, i) => ({ ...t, order: i + 1 }));
  _templates = ordered; write(ordered);
}
export function upsertPlanTemplate(t: PlanTemplate): void {
  const list = getPlanTemplates();
  const idx = list.findIndex(x => x.id === t.id);
  if (idx >= 0) { list[idx] = t; savePlanTemplates(list); }
  else { savePlanTemplates([...list, t]); }
}

export function blankPlanTemplate(): PlanTemplate {
  const max = getPlanTemplates().reduce((m, t) => Math.max(m, t.order), 0);
  return {
    id: agrId("pt"), name: "", key: "", industry: "General", typeKey: "service_agreement",
    description: "", services: [], visits: [],
    billing: { frequencyKey: "annual", amount: 0, taxable: false },
    benefits: [], terms: STD_TERMS, renewal: STD_RENEWAL,
    sections: DEFAULT_SECTIONS, status: "draft", active: true, order: max + 1,
  };
}

export { agrId, agrSlug };
