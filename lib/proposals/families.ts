// Proposal TEMPLATE FAMILIES — the real layout system.
//
// The old "designs" were cosmetic skins of one layout. This splits the template
// system into two axes:
//
//   Template Family = the LAYOUT / STRUCTURE (one vs two column, hero vs none,
//                     comparison cards vs line-item table, inline vs sidebar
//                     totals, presentation vs document feel). Families feel
//                     structurally different — they arrange the reusable blocks
//                     (Header, Customer Info, Comparison, Line Items, Pricing
//                     Summary, Financing, Warranty, Terms, Signature, …) in
//                     genuinely different ways.
//
//   Style Variant  = a VISUAL SKIN within a family (fonts, accent intensity,
//                     divider treatment, density). Skins never change structure.
//
// Phase 1 ships the engine + 2 flagship families with full renderers
// (Classic Proposal + Good/Better/Best Comparison). The remaining families are
// declared here so the picker shows the full system; they light up as their
// renderers land.

export type FamilyId =
  | "classic" | "comparison" | "package" | "visual" | "scope"
  | "minimal" | "technical" | "offer";

export type VariantId = "clean" | "bold" | "warm" | "executive";

const SANS = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const SERIF = "Georgia, 'Times New Roman', 'Iowan Old Style', serif";

// ─── Style variants (skins) ───────────────────────────────
export interface VariantSkin {
  id: VariantId;
  name: string;
  fontFamily: string;
  headingFamily: string;
  accentFill: boolean;          // fill header / total bands with the accent color
  radius: number;               // card / block corner radius (px)
  divider: "hairline" | "rule" | "soft";
  labelCaps: boolean;           // uppercase section labels
  tone: "cool" | "warm" | "neutral";
}

export const VARIANTS: Record<VariantId, VariantSkin> = {
  clean:     { id: "clean",     name: "Clean",     fontFamily: SANS,  headingFamily: SANS,  accentFill: false, radius: 10, divider: "hairline", labelCaps: true,  tone: "cool" },
  bold:      { id: "bold",      name: "Bold",      fontFamily: SANS,  headingFamily: SANS,  accentFill: true,  radius: 12, divider: "rule",     labelCaps: false, tone: "cool" },
  warm:      { id: "warm",      name: "Warm",      fontFamily: SANS,  headingFamily: SERIF, accentFill: false, radius: 16, divider: "soft",     labelCaps: false, tone: "warm" },
  executive: { id: "executive", name: "Executive", fontFamily: SERIF, headingFamily: SERIF, accentFill: false, radius: 6,  divider: "rule",     labelCaps: true,  tone: "neutral" },
};

// ─── Template families (layouts) ──────────────────────────
export interface TemplateFamily {
  id: FamilyId;
  name: string;
  tagline: string;
  description: string;
  structure: string[];          // short structural descriptors for the picker
  columns: 1 | 2;
  hero: boolean;                // hero/presentation header vs document letterhead
  totals: "inline" | "sidebar" | "summary-band";
  optionTreatment: "table" | "comparison-cards" | "stacked-cards" | "spec-blocks";
  available: boolean;           // has a full renderer yet
  variants: VariantId[];
  defaultVariant: VariantId;
}

