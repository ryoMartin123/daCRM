// ─── Business Structure — mock operational metadata ───────
// The hierarchy data model (lib/hierarchy) stores only the essentials a record
// needs to drive selectors and routing: name, city/state, status. The Admin
// Business Structure manager surfaces a richer *operational profile* — legal
// name, contacts, manager, operating hours, dispatch defaults, etc.
//
// Those extras live here as local mock data keyed by record id, with graceful
// fallbacks for records created at runtime (no entry => the panel shows
// "Not set" placeholders rather than breaking). This is presentation-only mock
// state — no Supabase. When the real schema lands these become columns.

import { getUsers, type AppUser } from "@/lib/users/data";

// ─── Extended detail shapes ───────────────────────────────
export interface CompanyMeta {
  legalName?: string;
  displayName?: string;
  primaryContact?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  timezone?: string;
  manager?: string;
  reportingCode?: string;
}

export interface LocationMeta {
  type?: string;          // Branch / Office / Warehouse / Showroom
  phone?: string;
  email?: string;
  address?: string;
  manager?: string;
  timezone?: string;
  hours?: string;
  dispatchBoard?: string;
  teams?: string[];
  warehouse?: string;
}

export interface ServiceAreaMeta {
  coverage?: string;      // cities / counties / zips summary
  notes?: string;
  dispatchBoard?: string;
  teams?: string;
  feeZone?: string;
}

// ─── Seed metadata (matches lib/hierarchy/data seed ids) ──
export const COMPANY_META: Record<string, CompanyMeta> = {
  co_hvac: {
    legalName: "Northstar HVAC Services, LLC",
    displayName: "Northstar HVAC",
    primaryContact: "Ryo Martin",
    phone: "(706) 555-0142",
    email: "office@northstarhvac.example",
    website: "northstarhvac.example",
    address: "1420 Commerce Dr, Augusta, GA 30901",
    timezone: "America/New_York",
    manager: "Ryo Martin",
    reportingCode: "NS-HVAC",
  },
  co_roofing: {
    legalName: "Northstar Roofing Co.",
    displayName: "Northstar Roofing",
    primaryContact: "Ryo Martin",
    phone: "(803) 555-0177",
    email: "office@northstarroofing.example",
    website: "northstarroofing.example",
    address: "88 Gervais St, Columbia, SC 29201",
    timezone: "America/New_York",
    manager: "Ryo Martin",
    reportingCode: "NS-ROOF",
  },
};

export const LOCATION_META: Record<string, LocationMeta> = {
  loc_augusta: {
    type: "Branch",
    phone: "(706) 555-0142",
    email: "augusta@northstarhvac.example",
    address: "1420 Commerce Dr, Augusta, GA 30901",
    manager: "Kylie Brooks",
    timezone: "America/New_York",
    hours: "Mon–Fri 7:00 AM – 6:00 PM",
    dispatchBoard: "Augusta Service Board",
    teams: ["Service Team A", "Install Crew 1"],
    warehouse: "Augusta Main Warehouse",
  },
  loc_evans: {
    type: "Branch",
    phone: "(706) 555-0188",
    email: "evans@northstarhvac.example",
    address: "4501 Washington Rd, Evans, GA 30809",
    manager: "Tucker Hayes",
    timezone: "America/New_York",
    hours: "Mon–Fri 7:30 AM – 5:30 PM",
    dispatchBoard: "Evans Service Board",
    teams: ["Service Team B"],
    warehouse: "Shared — Augusta Main",
  },
  loc_columbia: {
    type: "Branch",
    phone: "(803) 555-0177",
    email: "columbia@northstarroofing.example",
    address: "88 Gervais St, Columbia, SC 29201",
    manager: "Unassigned",
    timezone: "America/New_York",
    hours: "Mon–Fri 8:00 AM – 5:00 PM",
    dispatchBoard: "Columbia Roofing Board",
    teams: ["Roofing Crew 1"],
    warehouse: "Columbia Yard",
  },
};

export const SERVICE_AREA_META: Record<string, ServiceAreaMeta> = {
  sa_augusta:   { coverage: "Augusta, GA · Richmond County · 30901–30909", notes: "Primary metro — highest job volume.", dispatchBoard: "Augusta Service Board", teams: "Service Team A", feeZone: "No travel fee" },
  sa_martinez:  { coverage: "Martinez, GA · Columbia County · 30907", dispatchBoard: "Augusta Service Board", teams: "Service Team A", feeZone: "No travel fee" },
  sa_grovetown: { coverage: "Grovetown, GA · Columbia County · 30813", dispatchBoard: "Augusta Service Board", feeZone: "Zone 2 — $25 trip fee" },
  sa_n_augusta: { coverage: "North Augusta, SC · Aiken County · 29841, 29860", notes: "Cross-state — verify SC licensing on permits.", dispatchBoard: "Augusta Service Board", feeZone: "Zone 2 — $25 trip fee" },
  sa_evans:     { coverage: "Evans, GA · Columbia County · 30809", dispatchBoard: "Evans Service Board", teams: "Service Team B", feeZone: "No travel fee" },
  sa_harlem:    { coverage: "Harlem, GA · Columbia County · 30814", dispatchBoard: "Evans Service Board", feeZone: "Zone 3 — $40 trip fee" },
  sa_columbia:  { coverage: "Columbia, SC · Richland County · 29201–29229", dispatchBoard: "Columbia Roofing Board", teams: "Roofing Crew 1", feeZone: "No travel fee" },
  sa_aiken:     { coverage: "Aiken, SC · Aiken County · 29801, 29803", dispatchBoard: "Columbia Roofing Board", feeZone: "Zone 2 — $30 trip fee" },
};

// ─── Apps that consume the structure context ──────────────
// Admin owns the structure; these apps read the selected company / location /
// service area as their working context.
export const APPS_USING_STRUCTURE: { id: string; name: string; accent: string; uses: string[] }[] = [
  { id: "crm",        name: "CRM",        accent: "#0ea5e9", uses: ["Jobs", "Dispatching", "Customers", "Quotes"] },
  { id: "hr",         name: "HR",         accent: "#ec4899", uses: ["Employees", "Hiring", "Time Off"] },
  { id: "accounting", name: "Accounting", accent: "#22c55e", uses: ["Reports", "Invoices"] },
  { id: "documents",  name: "Documents",  accent: "#f59e0b", uses: ["Folder permissions"] },
];

// ─── Department scaffolding (not built yet) ───────────────
// Surfaced as a disabled "later" affordance so the structure reads true to the
// roadmap without implying departments exist.
export const DEPARTMENT_PLACEHOLDERS = [
  "Service", "Install", "Sales", "Office / Admin",
  "Accounting", "HR", "Management", "Warehouse",
];

// ─── Assigned-user helpers (real, derived from lib/users) ─
// A user "belongs to" a company/location through any role assignment whose scope
// touches it. Org-level grants (owner, org admin, org-wide roles) reach every
// company and location, so they count everywhere.
export function usersForCompany(companyId: string): AppUser[] {
  return getUsers().filter((u) =>
    u.assignments.some((a) => a.level === "org" || a.companyId === companyId),
  );
}

export function usersForLocation(locationId: string, companyId: string): AppUser[] {
  return getUsers().filter((u) =>
    u.assignments.some(
      (a) => a.level === "org" || a.locationId === locationId ||
        // company-level grant covers all of its locations
        (a.level === "company" && a.companyId === companyId),
    ),
  );
}

export function assignedUserCount(): number {
  return getUsers().filter((u) => u.status !== "inactive").length;
}
