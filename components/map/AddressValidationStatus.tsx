"use client";

// ─── AddressValidationStatus ──────────────────────────────
// Small reusable badge for a record's Google address-validation state. Surfaces
// an "Address needs review" warning when confidence is low/unverified, so map &
// dispatch views can flag records that aren't reliably map-ready. Pairs with the
// ParsedAddress.validationStatus produced by AddressAutocomplete.

import { CheckCircle, AlertTriangle, HelpCircle } from "lucide-react";
import type { AddressValidationStatus as Status } from "@/lib/address/types";

const CONFIG: Record<Status, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  validated:      { label: "Verified",            color: "#047857", bg: "#10b98122", icon: CheckCircle },
  inferred:       { label: "Auto-corrected",      color: "#047857", bg: "#10b98122", icon: CheckCircle },
  user_confirmed: { label: "Confirmed",           color: "#047857", bg: "#10b98122", icon: CheckCircle },
  skipped:        { label: "Address needs review", color: "#b45309", bg: "#f59e0b22", icon: AlertTriangle },
  unvalidated:    { label: "Not verified",        color: "#6b7280", bg: "var(--bg-surface-2)", icon: HelpCircle },
};

export default function AddressValidationStatus({ status, className = "" }: { status: Status; className?: string }) {
  const c = CONFIG[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${className}`} style={{ backgroundColor: c.bg, color: c.color }}>
      <Icon className="w-3 h-3" /> {c.label}
    </span>
  );
}
