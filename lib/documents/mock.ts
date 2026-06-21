// ─── Documents & Company Info — mock content ──────────────
// Local mock for the file-tree UI: a nested folder structure plus a flat list of
// documents keyed by folder id. No persistence yet — this drives the layout and
// the visibility/permission placeholders. Real storage (Supabase) comes later.

export interface DocFolder {
  id: string;
  name: string;
  children?: DocFolder[];
}

export type DocStatus = "Draft" | "Published" | "Archived";
export type DocVisibility =
  | "Everyone"
  | "Managers only"
  | "HR / Accounting"
  | "Sales / Admin"
  | "Field employees"
  | "Confidential";

export interface DocItem {
  id: string;
  title: string;
  folderId: string;
  type: string;          // PDF, DOCX, Sheet, …
  status: DocStatus;
  owner: string;
  updated: string;       // human date
  tags: string[];
  visibility: DocVisibility;
  linkedApp?: "CRM" | "HR" | "Accounting";
}

// Folder tree — mirrors the reference structure.
export const DOC_TREE: DocFolder = {
  id: "root",
  name: "Company Documents",
  children: [
    {
      id: "system",
      name: "System Management",
      children: [
        {
          id: "sys-2025",
          name: "2025 Updates",
          children: [
            { id: "sys-hiring", name: "Hiring Process" },
            { id: "sys-billing", name: "Billing Process" },
          ],
        },
        { id: "sys-fundamentals", name: "Fundamentals" },
        { id: "sys-offgrid", name: "Off Grid Servers" },
      ],
    },
    {
      id: "hvac",
      name: "HVAC Operations",
      children: [
        { id: "hvac-service", name: "Service SOPs" },
        { id: "hvac-install", name: "Install SOPs" },
        { id: "hvac-maint", name: "Maintenance Procedures" },
        { id: "hvac-safety", name: "Safety" },
      ],
    },
    {
      id: "hr",
      name: "HR",
      children: [
        { id: "hr-handbook", name: "Employee Handbook" },
        { id: "hr-onboarding", name: "Onboarding" },
        { id: "hr-training", name: "Training" },
        { id: "hr-policies", name: "Policies" },
      ],
    },
    {
      id: "sales",
      name: "Sales",
      children: [
        { id: "sales-scripts", name: "Scripts" },
        { id: "sales-proposals", name: "Proposal Templates" },
        { id: "sales-financing", name: "Financing" },
      ],
    },
    {
      id: "accounting",
      name: "Accounting",
      children: [
        { id: "acct-billing", name: "Billing Process" },
        { id: "acct-collections", name: "Collections" },
        { id: "acct-reports", name: "Reports" },
      ],
    },
  ],
};

export const DOCS: DocItem[] = [
  { id: "d1", title: "New Hire Checklist", folderId: "sys-hiring", type: "PDF", status: "Published", owner: "Dana Whitfield", updated: "Jun 12, 2026", tags: ["hiring", "process"], visibility: "Managers only", linkedApp: "HR" },
  { id: "d2", title: "Invoice Approval Flow", folderId: "sys-billing", type: "DOCX", status: "Published", owner: "Nicole Adams", updated: "Jun 09, 2026", tags: ["billing"], visibility: "HR / Accounting", linkedApp: "Accounting" },
  { id: "d3", title: "Company Fundamentals", folderId: "sys-fundamentals", type: "PDF", status: "Published", owner: "Ryo Martin", updated: "May 30, 2026", tags: ["overview"], visibility: "Everyone" },
  { id: "d4", title: "AC Service SOP", folderId: "hvac-service", type: "PDF", status: "Published", owner: "Ryo Martin", updated: "Jun 18, 2026", tags: ["sop", "service"], visibility: "Field employees", linkedApp: "CRM" },
  { id: "d5", title: "Furnace Install Checklist", folderId: "hvac-install", type: "PDF", status: "Draft", owner: "Tucker Hayes", updated: "Jun 20, 2026", tags: ["sop", "install"], visibility: "Field employees" },
  { id: "d6", title: "Ladder & Lift Safety", folderId: "hvac-safety", type: "PDF", status: "Published", owner: "Dana Whitfield", updated: "Apr 02, 2026", tags: ["safety"], visibility: "Field employees" },
  { id: "d7", title: "Employee Handbook 2026", folderId: "hr-handbook", type: "PDF", status: "Published", owner: "Dana Whitfield", updated: "Jun 01, 2026", tags: ["policy"], visibility: "Everyone", linkedApp: "HR" },
  { id: "d8", title: "PTO Policy", folderId: "hr-policies", type: "DOCX", status: "Published", owner: "Dana Whitfield", updated: "Jun 15, 2026", tags: ["policy", "pto"], visibility: "Everyone", linkedApp: "HR" },
  { id: "d9", title: "Discovery Call Script", folderId: "sales-scripts", type: "DOCX", status: "Published", owner: "Ryo Martin", updated: "May 22, 2026", tags: ["sales"], visibility: "Sales / Admin", linkedApp: "CRM" },
  { id: "d10", title: "Standard Proposal Template", folderId: "sales-proposals", type: "PDF", status: "Published", owner: "Ryo Martin", updated: "Jun 10, 2026", tags: ["proposal", "template"], visibility: "Sales / Admin", linkedApp: "CRM" },
  { id: "d11", title: "Collections Procedure", folderId: "acct-collections", type: "PDF", status: "Published", owner: "Nicole Adams", updated: "Jun 05, 2026", tags: ["accounting"], visibility: "HR / Accounting", linkedApp: "Accounting" },
  { id: "d12", title: "Monthly Close Report", folderId: "acct-reports", type: "Sheet", status: "Draft", owner: "Nicole Adams", updated: "Jun 19, 2026", tags: ["report"], visibility: "Confidential", linkedApp: "Accounting" },
];

// Total documents at or below a folder (for tree counts).
export function docCount(folder: DocFolder): number {
  let n = DOCS.filter((d) => d.folderId === folder.id).length;
  for (const c of folder.children ?? []) n += docCount(c);
  return n;
}

export function docsInFolder(folderId: string): DocItem[] {
  return DOCS.filter((d) => d.folderId === folderId);
}
