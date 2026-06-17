// Custom Proposal — block-based document model.
//
// The "Custom Proposal" path is a flexible document builder (vs. the structured,
// salesbook-driven "Proposal From Template" workspace). A custom quote owns an
// ordered list of BLOCKS rather than template sections.
//
// Pricing data (lineItems, options, quote.pricing) still lives on the quote
// record — blocks just decide WHERE/HOW those render in the document. Internal
// pricing is never auto-rendered to the customer; the rep inserts a Price Summary
// or Line Items block to surface a customer-facing number.
//
// No mock data here. localStorage persistence is handled by lib/quotes/data.ts
// (the `blocks` field on QuoteRecord); swap for Supabase later.

import type { QuoteSection } from "./types";

export type BlockType =
  | "heading"
  | "rich_text"
  | "scope_of_work"
  | "problem_need"
  | "recommended_solution"
  | "image"
  | "image_gallery"
  | "line_items"
  | "price_summary"
  | "option_cards"
  | "equipment_card"
  | "financing_note"
  | "warranty"
  | "terms"
  | "approval_signature"
  | "divider"
  | "page_break"
  | "custom_section";

export interface BlockImage { id: string; src: string; caption?: string; alt?: string }

export interface BlockSettings {
  level?: 1 | 2 | 3;                       // heading size
  align?: "left" | "center" | "right";     // heading / image alignment
  width?: number;                          // image width (% of column)
  showMonthly?: boolean;                   // price_summary — show financing/mo
  itemized?: boolean;                      // price_summary — itemized vs total only
  termsBlockId?: string;                   // terms — saved terms block reference
  brand?: string; model?: string; price?: number; specs?: string; // equipment_card
}

// A content block on a custom proposal. `content` holds rich-text HTML for
// narrative blocks, plain text for headings, and is unused for structural blocks.
export interface QuoteBlock {
  id: string;
  type: BlockType;
  title: string;          // editable label / heading shown in the document
  visible: boolean;
  content: string;
  images?: BlockImage[];
  settings?: BlockSettings;
  locked?: boolean;
}

// Block types whose body is edited with the rich-text editor.
export const RICH_BLOCK_TYPES: BlockType[] = [
  "rich_text", "scope_of_work", "problem_need", "recommended_solution",
  "warranty", "financing_note", "terms", "custom_section",
];

// ─── Block library (the "Add block" menu) ────────────────
export interface BlockDef { type: BlockType; label: string; group: string; hint?: string }
export const BLOCK_LIBRARY: BlockDef[] = [
  { type: "heading",             label: "Heading",            group: "Content" },
  { type: "rich_text",           label: "Rich Text",          group: "Content", hint: "Paste or write formatted text" },
  { type: "problem_need",        label: "Problem / Need",     group: "Content" },
  { type: "recommended_solution",label: "Recommended Solution", group: "Content" },
  { type: "scope_of_work",       label: "Scope of Work",      group: "Content" },
  { type: "custom_section",      label: "Custom Section",     group: "Content" },
  { type: "image",               label: "Image",              group: "Media" },
  { type: "image_gallery",       label: "Image Gallery",      group: "Media", hint: "Before/after & site photos" },
  { type: "line_items",          label: "Line Items",         group: "Pricing" },
  { type: "price_summary",       label: "Price Summary",      group: "Pricing" },
  { type: "option_cards",        label: "Good / Better / Best", group: "Pricing" },
  { type: "equipment_card",      label: "Equipment Card",     group: "Pricing" },
  { type: "financing_note",      label: "Financing",          group: "Pricing" },
  { type: "warranty",            label: "Warranty",           group: "Closing" },
  { type: "terms",               label: "Terms & Conditions", group: "Closing" },
  { type: "approval_signature",  label: "Approval / Signature", group: "Closing" },
  { type: "divider",             label: "Divider",            group: "Layout" },
  { type: "page_break",          label: "Page Break",         group: "Layout" },
];

export const BLOCK_LABELS: Record<BlockType, string> =
  Object.fromEntries(BLOCK_LIBRARY.map(b => [b.type, b.label])) as Record<BlockType, string>;

