// ─── Global tasks — types + mock data ─────────────────────
// Aggregates tasks from customer, lead, job, and project contexts.
// Replace with a Supabase query when connected:
//   supabase.from('tasks').select('*')
//     .eq('organization_id', orgId).order('due_date')

export type TaskStatus = "open" | "overdue" | "completed";

export type TaskType =
  | "follow_up"
  | "call"
  | "schedule"
  | "send_estimate"
  | "send_agreement"
  | "review"
  | "inspection"
  | "other";

export interface Task {
  id: string;
  organizationId: string;
  companyId: string;
  locationId: string;

  title: string;
  type: TaskType;
  status: TaskStatus;
  dueDate: string;
  completedAt?: string;
  assignedTo: string;
  assignedToInitials: string;
  notes?: string;

  // Optional linked records
  customerId?: string;
  customerName?: string;
  leadId?: string;
  jobId?: string;
  projectId?: string;

  // Display
  linkedLabel?: string;
  linkedHref?: string;
  linkedType?: "customer" | "lead" | "job" | "project";

  createdAt: string;
}

// ─── Display config ───────────────────────────────────────
export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  follow_up:      "Follow-Up",
  call:           "Call",
  schedule:       "Schedule",
  send_estimate:  "Send Estimate",
  send_agreement: "Send Agreement",
  review:         "Review",
  inspection:     "Inspection",
  other:          "Other",
};

