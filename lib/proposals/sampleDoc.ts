// Shared sample proposal data for live previews (Quote Templates manager, etc.).
// Builds a realistic ProposalDocData from a set of visible section keys so the
// family renderer can show a true-to-life preview without a real quote.

import { buildProposalDoc, type ProposalDocData } from "@/lib/quotes/proposalDoc";
import { SECTION_LABELS, getSectionBlock, type SectionKey } from "@/lib/proposals/data";
import type { LineItem, QuoteOption } from "@/lib/quotes/data";
import { resolveRenderMode, type QuoteDesign, type QuoteDesignMode } from "@/lib/quotes/quoteDesigns";

export const SAMPLE_CUSTOMER = {
  name: "Jordan & Casey Rivera",
  property: "1846 Magnolia Ridge Dr, Evans, GA 30809",
  rep: "Alex Morgan",
};

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=70&auto=format&fit=crop`;

const SAMPLE_OPTIONS: QuoteOption[] = [
  { id: "so1", tier: "good",   name: "Builder Series 14.3 SEER2", brand: "Goodman", model: "GLXS3BA", description: "Reliable, budget-friendly comfort.", price: 7800,  monthlyPrice: 119, efficiency: "14.3 SEER2", warranty: "10-yr parts", image: img("1614447413576-b346c641c128"), includes: ["New condenser & coil", "Standard thermostat", "Permit & inspection"] },
  { id: "so2", tier: "better", name: "Comfort Series 16 SEER2",   brand: "Carrier", model: "CA16NA",  description: "Quieter, more efficient, smart thermostat.", price: 10400, monthlyPrice: 159, efficiency: "16 SEER2", warranty: "10-yr parts + 2-yr labor", featured: true, image: img("1615309662243-70f6df917b59"), includes: ["2-stage condenser", "Smart thermostat", "Media air cleaner", "Permit & inspection"] },
  { id: "so3", tier: "best",   name: "Infinity Series 19 SEER2",  brand: "Carrier", model: "24VNA9",  description: "Top efficiency, variable speed, whole-home IAQ.", price: 14900, monthlyPrice: 224, efficiency: "19 SEER2", warranty: "10-yr parts + labor", image: img("1550998251-1e18917c975c"), includes: ["Variable-speed system", "Wi-Fi smart control", "Whole-home air purifier", "Permit & inspection"] },
];

const SAMPLE_LINE_ITEMS: LineItem[] = [
  { id: "sl1", name: "Equipment & materials", description: "Per the recommended solution", quantity: 1, unitPrice: 9200, total: 9200, taxable: true },
  { id: "sl2", name: "Installation & labor", description: "Includes haul-away, startup & test", quantity: 1, unitPrice: 2400, total: 2400, taxable: false },
];

export function buildSampleProposalDoc(sectionKeys: SectionKey[], title = "Comfort System Replacement"): ProposalDocData {
  const sections = sectionKeys.map(k => ({
    key: k, label: SECTION_LABELS[k] ?? k, body: getSectionBlock(k)?.defaultBody ?? "", visible: true,
  }));
  return buildProposalDoc({
    quoteNumber: "Q-2026-0148", title,
    customerName: SAMPLE_CUSTOMER.name, propertyLabel: SAMPLE_CUSTOMER.property, assignedTo: SAMPLE_CUSTOMER.rep,
    createdAt: "Jun 20, 2026", expiresAt: "Jul 20, 2026",
    sections, lineItems: SAMPLE_LINE_ITEMS, options: SAMPLE_OPTIONS,
    subtotal: 11600, tax: 812, total: 12412, taxRatePct: 7,
  });
}

// ─── Mode-aware sample ("Preview As") ─────────────────────
// Shows how ONE design adapts to different quote situations. Each mode supplies a
// realistic section set + the right amount of option/line content, so the renderer
// auto-hides what isn't there (no empty option cards, no orphan sections).
const MODE_SAMPLE: Record<QuoteDesignMode, { sections: SectionKey[]; options: QuoteOption[]; title: string }> = {
  quick_quote: {
    title: "Service & Repair Quote",
    sections: ["customer_info", "line_items", "terms", "approval"],
    options: [],
  },
  single_offer: {
    title: "Recommended Comfort System",
    sections: ["cover_header", "customer_info", "recommended_solution", "gbb_options", "line_items", "warranty", "financing_note", "terms", "approval"],
    options: [{ ...SAMPLE_OPTIONS[1], tier: undefined, featured: false }],
  },
  multi_option: {
    title: "Choose Your System",
    sections: ["cover_header", "customer_info", "problem_need", "recommended_solution", "gbb_options", "financing_note", "warranty", "terms", "approval"],
    options: SAMPLE_OPTIONS,
  },
  salesbook: {
    title: "Comfort System Replacement",
    sections: [],   // filled from the design's own defaultSections
    options: SAMPLE_OPTIONS,
  },
  custom: {
    title: "Custom Project Proposal",
    sections: ["cover_header", "customer_info", "property_info", "recommended_solution", "scope_of_work", "line_items", "terms", "approval"],
    options: [],
  },
};

export function buildSampleProposalDocForMode(design: QuoteDesign, requested: QuoteDesignMode): {
  doc: ProposalDocData; renderMode: QuoteDesignMode;
} {
  const renderMode = resolveRenderMode(design, requested);
  const spec = MODE_SAMPLE[renderMode];
  const sectionKeys = renderMode === "salesbook" && design.defaultSections.length ? design.defaultSections : spec.sections;
  const sections = sectionKeys.map(k => ({
    key: k, label: SECTION_LABELS[k] ?? k, body: getSectionBlock(k)?.defaultBody ?? "", visible: true,
  }));
  // Quick/custom previews lead with the line-item table; option-driven modes show cards.
  const total = spec.options.length ? 12412 : 11600 + 812;
  return {
    doc: buildProposalDoc({
      quoteNumber: "Q-2026-0148", title: design.previewTitle || spec.title,
      customerName: SAMPLE_CUSTOMER.name, propertyLabel: SAMPLE_CUSTOMER.property, assignedTo: SAMPLE_CUSTOMER.rep,
      createdAt: "Jun 20, 2026", expiresAt: "Jul 20, 2026",
      sections, lineItems: SAMPLE_LINE_ITEMS, options: spec.options,
      subtotal: 11600, tax: 812, total, taxRatePct: 7,
    }),
    renderMode,
  };
}
