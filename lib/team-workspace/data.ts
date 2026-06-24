// ─── Team Workspace — mock data (pre-Supabase) ────────────
// Internal collaboration app: channels, announcements, meetings, and action
// items. Mock + in-memory mutation (resets on reload) so the Channels workspace
// feels usable — create a channel, post an update, add an action item — without
// a backend. Channels can later link to CRM/HR/Inventory records & Documents.

export type MeetingStatus = "scheduled" | "completed" | "canceled";

export interface Meeting {
  id: string;
  channelId?: string;           // the channel this meeting belongs to (if any)
  title: string;
  when: string;                 // human-readable date/time for the mock
  attendees: string[];
  relatedApp?: string;          // e.g. "CRM", "HR" — link target later
  relatedRecord?: string;       // e.g. "Job #1042"
  agenda: string[];
  notes?: string;
  actionItems: string[];
  status: MeetingStatus;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  audience: string;             // "Company-wide", "Service Team", …
  date: string;
}

// ─── Channels ─────────────────────────────────────────────
export type ChannelType =
  | "company" | "team" | "department" | "project" | "training" | "safety" | "inventory" | "announcement" | "custom";
export const CHANNEL_TYPE_LABELS: Record<ChannelType, string> = {
  company: "Company-wide", team: "Team", department: "Department", project: "Project",
  training: "Training", safety: "Safety", inventory: "Inventory", announcement: "Announcement", custom: "Custom",
};
// Options offered in the Create/Edit flows (a friendly subset).
export const CHANNEL_TYPE_OPTIONS: ChannelType[] = ["company", "team", "project", "training", "safety", "inventory", "custom"];

export type ChannelVisibility = "everyone" | "roles" | "users" | "company_location" | "managers" | "private";
export const VISIBILITY_LABELS: Record<ChannelVisibility, string> = {
  everyone: "Everyone", roles: "Specific roles", users: "Specific users",
  company_location: "Company / location", managers: "Managers only", private: "Private",
};
export const VISIBILITY_OPTIONS: ChannelVisibility[] = ["everyone", "roles", "users", "company_location", "managers", "private"];

export type ChannelStatus = "active" | "archived";

// Per-channel member roles. Admins run the channel (pin, announce, manage
// members); members can read + post regular messages. Assigned in Settings.
export type ChannelRole = "admin" | "member";
export const CHANNEL_ROLE_LABELS: Record<ChannelRole, string> = { admin: "Channel Admin", member: "Member" };
export const CHANNEL_ROLE_CAPS: Record<ChannelRole, string[]> = {
  admin: ["Post updates, announcements & decisions", "Pin & unpin messages", "Manage members & their roles", "Edit or archive the channel"],
  member: ["Read the channel", "Post regular messages & questions"],
};
export interface ChannelMember { name: string; role: ChannelRole; }

export interface Channel {
  id: string;
  name: string;
  description: string;
  type: ChannelType;
  visibility: ChannelVisibility;
  membersCount: number;
  unreadCount: number;
  lastActivity: string;         // display string, e.g. "2h ago"
  pinned: boolean;
  status: ChannelStatus;
  accent: string;               // icon/color
  members: ChannelMember[];     // roster with per-channel roles (mock)
  managers: string[];           // manager/owner display names
  companyId?: string;           // org-wide when undefined; else scoped to a company
  locationId?: string;
  context?: string;             // display label for linked company/location
}

export type PostType = "update" | "announcement" | "note" | "question" | "decision";
export const POST_TYPE_STYLE: Record<PostType, { label: string; color: string; bg: string }> = {
  update:       { label: "Update",       color: "#0ea5e9", bg: "#0ea5e91a" },
  announcement: { label: "Announcement", color: "#6366f1", bg: "#6366f11a" },
  note:         { label: "Note",         color: "#6b7280", bg: "var(--bg-input)" },
  question:     { label: "Question",     color: "#f59e0b", bg: "#f59e0b1a" },
  decision:     { label: "Decision",     color: "#10b981", bg: "#10b9811a" },
};
export const POST_TYPE_OPTIONS: PostType[] = ["update", "announcement", "note", "question", "decision"];

export interface ChannelPost {
  id: string;
  channelId: string;
  author: string;
  postType: PostType;
  content: string;
  createdAt: string;
  pinned: boolean;
  linkedRecord?: string;
  reactionsCount: number;
  commentsCount: number;
}

