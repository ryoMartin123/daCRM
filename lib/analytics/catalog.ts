// ─── Analytics catalog — business-friendly registry ───────
// The vocabulary the composer speaks: data sources, the metrics each exposes,
// how they can be grouped/filtered, the visualizations, and the dashboards a
// report can be saved to. No table/column names — only language an owner reads.

import {
  Users, UserPlus, Briefcase, ClipboardList, FileText, Receipt, CreditCard, HardHat,
  ShieldCheck, Megaphone, Phone, MessageSquare, Star, Boxes, ShoppingCart, Clock, MapPin, Building2,
  Hash, TrendingUp, GitCompareArrows, Gauge, LineChart, BarChart3, BarChartHorizontal, PieChart, CircleDot, Filter as FunnelIcon,
  Table, Trophy, type LucideIcon,
} from "lucide-react";
import type { VizType, Grouping, DateRangeKey, MetricFormat } from "./types";

export interface MetricDef { id: string; label: string; format: MetricFormat }
export interface SourceDef {
  id: string; label: string; icon: LucideIcon; app: string;
  metrics: string[]; groupings: Grouping[]; filters: string[];
}
export interface VizDef { id: VizType; label: string; icon: LucideIcon; hint: string; needsCategories?: boolean; timeOnly?: boolean }
export interface FilterDef { id: string; label: string; options: { value: string; label: string }[] }

// ── Metrics ──
export const METRICS: Record<string, MetricDef> = {
  // CRM / sales
  lead_count: { id: "lead_count", label: "Lead count", format: "number" },
  new_customers: { id: "new_customers", label: "New customers", format: "number" },
  estimate_count: { id: "estimate_count", label: "Estimate count", format: "number" },
  estimate_total: { id: "estimate_total", label: "Estimate total", format: "currency" },
  estimate_approval_rate: { id: "estimate_approval_rate", label: "Estimate approval rate", format: "percent" },
  conversion_rate: { id: "conversion_rate", label: "Estimate conversion rate", format: "percent" },
  avg_estimate_value: { id: "avg_estimate_value", label: "Average estimate value", format: "currency" },
  lost_estimate_value: { id: "lost_estimate_value", label: "Lost estimate value", format: "currency" },
  revenue_by_customer: { id: "revenue_by_customer", label: "Revenue by customer", format: "currency" },
  revenue_by_source: { id: "revenue_by_source", label: "Revenue by lead source", format: "currency" },
  // Jobs / ops
  job_count: { id: "job_count", label: "Job count", format: "number" },
  completed_jobs: { id: "completed_jobs", label: "Completed jobs", format: "number" },
  canceled_jobs: { id: "canceled_jobs", label: "Canceled jobs", format: "number" },
  avg_job_duration: { id: "avg_job_duration", label: "Average job duration", format: "duration" },
  avg_ticket: { id: "avg_ticket", label: "Average ticket", format: "currency" },
  callback_rate: { id: "callback_rate", label: "Callback rate", format: "percent" },
  emergency_jobs: { id: "emergency_jobs", label: "Emergency jobs", format: "number" },
  maintenance_visits: { id: "maintenance_visits", label: "Maintenance visits", format: "number" },
  // Accounting
  invoice_revenue: { id: "invoice_revenue", label: "Invoice revenue", format: "currency" },
  paid_revenue: { id: "paid_revenue", label: "Paid revenue", format: "currency" },
  outstanding_ar: { id: "outstanding_ar", label: "Outstanding AR", format: "currency" },
  overdue_invoices: { id: "overdue_invoices", label: "Overdue invoices", format: "number" },
  avg_invoice: { id: "avg_invoice", label: "Average invoice amount", format: "currency" },
  payments_collected: { id: "payments_collected", label: "Payments collected", format: "currency" },
  refunds: { id: "refunds", label: "Refunds", format: "currency" },
  // Marketing
  campaigns_sent: { id: "campaigns_sent", label: "Campaigns sent", format: "number" },
  replies: { id: "replies", label: "Replies", format: "number" },
  booked_jobs: { id: "booked_jobs", label: "Booked jobs", format: "number" },
  revenue_attributed: { id: "revenue_attributed", label: "Revenue attributed", format: "currency" },
  reviews_received: { id: "reviews_received", label: "Reviews received", format: "number" },
  // Technician
  tech_jobs_completed: { id: "tech_jobs_completed", label: "Jobs completed", format: "number" },
  tech_revenue: { id: "tech_revenue", label: "Revenue generated", format: "currency" },
  close_rate: { id: "close_rate", label: "Close rate", format: "percent" },
  on_time_rate: { id: "on_time_rate", label: "On-time rate", format: "percent" },
  utilization: { id: "utilization", label: "Utilization", format: "percent" },
  drive_time: { id: "drive_time", label: "Drive time", format: "duration" },
  // Inventory
  material_usage: { id: "material_usage", label: "Material usage", format: "currency" },
  low_stock_items: { id: "low_stock_items", label: "Low stock items", format: "number" },
  vendor_spend: { id: "vendor_spend", label: "Vendor spend", format: "currency" },
  po_count: { id: "po_count", label: "Purchase orders", format: "number" },
};

