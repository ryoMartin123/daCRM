"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Check } from "lucide-react";

// Themed time picker — a scrollable list of slots matching the Select dropdown.
// Value is an "HH:MM" 24h string (drop-in for a native <input type="time">).
interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: "sm" | "md";
  className?: string;
  minuteStep?: number;
  startHour?: number;
  endHour?: number;
}

function fmt12(hhmm: string): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  if (isNaN(h)) return "";
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m ?? 0).padStart(2, "0")} ${period}`;
}

export default function TimePicker({ value, onChange, placeholder = "Select time", size = "md", className, minuteStep = 15, startHour = 6, endHour = 21 }: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    // Bring the selected slot into view.
    requestAnimationFrame(() => selRef.current?.scrollIntoView({ block: "center" }));
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const options: string[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += minuteStep) {
      if (h === endHour && m > 0) break;
      options.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }

  const pad = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm";

  return (
    <div ref={wrapRef} className={`relative ${className ?? "w-full"}`}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 rounded-lg outline-none transition-colors ${pad}`}
        style={{
          border: `1px solid ${open ? "#a5b4fc" : "var(--border)"}`,
          backgroundColor: "var(--bg-surface)",
          color: value ? "var(--text-primary)" : "var(--text-muted)",
          boxShadow: open ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
        }}>
        <span className="truncate text-left">{value ? fmt12(value) : placeholder}</span>
        <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1.5 p-1 rounded-xl overflow-y-auto thin-scroll-y"
          style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 12px 32px rgba(0,0,0,0.16)", maxHeight: "240px" }}
          role="listbox">
          {options.map(o => {
            const isSel = o === value;
            return (
              <button key={o} ref={isSel ? selRef : undefined} type="button" onClick={() => { onChange(o); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-sm transition-colors ${isSel ? "" : "hover:bg-[var(--bg-surface-2)]"}`}
                style={{ backgroundColor: isSel ? "var(--bg-surface-2)" : undefined, color: isSel ? "#4f46e5" : "var(--text-secondary)", fontWeight: isSel ? 600 : 400 }}>
                <span>{fmt12(o)}</span>
                {isSel && <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#4f46e5" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
