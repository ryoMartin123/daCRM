"use client";

import { ChevronUp, ChevronDown } from "lucide-react";

// Number input with the CRM's own up/down chevron stepper instead of the browser's
// default spinner. String value to match the wizards' string-backed number fields.
// Optional inline prefix/suffix (e.g. "$", "%", "/hr") and a highlight border.
export default function NumberStepper({ value, onChange, min, max, step = 1, disabled, size = "md", className = "", placeholder, prefix, suffix, borderColor }: {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  placeholder?: string;
  prefix?: string;     // inline leading affix, e.g. "$"
  suffix?: string;     // inline trailing affix, e.g. "%" or "/hr"
  borderColor?: string; // override the default border (used for highlighted fields)
}) {
  const clamp = (n: number) => {
    if (min != null && n < min) n = min;
    if (max != null && n > max) n = max;
    return n;
  };
  const bump = (dir: 1 | -1) => onChange(String(clamp((parseFloat(value) || 0) + dir * step)));
  const affixText = size === "sm" ? "text-[11px]" : "text-xs";
  const padY = size === "sm" ? "py-1.5 text-xs" : "py-2 text-sm";
  const padL = prefix ? "pl-1.5" : (size === "sm" ? "pl-2.5" : "pl-3");
  const padR = suffix ? "pr-1.5" : (size === "sm" ? "pr-2.5" : "pr-3");

  return (
    <div className={`flex items-stretch rounded-lg overflow-hidden ${className}`}
      style={{ border: `1px solid ${borderColor ?? "var(--border)"}`, backgroundColor: "var(--bg-surface)", opacity: disabled ? 0.5 : 1 }}>
      {prefix && <span className={`flex items-center pl-2.5 ${affixText}`} style={{ color: "var(--text-muted)" }}>{prefix}</span>}
      <input type="number" inputMode="numeric" value={value} disabled={disabled} min={min} max={max} step={step} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={`no-spinner flex-1 min-w-0 outline-none bg-transparent ${padY} ${padL} ${padR}`} style={{ color: "var(--text-primary)" }} />
      {suffix && <span className={`flex items-center pr-1.5 ${affixText}`} style={{ color: "var(--text-muted)" }}>{suffix}</span>}
      <div className="flex flex-col shrink-0" style={{ borderLeft: "1px solid var(--border)" }}>
        <button type="button" tabIndex={-1} disabled={disabled} onClick={() => bump(1)} aria-label="Increase"
          className="flex-1 px-1.5 flex items-center justify-center transition-colors hover:bg-[var(--bg-surface-2)] disabled:cursor-not-allowed"
          style={{ color: "var(--text-muted)" }}><ChevronUp className="w-3 h-3" /></button>
        <button type="button" tabIndex={-1} disabled={disabled} onClick={() => bump(-1)} aria-label="Decrease"
          className="flex-1 px-1.5 flex items-center justify-center transition-colors hover:bg-[var(--bg-surface-2)] disabled:cursor-not-allowed"
          style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}><ChevronDown className="w-3 h-3" /></button>
      </div>
    </div>
  );
}
