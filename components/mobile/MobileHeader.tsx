"use client";

// ─── Mobile header ────────────────────────────────────────
// Slim, calm top bar (not a dense desktop toolbar). Optional back button and a
// single right-side action. Pads into the status-bar safe area.

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function MobileHeader({ title, subtitle, back, right, sticky = true }: {
  title: string; subtitle?: string; back?: boolean; right?: React.ReactNode; sticky?: boolean;
}) {
  const router = useRouter();
  return (
    <header className={sticky ? "sticky top-0 z-30" : ""}
      style={{ backgroundColor: "var(--bg-page)", paddingTop: "max(env(safe-area-inset-top), 0.5rem)" }}>
      <div className="flex items-center gap-2 px-4 pb-2 min-h-[44px]">
        {back && (
          <button onClick={() => router.back()} className="-ml-2 p-1.5 rounded-full active:bg-[var(--bg-surface-2)]" aria-label="Back">
            <ChevronLeft className="w-6 h-6" style={{ color: "var(--text-primary)" }} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-tight truncate" style={{ color: "var(--text-primary)" }}>{title}</h1>
          {subtitle && <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
        </div>
        {right}
      </div>
    </header>
  );
}
