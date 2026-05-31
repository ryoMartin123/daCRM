// Work Orders — TypeScript types.
// These mirror supabase/migrations/0004_work_orders.sql.

export type WorkOrderStatus = "pending" | "in_progress" | "completed" | "canceled";

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
}

export interface WorkOrder {
  id: string;
  organizationId: string;
  companyId: string;
  locationId: string;
  serviceAreaId?: string;

  customerId?: string;
  propertyId?: string;
  jobId?: string;          // required in practice; nullable in DB for flexibility

  assignedTo?: string;

  title: string;
  description?: string;
  status: WorkOrderStatus;

  scheduledDate?: string;
  completedAt?: string;

  checklist: ChecklistItem[];
  fieldNotes?: string;

  // Read-only financial references — work order does not own these
  quoteId?: string;
  invoiceId?: string;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Display helpers ──────────────────────────────────────

export const WORK_ORDER_STATUS_STYLE: Record<WorkOrderStatus, { label: string; bg: string; color: string }> = {
  pending:     { label: "Pending",     bg: "var(--bg-input)", color: "var(--text-muted)" },
  in_progress: { label: "In Progress", bg: "#fef3c7",         color: "#92400e" },
  completed:   { label: "Completed",   bg: "#d1fae5",         color: "#065f46" },
  canceled:    { label: "Canceled",    bg: "#fee2e2",         color: "#991b1b" },
};
