// CRM & Jobs — a customer record: header with lifetime value, the tabbed detail,
// and the connected jobs/estimates with live statuses.

import { Building2, Phone, Mail, MapPin } from "lucide-react";

const ROWS = [
  { ref: "JOB-2041", title: "Rooftop unit replacement", date: "Jun 24", amt: "$8,420", status: "Scheduled", color: "#2563eb" },
  { ref: "EST-1188", title: "Annual maintenance plan", date: "Jun 18", amt: "$1,260", status: "Approved", color: "#16a34a" },
  { ref: "JOB-2009", title: "Emergency no-cool call", date: "Jun 02", amt: "$640", status: "Invoiced", color: "#059669" },
  { ref: "EST-1140", title: "Ductwork inspection", date: "May 27", amt: "$3,900", status: "Sent", color: "#f59e0b" },
];

export default function CrmMockup() {
  return (
    <div className="h-[400px] overflow-hidden text-left" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* Record header */}
      <div className="p-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-start gap-3">
          <span className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-soft-bg)" }}><Building2 className="w-6 h-6" style={{ color: "var(--accent-text)" }} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Atlas Plaza Management</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--accent-soft-2-bg)", color: "var(--accent-text-strong)" }}>Commercial</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> (706) 555-0148</span>
              <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> ops@atlasplaza.com</span>
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Augusta, GA</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5 mt-3">
          {[["Lifetime value", "$84,210"], ["Open estimates", "2"], ["Agreements", "Active"]].map(([l, v]) => (
            <div key={l} className="rounded-lg px-3 py-2" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{v}</p>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 pt-2.5">
        {["Jobs & Estimates", "Photos", "Agreements", "Timeline"].map((t, i) => (
          <span key={t} className="px-2.5 py-1.5 rounded-md text-[11px] font-medium" style={i === 0 ? { backgroundColor: "var(--warning-soft-2-bg)", color: "var(--warning-text)" } : { color: "var(--text-muted)" }}>{t}</span>
        ))}
      </div>

      {/* Table */}
      <div className="px-4 pt-2">
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
          {ROWS.map((r, i) => (
            <div key={r.ref} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-3 py-2.5" style={{ backgroundColor: "var(--bg-surface)", borderTop: i ? "1px solid var(--border-subtle)" : "none" }}>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-surface-2)", color: "var(--text-muted)" }}>{r.ref}</span>
              <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{r.title}</span>
              <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{r.amt}</span>
              <span className="text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap" style={{ backgroundColor: r.color + "22", color: r.color }}>{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