// ── Groupings & date ranges & dashboards ──
export const GROUPINGS: Record<Grouping, { label: string; time?: boolean }> = {
  none: { label: "No grouping (single total)" },
  day: { label: "Day", time: true },
  week: { label: "Week", time: true },
  month: { label: "Month", time: true },
  quarter: { label: "Quarter", time: true },
  year: { label: "Year", time: true },
  technician: { label: "Technician" },
  location: { label: "Location" },
  company: { label: "Company" },
  job_type: { label: "Job type" },
  customer_type: { label: "Customer type" },
  lead_source: { label: "Lead source" },
  campaign: { label: "Campaign" },
  status: { label: "Status" },
  service_area: { label: "Service area" },
};

export const DATE_RANGES: { key: DateRangeKey; label: string }[] = [
  { key: "last_7", label: "Last 7 days" },
  { key: "last_30", label: "Last 30 days" },
  { key: "last_90", label: "Last 90 days" },
  { key: "last_12_months", label: "Last 12 months" },
  { key: "this_month", label: "This month" },
  { key: "this_quarter", label: "This quarter" },
  { key: "ytd", label: "Year to date" },
  { key: "all_time", label: "All time" },
];

export const VIZ_TYPES: VizDef[] = [
  { id: "kpi", label: "KPI card", icon: Hash, hint: "A single headline number." },
  { id: "gauge", label: "Gauge", icon: Gauge, hint: "A single value on a dial." },
  { id: "trend", label: "Trend card", icon: TrendingUp, hint: "Number with a sparkline + change.", timeOnly: true },
  { id: "comparison", label: "Comparison", icon: GitCompareArrows, hint: "This period vs the last." },
  { id: "line", label: "Line chart", icon: LineChart, hint: "Change over time.", timeOnly: true },
  { id: "bar", label: "Bar chart", icon: BarChart3, hint: "Compare categories or periods." },
  { id: "hbar", label: "Horizontal bar", icon: BarChartHorizontal, hint: "Many categories, ranked." },
  { id: "pie", label: "Pie chart", icon: PieChart, hint: "Share of a whole.", needsCategories: true },
  { id: "donut", label: "Donut chart", icon: CircleDot, hint: "Share of a whole, with a center total.", needsCategories: true },
  { id: "funnel", label: "Funnel", icon: FunnelIcon, hint: "Stage-to-stage drop-off.", needsCategories: true },
  { id: "table", label: "Table", icon: Table, hint: "Exact values, all rows." },
  { id: "leaderboard", label: "Leaderboard", icon: Trophy, hint: "Ranked rows with bars.", needsCategories: true },
];

export const DASHBOARDS: { id: string; label: string }[] = [
  { id: "my", label: "My Dashboard" },
  { id: "owner", label: "Owner Dashboard" },
  { id: "crm", label: "CRM Dashboard" },
  { id: "marketing", label: "Marketing Dashboard" },
  { id: "dispatch", label: "Dispatch Dashboard" },
  { id: "accounting", label: "Accounting Dashboard" },
  { id: "technician", label: "Technician Dashboard" },
  { id: "location", label: "Location Dashboard" },
];

