// ─── Marketing site navigation + platform data ────────────
// Single source of truth for the mega-menu, footer, and the platform/features
// pages so the nav and the page content never drift apart.

import type { LucideIcon } from "lucide-react";
import {
  Users, CalendarRange, Smartphone, Megaphone, BarChart3, CreditCard,
  FileText, Boxes, UsersRound, MapPinned, LayoutGrid,
} from "lucide-react";

export interface PlatformArea {
  id: string;            // anchor id on the home page (e.g. "dispatch")
  title: string;
  blurb: string;
  icon: LucideIcon;
}

// The two mega-menu columns. "Product" = the customer-facing operating surfaces;
// "Operations" = the back-office systems that round out the platform.
export const PRODUCT_AREAS: PlatformArea[] = [
  { id: "overview",  title: "Platform Overview",   blurb: "One connected system for the whole operation", icon: LayoutGrid },
  { id: "crm",       title: "CRM & Jobs",          blurb: "Customers, leads, estimates, and jobs in one record", icon: Users },
  { id: "dispatch",  title: "Dispatch & Routing",  blurb: "Live board, drag-and-drop scheduling, smart routes", icon: CalendarRange },
  { id: "mobile",    title: "Technician Mobile",   blurb: "A field-ready app for the team in the truck", icon: Smartphone },
  { id: "marketing", title: "Marketing Automation",blurb: "Campaigns and follow-ups that run themselves", icon: Megaphone },
  { id: "analytics", title: "Analytics & Reporting",blurb: "Build the reports your business actually runs on", icon: BarChart3 },
];

export const OPERATIONS_AREAS: PlatformArea[] = [
  { id: "payments",  title: "Payments & Accounting", blurb: "Invoicing, payments, and the books, connected", icon: CreditCard },
  { id: "documents", title: "Documents & SOPs",      blurb: "Standard work and paperwork in one library", icon: FileText },
  { id: "inventory", title: "Inventory & Procurement",blurb: "Track parts, stock, and purchasing", icon: Boxes },
  { id: "hr",        title: "HR & Team Management",   blurb: "People, roles, time, and onboarding", icon: UsersRound },
  { id: "fleet",     title: "Field & Fleet Visibility",blurb: "See every job, truck, and tech in real time", icon: MapPinned },
];

export const ALL_AREAS: PlatformArea[] = [...PRODUCT_AREAS, ...OPERATIONS_AREAS];

// Primary nav links (right of the mega-menu trigger).
export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Industries",      href: "/industries" },
  { label: "Design Partners", href: "/design-partners" },
  { label: "Early Access",    href: "/early-access" },
];

export const INDUSTRIES: { name: string; blurb: string }[] = [
  { name: "HVAC",                 blurb: "Maintenance plans, seasonal demand, and fast dispatch." },
  { name: "Roofing",              blurb: "Inspections, estimates, and multi-crew project work." },
  { name: "Plumbing",             blurb: "Service calls, memberships, and emergency routing." },
  { name: "Electrical",          blurb: "Service and project work with clean documentation." },
  { name: "Restoration",          blurb: "Multi-day jobs, documentation, and coordination." },
  { name: "Property Maintenance", blurb: "Recurring work across many properties and sites." },
  { name: "B2B Service",          blurb: "Contracts, retainers, and account-based operations." },
];

// App entry points (existing routes — the marketing site links into the app).
export const APP_LOGIN_HREF = "/login";
export const APP_LAUNCH_HREF = "/welcome";
