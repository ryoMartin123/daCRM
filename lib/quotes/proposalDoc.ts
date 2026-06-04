// Normalized proposal-document data shared by the on-screen preview, the print
// view, and the PDF generator — so all three render identical content from a
// single source. Built from a quote's live builder state or a saved record.

import type { LineItem, QuoteRecord, QuoteSection } from "./data";
import { getProposalBranding, SECTION_LABELS, type ProposalBranding, type SectionKey } from "@/lib/proposals/data";

export interface ProposalDocData {
  quoteNumber: string;
  title: string;
  branding: ProposalBranding;
  customerName: string;
  locationName?: string;
  propertyLabel?: string;
  assignedTo?: string;
  createdAt?: string;
  expiresAt?: string;
  sections: QuoteSection[];        // ordered; only visible ones render
  lineItems: LineItem[];
  subtotal: number; tax: number; total: number;
  taxRatePct: number;
  customerNotes?: string;
  stamp?: string;                  // e.g. "APPROVED"
}

export interface BuildProposalInput {
  quoteNumber: string;
  title: string;
  customerName: string;
  locationName?: string;
  propertyLabel?: string;
  assignedTo?: string;
  createdAt?: string;
  expiresAt?: string;
  sections: QuoteSection[];
  lineItems: LineItem[];
  subtotal: number; tax: number; total: number;
  taxRatePct?: number;
  customerNotes?: string;
  stamp?: string;
}

const STAMP_FOR_STATUS: Record<string, string | undefined> = {
  approved: "APPROVED", converted: "APPROVED", rejected: "DECLINED", expired: "EXPIRED",
};

// Builder state → doc data.
export function buildProposalDoc(input: BuildProposalInput): ProposalDocData {
  return {
    quoteNumber: input.quoteNumber,
    title: input.title,
    branding: getProposalBranding(),
    customerName: input.customerName,
    locationName: input.locationName,
    propertyLabel: input.propertyLabel,
    assignedTo: input.assignedTo,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    sections: input.sections,
    lineItems: input.lineItems,
    subtotal: input.subtotal, tax: input.tax, total: input.total,
    taxRatePct: input.taxRatePct ?? 0,
    customerNotes: input.customerNotes,
    stamp: input.stamp,
  };
}

// Saved quote record → doc data (used by the quote detail page).
export function proposalDocFromQuote(q: QuoteRecord): ProposalDocData {
  const sections: QuoteSection[] = q.sections && q.sections.length
    ? q.sections
    : [{ key: "line_items", label: SECTION_LABELS["line_items" as SectionKey], body: "", visible: true }];
  const taxRatePct = q.subtotal > 0 ? Math.round((q.tax / q.subtotal) * 1000) / 10 : 0;
  return buildProposalDoc({
    quoteNumber: q.quoteNumber, title: q.title,
    customerName: q.customerName, locationName: q.locationName, propertyLabel: q.propertyLabel,
    assignedTo: q.assignedTo, createdAt: q.createdAt, expiresAt: q.expiresAt,
    sections, lineItems: q.lineItems, subtotal: q.subtotal, tax: q.tax, total: q.total,
    taxRatePct, customerNotes: q.customerNotes, stamp: STAMP_FOR_STATUS[q.status],
  });
}