export type ActionItemStatus = "open" | "in_progress" | "completed" | "overdue";
export const ACTION_STATUS_STYLE: Record<ActionItemStatus, { label: string; dot: string }> = {
  open: { label: "Open", dot: "#f59e0b" },
  in_progress: { label: "In progress", dot: "#0ea5e9" },
  completed: { label: "Completed", dot: "#10b981" },
  overdue: { label: "Overdue", dot: "#ef4444" },
};

export interface ActionItem {
  id: string;
  channelId?: string;
  title: string;
  owner: string;                // assigned to
  due: string;
  status: ActionItemStatus;
  source: "channel" | "meeting" | "manual";
  linkedRecord?: string;
}

export interface ChannelDocument {
  id: string;
  channelId: string;
  title: string;
  folder: string;
  type: string;
  status: string;
  lastUpdated: string;
  owner: string;
}

export const MEETING_STATUS_STYLE: Record<MeetingStatus, { label: string; dot: string }> = {
  scheduled: { label: "Scheduled", dot: "#0ea5e9" },
  completed: { label: "Completed", dot: "#10b981" },
  canceled: { label: "Canceled", dot: "#9ca3af" },
};

// ─── Seeds ────────────────────────────────────────────────
// Member rosters carry per-channel roles. companyId scopes a channel to a
// company (org-wide when undefined) so the company/location view can filter.
const mem = (name: string, role: ChannelRole = "member"): ChannelMember => ({ name, role });

let _channels: Channel[] = [
  { id: "ch-company", name: "Company-wide", description: "Company announcements and general updates.", type: "company", visibility: "everyone", membersCount: 24, unreadCount: 3, lastActivity: "2h ago", pinned: true, status: "active", accent: "#6366f1", managers: ["Ryo Martin"],
    members: [mem("Ryo Martin", "admin"), mem("Dana Whitfield", "admin"), mem("Tucker Hayes"), mem("Kylie Brooks"), mem("Chandler Reyes")] },
  { id: "ch-service", name: "Service Team", description: "Service calls, technician updates, and field issues.", type: "team", visibility: "roles", membersCount: 5, unreadCount: 1, lastActivity: "20m ago", pinned: true, status: "active", accent: "#0ea5e9", managers: ["Dispatch"], companyId: "co_hvac", locationId: "loc_augusta",
    members: [mem("Kylie Brooks", "admin"), mem("Tucker Hayes"), mem("Chandler Reyes"), mem("Marcus Chen")] },
  { id: "ch-install", name: "Install Team", description: "Install scheduling, job prep, materials, and punch lists.", type: "team", visibility: "roles", membersCount: 4, unreadCount: 0, lastActivity: "Yesterday", pinned: false, status: "active", accent: "#14b8a6", managers: [], companyId: "co_hvac",
    members: [mem("Marcus Chen", "admin"), mem("Tucker Hayes"), mem("Luis Romero")] },
  { id: "ch-sales", name: "Sales", description: "Leads, quotes, follow-ups, and proposal updates.", type: "team", visibility: "roles", membersCount: 3, unreadCount: 2, lastActivity: "1h ago", pinned: false, status: "active", accent: "#ec4899", managers: [], companyId: "co_hvac",
    members: [mem("Priya Nair", "admin"), mem("Chandler Reyes")] },
  { id: "ch-office", name: "Office/Admin", description: "Dispatch, billing, scheduling, and customer communication.", type: "department", visibility: "roles", membersCount: 3, unreadCount: 0, lastActivity: "3h ago", pinned: false, status: "active", accent: "#a855f7", managers: [], companyId: "co_hvac",
    members: [mem("Dana Whitfield", "admin"), mem("Kylie Brooks")] },
  { id: "ch-training", name: "Training", description: "Training topics, SOP updates, quizzes, and improvement items.", type: "training", visibility: "everyone", membersCount: 4, unreadCount: 0, lastActivity: "Yesterday", pinned: false, status: "active", accent: "#f59e0b", managers: [],
    members: [mem("Ryo Martin", "admin"), mem("Tucker Hayes"), mem("Marcus Chen")] },
  { id: "ch-safety", name: "Safety", description: "Safety reminders, incidents, and compliance.", type: "safety", visibility: "everyone", membersCount: 4, unreadCount: 0, lastActivity: "2d ago", pinned: false, status: "active", accent: "#ef4444", managers: [],
    members: [mem("Dana Whitfield", "admin"), mem("Luis Romero")] },
  { id: "ch-inventory", name: "Inventory / Warehouse", description: "Stock, truck inventory, material requests, and vendor updates.", type: "inventory", visibility: "roles", membersCount: 3, unreadCount: 0, lastActivity: "4h ago", pinned: false, status: "active", accent: "#f97316", managers: [], companyId: "co_hvac",
    members: [mem("Marcus Chen", "admin"), mem("Luis Romero")] },
  { id: "ch-mgmt", name: "Management", description: "Leadership planning, KPIs, and cross-department decisions.", type: "department", visibility: "managers", membersCount: 2, unreadCount: 0, lastActivity: "Yesterday", pinned: false, status: "active", accent: "#8b5cf6", managers: ["Ryo Martin"],
    members: [mem("Ryo Martin", "admin"), mem("Priya Nair", "admin")] },
  { id: "ch-roofing", name: "Roofing Crew", description: "Roofing schedules, materials, and jobsite updates.", type: "team", visibility: "roles", membersCount: 3, unreadCount: 0, lastActivity: "5h ago", pinned: false, status: "active", accent: "#0891b2", managers: [], companyId: "co_roofing", locationId: "loc_columbia",
    members: [mem("Sam Okafor", "admin"), mem("Derek Lyle")] },
  { id: "ch-proj-maple", name: "Maple Ridge Retrofit", description: "Multi-unit retrofit project coordination and punch list.", type: "project", visibility: "users", membersCount: 3, unreadCount: 0, lastActivity: "Yesterday", pinned: false, status: "active", accent: "#0ea5e9", managers: [], companyId: "co_hvac", locationId: "loc_augusta",
    members: [mem("Marcus Chen", "admin"), mem("Tucker Hayes"), mem("Priya Nair")] },
  { id: "ch-2025-kickoff", name: "2025 Kickoff", description: "Archived planning channel from the 2025 company kickoff.", type: "custom", visibility: "everyone", membersCount: 2, unreadCount: 0, lastActivity: "Jan 12", pinned: false, status: "archived", accent: "#6b7280", managers: [],
    members: [mem("Ryo Martin", "admin")] },
];

