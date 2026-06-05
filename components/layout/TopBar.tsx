import { Bell, ChevronUp } from "lucide-react";
import HierarchySelector from "@/components/layout/HierarchySelector";
import GlobalCreateMenu from "@/components/layout/GlobalCreateMenu";
import GlobalSearch from "@/components/layout/GlobalSearch";
import ViewAsMenu from "@/components/layout/ViewAsMenu";

export default function TopBar({ onHide }: { onHide?: () => void }) {
  return (
    <div
      className="flex items-center gap-4 px-6 py-3 shrink-0"
      style={{
        backgroundColor: "var(--topbar-bg)",
        borderBottom: "1px solid var(--topbar-border)",
      }}
    >
      {/* Left */}
      <div className="flex-1 min-w-0 flex items-center">
        <HierarchySelector />
      </div>

      {/* Center — search pinned to the middle of the bar */}
      <div className="w-full max-w-md shrink-0">
        <GlobalSearch />
      </div>

      {/* Right — actions */}
      <div className="flex-1 flex items-center justify-end gap-2">
        <ViewAsMenu />
        <button
          className="relative p-2 rounded-lg transition-colors hover:bg-[var(--bg-surface-2)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        <GlobalCreateMenu />
        {onHide && (
          <button onClick={onHide} title="Hide bar"
            className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-surface-2)]"
            style={{ color: "var(--text-muted)" }}>
            <ChevronUp className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
