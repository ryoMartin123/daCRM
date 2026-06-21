// Media Library — reusable SALES assets for salesbooks, offer groups, and quote
// designs. NOT customer Photos & Files (those are real job/property files).
//
// Mental model:
//   Media Library  = images/assets the proposal reuses (equipment, covers, logos…)
//   Offer Library  = what we sell
//   Content Blocks = what we say
//   Quote Designs  = how it looks
//
// Critical behavior: upload once, reuse everywhere. When a quote is created from a
// salesbook the chosen media is COPIED (by url) so old quotes never change when an
// asset is later edited.
//
// Phase 1: localStorage-backed, data-URL "uploads" (placeholder — no cloud yet).
// This module is intentionally standalone (it does not import offers/salesbooks)
// so the graph stays acyclic; usage counts are computed in the UI by scanning the
// offer + salesbook stores.

import { type SalesbookIndustry, INDUSTRY_LABELS } from "@/lib/salesbooks/data";

export { INDUSTRY_LABELS };
export type { SalesbookIndustry };

// ─── Categories ───────────────────────────────────────────
export type MediaCategory =
  | "equipment" | "cover" | "before_after" | "brand_logo" | "trust_badge" | "section" | "asset";

export const MEDIA_CATEGORY_LABELS: Record<MediaCategory, string> = {
  equipment: "Equipment Image", cover: "Cover Image", before_after: "Before / After",
  brand_logo: "Brand Logo", trust_badge: "Trust Badge", section: "Section Image", asset: "Uploaded Asset",
};

export const MEDIA_CATEGORIES = Object.keys(MEDIA_CATEGORY_LABELS) as MediaCategory[];

export type MediaStatus = "active" | "archived";

// ─── Asset ────────────────────────────────────────────────
export interface MediaAsset {
  id: string;
  name: string;
  category: MediaCategory;
  industry?: SalesbookIndustry;
  brand?: string;
  model?: string;
  equipmentType?: string;
  url: string;                 // data-URL or remote URL (placeholder "upload")
  caption?: string;
  altText?: string;
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;          // display date
  status: MediaStatus;
}