const ANNOUNCEMENTS: Announcement[] = [
  { id: "ann-training", title: "Training schedule updated", body: "Friday training moves to 1:00 PM starting this week.", audience: "Company-wide", date: "Jun 22, 2026" },
  { id: "ann-truck", title: "Truck inspection reminders", body: "Pre-shift truck inspections are now required every Tuesday.", audience: "Service Team", date: "Jun 20, 2026" },
  { id: "ann-sop", title: "New SOP published", body: "Updated install checklist is live in Documents → SOPs.", audience: "Install Team", date: "Jun 18, 2026" },
];

const MEETINGS: Meeting[] = [
  { id: "mtg-truck", channelId: "ch-service", title: "Tuesday Truck Inspection", when: "Tue, Jun 24 · 7:30 AM", attendees: ["Tucker Hayes", "Field Team"], relatedApp: "Inventory", relatedRecord: "Truck 1 / Truck 2", agenda: ["Tire & fluid check", "Restock truck inventory", "Report damage"], actionItems: ["Order 2 replacement gauges"], status: "scheduled" },
  { id: "mtg-training", channelId: "ch-training", title: "Friday Training", when: "Fri, Jun 27 · 1:00 PM", attendees: ["All Technicians"], relatedApp: "HR", relatedRecord: "Safety Cert 2026", agenda: ["New SOP walkthrough", "Equipment handling refresher"], actionItems: ["Complete safety quiz"], status: "scheduled" },
  { id: "mtg-sync", channelId: "ch-service", title: "Morning Team Sync", when: "Daily · 8:00 AM", attendees: ["Service Team", "Dispatch"], agenda: ["Today's board", "Blockers", "Priority calls"], actionItems: [], status: "scheduled" },
  { id: "mtg-recap", channelId: "ch-service", title: "Afternoon Recap", when: "Daily · 4:30 PM", attendees: ["Service Team", "Dispatch"], agenda: ["Completed jobs", "Carryovers", "Tomorrow prep"], notes: "Logged from yesterday's recap.", actionItems: ["Follow up on Evans, GA install"], status: "completed" },
];

