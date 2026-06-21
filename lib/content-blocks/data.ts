// Content Blocks — reusable proposal WORDING (scopes, warranties, financing,
// terms, exclusions, approvals, value statements) inserted into salesbooks and
// then copied into quotes.
//
// Mental model:
//   Content Blocks = what the proposal says
//   Offer Library  = what it sells
//   Media Library  = images it uses
//   Quote Designs  = how it looks
//
// Critical chain: Master Content Block → copied into Salesbook → copied into Quote.
// Editing a quote never changes the master; editing the master never changes old
// quotes. (Salesbook sections store a contentBlockId reference + a copied body.)
//
// Phase 1: localStorage-backed mock + seeds. Plain-text bodies (the salesbook /
// quote section editors are textareas). Merge fields ({{customer_name}} …),
// linked media, and version history are declared in the spec but deferred.

import type { SectionKey } from "@/lib/proposals/data";
import { type SalesbookIndustry, INDUSTRY_LABELS } from "@/lib/salesbooks/data";

export { INDUSTRY_LABELS };
export type { SalesbookIndustry };

// ─── Types ────────────────────────────────────────────────
export type ContentBlockType =
  | "recommended_solution" | "scope_of_work" | "problem_need" | "warranty"
  | "financing" | "terms" | "exclusions" | "approval" | "company_value"
  | "addon_explanation" | "custom";

export const CONTENT_BLOCK_TYPE_LABELS: Record<ContentBlockType, string> = {
  recommended_solution: "Recommended Solution", scope_of_work: "Scope of Work", problem_need: "Problem / Need",
  warranty: "Warranty", financing: "Financing", terms: "Terms & Conditions", exclusions: "Exclusions",
  approval: "Approval Language", company_value: "Company Value Statement", addon_explanation: "Add-On Explanation", custom: "Custom",
};
export const CONTENT_BLOCK_TYPES = Object.keys(CONTENT_BLOCK_TYPE_LABELS) as ContentBlockType[];

// Block type → the proposal SectionKey it inserts as on a salesbook.
export const BLOCK_TYPE_SECTION_KEY: Record<ContentBlockType, SectionKey> = {
  recommended_solution: "recommended_solution", scope_of_work: "scope_of_work", problem_need: "problem_need",
  warranty: "warranty", financing: "financing_note", terms: "terms", exclusions: "terms",
  approval: "approval", company_value: "recommended_solution", addon_explanation: "optional_addons", custom: "recommended_solution",
};

export type ContentBlockStatus = "active" | "archived";

export interface ContentBlock {
  id: string;
  name: string;
  type: ContentBlockType;
  industry?: SalesbookIndustry;
  category?: string;
  description?: string;       // short description
  text: string;              // default text (plain text w/ line breaks)
  tags: string[];
  status: ContentBlockStatus;
  createdAt: string;
  updatedAt: string;
}

// ─── Seeds ────────────────────────────────────────────────
let _seq = 0;
function sid(): string { return `cb-seed-${(_seq++).toString(36)}`; }
const cb = (name: string, type: ContentBlockType, text: string, extra?: Partial<ContentBlock>): ContentBlock => ({
  id: sid(), name, type, text, tags: extra?.tags ?? [], status: "active",
  industry: extra?.industry, category: extra?.category ?? CONTENT_BLOCK_TYPE_LABELS[type],
  description: extra?.description, createdAt: "Jun 1, 2026", updatedAt: "Jun 1, 2026",
});

