// Offer Library — reusable SALES offers for salesbooks. An Offer Group is a set of
// option/tier cards (Good/Better/Best, packages, equipment) built from catalog
// items, equipment details, images, and pricing.
//
// Mental model:
//   Items & Services = individual catalog line items
//   Offer Library    = grouped sales offers built from items + equipment + images + pricing
//   Salesbook        = assembled reusable proposal package (uses offers, content blocks, media, designs)
//   Quote            = customer-specific copy
//
// Critical behavior: when a quote is created from a salesbook, the chosen offer
// data is COPIED into the quote so editing the quote never changes the master
// offer group.
//
// Phase 1: localStorage-backed mock + seeds. Offer option images reference Media
// Library assets by id (mediaId) and snapshot the url for stability. This module
// does not import the media/salesbook stores (kept acyclic); usage counts are
// computed in the UI.

import { type SalesbookIndustry, INDUSTRY_LABELS } from "@/lib/salesbooks/data";

export { INDUSTRY_LABELS };
export type { SalesbookIndustry };

// ─── Enums ────────────────────────────────────────────────
export type OfferStatus = "draft" | "active" | "archived";

export type OfferTier = "budget" | "good" | "better" | "best" | "standard" | "premium";
export const OFFER_TIER_LABELS: Record<OfferTier, string> = {
  budget: "Budget", good: "Good", better: "Better", best: "Best", standard: "Standard", premium: "Premium",
};
export const OFFER_TIERS = Object.keys(OFFER_TIER_LABELS) as OfferTier[];

// How an offer group lays out its options on the proposal.
export type OfferDisplayLayout =
  | "stacked" | "comparison_cards" | "compact_list" | "comparison_table"
  | "package_stack" | "image_forward" | "spec_table";
export const OFFER_LAYOUT_LABELS: Record<OfferDisplayLayout, string> = {
  stacked: "Stacked cards", comparison_cards: "Side-by-side comparison cards", compact_list: "Compact list",
  comparison_table: "Comparison table", package_stack: "Package stack", image_forward: "Image-forward cards", spec_table: "Technical spec table",
};
export const OFFER_LAYOUTS = Object.keys(OFFER_LAYOUT_LABELS) as OfferDisplayLayout[];

// How pricing shows on the proposal.
export type PriceDisplay = "total_only" | "monthly_only" | "total_and_monthly" | "as_low_as" | "hidden";
export const PRICE_DISPLAY_LABELS: Record<PriceDisplay, string> = {
  total_only: "Show total only", monthly_only: "Show monthly only", total_and_monthly: "Show total + monthly",
  as_low_as: 'Show "as low as" monthly', hidden: "Hide price until quote level",
};
export const PRICE_DISPLAYS = Object.keys(PRICE_DISPLAY_LABELS) as PriceDisplay[];

// ─── Sub-shapes ───────────────────────────────────────────
// HVAC-leaning equipment detail block (all optional; generic enough for others).
export interface OfferEquipment {
  outdoorUnit?: string;
  indoorUnit?: string;
  thermostat?: string;
  heatKit?: string;
  seer2?: string;
  tonnage?: string;
  fuelType?: string;
  systemType?: string;
  accessories?: string[];
  warranty?: string;
}

// A line inside an option — pulled from the catalog or custom; can be hidden from
// the customer (so a package price shows instead of internal components).
export interface OfferIncludedItem {
  id: string;
  name: string;
  itemId?: string;            // catalog item this was added from (snapshot + back-ref)
  price?: number;
  custom?: boolean;           // typed in rather than from the catalog
  showToCustomer: boolean;
}

// An image on an option — references a Media Library asset (mediaId) and snapshots
// its url so the offer stays stable if the asset later changes.
export interface OfferImage {
  id: string;
  mediaId?: string;
  url: string;
  caption?: string;
}

export interface OfferOption {
  id: string;
  tier?: OfferTier;
  title: string;
  brand?: string;
  description?: string;
  price: number;
  monthlyPrice?: number;
  recommended?: boolean;
  order: number;
  images: OfferImage[];
  primaryImageId?: string;
  includedItems: OfferIncludedItem[];
  equipment?: OfferEquipment;
  warranty?: string;
  internalNotes?: string;
  taxable?: boolean;
}