let _posts: ChannelPost[] = [
  { id: "p-truck", channelId: "ch-service", author: "Dispatch", postType: "announcement", content: "Truck inspection reminders for Tuesday — complete your pre-shift checklist before 7:30 AM.", createdAt: "2h ago", pinned: true, reactionsCount: 4, commentsCount: 2, linkedRecord: "Meeting · Tuesday Truck Inspection" },
  { id: "p-photos", channelId: "ch-service", author: "Kylie Brooks", postType: "question", content: "Need updated photos uploaded for the Johnson install — can the crew grab a few before they wrap today?", createdAt: "20m ago", pinned: false, reactionsCount: 1, commentsCount: 3, linkedRecord: "CRM · Job #1042" },
  { id: "p-airflow", channelId: "ch-training", author: "Ryo Martin", postType: "update", content: "Friday training will cover airflow diagnostics. Bring your manometers.", createdAt: "Yesterday", pinned: false, reactionsCount: 6, commentsCount: 1 },
  { id: "p-sop", channelId: "ch-company", author: "Ryo Martin", postType: "announcement", content: "New SOP published for work phone setup. Review it in Documents → SOPs and acknowledge by Friday.", createdAt: "3h ago", pinned: true, reactionsCount: 9, commentsCount: 4, linkedRecord: "Documents · Work Phone Setup SOP" },
  { id: "p-decision", channelId: "ch-company", author: "Ryo Martin", postType: "decision", content: "We're standardizing on the new install checklist company-wide starting July 1.", createdAt: "Yesterday", pinned: false, reactionsCount: 5, commentsCount: 0 },
];

let _actionItems: ActionItem[] = [
  { id: "ai-gauges", channelId: "ch-service", title: "Order 2 replacement gauges", owner: "Tucker Hayes", due: "Jun 25, 2026", status: "open", source: "meeting", linkedRecord: "Meeting · Tuesday Truck Inspection" },
  { id: "ai-photos", channelId: "ch-service", title: "Upload Johnson install photos", owner: "Install Crew", due: "Jun 23, 2026", status: "overdue", source: "channel", linkedRecord: "CRM · Job #1042" },
  { id: "ai-quiz", channelId: "ch-training", title: "Complete safety quiz", owner: "All Technicians", due: "Jun 27, 2026", status: "in_progress", source: "meeting" },
  { id: "ai-evans", channelId: "ch-service", title: "Follow up on Evans, GA install", owner: "Dispatch", due: "Jun 24, 2026", status: "open", source: "meeting" },
  { id: "ai-sop", channelId: "ch-company", title: "Acknowledge new install SOP", owner: "Install Team", due: "Jun 26, 2026", status: "open", source: "channel", linkedRecord: "Documents · Install Checklist" },
  { id: "ai-phone", channelId: "ch-company", title: "Set up new work phones", owner: "Office/Admin", due: "Jun 30, 2026", status: "completed", source: "manual" },
];

const CHANNEL_DOCS: ChannelDocument[] = [
  { id: "cd-phone", channelId: "ch-company", title: "Work Phone Setup SOP", folder: "SOPs", type: "PDF", status: "Published", lastUpdated: "Jun 18, 2026", owner: "Ryo Martin" },
  { id: "cd-truck", channelId: "ch-service", title: "Truck Inspection Checklist", folder: "Safety", type: "PDF", status: "Published", lastUpdated: "Jun 15, 2026", owner: "Dispatch" },
  { id: "cd-comm", channelId: "ch-service", title: "Service Call Communication SOP", folder: "SOPs", type: "DOCX", status: "Published", lastUpdated: "Jun 10, 2026", owner: "Dispatch" },
  { id: "cd-safety", channelId: "ch-safety", title: "Safety Policy", folder: "Policies", type: "PDF", status: "Published", lastUpdated: "May 30, 2026", owner: "Ryo Martin" },
  { id: "cd-airflow", channelId: "ch-training", title: "Airflow Diagnostics Guide", folder: "Training", type: "PDF", status: "Draft", lastUpdated: "Jun 21, 2026", owner: "Ryo Martin" },
];