const SEED: ContentBlock[] = [
  // Recommended Solution
  cb("HVAC System Replacement Recommendation", "recommended_solution",
    "Based on the age and condition of your current system, we recommend a complete, properly sized replacement professionally installed by our certified team — for quieter operation, lower energy bills, and even comfort throughout your home.",
    { industry: "hvac", tags: ["hvac", "replacement"] }),
  cb("Mini-Split Recommendation", "recommended_solution",
    "We recommend a high-efficiency ductless mini-split to deliver targeted, independent comfort to the space — no ductwork required, with quiet operation and excellent efficiency.",
    { industry: "hvac", tags: ["mini-split", "ductless"] }),
  cb("Roof Replacement Recommendation", "recommended_solution",
    "Given the current condition of your roof, we recommend a full replacement with quality materials and a manufacturer-backed warranty to protect your home for decades to come.",
    { industry: "roofing", tags: ["roof"] }),
  cb("Water Heater Replacement Recommendation", "recommended_solution",
    "We recommend replacing your aging water heater with a modern, efficient unit sized to your household's hot-water demand — for reliable performance and lower operating costs.",
    { industry: "plumbing", tags: ["water heater"] }),

  // Scope of Work
  cb("HVAC Split System Replacement Scope", "scope_of_work",
    "• Remove and dispose of existing equipment\n• Install new condenser, coil, and air handler\n• Connect new line set, electrical, and condensate\n• Install and configure thermostat\n• Start up, test, and verify proper operation\n• Pull permit and coordinate inspection",
    { industry: "hvac", tags: ["hvac", "split"] }),
  cb("Mini-Split Installation Scope", "scope_of_work",
    "• Mount indoor head(s) and outdoor condenser\n• Run and insulate refrigerant line set\n• Electrical connection and disconnect\n• Vacuum, charge, and commission system\n• Test operation and review controls with homeowner",
    { industry: "hvac", tags: ["mini-split"] }),
  cb("Roof Replacement Scope", "scope_of_work",
    "• Tear off existing roofing to the deck\n• Inspect and replace damaged decking as needed\n• Install underlayment, ice & water shield, and drip edge\n• Install new shingles, flashing, and ridge vent\n• Full cleanup and magnet sweep of the property",
    { industry: "roofing", tags: ["roof"] }),
  cb("Water Heater Replacement Scope", "scope_of_work",
    "• Drain and remove existing water heater\n• Install new unit with code-compliant connections\n• Update venting and gas/electrical as required\n• Test for leaks and verify operation\n• Haul away old unit and pull permit",
    { industry: "plumbing", tags: ["water heater"] }),

  // Warranty
  cb("Standard HVAC Warranty", "warranty",
    "All equipment is covered by the manufacturer's parts warranty with registration, plus our workmanship guarantee on installation.",
    { industry: "hvac", tags: ["warranty"] }),
  cb("Labor Warranty", "warranty",
    "We stand behind our work with a 2-year labor warranty on all installations, in addition to any manufacturer coverage.",
    { tags: ["warranty", "labor"] }),
  cb("Roof Workmanship Warranty", "warranty",
    "Your new roof includes the manufacturer's material warranty plus our 10-year workmanship warranty covering installation.",
    { industry: "roofing", tags: ["warranty", "roof"] }),

  // Financing
  cb("Standard Financing Note", "financing",
    "Flexible financing is available with low monthly payments. Ask your representative about current promotions and terms.",
    { tags: ["financing"] }),
  cb("Approved Credit Disclaimer", "financing",
    "Monthly payment estimates are examples only and subject to credit approval. Actual terms, APR, and payment may vary.",
    { tags: ["financing", "disclaimer"] }),
  cb("No Financing Available Note", "financing",
    "This proposal is presented at the cash price. Financing is not applied to this offer.",
    { tags: ["financing"] }),

  // Terms
  cb("Standard Quote Terms", "terms",
    "This proposal is valid for 30 days from the date issued. Pricing is subject to change after the validity period. Work will be scheduled upon acceptance and receipt of any required deposit.",
    { tags: ["terms"] }),
  cb("Deposit Required Terms", "terms",
    "A 50% deposit is required to schedule installation, with the balance due upon completion. Deposits are applied to the total project price.",
    { tags: ["terms", "deposit"] }),
  cb("Permits and Inspection Terms", "terms",
    "All required permits and inspections are included. Work will conform to applicable local codes; any code-mandated upgrades discovered during work will be quoted separately before proceeding.",
    { tags: ["terms", "permits"] }),

  // Exclusions
  cb("HVAC Exclusions", "exclusions",
    "Unless explicitly noted, this proposal excludes: ductwork modifications, electrical panel upgrades, drywall or paint repair, and remediation of pre-existing code violations.",
    { industry: "hvac", tags: ["exclusions"] }),
  cb("Roofing Exclusions", "exclusions",
    "Excludes: structural deck repair beyond noted allowance, gutter replacement, interior repairs, and removal of more than one existing roofing layer unless specified.",
    { industry: "roofing", tags: ["exclusions"] }),
  cb("Unforeseen Conditions Exclusion", "exclusions",
    "Hidden or unforeseen conditions discovered during work (e.g., concealed damage, code deficiencies) are not included and will be presented as a change order before any additional work proceeds.",
    { tags: ["exclusions"] }),

  // Approval
  cb("Standard Approval Language", "approval",
    "By signing below, you approve this proposal and authorize the work and pricing described herein.",
    { tags: ["approval"] }),
  cb("Deposit Authorization", "approval",
    "By signing below, you approve this proposal, authorize the work described, and agree to the deposit terms to schedule the project.",
    { tags: ["approval", "deposit"] }),
  cb("Maintenance Agreement Approval", "approval",
    "By signing below, you enroll in the selected maintenance plan and authorize recurring billing per the terms described.",
    { tags: ["approval", "maintenance"] }),

  // Company Value
  cb("Why Choose Us", "company_value",
    "For over a decade we've delivered honest recommendations, quality workmanship, and dependable service. Our certified technicians treat your home like their own — on time, clean, and done right the first time.",
    { tags: ["value"] }),
  cb("Licensed & Insured Statement", "company_value",
    "We are fully licensed, bonded, and insured for your protection and peace of mind.",
    { tags: ["value", "trust"] }),
  cb("Satisfaction Guarantee", "company_value",
    "Your satisfaction is guaranteed. If something isn't right, we'll make it right — that's our promise.",
    { tags: ["value", "guarantee"] }),

  // Problem / Need
  cb("Old HVAC System Problem", "problem_need",
    "Your current system is past its expected service life and operating inefficiently, leading to rising energy bills, uneven temperatures, and an increasing risk of unexpected breakdowns.",
    { industry: "hvac", tags: ["problem"] }),
  cb("High Energy Bill Problem", "problem_need",
    "Aging, low-efficiency equipment is driving up your monthly energy costs. A modern high-efficiency system can significantly reduce operating expenses.",
    { tags: ["problem", "energy"] }),
  cb("Roof Leak Problem", "problem_need",
    "Active leaks and deteriorated roofing materials are allowing water intrusion that can damage the structure, insulation, and interior of your home if not addressed.",
    { industry: "roofing", tags: ["problem", "roof"] }),

  // Add-On Explanation
  cb("Surge Protector Explanation", "addon_explanation",
    "A whole-system surge protector shields your new equipment's sensitive electronics from voltage spikes — a small investment that helps protect your warranty and extend equipment life.",
    { industry: "hvac", tags: ["addon", "surge"] }),
  cb("Media Filter Upgrade Explanation", "addon_explanation",
    "A high-efficiency media filter captures far more airborne particles than a standard filter, improving indoor air quality and protecting your equipment — with fewer filter changes.",
    { industry: "hvac", tags: ["addon", "iaq"] }),
  cb("Air Purifier Explanation", "addon_explanation",
    "A whole-home air purifier reduces allergens, bacteria, and odors throughout your home for healthier, cleaner air.",
    { industry: "hvac", tags: ["addon", "iaq"] }),
];