export const FAMILIES: TemplateFamily[] = [
  {
    id: "classic",
    name: "Classic Proposal",
    tagline: "Clean one-column document",
    description: "A timeless, single-column proposal that reads like a polished letter. Letterhead, narrative sections in open whitespace, an itemized table, and an inline total. The dependable default.",
    structure: ["One column", "Letterhead header", "Line-item table", "Inline totals", "Open whitespace"],
    columns: 1, hero: false, totals: "inline", optionTreatment: "table",
    available: true, variants: ["clean", "executive"], defaultVariant: "clean",
  },
  {
    id: "comparison",
    name: "Good / Better / Best Comparison",
    tagline: "Presentation-style option cards",
    description: "A sales-forward, presentation layout built around three side-by-side option cards with images, big prices, and feature checklists. A hero header sets the stage and a summary band closes it. Built to drive upgrades.",
    structure: ["Hero header", "3 comparison cards", "Image-forward", "Summary band totals", "Recommended highlight"],
    columns: 2, hero: true, totals: "summary-band", optionTreatment: "comparison-cards",
    available: true, variants: ["clean", "bold", "warm"], defaultVariant: "bold",
  },
  {
    id: "package",
    name: "Package Stack Proposal",
    tagline: "Stacked package cards",
    description: "A one-column proposal built around full-width, stacked package cards — each option shown as a rich row with image, inclusions, price, and monthly payment — then a clear total. Built for HVAC replacement packages and Good / Better / Best / Budget options.",
    structure: ["One column", "Stacked package cards", "Per-option monthly", "Total + financing"],
    columns: 1, hero: false, totals: "summary-band", optionTreatment: "stacked-cards",
    available: true, variants: ["clean", "bold", "warm", "executive"], defaultVariant: "bold",
  },
  {
    id: "visual",
    name: "Visual Sales Proposal",
    tagline: "Hero imagery & photo galleries",
    description: "An image-led, marketing-style proposal with a hero photo, before/after galleries, and large benefit blocks. Best for high-visual trades.",
    structure: ["Hero image", "Photo galleries", "Benefit blocks", "Sidebar totals"],
    columns: 2, hero: true, totals: "sidebar", optionTreatment: "stacked-cards",
    available: false, variants: ["warm", "bold"], defaultVariant: "warm",
  },
  {
    id: "scope",
    name: "Scope of Work Proposal",
    tagline: "Detailed scope & phases",
    description: "A work-order-style layout that leads with a structured scope of work, phases, and inclusions, then pricing. Best for projects and commercial work.",
    structure: ["Scope-first", "Phase blocks", "Boxed sections", "Inline totals"],
    columns: 1, hero: false, totals: "inline", optionTreatment: "table",
    available: false, variants: ["clean", "executive"], defaultVariant: "executive",
  },
  {
    id: "minimal",
    name: "Modern Minimal Proposal",
    tagline: "Maximum whitespace",
    description: "Quiet, modern, and typographic. Hairline rules, generous spacing, and a single understated total. Gets out of the way.",
    structure: ["Airy spacing", "Hairline rules", "Typographic", "Plain total"],
    columns: 1, hero: false, totals: "inline", optionTreatment: "stacked-cards",
    available: false, variants: ["clean"], defaultVariant: "clean",
  },
  {
    id: "technical",
    name: "Technical / Spec Proposal",
    tagline: "Spec tables & data blocks",
    description: "A dense, engineering-style layout with spec tables, model/efficiency data blocks, and a two-column body. Best for technical and corporate buyers.",
    structure: ["Two column", "Spec tables", "Data blocks", "Compact density"],
    columns: 2, hero: false, totals: "sidebar", optionTreatment: "spec-blocks",
    available: false, variants: ["clean", "executive"], defaultVariant: "clean",
  },
  {
    id: "offer",
    name: "Financing / Offer-First Proposal",
    tagline: "Leads with the monthly payment",
    description: "An offer-led layout that opens with the monthly payment and promotion, then justifies it. Built to convert price-sensitive buyers.",
    structure: ["Offer hero", "Monthly-payment first", "Promo callouts", "Summary band"],
    columns: 1, hero: true, totals: "summary-band", optionTreatment: "comparison-cards",
    available: false, variants: ["bold", "warm"], defaultVariant: "bold",
  },
];

export const DEFAULT_FAMILY = FAMILIES[0];

export function getFamily(id?: string): TemplateFamily {
  return FAMILIES.find(f => f.id === id) ?? DEFAULT_FAMILY;
}
export function getVariant(family: TemplateFamily, id?: string): VariantSkin {
  const vid = (id && family.variants.includes(id as VariantId)) ? (id as VariantId) : family.defaultVariant;
  return VARIANTS[vid];
}

// Convenience resolver from a stored (familyId, variantId) pair.
export interface ResolvedTemplate { family: TemplateFamily; variant: VariantSkin }
export function resolveTemplate(familyId?: string, variantId?: string): ResolvedTemplate {
  const family = getFamily(familyId);
  return { family, variant: getVariant(family, variantId) };
}