function rid(prefix: string): string { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`; }

// ─── Reads ────────────────────────────────────────────────
export function getAllChannels(): Channel[] { return _channels; }
export function getChannels(): Channel[] { return _channels.filter(c => c.status === "active"); }
export function getChannel(id: string): Channel | undefined { return _channels.find(c => c.id === id); }
export function getAnnouncements(): Announcement[] { return ANNOUNCEMENTS; }

export function getMeetings(): Meeting[] { return MEETINGS; }
export function getUpcomingMeetings(): Meeting[] { return MEETINGS.filter(m => m.status === "scheduled"); }
export function getChannelMeetings(channelId: string): Meeting[] { return MEETINGS.filter(m => m.channelId === channelId); }

export function getActionItems(): ActionItem[] { return _actionItems; }
export function getOpenActionItems(): ActionItem[] { return _actionItems.filter(a => a.status !== "completed"); }
export function getChannelActionItems(channelId: string): ActionItem[] { return _actionItems.filter(a => a.channelId === channelId); }

export function getChannelPosts(channelId: string): ChannelPost[] { return _posts.filter(p => p.channelId === channelId); }
export function getPinnedPosts(channelId: string): ChannelPost[] { return _posts.filter(p => p.channelId === channelId && p.pinned); }
export function getChannelDocuments(channelId: string): ChannelDocument[] { return CHANNEL_DOCS.filter(d => d.channelId === channelId); }

// ─── Mutations (in-memory; callers refresh via a local tick) ──
export interface CreateChannelInput {
  name: string; description: string; type: ChannelType; visibility: ChannelVisibility;
  context?: string; companyId?: string;
}
export function createChannel(input: CreateChannelInput): Channel {
  const accentByType: Partial<Record<ChannelType, string>> = {
    company: "#6366f1", team: "#2563eb", project: "#2563eb", training: "#f59e0b",
    safety: "#ef4444", inventory: "#f97316", department: "#a855f7", custom: "#2563eb",
  };
  const c: Channel = {
    id: rid("ch"), name: input.name.trim(), description: input.description.trim(),
    type: input.type, visibility: input.visibility,
    membersCount: 1, unreadCount: 0, lastActivity: "Just now",
    pinned: false, status: "active", accent: accentByType[input.type] ?? "#2563eb",
    members: [{ name: "Ryo Martin", role: "admin" }], managers: ["Ryo Martin"],
    context: input.context, companyId: input.companyId,
  };
  _channels = [c, ..._channels];
  return c;
}
export function updateChannel(id: string, patch: Partial<Channel>): void {
  _channels = _channels.map(c => c.id === id ? { ...c, ...patch } : c);
}
export function archiveChannel(id: string): void { updateChannel(id, { status: "archived", pinned: false }); }
export function togglePinChannel(id: string): void {
  const c = getChannel(id); if (c) updateChannel(id, { pinned: !c.pinned });
}

// ─── Channel members & roles (Settings) ───────────────────
export function getChannelMembers(channelId: string): ChannelMember[] { return getChannel(channelId)?.members ?? []; }
export function setChannelMemberRole(channelId: string, name: string, role: ChannelRole): void {
  _channels = _channels.map(c => c.id !== channelId ? c : { ...c, members: c.members.map(m => m.name === name ? { ...m, role } : m) });
}
export function addChannelMember(channelId: string, name: string, role: ChannelRole = "member"): void {
  const clean = name.trim(); if (!clean) return;
  _channels = _channels.map(c => {
    if (c.id !== channelId || c.members.some(m => m.name.toLowerCase() === clean.toLowerCase())) return c;
    const members = [...c.members, { name: clean, role }];
    return { ...c, members, membersCount: members.length };
  });
}
export function removeChannelMember(channelId: string, name: string): void {
  _channels = _channels.map(c => {
    if (c.id !== channelId) return c;
    const members = c.members.filter(m => m.name !== name);
    return { ...c, members, membersCount: members.length };
  });
}

// ─── Membership permissions (mock current user) ───────────
// The signed-in workspace user. Channel Admins can manage members; everyone
// else sees the roster read-only.
export const CURRENT_USER = "Ryo Martin";

export function channelRoleOf(channelId: string, name = CURRENT_USER): ChannelRole | null {
  return getChannel(channelId)?.members.find(m => m.name === name)?.role ?? null;
}
// Can `name` add/remove members & change roles in this channel?
export function canManageChannelMembers(channelId: string, name = CURRENT_USER): boolean {
  return channelRoleOf(channelId, name) === "admin";
}
// People known to the workspace — the add-member picker source.
export function getWorkspacePeople(): string[] {
  return [...new Set(_channels.flatMap(c => c.members.map(m => m.name)))].sort();
}

export function addChannelPost(channelId: string, postType: PostType, content: string, author = "Ryo Martin"): ChannelPost {
  const p: ChannelPost = {
    id: rid("p"), channelId, author, postType, content: content.trim(),
    createdAt: "Just now", pinned: false, reactionsCount: 0, commentsCount: 0,
  };
  _posts = [p, ..._posts];
  updateChannel(channelId, { lastActivity: "Just now" });
  return p;
}

export function addChannelActionItem(channelId: string, title: string, owner: string, due: string): ActionItem {
  const a: ActionItem = { id: rid("ai"), channelId, title: title.trim(), owner: owner.trim() || "Unassigned", due: due.trim() || "—", status: "open", source: "channel" };
  _actionItems = [a, ..._actionItems];
  return a;
}
export function setActionItemStatus(id: string, status: ActionItemStatus): void {
  _actionItems = _actionItems.map(a => a.id === id ? { ...a, status } : a);
}