// ── Filters (option lists are illustrative; wired to real lookups later) ──
export const FILTER_DEFS: Record<string, FilterDef> = {
  location: { id: "location", label: "Location", options: [
    { value: "augusta", label: "Augusta" }, { value: "evans", label: "Evans" }, { value: "aiken", label: "Aiken" }, { value: "columbia", label: "Columbia" } ] },
  technician: { id: "technician", label: "Technician", options: [
    { value: "any", label: "Any technician" } ] },
  job_type: { id: "job_type", label: "Job type", options: [
    { value: "repair", label: "Repair" }, { value: "maintenance", label: "Maintenance" }, { value: "installation", label: "Installation" }, { value: "estimate", label: "Estimate" }, { value: "emergency", label: "Emergency" } ] },
  customer_type: { id: "customer_type", label: "Customer type", options: [
    { value: "residential", label: "Residential" }, { value: "commercial", label: "Commercial" } ] },
  lead_source: { id: "lead_source", label: "Lead source", options: [
    { value: "google", label: "Google" }, { value: "referral", label: "Referral" }, { value: "website", label: "Website" }, { value: "repeat", label: "Repeat customer" } ] },
  estimate_status: { id: "estimate_status", label: "Estimate status", options: [
    { value: "open", label: "Open" }, { value: "approved", label: "Approved" }, { value: "rejected", label: "Rejected" } ] },
  invoice_status: { id: "invoice_status", label: "Invoice status", options: [
    { value: "paid", label: "Paid" }, { value: "unpaid", label: "Unpaid" }, { value: "overdue", label: "Overdue" } ] },
  payment_status: { id: "payment_status", label: "Payment status", options: [
    { value: "collected", label: "Collected" }, { value: "refunded", label: "Refunded" }, { value: "deposit", label: "Deposit" } ] },
  campaign: { id: "campaign", label: "Campaign", options: [
    { value: "any", label: "Any campaign" } ] },
  service_area: { id: "service_area", label: "Service area", options: [
    { value: "augusta_ga", label: "Augusta, GA" }, { value: "evans_ga", label: "Evans, GA" }, { value: "aiken_sc", label: "Aiken, SC" } ] },
  priority: { id: "priority", label: "Priority", options: [
    { value: "normal", label: "Normal" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" } ] },
  maintenance_status: { id: "maintenance_status", label: "Maintenance plan", options: [
    { value: "active", label: "Active" }, { value: "expired", label: "Expired" }, { value: "none", label: "No plan" } ] },
};

const TIME: Grouping[] = ["day", "week", "month", "quarter", "year"];

// ── Data sources ──
export const DATA_SOURCES: SourceDef[] = [
  { id: "customers", label: "Customers", icon: Users, app: "crm",
    metrics: ["new_customers", "revenue_by_customer"], groupings: [...TIME, "location", "customer_type", "lead_source", "service_area"], filters: ["location", "customer_type", "lead_source", "service_area"] },
  { id: "leads", label: "Leads", icon: UserPlus, app: "crm",
    metrics: ["lead_count", "revenue_by_source"], groupings: [...TIME, "lead_source", "location", "service_area"], filters: ["lead_source", "location", "service_area"] },
  { id: "jobs", label: "Jobs", icon: Briefcase, app: "crm",
    metrics: ["job_count", "completed_jobs", "canceled_jobs", "avg_job_duration", "avg_ticket", "callback_rate", "emergency_jobs", "maintenance_visits"], groupings: [...TIME, "technician", "location", "job_type", "status", "service_area"], filters: ["location", "technician", "job_type", "priority", "service_area"] },
  { id: "work_orders", label: "Work orders", icon: ClipboardList, app: "crm",
    metrics: ["job_count", "completed_jobs", "avg_job_duration"], groupings: [...TIME, "technician", "status", "location"], filters: ["location", "technician", "status"] },
  { id: "estimates", label: "Estimates", icon: FileText, app: "crm",
    metrics: ["estimate_count", "estimate_total", "estimate_approval_rate", "conversion_rate", "avg_estimate_value", "lost_estimate_value"], groupings: [...TIME, "technician", "location", "lead_source", "status"], filters: ["location", "technician", "estimate_status", "lead_source"] },
  { id: "invoices", label: "Invoices", icon: Receipt, app: "accounting",
    metrics: ["invoice_revenue", "paid_revenue", "outstanding_ar", "overdue_invoices", "avg_invoice"], groupings: [...TIME, "location", "technician", "job_type", "status"], filters: ["location", "invoice_status", "job_type"] },
  { id: "payments", label: "Payments", icon: CreditCard, app: "accounting",
    metrics: ["payments_collected", "refunds"], groupings: [...TIME, "location", "status"], filters: ["location", "payment_status"] },
  { id: "technicians", label: "Technicians", icon: HardHat, app: "crm",
    metrics: ["tech_jobs_completed", "tech_revenue", "close_rate", "on_time_rate", "utilization", "drive_time", "avg_ticket", "callback_rate"], groupings: ["technician", "location", ...TIME], filters: ["location", "technician"] },
  { id: "maintenance", label: "Maintenance plans", icon: ShieldCheck, app: "crm",
    metrics: ["maintenance_visits", "new_customers"], groupings: [...TIME, "location", "status"], filters: ["location", "maintenance_status"] },
  { id: "campaigns", label: "Marketing campaigns", icon: Megaphone, app: "marketing",
    metrics: ["campaigns_sent", "replies", "booked_jobs", "revenue_attributed"], groupings: [...TIME, "campaign", "lead_source"], filters: ["campaign", "lead_source"] },
  { id: "calls", label: "Calls", icon: Phone, app: "crm",
    metrics: ["lead_count", "booked_jobs"], groupings: [...TIME, "technician", "location"], filters: ["location", "technician"] },
  { id: "messages", label: "Messages", icon: MessageSquare, app: "crm",
    metrics: ["replies", "booked_jobs"], groupings: [...TIME, "campaign"], filters: ["campaign"] },
  { id: "reviews", label: "Reviews", icon: Star, app: "marketing",
    metrics: ["reviews_received"], groupings: [...TIME, "location", "technician"], filters: ["location", "technician"] },
  { id: "inventory", label: "Inventory", icon: Boxes, app: "inventory",
    metrics: ["material_usage", "low_stock_items"], groupings: [...TIME, "location", "job_type"], filters: ["location", "job_type"] },
  { id: "purchase_orders", label: "Purchase orders", icon: ShoppingCart, app: "inventory",
    metrics: ["po_count", "vendor_spend"], groupings: [...TIME, "location"], filters: ["location"] },
  { id: "time_tracking", label: "Time tracking", icon: Clock, app: "hr",
    metrics: ["utilization", "drive_time"], groupings: ["technician", ...TIME, "location"], filters: ["location", "technician"] },
  { id: "locations", label: "Locations", icon: MapPin, app: "crm",
    metrics: ["paid_revenue", "job_count", "new_customers"], groupings: ["location", ...TIME], filters: ["location"] },
  { id: "companies", label: "Companies", icon: Building2, app: "crm",
    metrics: ["paid_revenue", "job_count", "new_customers"], groupings: ["company", ...TIME], filters: [] },
];

export const sourceById = (id: string) => DATA_SOURCES.find(s => s.id === id);
export const vizById = (id: VizType) => VIZ_TYPES.find(v => v.id === id)!;
export const metricById = (id: string) => METRICS[id];

// Categorical members used to label non-time groupings in the mock engine.
export const GROUP_MEMBERS: Partial<Record<Grouping, string[]>> = {
  technician: ["Tucker R.", "Marcus D.", "Priya S.", "James K.", "Elena V."],
  location: ["Augusta", "Evans", "Aiken", "Columbia"],
  company: ["Giesbrecht HVAC", "R.L. Hayes Roofing", "Southern Rentals"],
  job_type: ["Repair", "Maintenance", "Installation", "Estimate", "Emergency"],
  customer_type: ["Residential", "Commercial"],
  lead_source: ["Google", "Referral", "Website", "Repeat", "LSA"],
  campaign: ["Spring Tune-up", "Win-back", "Review Request", "Renewals"],
  status: ["Open", "Scheduled", "In progress", "Completed", "Canceled"],
  service_area: ["Augusta, GA", "Evans, GA", "Martinez, GA", "Aiken, SC"],
};
