"use client";

// ─── Platform app sidebar ─────────────────────────────────
// Generic, nav-driven sidebar used by every app on the PlatformShell (Portal, HR,
// Accounting, Documents, Admin). The CRM keeps its own richer Sidebar. Active
// state is optimistic (mirrors the CRM sidebar) so the highlight doesn't lag the
// route transition.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { organization } from "@/lib/hierarchy/data";
import { usePermissionContext } from "@/components/providers/PermissionProvider";
import { getRoleLabel } from "@/lib/roles/store";
import { appById, type PlatformAppId } from "@/lib/platform/apps";
import { APP_NAV } from "@/lib/platform/nav";

export default function PlatformSidebar({ appId }: { appId: PlatformAppId }) {
  const pathname = usePathname();
  const { actingUser } = usePermissionContext();
  const app = appById(appId);
  const items = APP_NAV[appId] ?? [];

  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => setPending(null), [pathname]);
  const activeHref = pending ?? pathname;
  // Exact match for the index; prefix match for sub-pages.
  const isActive = (href: string) =>
    href === app?.href ? activeHref === href : activeHref === href || activeHref.startsWith(href + "/");

  const role = actingUser.isOrgOwner
    ? "Owner"
    : actingUser.assignments[0]
      ? getRoleLabel(actingUser.assignments[0].role)
      : "Member";

  const Icon = app?.icon;

  return (
    <div className="flex flex-col shrink-0 w-60" style={{ backgroundColor: "var(--sidebar-bg)" }}>
      {/* App header */}
      <div className="flex items-center gap-2.5 px-4 py-4" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        {Icon && (
          <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: (app?.accent ?? "#6366f1") + "26" }}>
            <Icon className="w-5 h-5" style={{ color: app?.accent }} />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight truncate" style={{ color: "var(--sidebar-text-active)" }}>
            {app?.name}
          </p>
          <p className="text-xs truncate" style={{ color: "var(--sidebar-text)" }}>{organization.name}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto thin-scroll-y py-3 px-2">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setPending(item.href)}
              className="flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm mb-0.5 transition-colors"
              style={{
                backgroundColor: active ? "var(--sidebar-item-active)" : "transparent",
                color: active ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
              }}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="py-3 px-3" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
            {actingUser.initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: "var(--sidebar-text-active)" }}>{actingUser.fullName}</p>
            <p className="text-xs truncate" style={{ color: "var(--sidebar-text)" }}>{role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
