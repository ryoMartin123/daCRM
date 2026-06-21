// ─── App loading screen ───────────────────────────────────
// The Suspense fallback each app's loading.tsx renders during navigation, so
// switching apps fades through a calm branded screen instead of an abrupt swap.
// Pure CSS animation (no client hooks) — matches the CRM's minimal Loader2 style
// and theme tokens. Pass an appId to show that app's icon + accent.

import { Loader2 } from "lucide-react";
import { appById, type PlatformAppId } from "@/lib/platform/apps";

export default function AppLoading({ appId, label }: { appId?: PlatformAppId; label?: string }) {
  const app = appId ? appById(appId) : undefined;
  const Icon = app?.icon;
  const accent = app?.accent ?? "var(--accent-text)";
  const name = label ?? app?.name;

  return (
    <div
      className="h-full w-full min-h-[60vh] flex items-center justify-center"
      style={{ backgroundColor: "var(--bg-page)" }}
    >
      <div className="flex flex-col items-center gap-5">
        {Icon ? (
          <span
            className="app-loading-pulse w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: accent + "1f" }}
          >
            <Icon className="w-7 h-7" style={{ color: accent }} />
          </span>
        ) : (
          <span className="app-loading-pulse w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--bg-surface-2)" }}>
            <Loader2 className="w-7 h-7 animate-spin" style={{ color: "var(--text-muted)" }} />
          </span>
        )}
        <div className="flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--text-muted)" }} />
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {name ? `Loading ${name}…` : "Loading…"}
          </span>
        </div>
      </div>
    </div>
  );
}