// ─── Seeds (CRM-provided starter assets) ──────────────────
const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=70&auto=format&fit=crop`;

const SEED: MediaAsset[] = [
  { id: "ma-cond-1",  name: "Condenser — Carrier",        category: "equipment", industry: "hvac", brand: "Carrier", model: "24VNA9", equipmentType: "Outdoor Unit", url: img("1614447413576-b346c641c128"), caption: "Variable-speed condenser", altText: "Outdoor condensing unit", tags: ["condenser", "outdoor"], uploadedBy: "Ryo Martin", uploadedAt: "Jun 1, 2026", status: "active" },
  { id: "ma-airhandler", name: "Air Handler",             category: "equipment", industry: "hvac", brand: "Carrier", model: "FE4A", equipmentType: "Indoor Unit", url: img("1615309662243-70f6df917b59"), caption: "Variable-speed air handler", altText: "Indoor air handler", tags: ["air handler", "indoor"], uploadedBy: "Ryo Martin", uploadedAt: "Jun 1, 2026", status: "active" },
  { id: "ma-minisplit", name: "Mini-Split Head",          category: "equipment", industry: "hvac", brand: "Mitsubishi", model: "MSZ-FS12", equipmentType: "Indoor Unit", url: img("1762341123870-d706f257a12e"), caption: "Wall-mounted indoor head", altText: "Ductless mini-split head", tags: ["mini-split", "ductless"], uploadedBy: "Ryo Martin", uploadedAt: "Jun 2, 2026", status: "active" },
  { id: "ma-waterheater", name: "Tankless Water Heater",  category: "equipment", industry: "plumbing", brand: "Rinnai", model: "RU199", equipmentType: "Water Heater", url: img("1581094288338-2314dddb7ece"), caption: "Tankless unit", altText: "Tankless water heater", tags: ["water heater", "tankless"], uploadedBy: "Ryo Martin", uploadedAt: "Jun 2, 2026", status: "active" },
  { id: "ma-roof-arch", name: "Architectural Shingles",   category: "equipment", industry: "roofing", brand: "GAF", model: "Timberline HDZ", equipmentType: "Shingle", url: img("1566071634551-224a639a1c7d"), caption: "Architectural shingle roof", altText: "Asphalt shingle roof", tags: ["roof", "shingle"], uploadedBy: "Ryo Martin", uploadedAt: "Jun 3, 2026", status: "active" },
  { id: "ma-cover-home", name: "Residential Cover",       category: "cover", industry: "hvac", url: img("1568605114967-8130f3a36994"), caption: "Comfortable home", altText: "Suburban home exterior", tags: ["cover", "residential"], uploadedBy: "Ryo Martin", uploadedAt: "Jun 3, 2026", status: "active" },
  { id: "ma-badge-licensed", name: "Licensed & Insured",  category: "trust_badge", url: img("1450101499163-c8848c66ca85"), caption: "Licensed & insured", altText: "Trust badge", tags: ["badge", "trust"], uploadedBy: "Ryo Martin", uploadedAt: "Jun 4, 2026", status: "active" },
];

// ─── Storage ──────────────────────────────────────────────
const KEY = "crm-media-library";
let _cache: MediaAsset[] | null = null;

function read(): MediaAsset[] {
  if (_cache) return _cache;
  if (typeof window === "undefined") return SEED;
  try {
    const r = localStorage.getItem(KEY);
    _cache = r ? JSON.parse(r) : SEED.slice();
  } catch { _cache = SEED.slice(); }
  return _cache!;
}
function write(list: MediaAsset[]): void {
  _cache = list;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
}
function nowStamp(): string {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function rid(): string { return `ma-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

// ─── Reads ────────────────────────────────────────────────
export function getMediaAssets(): MediaAsset[] { return read().filter(a => a.status !== "archived"); }
export function getAllMediaAssets(): MediaAsset[] { return read(); }
export function getMediaAsset(id: string): MediaAsset | undefined { return read().find(a => a.id === id); }

// ─── Mutations ────────────────────────────────────────────
export interface NewMediaInput {
  name?: string; url: string; category?: MediaCategory; industry?: SalesbookIndustry;
  brand?: string; model?: string; equipmentType?: string; caption?: string; altText?: string; tags?: string[];
}

// Add an asset (used by Upload and by "upload from inside Offer/Salesbook").
// Returns the created asset so callers can attach its id.
export function addMediaAsset(input: NewMediaInput): MediaAsset {
  const asset: MediaAsset = {
    id: rid(),
    name: input.name?.trim() || "Untitled asset",
    category: input.category ?? "asset",
    industry: input.industry,
    brand: input.brand, model: input.model, equipmentType: input.equipmentType,
    url: input.url,
    caption: input.caption, altText: input.altText,
    tags: input.tags ?? [],
    uploadedBy: "Ryo Martin",
    uploadedAt: nowStamp(),
    status: "active",
  };
  write([asset, ...read()]);
  return asset;
}

export function updateMediaAsset(id: string, patch: Partial<MediaAsset>): MediaAsset | undefined {
  let updated: MediaAsset | undefined;
  write(read().map(a => { if (a.id !== id) return a; updated = { ...a, ...patch, id: a.id }; return updated; }));
  return updated;
}

export function archiveMediaAsset(id: string): void {
  write(read().map(a => a.id === id ? { ...a, status: "archived" as MediaStatus } : a));
}
export function deleteMediaAsset(id: string): void {
  write(read().filter(a => a.id !== id));
}

// Resolve an asset url by id (offers/salesbooks reference assets by id but also
// snapshot the url for stability).
export function mediaUrl(id?: string): string | undefined {
  return id ? getMediaAsset(id)?.url : undefined;
}
