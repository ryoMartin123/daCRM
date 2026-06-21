"use client";

// ─── Platform top bar ─────────────────────────────────────
// Shared top bar for apps on the PlatformShell. Carries the app switcher,
// a (placeholder) global search, the View-as menu (the app-access tester), and
// a notifications stub. The CRM keeps its own fuller top bar; this one is
// deliberately lighter for the not-yet-built apps.

import { Search, Bell } from "lucide-react";
import AppSwitcher from "@/components/platform/AppSwitcher";
import HierarchySelector from "@/components/layout/HierarchySelector";
import ViewAsMenu from "@/components/layout/ViewAsMenu";

export default function PlatformTopBar() {
  return (
    <div
      className="flex items-center gap-4 px-6 py-3 shrink-0"
      style={{ backgroundColor: "var(--topbar-bg)", borderBottom: "1px solid var(--topbar-border)" }}
    >
      {/* Left — app switcher + permission-aware context selector. The selector
          self-hides on apps that don't filter by company/location (Portal, Admin). */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        <AppSwitcher />
        <HierarchySelector />
      </div>

      {/* Center — search placeholder */}
      <div className="shrink-0 w-[24rem] max-w-full">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="truncate">Search…</span>
        </div>
      </div>

      {/* Right — actions */}
      <div className="flex-1 flex items-center justify-end gap-2">
        <ViewAsMenu />
        <button
          className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-surface-2)]"
          style={{ color: "var(--text-muted)" }}
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