// ─── Mock tasks ───────────────────────────────────────────
export const ALL_TASKS: Task[] = [
  // ── Customer tasks ─────────────────────────────────────
  {
    id: "t1-1",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_augusta",
    title: "Follow up on water heater quote",
    type: "follow_up", status: "open",
    dueDate: "Jun 5, 2026", assignedTo: "Sara (CSR)", assignedToInitials: "SC",
    customerId: "1", customerName: "Sarah Mitchell",
    linkedLabel: "Sarah Mitchell", linkedHref: "/customers/1", linkedType: "customer",
    createdAt: "2026-05-20",
  },
  {
    id: "t1-2",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_augusta",
    title: "Schedule air quality test",
    type: "schedule", status: "open",
    dueDate: "Jun 20, 2026", assignedTo: "J. Patel", assignedToInitials: "JP",
    customerId: "1", customerName: "Sarah Mitchell",
    linkedLabel: "Sarah Mitchell", linkedHref: "/customers/1", linkedType: "customer",
    createdAt: "2026-04-03",
  },
  {
    id: "t2-1",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_augusta",
    title: "Send roofing replacement proposal",
    type: "send_estimate", status: "open",
    dueDate: "Jun 3, 2026", assignedTo: "D. Nguyen", assignedToInitials: "DN",
    customerId: "2", customerName: "Hammond LLC",
    linkedLabel: "Hammond LLC", linkedHref: "/customers/2", linkedType: "customer",
    createdAt: "2026-05-28",
  },
  {
    id: "t2-2",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_augusta",
    title: "Call D. Webb re: Building 2 HVAC",
    type: "call", status: "open",
    dueDate: "Jun 10, 2026", assignedTo: "Sara (CSR)", assignedToInitials: "SC",
    customerId: "2", customerName: "Hammond LLC",
    linkedLabel: "Hammond LLC", linkedHref: "/customers/2", linkedType: "customer",
    createdAt: "2026-05-15",
  },
  {
    id: "t4-1",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_evans",
    title: "Send Q3 plumbing inspection reminder",
    type: "send_agreement", status: "open",
    dueDate: "Jul 15, 2026", assignedTo: "Sara (CSR)", assignedToInitials: "SC",
    customerId: "4", customerName: "Lakeside Apartments",
    linkedLabel: "Lakeside Apartments", linkedHref: "/customers/4", linkedType: "customer",
    createdAt: "2026-05-05",
  },
  {
    id: "t7-1",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_augusta",
    title: "Confirm spring HVAC appointment",
    type: "call", status: "open",
    dueDate: "Jun 3, 2026", assignedTo: "Sara (CSR)", assignedToInitials: "SC",
    customerId: "7", customerName: "Alvarez Residence",
    linkedLabel: "Alvarez Residence", linkedHref: "/customers/7", linkedType: "customer",
    createdAt: "2026-06-01",
  },
  {
    id: "t8-1",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_augusta",
    title: "Send monthly property summary",
    type: "other", status: "overdue",
    dueDate: "May 31, 2026", assignedTo: "Sara (CSR)", assignedToInitials: "SC",
    customerId: "8", customerName: "ABC Property Group",
    linkedLabel: "ABC Property Group", linkedHref: "/customers/8", linkedType: "customer",
    createdAt: "2026-05-01",
  },
  {
    id: "t8-2",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_augusta",
    title: "Renewal pricing discussion",
    type: "call", status: "open",
    dueDate: "Jun 15, 2026", assignedTo: "Marcus Reyes", assignedToInitials: "MR",
    customerId: "8", customerName: "ABC Property Group",
    linkedLabel: "ABC Property Group", linkedHref: "/customers/8", linkedType: "customer",
    createdAt: "2026-06-01",
  },
  {
    id: "t12-1",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_evans",
    title: "Discuss renewal pricing — Evans Pro Park",
    type: "call", status: "open",
    dueDate: "Jun 12, 2026", assignedTo: "Sara (CSR)", assignedToInitials: "SC",
    customerId: "12", customerName: "Evans Professional Park",
    linkedLabel: "Evans Professional Park", linkedHref: "/customers/12", linkedType: "customer",
    createdAt: "2026-05-25",
  },
  // ── Lead tasks ─────────────────────────────────────────
  {
    id: "lt1-1",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_augusta",
    title: "Follow up on water heater quote",
    type: "follow_up", status: "open",
    dueDate: "Jun 5, 2026", assignedTo: "Sara (CSR)", assignedToInitials: "SC",
    customerId: "1", customerName: "Sarah Mitchell",
    leadId: "l1",
    linkedLabel: "Lead: Water Heater Replacement", linkedHref: "/leads/l1", linkedType: "lead",
    createdAt: "2026-05-20",
  },
  {
    id: "lt2-1",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_augusta",
    title: "Schedule Building 2 site assessment",
    type: "schedule", status: "open",
    dueDate: "Jun 3, 2026", assignedTo: "M. Cole", assignedToInitials: "MC",
    customerId: "2", customerName: "Hammond LLC",
    leadId: "l2",
    linkedLabel: "Lead: Building 2 HVAC Upgrade", linkedHref: "/leads/l2", linkedType: "lead",
    createdAt: "2026-05-15",
  },
  {
    id: "lt5-1",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_augusta",
    title: "Follow up on commercial agreement quote",
    type: "follow_up", status: "overdue",
    dueDate: "May 30, 2026", assignedTo: "Sara (CSR)", assignedToInitials: "SC",
    leadId: "l5",
    linkedLabel: "Lead: Commercial Maintenance Agreement", linkedHref: "/leads/l5", linkedType: "lead",
    createdAt: "2026-05-22",
  },
  {
    id: "lt11-1",
    organizationId: "org_northstar", companyId: "co_roofing", locationId: "loc_columbia",
    title: "Follow-up call with Southeast Restoration COO",
    type: "call", status: "open",
    dueDate: "Jun 5, 2026", assignedTo: "Marcus Reyes", assignedToInitials: "MR",
    customerId: "6", customerName: "Southeast Restoration",
    leadId: "l11",
    linkedLabel: "Lead: Consulting Retainer", linkedHref: "/leads/l11", linkedType: "lead",
    createdAt: "2026-05-18",
  },
  {
    id: "lt4-1",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_augusta",
    title: "Confirm site visit Jun 3 — Holloway",
    type: "call", status: "open",
    dueDate: "Jun 1, 2026", assignedTo: "J. Patel", assignedToInitials: "JP",
    leadId: "l4",
    linkedLabel: "Lead: Heat Pump Replacement", linkedHref: "/leads/l4", linkedType: "lead",
    createdAt: "2026-05-29",
  },
  // ── Job tasks ───────────────────────────────────────────
  {
    id: "tj1",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_augusta",
    title: "Confirm Jun 12 HVAC tune-up — Sarah Mitchell",
    type: "call", status: "open",
    dueDate: "Jun 10, 2026", assignedTo: "Sara (CSR)", assignedToInitials: "SC",
    customerId: "1", customerName: "Sarah Mitchell",
    jobId: "j1",
    linkedLabel: "Job: HVAC Spring Tune-up", linkedHref: "/jobs/j1", linkedType: "job",
    createdAt: "2026-06-01",
  },
  {
    id: "tj4",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_augusta",
    title: "Confirm Jun 10 commercial HVAC visit with D. Webb",
    type: "call", status: "open",
    dueDate: "Jun 8, 2026", assignedTo: "Sara (CSR)", assignedToInitials: "SC",
    customerId: "2", customerName: "Hammond LLC",
    jobId: "j4",
    linkedLabel: "Job: Commercial HVAC Q2 Inspection", linkedHref: "/jobs/j4", linkedType: "job",
    createdAt: "2026-05-29",
  },
  // ── Completed tasks ─────────────────────────────────────
  {
    id: "tc1",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_augusta",
    title: "Schedule spring HVAC tune-up — Sarah Mitchell",
    type: "schedule", status: "completed",
    dueDate: "Mar 20, 2026", completedAt: "Mar 12, 2026",
    assignedTo: "Sara (CSR)", assignedToInitials: "SC",
    customerId: "1", customerName: "Sarah Mitchell",
    linkedLabel: "Sarah Mitchell", linkedHref: "/customers/1", linkedType: "customer",
    createdAt: "2026-03-01",
  },
  {
    id: "tc2",
    organizationId: "org_northstar", companyId: "co_hvac", locationId: "loc_evans",
    title: "Send HVAC renewal agreement — Evans Pro Park",
    type: "send_agreement", status: "completed",
    dueDate: "May 5, 2026", completedAt: "May 2, 2026",
    assignedTo: "Sara (CSR)", assignedToInitials: "SC",
    customerId: "12", customerName: "Evans Professional Park",
    linkedLabel: "Evans Professional Park", linkedHref: "/customers/12", linkedType: "customer",
    createdAt: "2026-04-25",
  },
];

// ─── Lookup helpers ───────────────────────────────────────
export function getAllTasks(): Task[] { return ALL_TASKS; }

export function getTasksForCustomer(customerId: string): Task[] {
  return ALL_TASKS.filter(t => t.customerId === customerId && !t.leadId && !t.jobId);
}

export function getTasksForLead(leadId: string): Task[] {
  return ALL_TASKS.filter(t => t.leadId === leadId);
}

export function getTasksForJob(jobId: string): Task[] {
  return ALL_TASKS.filter(t => t.jobId === jobId);
}
