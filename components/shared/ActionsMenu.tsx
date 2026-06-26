"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Our own "more actions" mark instead of the generic vertical kebab: a small
// tri-dot constellation with the top node in the CRM indigo as a focal accent.
// One distinctive, branded affordance shared across every record detail header.
function MoreActionsGlyph({ className, accent }: { className?: string; accent: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <circle cx="8" cy="3.9" r="1.9" fill={accent ? "currentColor" : "#4f46e5"} />
      <circle cx="4.3" cy="11" r="1.55" fill="currentColor" />
      <circle cx="11.7" cy="11" r="1.55" fill="currentColor" />
    </svg>
  );
}

export interface ActionItem {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  // Renders a divider ABOVE this item (e.g. to separate destructive actions).
  separated?: boolean;
}

// A "⋮" trigger that opens a dropdown of every action available for the current
// record. One consistent affordance across job / project / lead / customer
// detail headers. Falsy entries are ignored so callers can inline-conditional.
export default function ActionsMenu({ actions, label = "Actions" }: {
  actions: (ActionItem | false | null | undefined)[];
  label?: string;
}) {
  const items = actions.filter(Boolean) as ActionItem[];
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={label} aria-haspopup="menu" aria-expanded={open}
        className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-[var(--bg-surface-2)]"
        style={{ border: `1px solid ${open ? "#4f46e5" : "var(--border)"}`, color: open ? "#4f46e5" : "var(--text-secondary)" }}
      >
        <MoreActionsGlyph className="w-4 h-4" accent={open} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl overflow-hidden py-1"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}>
          {items.map((it, i) => {
            const cls = "flex items-center gap-2.5 w-full px-3 py-2 text-sm text-left transition-colors";
            const color = it.danger ? "#dc2626" : "var(--text-primary)";
            const hover = it.danger ? "hover:bg-red-50" : "hover:bg-[var(--bg-surface-2)]";
            const Icon = it.icon;
            const body = (
              <>
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate">{it.label}</span>
              </>
            );
            return (
              <div key={it.label}>
                {(it.separated && i > 0) && <div className="my-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />}
                {it.href ? (
                  <Link href={it.href} onClick={() => setOpen(false)} className={`${cls} ${hover}`} style={{ color }} role="menuitem">
                    {body}
                  </Link>
                ) : (
                  <button onClick={() => { setOpen(false); it.onClick?.(); }} className={`${cls} ${hover}`} style={{ color }} role="menuitem">
                    {body}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
