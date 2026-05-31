"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Download, ChevronRight, FilePen, FileCheck, User, MapPin, Briefcase, FolderKanban, TrendingUp } from "lucide-react";
import { getQuote, fmt } from "@/lib/quotes/data";
import { QUOTE_STATUS_STYLE, type QuoteStatus } from "@/lib/quotes/types";
import { getCustomer } from "@/lib/customers/data";

const TABS = ["Details", "Notes", "History"];

// ─── Status action buttons per stage ─────────────────────
function StatusActions({
  status, onAction,
}: {
  status: QuoteStatus;
  onAction: (next: QuoteStatus | "convert") => void;
}) {
  if (status === "draft") return (
    <button onClick={() => onAction("sent")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
      style={{ backgroundColor: "#4f46e5", color: "#fff" }}>
      <FilePen className="w-3.5 h-3.5" /> Mark as Sent
    </button>
  );
  if (status === "sent") return (
    <>
      <button onClick={() => onAction("approved")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        style={{ backgroundColor: "#10b981", color: "#fff" }}>
        <FileCheck className="w-3.5 h-3.5" /> Mark Approved
      </button>
      <button onClick={() => onAction("rejected")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
        style={{ border: "1px solid #fecaca", color: "#dc2626" }}>
        Decline
      </button>
    </>
  );
  if (status === "approved") return (
    <button onClick={() => onAction("convert")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
      style={{ backgroundColor: "#4f46e5", color: "#fff" }}>
      Convert to Invoice →
    </button>
  );
  return null;
}

// ─── Line items table ─────────────────────────────────────
function LineItemsTable({ quoteId }: { quoteId: string }) {
  const quote = getQuote(quoteId)!;

  if (quote.lineItems.length === 0) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
        <div className="px-5 py-4 text-center">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No line items yet — add items to complete this quote.</p>
          {quote.internalNotes && (
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>{quote.internalNotes}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
      {/* Header */}
      <div className="grid px-5 py-3 text-[10px] font-semibold uppercase tracking-wider"
        style={{ gridTemplateColumns: "3fr 0.6fr 1fr 1fr", color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
        <span>Description</span><span className="text-right">Qty</span>
        <span className="text-right">Unit Price</span><span className="text-right">Total</span>
      </div>

      {quote.lineItems.map((item, i) => (
        <div key={item.id}
          className="grid px-5 py-3 items-start"
          style={{ gridTemplateColumns: "3fr 0.6fr 1fr 1fr", borderBottom: i < quote.lineItems.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
          <div>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>{item.description}</p>
            {item.notes && <p className="text-xs mt-0.5 italic" style={{ color: "var(--text-muted)" }}>{item.notes}</p>}
          </div>
          <p className="text-sm text-right" style={{ color: "var(--text-secondary)" }}>{item.quantity}</p>
          <p className="text-sm text-right" style={{ color: "var(--text-secondary)" }}>{fmt(item.unitPrice)}</p>
          <p className="text-sm text-right font-medium" style={{ color: "var(--text-primary)" }}>{fmt(item.total)}</p>
        </div>
      ))}

      {/* Totals */}
      <div className="px-5 py-4 space-y-2" style={{ borderTop: "2px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
        <div className="flex justify-between">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Subtotal</span>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{fmt(quote.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Tax</span>
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{fmt(quote.tax)}</span>
        </div>
        <div className="flex justify-between pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Total</span>
          <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{fmt(quote.total)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Details tab ──────────────────────────────────────────
function DetailsTab({ id }: { id: string }) {
  const quote    = getQuote(id)!;
  const customer = getCustomer(quote.customerId);
  const stageConfig = QUOTE_STATUS_STYLE[quote.status];

  const LinkedIcon = quote.linkedType === "job" ? Briefcase
    : quote.linkedType === "project" ? FolderKanban
    : quote.linkedType === "lead" ? TrendingUp
    : ChevronRight;

  const linkedHref = quote.linkedType === "job"     ? `/jobs/${quote.linkedId}`
    : quote.linkedType === "project"  ? `/projects/${quote.linkedId}`
    : quote.linkedType === "lead"     ? `/leads/${quote.linkedId}`
    : "#";

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* ── Left ─────────────────────────────────── */}
      <div className="space-y-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Quote Info</p>
          <div className="space-y-2.5">
            <div className="flex justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>Status</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: stageConfig.bg, color: stageConfig.color }}>{stageConfig.label}</span>
            </div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>Total</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{quote.total > 0 ? fmt(quote.total) : "TBD"}</span>
            </div>
            {quote.expiresAt && (
              <div className="flex justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>Expires</span>
                <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{quote.expiresAt}</span>
              </div>
            )}
            {quote.approvedAt && (
              <div className="flex justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>Approved</span>
                <span className="text-xs font-medium text-emerald-600">{quote.approvedAt}</span>
              </div>
            )}
            <div className="flex justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>Created</span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{quote.createdAt}</span>
            </div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>Prepared by</span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{quote.createdBy}</span>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Customer</p>
          {customer ? (
            <Link href={`/customers/${customer.id}`} className="flex items-start gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{customer.initials}</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{customer.name}</p>
                {customer.phone && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{customer.phone}</p>}
                <p className="text-[10px] mt-1" style={{ color: "#4f46e5" }}>View account →</p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-[10px] font-bold shrink-0">{quote.customerInitials}</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{quote.customerName}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Prospect — not yet a customer</p>
              </div>
            </div>
          )}
        </div>

        {/* Linked record */}
        {quote.linkedLabel && (
          <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Linked To</p>
            <Link href={linkedHref} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <LinkedIcon className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{quote.linkedLabel}</p>
                <p className="text-[10px] mt-0.5 capitalize" style={{ color: "var(--text-muted)" }}>{quote.linkedType}</p>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
            </Link>
          </div>
        )}
      </div>

      {/* ── Right ────────────────────────────────── */}
      <div className="col-span-2">
        <LineItemsTable quoteId={id} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState("Details");
  const [quote, setQuote] = useState(() => getQuote(id));

  if (!quote) {
    return (
      <div className="p-6">
        <Link href="/quotes" className="flex items-center gap-1.5 text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Quotes
        </Link>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Quote not found.</p>
      </div>
    );
  }

  const stageConfig = QUOTE_STATUS_STYLE[quote.status];

  function handleAction(next: QuoteStatus | "convert") {
    if (next === "convert") {
      alert(`Conversion to invoice will be wired when Supabase is connected.\nQuote ${quote!.quoteNumber} is approved and ready to convert.`);
      return;
    }
    setQuote(q => q ? { ...q, status: next } : q);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div style={{ backgroundColor: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/quotes" className="flex items-center gap-1.5 text-sm shrink-0" style={{ color: "var(--text-secondary)" }}>
              <ArrowLeft className="w-4 h-4" /> Quotes
            </Link>
            <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--border)" }} />
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <FilePen className="w-4.5 h-4.5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base font-semibold font-mono" style={{ color: "var(--text-primary)" }}>{quote.quoteNumber}</h1>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: stageConfig.bg, color: stageConfig.color }}>{stageConfig.label}</span>
                  {quote.total > 0 && (
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(quote.total)}</span>
                  )}
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                  {quote.title} · {quote.customerName}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusActions status={quote.status} onAction={handleAction} />
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
              style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        <div className="flex items-center gap-0.5 px-6">
          {TABS.map(t => {
            const active = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)}
                className="relative px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap"
                style={{ color: active ? "#4f46e5" : "var(--text-muted)" }}>
                {t}
                {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-indigo-600" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: "var(--bg-page)" }}>
        {tab === "Details" && <DetailsTab id={id} />}
        {tab === "Notes" && (
          <div className="max-w-xl rounded-xl p-8 text-center" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Notes</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Coming in Phase 2</p>
          </div>
        )}
        {tab === "History" && (
          <div className="max-w-xl rounded-xl p-8 text-center" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Activity History</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Coming in Phase 2</p>
          </div>
        )}
      </div>
    </div>
  );
}
