"use client";

import Link from "next/link";
import { FilePen, ExternalLink } from "lucide-react";
import { ALL_QUOTES, fmt } from "@/lib/quotes/data";
import { useHierarchy } from "@/components/providers/HierarchyProvider";

export default function QuotesFollowUp() {
  const { effectiveCompanyId, effectiveLocationId } = useHierarchy();

  const quotes = ALL_QUOTES
    .filter(q => q.status === "sent")
    .filter(q => !effectiveCompanyId  || q.companyId  === effectiveCompanyId)
    .filter(q => !effectiveLocationId || q.locationId === effectiveLocationId)
    .slice(0, 4);

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <FilePen className="w-4 h-4" style={{ color: "#6d28d9" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Quotes — Follow-Up</h2>
          {quotes.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "#ede9fe", color: "#5b21b6" }}>{quotes.length}</span>
          )}
        </div>
        <Link href="/quotes?tab=sent" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
          View all <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="px-4 py-6 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>All quotes actioned — great work.</p>
        </div>
      ) : (
        <div>
          {quotes.map((q, i) => (
            <Link key={q.id} href={`/quotes/${q.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-surface-2)] transition-colors"
              style={{ borderBottom: i < quotes.length - 1 ? "1px solid var(--border-subtle)" : "none", textDecoration: "none" }}>
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600 shrink-0">
                {q.customerInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{q.customerName}</p>
                <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{q.title}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  {q.total > 0 ? fmt(q.total) : "TBD"}
                </p>
                {q.expiresAt && (
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Exp {q.expiresAt}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