export const BLOCK_GROUPS = ["Content", "Media", "Pricing", "Closing", "Layout"];

// ─── id + factory ─────────────────────────────────────────
let _seq = 0;
export function blockId(): string { return `blk-${Date.now().toString(36)}-${(_seq++).toString(36)}`; }
export function imageId(): string { return `img-${Date.now().toString(36)}-${(_seq++).toString(36)}`; }

const DEFAULT_TITLES: Partial<Record<BlockType, string>> = {
  heading: "Section heading",
  rich_text: "Text",
  scope_of_work: "Scope of Work",
  problem_need: "Problem / Need",
  recommended_solution: "Recommended Solution",
  image: "Image",
  image_gallery: "Photos",
  line_items: "Line Items",
  price_summary: "Investment Summary",
  option_cards: "Your Options",
  equipment_card: "Equipment",
  financing_note: "Financing",
  warranty: "Warranty",
  terms: "Terms & Conditions",
  approval_signature: "Approval",
  divider: "Divider",
  page_break: "Page Break",
  custom_section: "Custom Section",
};

export function defaultBlock(type: BlockType): QuoteBlock {
  const base: QuoteBlock = { id: blockId(), type, title: DEFAULT_TITLES[type] ?? "Block", visible: true, content: "" };
  switch (type) {
    case "heading":       return { ...base, content: "Section heading", settings: { level: 2, align: "left" } };
    case "image":         return { ...base, images: [], settings: { width: 100, align: "center" } };
    case "image_gallery": return { ...base, images: [] };
    case "price_summary": return { ...base, settings: { showMonthly: true, itemized: true } };
    case "equipment_card":return { ...base, images: [], settings: {} };
    default:              return base;
  }
}

// ─── Starter structure (new custom proposals) ────────────
export function starterBlocks(): QuoteBlock[] {
  return [
    { ...defaultBlock("heading"), title: "Title", content: "Proposal", settings: { level: 1, align: "left" } },
    { ...defaultBlock("problem_need"), content: "" },
    { ...defaultBlock("recommended_solution"), content: "" },
    { ...defaultBlock("scope_of_work"), content: "" },
    defaultBlock("line_items"),
    defaultBlock("price_summary"),
    defaultBlock("terms"),
    defaultBlock("approval_signature"),
  ];
}

// ─── Migration: existing template-style sections → blocks ─
// Lets a custom quote that was started before the block builder existed keep any
// content the rep already typed. Letterhead-style sections become document chrome
// (not blocks) and internal pricing is surfaced as a pinned panel, so both are skipped.
const SECTION_TO_BLOCK: Record<string, BlockType | null> = {
  cover_header: "heading",
  customer_info: null,
  property_info: null,
  internal_pricing_summary: null,
  problem_need: "problem_need",
  inspection_findings: "custom_section",
  recommended_solution: "recommended_solution",
  scope_of_work: "scope_of_work",
  line_items: "line_items",
  gbb_options: "option_cards",
  optional_addons: "custom_section",
  photos: "image_gallery",
  equipment_cards: "equipment_card",
  warranty: "warranty",
  financing_note: "financing_note",
  terms: "terms",
  approval: "approval_signature",
  custom_text: "rich_text",
};

export function sectionsToBlocks(sections: QuoteSection[], quoteTitle: string): QuoteBlock[] {
  const out: QuoteBlock[] = [];
  for (const s of sections) {
    const type = SECTION_TO_BLOCK[s.key];
    if (type === null || type === undefined) continue;
    const blk = defaultBlock(type);
    blk.visible = s.visible;
    blk.title = s.label || blk.title;
    if (type === "heading") blk.content = quoteTitle || s.body || "Proposal";
    else if (RICH_BLOCK_TYPES.includes(type) && s.body) blk.content = `<p>${escapeHtml(s.body).replace(/\n/g, "</p><p>")}</p>`;
    out.push(blk);
  }
  return out.length ? out : starterBlocks();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
