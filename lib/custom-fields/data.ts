// Custom Fields — mock data + CRUD helpers.
// Persisted to localStorage under STORAGE_KEY.
// Replace with Supabase queries when connected:
//   supabase.from('custom_fields').select('*').eq('organization_id', orgId)

import type { CustomField, RecordType } from "./types";

const STORAGE_KEY = "crm-custom-fields";

// ─── Seed data ────────────────────────────────────────────
const SEED_FIELDS: CustomField[] = [
  // ── Customers ─────────────────────────────────────────
  { id: "cf-c1", recordType: "customers", label: "Preferred Contact Time", key: "preferred_contact_time",
    fieldType: "dropdown", required: false, visible: true, sortOrder: 1, createdAt: "2026-05-01",
    options: ["Morning (8am–12pm)", "Afternoon (12pm–5pm)", "Evening (5pm–8pm)", "Any Time"] },
  { id: "cf-c2", recordType: "customers", label: "Customer Tier",         key: "customer_tier",
    fieldType: "dropdown", required: false, visible: true, sortOrder: 2, createdAt: "2026-05-01",
    options: ["Standard", "Silver", "Gold", "VIP"] },
  { id: "cf-c3", recordType: "customers", label: "Referred By",           key: "referred_by",
    fieldType: "text",     required: false, visible: true, sortOrder: 3, createdAt: "2026-05-01" },
  { id: "cf-c4", recordType: "customers", label: "Do Not Contact",        key: "do_not_contact",
    fieldType: "checkbox", required: false, visible: true, sortOrder: 4, createdAt: "2026-05-01" },

  // ── Leads ──────────────────────────────────────────────
  { id: "cf-l1", recordType: "leads", label: "Lead Temperature",  key: "lead_temperature",
    fieldType: "dropdown", required: false, visible: true, sortOrder: 1, createdAt: "2026-05-01",
    options: ["Cold", "Warm", "Hot"] },
  { id: "cf-l2", recordType: "leads", label: "Competitor Mentioned", key: "competitor_mentioned",
    fieldType: "text",     required: false, visible: true, sortOrder: 2, createdAt: "2026-05-01" },
  { id: "cf-l3", recordType: "leads", label: "Budget Range",       key: "budget_range",
    fieldType: "dropdown", required: false, visible: true, sortOrder: 3, createdAt: "2026-05-01",
    options: ["Under $500", "$500–$2,000", "$2,000–$10,000", "Over $10,000"] },
  { id: "cf-l4", recordType: "leads", label: "Decision Timeline",  key: "decision_timeline",
    fieldType: "dropdown", required: false, visible: true, sortOrder: 4, createdAt: "2026-05-01",
    options: ["Immediate", "Within 30 Days", "60–90 Days", "No Rush"] },

  // ── Jobs ───────────────────────────────────────────────
  { id: "cf-j1", recordType: "jobs", label: "Permit Number",     key: "permit_number",
    fieldType: "text",     required: false, visible: true, sortOrder: 1, createdAt: "2026-05-01" },
  { id: "cf-j2", recordType: "jobs", label: "Warranty Expires",  key: "warranty_expires",
    fieldType: "date",     required: false, visible: true, sortOrder: 2, createdAt: "2026-05-01" },
  { id: "cf-j3", recordType: "jobs", label: "Materials Cost",    key: "materials_cost",
    fieldType: "currency", required: false, visible: true, sortOrder: 3, createdAt: "2026-05-01" },
  { id: "cf-j4", recordType: "jobs", label: "Technician Notes",  key: "technician_notes",
    fieldType: "long_text",required: false, visible: true, sortOrder: 4, createdAt: "2026-05-01" },

  // ── Properties ─────────────────────────────────────────
  { id: "cf-p1", recordType: "properties", label: "Access Code",    key: "access_code",
    fieldType: "text",     required: false, visible: true, sortOrder: 1, createdAt: "2026-05-01" },
  { id: "cf-p2", recordType: "properties", label: "Dog on Premises", key: "dog_on_premises",
    fieldType: "checkbox", required: false, visible: true, sortOrder: 2, createdAt: "2026-05-01" },
  { id: "cf-p3", recordType: "properties", label: "Parking Notes",  key: "parking_notes",
    fieldType: "text",     required: false, visible: false, sortOrder: 3, createdAt: "2026-05-01" },

  // ── Equipment ──────────────────────────────────────────
  { id: "cf-e1", recordType: "equipment", label: "Service Interval (months)", key: "service_interval_months",
    fieldType: "number",   required: false, visible: true, sortOrder: 1, createdAt: "2026-05-01" },
  { id: "cf-e2", recordType: "equipment", label: "Warranty Type",  key: "warranty_type",
    fieldType: "dropdown", required: false, visible: true, sortOrder: 2, createdAt: "2026-05-01",
    options: ["Parts Only", "Full Coverage", "Labor Only", "None"] },
  { id: "cf-e3", recordType: "equipment", label: "Manuals URL",    key: "manuals_url",
    fieldType: "url",      required: false, visible: false, sortOrder: 3, createdAt: "2026-05-01" },
];

// ─── Runtime store ────────────────────────────────────────
let _fields: CustomField[] | null = null;

function initFields(): CustomField[] {
  if (_fields) return _fields;
  if (typeof window === "undefined") return SEED_FIELDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    _fields = raw ? (JSON.parse(raw) as CustomField[]) : [...SEED_FIELDS];
  } catch {
    _fields = [...SEED_FIELDS];
  }
  return _fields;
}

export function getFields(recordType?: RecordType): CustomField[] {
  const all = initFields();
  return recordType
    ? all.filter(f => f.recordType === recordType).sort((a, b) => a.sortOrder - b.sortOrder)
    : all;
}

export function saveFields(fields: CustomField[]): void {
  _fields = fields;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fields)); } catch { /* ignore */ }
}

// ─── Helpers ──────────────────────────────────────────────
export function generateId(): string {
  return `cf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function labelToKey(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 64);
}