// Per-group field toggles (what shows on the customer-facing cards).
export interface OfferFieldToggles {
  showBrand: boolean;
  showModels: boolean;
  showImages: boolean;
  showMonthly: boolean;
  showIncluded: boolean;
  showWarranty: boolean;
  showRecommended: boolean;
  showSpecs: boolean;
  showPrice: boolean;
}

export function defaultToggles(): OfferFieldToggles {
  return { showBrand: true, showModels: true, showImages: true, showMonthly: true, showIncluded: true, showWarranty: true, showRecommended: true, showSpecs: false, showPrice: true };
}

export interface OfferGroup {
  id: string;
  companyId?: string;
  name: string;
  industry: SalesbookIndustry;
  category: string;
  systemType?: string;        // system type / service type
  size?: string;              // size / capacity (optional)
  description?: string;
  status: OfferStatus;
  tags: string[];
  displayLayout: OfferDisplayLayout;
  priceDisplay: PriceDisplay;
  financingNote?: string;
  toggles: OfferFieldToggles;
  options: OfferOption[];
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers used by seeds ────────────────────────────────
const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=70&auto=format&fit=crop`;
let _seq = 0;
function sid(prefix: string): string { return `${prefix}-seed-${(_seq++).toString(36)}`; }

function inc(name: string, showToCustomer = true, price?: number): OfferIncludedItem {
  return { id: sid("inc"), name, showToCustomer, price, custom: true };
}
function image(url: string, caption?: string): OfferImage {
  return { id: sid("oi"), url, caption };
}

// ─── Seed offer groups ────────────────────────────────────
const SEED: OfferGroup[] = [
  {
    id: "og-3ton-split",
    name: "3 Ton Split System Options",
    industry: "hvac", category: "System Replacement", systemType: "Split System", size: "3 Ton",
    description: "Good / Better / Best replacement options for a 3-ton split system.",
    status: "active", tags: ["hvac", "replacement", "gbb"],
    displayLayout: "comparison_cards", priceDisplay: "total_and_monthly",
    financingNote: "Financing available — as low as $119/mo with approved credit.",
    toggles: defaultToggles(),
    options: [
      { id: "oo-3t-good", tier: "good", title: "Builder Series 14.3 SEER2", brand: "Goodman", description: "Reliable, budget-friendly comfort.", price: 7800, monthlyPrice: 119, order: 0,
        images: [image(img("1614447413576-b346c641c128"), "Condenser")], includedItems: [inc("New condenser & coil"), inc("Standard thermostat"), inc("Permit & inspection")],
        equipment: { outdoorUnit: "GSXN3 14.3 SEER2", indoorUnit: "Cased coil", thermostat: "Non-programmable", seer2: "14.3", tonnage: "3", systemType: "Split System", warranty: "10-yr parts" }, warranty: "10-yr parts" },
      { id: "oo-3t-better", tier: "better", title: "Comfort Series 16 SEER2", brand: "Carrier", description: "Quieter, more efficient, smart thermostat.", price: 10400, monthlyPrice: 159, recommended: true, order: 1,
        images: [image(img("1615309662243-70f6df917b59"), "Air handler")], includedItems: [inc("2-stage condenser"), inc("Smart thermostat"), inc("Media air cleaner"), inc("Permit & inspection")],
        equipment: { outdoorUnit: "CA16NA 16 SEER2", indoorUnit: "Variable-speed air handler", thermostat: "Smart Wi-Fi", seer2: "16", tonnage: "3", systemType: "Split System", warranty: "10-yr parts + 2-yr labor" }, warranty: "10-yr parts + 2-yr labor" },
      { id: "oo-3t-best", tier: "best", title: "Infinity Series 19 SEER2", brand: "Carrier", description: "Top efficiency, variable speed, whole-home IAQ.", price: 14900, monthlyPrice: 224, order: 2,
        images: [image(img("1550998251-1e18917c975c"), "Infinity system")], includedItems: [inc("Variable-speed system"), inc("Wi-Fi smart control"), inc("Whole-home air purifier"), inc("10-yr labor warranty"), inc("Permit & inspection")],
        equipment: { outdoorUnit: "24VNA9 19 SEER2", indoorUnit: "Variable-speed air handler", thermostat: "Infinity touch control", seer2: "19", tonnage: "3", systemType: "Split System", warranty: "10-yr parts + labor" }, warranty: "10-yr parts + labor" },
    ],
    createdAt: "Jun 1, 2026", updatedAt: "Jun 1, 2026",
  },
  {
    id: "og-12k-mini",
    name: "12k Mini-Split Options",
    industry: "hvac", category: "Mini Splits", systemType: "Ductless", size: "12k BTU",
    description: "Single-zone ductless options for additions and garages.",
    status: "active", tags: ["hvac", "ductless", "mini-split"],
    displayLayout: "stacked", priceDisplay: "total_and_monthly",
    toggles: defaultToggles(),
    options: [
      { id: "oo-12k-std", tier: "standard", title: "Single-Zone 12k BTU", brand: "Mitsubishi", description: "One indoor head, one room.", price: 4200, monthlyPrice: 69, order: 0,
        images: [image(img("1762341123870-d706f257a12e"))], includedItems: [inc("1 indoor head"), inc("Outdoor condenser"), inc("Line set & install")],
        equipment: { outdoorUnit: "MUZ-FS12", indoorUnit: "MSZ-FS12", seer2: "20", systemType: "Ductless", warranty: "12-yr compressor" }, warranty: "12-yr compressor" },
      { id: "oo-12k-prem", tier: "premium", title: "Hyper-Heat 12k BTU", brand: "Mitsubishi", description: "Cold-climate performance.", price: 5600, monthlyPrice: 89, recommended: true, order: 1,
        images: [image(img("1654880821975-681bd2ff42ae"))], includedItems: [inc("Hyper-heat head"), inc("Outdoor condenser"), inc("Line set & install"), inc("Wireless controller")],
        equipment: { outdoorUnit: "MUZ-FH12 Hyper-Heat", indoorUnit: "MSZ-FH12", seer2: "23", systemType: "Ductless", warranty: "12-yr compressor" }, warranty: "12-yr compressor" },
    ],
    createdAt: "Jun 2, 2026", updatedAt: "Jun 2, 2026",
  },
  {
    id: "og-water-heater",
    name: "Water Heater Replacement Options",
    industry: "plumbing", category: "Water Heaters", systemType: "Water Heater",
    description: "Tank and tankless replacement options.",
    status: "active", tags: ["plumbing", "water heater"],
    displayLayout: "comparison_cards", priceDisplay: "total_and_monthly",
    toggles: defaultToggles(),
    options: [
      { id: "oo-wh-good", tier: "good", title: "50-Gal Tank", brand: "Rheem", description: "Standard tank replacement.", price: 1850, monthlyPrice: 39, order: 0,
        images: [image(img("1581094288338-2314dddb7ece"))], includedItems: [inc("50-gal tank"), inc("Install & haul-away"), inc("Permit")], warranty: "6-yr tank" },
      { id: "oo-wh-best", tier: "best", title: "Tankless On-Demand", brand: "Rinnai", description: "Endless hot water, space-saving.", price: 4200, monthlyPrice: 79, recommended: true, order: 1,
        images: [image(img("1581094288338-2314dddb7ece"))], includedItems: [inc("Tankless unit"), inc("Gas & venting"), inc("Install & haul-away"), inc("Permit")], warranty: "12-yr heat exchanger" },
    ],
    createdAt: "Jun 3, 2026", updatedAt: "Jun 3, 2026",
  },
  {
    id: "og-maint-plan",
    name: "Maintenance Plan Options",
    industry: "hvac", category: "Maintenance", systemType: "Membership",
    description: "Recurring maintenance / membership tiers.",
    status: "draft", tags: ["maintenance", "membership"],
    displayLayout: "comparison_table", priceDisplay: "monthly_only",
    toggles: { ...defaultToggles(), showImages: false, showSpecs: false },
    options: [
      { id: "oo-mp-good", tier: "good", title: "Essential Plan", description: "Annual tune-up + priority booking.", price: 144, monthlyPrice: 12, order: 0, images: [], includedItems: [inc("1 visit/yr"), inc("Priority scheduling"), inc("10% repair discount")] },
      { id: "oo-mp-better", tier: "better", title: "Total Comfort Plan", description: "Two visits + waived diagnostics.", price: 264, monthlyPrice: 22, recommended: true, order: 1, images: [], includedItems: [inc("2 visits/yr"), inc("Waived diagnostic fees"), inc("15% repair discount")] },
    ],
    createdAt: "Jun 4, 2026", updatedAt: "Jun 4, 2026",
  },
];

// ─── Storage ──────────────────────────────────────────────
const KEY = "crm-offer-library";
let _cache: OfferGroup[] | null = null;

function read(): OfferGroup[] {
  if (_cache) return _cache;
  if (typeof window === "undefined") return SEED;
  try { const r = localStorage.getItem(KEY); _cache = r ? JSON.parse(r) : SEED.slice(); }
  catch { _cache = SEED.slice(); }
  return _cache!;
}
function write(list: OfferGroup[]): void {
  _cache = list;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
function nowStamp(): string { return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function rid(prefix: string): string { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Reads ────────────────────────────────────────────────
export function getOfferGroups(): OfferGroup[] { return read().filter(g => g.status !== "archived"); }
export function getAllOfferGroups(): OfferGroup[] { return read(); }
export function getOfferGroup(id: string): OfferGroup | undefined { return read().find(g => g.id === id); }

// ─── Mutations ────────────────────────────────────────────
export function blankOption(order: number): OfferOption {
  return { id: rid("oo"), title: "New option", price: 0, order, images: [], includedItems: [], taxable: true };
}

export function blankOfferGroup(): OfferGroup {
  return {
    id: rid("og"), name: "New offer group", industry: "hvac", category: "System Replacement",
    status: "draft", tags: [], displayLayout: "comparison_cards", priceDisplay: "total_and_monthly",
    toggles: defaultToggles(), options: [], createdAt: nowStamp(), updatedAt: nowStamp(),
  };
}

export function createOfferGroup(partial?: Partial<OfferGroup>): OfferGroup {
  const g: OfferGroup = { ...blankOfferGroup(), ...partial, id: rid("og"), createdAt: nowStamp(), updatedAt: nowStamp() };
  write([g, ...read()]);
  return g;
}

export function updateOfferGroup(id: string, patch: Partial<OfferGroup>): OfferGroup | undefined {
  let updated: OfferGroup | undefined;
  write(read().map(g => { if (g.id !== id) return g; updated = { ...g, ...patch, id: g.id, updatedAt: nowStamp() }; return updated; }));
  return updated;
}

export function duplicateOfferGroup(id: string): OfferGroup | undefined {
  const src = getOfferGroup(id);
  if (!src) return;
  const copy: OfferGroup = {
    ...src, id: rid("og"), name: `${src.name} (Copy)`, status: "draft",
    options: src.options.map((o, i) => ({ ...o, id: rid("oo"), order: i })),
    createdAt: nowStamp(), updatedAt: nowStamp(),
  };
  write([copy, ...read()]);
  return copy;
}

export function archiveOfferGroup(id: string): void {
  write(read().map(g => g.id === id ? { ...g, status: "archived" as OfferStatus, updatedAt: nowStamp() } : g));
}
export function deleteOfferGroup(id: string): void { write(read().filter(g => g.id !== id)); }

// ─── Derived ──────────────────────────────────────────────
export function offerPriceRange(g: OfferGroup): { min: number; max: number } | null {
  const prices = g.options.map(o => o.price).filter(p => p > 0);
  if (prices.length === 0) return null;
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

// Snapshot-copy an offer group's options into customer-facing quote options shape.
// Used when a quote is created from a salesbook so the quote is independent.
export interface OfferOptionSnapshot {
  id: string; tier?: "good" | "better" | "best"; name: string; brand?: string;
  description?: string; price: number; monthlyPrice?: number; warranty?: string;
  category?: string; includes?: string[]; image?: string; featured?: boolean;
}
export function snapshotOfferOptions(g: OfferGroup): OfferOptionSnapshot[] {
  // Map the rich offer tiers onto the simpler good/better/best the renderer knows.
  const tierMap: Record<OfferTier, "good" | "better" | "best" | undefined> = {
    budget: "good", good: "good", better: "better", best: "best", standard: "good", premium: "best",
  };
  return [...g.options].sort((a, b) => a.order - b.order).map((o, i) => ({
    id: `qopt-${Date.now()}-${i}`,
    tier: o.tier ? tierMap[o.tier] : undefined,
    name: o.title, brand: o.brand, description: o.description,
    price: o.price, monthlyPrice: o.monthlyPrice, warranty: o.warranty,
    category: g.category,
    includes: o.includedItems.filter(it => it.showToCustomer).map(it => it.name),
    image: o.primaryImageId ? o.images.find(im => im.id === o.primaryImageId)?.url : o.images[0]?.url,
    featured: o.recommended,
  }));
}
