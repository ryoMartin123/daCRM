// ─── App access (platform layer 1) ────────────────────────
// "Which apps can this user open?" — the coarsest permission tier, sitting above
// the CRM's resource/action engine (lib/roles). My Portal is always granted;
// every other app is permission-based.
//
// Resolution order:
//   1. portal is forced on.
//   2. An explicit per-user `appAccess` override (set on mock directory users)
//      wins — this is how we model an Accounting clerk or HR manager precisely.
//   3. Otherwise fall back to a sensible default derived from the user's role.
//
// Maps to a future `app_access` column / role default in the platform schema.

import type { AppUser } from "@/lib/users/data";
import type { RoleKey } from "@/lib/roles/types";
import type { PlatformAppId } from "./apps";

export type AppAccess = Record<PlatformAppId, boolean>;

const NONE: AppAccess = {
  portal: true, // always — every user gets My Portal
  crm: false,
  marketing: false,
  team_workspace: false,
  inventory: false,
  hr: false,
  accounting: false,
  documents: false,
  admin: false,
};

function grant(...apps: PlatformAppId[]): AppAccess {
  const a: AppAccess = { ...NONE };
  for (const app of apps) a[app] = true;
  return a;
}

// Role → default app access. Mock users usually carry an explicit override, so
// this is mainly the fallback for roles without one.
const ROLE_DEFAULTS: Partial<Record<RoleKey, AppAccess>> = {
  org_owner: grant("portal", "crm", "marketing", "team_workspace", "inventory", "hr", "accounting", "documents", "admin"),
  org_admin: grant("portal", "crm", "marketing", "team_workspace", "inventory", "hr", "accounting", "documents", "admin"),
  branch_manager: grant("portal", "crm", "marketing", "team_workspace", "inventory", "documents", "admin"),
  location_manager: grant("portal", "crm", "marketing", "team_workspace", "documents"),
  dispatcher: grant("portal", "crm", "team_workspace", "documents"),
  field_technician: grant("portal", "crm", "team_workspace", "documents"),
  installer: grant("portal", "crm", "team_workspace", "documents"),
  salesperson: grant("portal", "crm", "team_workspace", "documents"),
  accounting: grant("portal", "crm", "inventory", "accounting", "documents"),
  hr_manager: grant("portal", "team_workspace", "hr", "documents"),
};

export function appAccessForUser(user: AppUser): AppAccess {
  // Owner shortcut — full platform access.
  if (user.isOrgOwner) {
    return grant("portal", "crm", "marketing", "team_workspace", "inventory", "hr", "accounting", "documents", "admin");
  }

  // Explicit override on the user wins (portal stays forced-on).
  if (user.appAccess) {
    return { ...NONE, ...user.appAccess, portal: true };
  }

  // Otherwise union the defaults of every role the user holds.
  const out: AppAccess = { ...NONE };
  for (const a of user.assignments) {
    const def = ROLE_DEFAULTS[a.role];
    if (!def) continue;
    for (const key of Object.keys(def) as PlatformAppId[]) {
      if (def[key]) out[key] = true;
    }
  }
  return out;
}

export function hasAppAccess(user: AppUser, app: PlatformAppId): boolean {
  return appAccessForUser(user)[app];
}

// The access a user would have from their role(s) alone — i.e. ignoring any
// explicit per-user override. This is the baseline the directory + detail drawer
// diff against to decide whether an app is "inherited from the role" or a
// "Custom override". Resolved exactly like appAccessForUser's fallback path so a
// user with no override always matches their effective access.
export function roleDefaultAccess(user: AppUser): AppAccess {
  if (user.isOrgOwner) {
    return grant("portal", "crm", "marketing", "team_workspace", "inventory", "hr", "accounting", "documents", "admin");
  }
  const out: AppAccess = { ...NONE };
  for (const a of user.assignments) {
    const def = ROLE_DEFAULTS[a.role];
    if (!def) continue;
    for (const key of Object.keys(def) as PlatformAppId[]) {
      if (def[key]) out[key] = true;
    }
  }
  return out;
}

// True when the user's effective access differs from their role-derived default
// on any app — i.e. a manual override is in effect.
export function hasAppOverride(user: AppUser): boolean {
  if (user.isOrgOwner || !user.appAccess) return false;
  const base = roleDefaultAccess(user);
  const resolved = appAccessForUser(user);
  return (Object.keys(NONE) as PlatformAppId[]).some((app) => resolved[app] !== base[app]);
}
