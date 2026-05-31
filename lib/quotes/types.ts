// Quotes and Invoices — TypeScript types.
// These mirror supabase/migrations/0003_quotes_invoices.sql.
// No mock data here — these types are imported by future UI components
// and Supabase query helpers.

export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "approved"
  | "rejected"
  | "expired"
  | "converted";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "partially_paid"
  | "paid"
  | "past_due"
  | "void"
  | "canceled";

// Line item categories (Quotes & Invoices)
export type LineItemCategory =
  | "Labor" | "Materials" | "Equipment" | "Permit" | "Subcontractor"
  | "Discount" | "Warranty" | "Maintenance Plan" | "Other";

export const LINE_ITEM_CATEGORIES: LineItemCategory[] = [
  "Labor", "Materials", "Equipment", "Permit", "Subcontractor",
  "Discount", "Warranty", "Maintenance Plan", "Other",
];

export interface Quote {
  id: string;
  organizationId: string;
  companyId: string;
  locationId: string;
  serviceAreaId?: string;

  // Master owner
  customerId: string;

  // Optional context links
  propertyId?: string;
  leadId?: string;
  projectId?: string;
  jobId?: string;
  agreementId?: string;

  quoteNumber: string;
  title: string;
  status: QuoteStatus;

  subtotal: number;
  tax: number;
  total: number;

  expiresAt?: string;
  approvedAt?: string;
  assignedUserId?: string;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  organizationId: string;
  companyId: string;
  locationId: string;
  serviceAreaId?: string;

  // Master owner
  customerId: string;

  // Optional context links
  propertyId?: string;
  projectId?: string;
  jobId?: string;
  agreementId?: string;

  // Set if converted from a quote
  quoteId?: string;

  invoiceNumber: string;
  title: string;
  status: InvoiceStatus;

  subtotal: number;
  tax: number;
  total: number;
  balanceDue: number;

  dueDate: string;
  paidAt?: string;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Display helpers ──────────────────────────────────────

export const QUOTE_STATUS_STYLE: Record<QuoteStatus, { label: string; bg: string; color: string }> = {
  draft:     { label: "Draft",     bg: "var(--bg-input)", color: "var(--text-muted)" },
  sent:      { label: "Sent",      bg: "#e0e7ff",         color: "#3730a3" },
  viewed:    { label: "Viewed",    bg: "#dbeafe",         color: "#1e40af" },
  approved:  { label: "Approved",  bg: "#d1fae5",         color: "#065f46" },
  rejected:  { label: "Rejected",  bg: "#fee2e2",         color: "#991b1b" },
  expired:   { label: "Expired",   bg: "#fef3c7",         color: "#92400e" },
  converted: { label: "Converted", bg: "#d1fae5",         color: "#065f46" },
};

export const INVOICE_STATUS_STYLE: Record<InvoiceStatus, { label: string; bg: string; color: string }> = {
  draft:          { label: "Draft",          bg: "var(--bg-input)", color: "var(--text-muted)" },
  sent:           { label: "Sent",           bg: "#e0e7ff",         color: "#3730a3" },
  viewed:         { label: "Viewed",         bg: "#dbeafe",         color: "#1e40af" },
  partially_paid: { label: "Partially Paid", bg: "#fef3c7",         color: "#92400e" },
  paid:           { label: "Paid",           bg: "#d1fae5",         color: "#065f46" },
  past_due:       { label: "Past Due",       bg: "#fee2e2",         color: "#991b1b" },
  void:           { label: "Void",           bg: "var(--bg-input)", color: "var(--text-muted)" },
  canceled:       { label: "Canceled",       bg: "var(--bg-input)", color: "var(--text-muted)" },
};