// ─── Storage ──────────────────────────────────────────────
const KEY = "crm-content-blocks";
let _cache: ContentBlock[] | null = null;

function read(): ContentBlock[] {
  if (_cache) return _cache;
  if (typeof window === "undefined") return SEED;
  try { const r = localStorage.getItem(KEY); _cache = r ? JSON.parse(r) : SEED.slice(); }
  catch { _cache = SEED.slice(); }
  return _cache!;
}
function write(list: ContentBlock[]): void {
  _cache = list;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
function nowStamp(): string { return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function rid(): string { return `cb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Reads ────────────────────────────────────────────────
export function getContentBlocks(): ContentBlock[] { return read().filter(b => b.status !== "archived"); }
export function getAllContentBlocks(): ContentBlock[] { return read(); }
export function getContentBlock(id: string): ContentBlock | undefined { return read().find(b => b.id === id); }

// ─── Mutations ────────────────────────────────────────────
export function blankContentBlock(): ContentBlock {
  return { id: rid(), name: "", type: "custom", text: "", tags: [], status: "active", createdAt: nowStamp(), updatedAt: nowStamp() };
}

export function createContentBlock(partial: Partial<ContentBlock>): ContentBlock {
  const b: ContentBlock = { ...blankContentBlock(), ...partial, id: rid(), createdAt: nowStamp(), updatedAt: nowStamp() };
  write([b, ...read()]);
  return b;
}

export function updateContentBlock(id: string, patch: Partial<ContentBlock>): ContentBlock | undefined {
  let updated: ContentBlock | undefined;
  write(read().map(b => { if (b.id !== id) return b; updated = { ...b, ...patch, id: b.id, updatedAt: nowStamp() }; return updated; }));
  return updated;
}

export function duplicateContentBlock(id: string): ContentBlock | undefined {
  const src = getContentBlock(id);
  if (!src) return;
  const copy: ContentBlock = { ...src, id: rid(), name: `${src.name} (Copy)`, status: "active", createdAt: nowStamp(), updatedAt: nowStamp() };
  write([copy, ...read()]);
  return copy;
}

export function archiveContentBlock(id: string): void {
  write(read().map(b => b.id === id ? { ...b, status: "archived" as ContentBlockStatus, updatedAt: nowStamp() } : b));
}
export function deleteContentBlock(id: string): void { write(read().filter(b => b.id !== id)); }
