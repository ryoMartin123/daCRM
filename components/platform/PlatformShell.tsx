"use client";

// ─── Platform shell ───────────────────────────────────────
// The chrome every non-CRM app renders inside: app sidebar + platform top bar +
// scrollable content. Also enforces app access for the *acting* user — if they
// (or the user being previewed via View-as) can't open this app, we show a
// locked state instead of the app, with a way back to the launcher.

import Link from "next/link";
import { Lock } from "lucide-react";
import PlatformSidebar from "@/components/platform/PlatformSidebar";
import PlatformTopBar from "@/components/platform/PlatformTopBar";
import AppSwitcher from "@/components/platform/AppSwitcher";
import AppLoadingOverlay from "@/components/platform/AppLoadingOverlay";
import { usePermissionContext } from "@/components/providers/PermissionProvider";
import { appAccessForUser } from "@/lib/platform/access";
import { appById, type PlatformAppId } from "@/lib/platform/apps";

export default function PlatformShell({
  appId,
  children,
}: {
  appId: PlatformAppId;
  children: React.ReactNode;
}) {
  const { actingUser } = usePermissionContext();
  const allowed = appAccessForUser(actingUser)[appId];
  const app = appById(appId);

  if (!allowed) {
    return (
      <div className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: "var(--bg-page)" }}>
        <div className="flex items-center gap-4 px-6 py-3 shrink-0" style={{ backgroundColor: "var(--topbar-bg)", borderBottom: "1px solid var(--topbar-border)" }}>
          <AppSwitcher />
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "var(--bg-surface-2)" }}>
              <Lock className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
            </div>
            <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
              No access to {app?.name}
            </h1>
            <p className="text-sm mt-1.5" style={{ color: "var(--text-muted)" }}>
              {actingUser.fullName} doesn&apos;t have permission to open this app. Switch apps or return to the launcher.
            </p>
            <Link
              href="/welcome"
              className="inline-block mt-5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: "var(--accent-text)" }}
            >
              Back to launcher
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--bg-page)" }}>
      <PlatformSidebar appId={appId} />
      <div className="flex flex-col flex-1 min-w-0">
        <PlatformTopBar />
        <main className="flex-1 overflow-y-auto" data-route-fade>{children}</main>
      </div>
      {/* Brief branded loader on app entry — holds, then fades out. */}
      <AppLoadingOverlay appId={appId} />
    </div>
  );
}
