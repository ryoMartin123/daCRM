"use client";

import React, { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, Download, ChevronRight, Receipt, DollarSign, Briefcase, FolderKanban, FilePen } from "lucide-react";
import { getInvoice, getQuote, fmt } from "@/lib/quotes/data";
import { INVOICE_STATUS_STYLE, type InvoiceStatus } from "@/lib/quotes/types";
import { getCustomer } from "@/lib/customers/data";

const TABS = ["Details", "Notes", "History"];

// ─── Status action buttons ────────────────────────────────
function StatusActions({
  status, onAction,
}: {
  status: InvoiceStatus;
  onAction: (next: InvoiceStatus | "payment") => void;
}) {
  if (status === "draft") return (
    <button onClick={() => onAction("sent")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
      style={{ backgroundColor: "#4f46e5", color: "#fff" }}>
      <Receipt className="w-3.5 h-3.5" /> Send Invoice
    </button>
  );
  if (status === "sent" || status === "partially_paid" || status === "past_due") return (
    <button onClick={() => onAction("payment")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
      style={{ backgroundColor: "#10b981", color: "#fff" }}>
      <DollarSign className="w-3.5 h-3.5" /> Record Payment
    </button>
  );
  return null;
}

// ─── Line items table ─────────────────────────────────────
function LineItemsTable({ invoiceId }: { invoiceId: string }) {
  const invoice = getInvoice(invoiceId)!;

  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
      {/* Header */}
      <div className="grid px-5 py-3 text-[10px] font-semibold uppercase tracking-wider"
        style={{ gridTemplateColumns: "3fr 0.6fr 1fr 1fr", color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
        <span>Description</span><span className="text-right">Qty</span>
        <span className="text-right">Unit Price</span><span className="text-right">Total</span>
      </div>

      {invoice.lineItems.map((item, i) => (
        <div key={item.id} className="grid px-5 py-3 items-start"
          style={{ gridTemplateColumns: "3fr 0.6fr 1fr 1fr", borderBottom: i < invoice.lineItems.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
          <div>
            <p className="text-sm" style={{ color: "var(--text-primary)" }}>{item.description}</p>
            {item.notes && <p className="text-xs mt-0.5 italic" style={{ color: "var(--text-muted)" }}>{item.notes}</p>}
          </div>
          <p className="text-sm text-right" style={{ color: "var(--text-secondary)" }}>{item.quantity}</p>
          <p className="text-sm text-right" style={{ color: "var(--text-secondary)" }}>{fmt(item.unitPrice)}</p>
          <p className="text-sm text-right font-medium" style={{ color: "var(--text-primary)" }}>{fmt(item.total)}</p>
        </div>
      ))}

      {/* Payment summary */}
      <div className="px-5 py-4 space-y-2" style={{ borderTop: "2px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
        <div className="flex justify-between">
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Subtotal</span>
          <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{fmt(invoice.subtotal)}</span>
        </div>
        {invoice.tax > 0 && (
          <div className="flex justify-between">
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Tax</span>
            <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{fmt(invoice.tax)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Total</span>
          <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{fmt(invoice.total)}</span>
        </div>
        {invoice.paidAt && (
          <div className="flex justify-between">
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Paid {invoice.paidAt}</span>
            <span className="text-sm font-semibold text-emerald-600">–{fmt(invoice.total)}</span>
          </div>
        )}
        <div className="flex justify-between pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Balance Due</span>
          <span className="text-lg font-bold"
            style={{ color: invoice.balanceDue > 0 ? (invoice.status === "past_due" ? "#dc2626" : "var(--text-primary)") : "#10b981" }}>
            {invoice.balanceDue > 0 ? fmt(invoice.balanceDue) : "Paid in Full"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Details tab ──────────────────────────────────────────
function DetailsTab({ id }: { id: string }) {
  const invoice  = getInvoice(id)!;
  const customer = getCustomer(invoice.customerId);
  const sourceQuote = invoice.quoteId ? getQuote(invoice.quoteId) : null;
  const stageConfig = INVOICE_STATUS_STYLE[invoice.status];
  const isOverdue   = invoice.status === "past_due";

  const LinkedIcon = invoice.linkedType === "job" ? Briefcase
    : invoice.linkedType === "project" ? FolderKanban
    : invoice.linkedType === "quote" ? FilePen
    : ChevronRight;

  const linkedHref = invoice.linkedType === "job"     ? `/jobs/${invoice.linkedId}`
    : invoice.linkedType === "project"  ? `/projects/${invoice.linkedId}`
    : invoice.linkedType === "quote"    ? `/quotes/${invoice.linkedId}`
    : "#";

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* ── Left ─────────────────────────────────── */}
      <div className="space-y-4">
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Invoice Info</p>
          <div className="space-y-2.5">
            <div className="flex justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>Status</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: stageConfig.bg, color: stageConfig.color }}>{stageConfig.label}</span>
            </div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>Total</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(invoice.total)}</span>
            </div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>Balance Due</span>
              <span className="text-sm font-semibold"
                style={{ color: invoice.balanceDue > 0 ? (isOverdue ? "#dc2626" : "var(--text-primary)") : "#10b981" }}>
                {invoice.balanceDue > 0 ? fmt(invoice.balanceDue) : "Paid"}
              </span>
            </div>
            <div className="flex justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>Due Date</span>
              <span className="text-xs font-medium" style={{ color: isOverdue ? "#dc2626" : "var(--text-primary)" }}>
                {invoice.dueDate}{isOverdue ? " ⚠" : ""}
              </span>
            </div>
            {invoice.paidAt && (
              <div className="flex justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>Paid</span>
                <span className="text-xs font-medium text-emerald-600">{invoice.paidAt}</span>
              </div>
            )}
            <div className="flex justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>Created</span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{invoice.createdAt}</span>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Customer</p>
          {customer ? (
            <Link href={`/customers/${customer.id}`} className="flex items-start gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{customer.initials}</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{customer.name}</p>
                {customer.phone && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{customer.phone}</p>}
                <p className="text-[10px] mt-1" style={{ color: "#4f46e5" }}>View account →</p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0">{invoice.customerInitials}</div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{invoice.customerName}</p>
            </div>
          )}
        </div>

        {/* Source quote */}
        {sourceQuote && (
          <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>From Quote</p>
            <Link href={`/quotes/${sourceQuote.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                <FilePen className="w-4 h-4 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{sourceQuote.quoteNumber}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{sourceQuote.title}</p>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
            </Link>
          </div>
        )}

        {/* Linked record */}
        {invoice.linkedLabel && invoice.linkedType !== "quote" && (
          <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Linked To</p>
            <Link href={linkedHref} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <LinkedIcon className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{invoice.linkedLabel}</p>
                <p className="text-[10px] capitalize" style={{ color: "var(--text-muted)" }}>{invoice.linkedType}</p>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
            </Link>
          </div>
        )}
      </div>

      {/* ── Right ────────────────────────────────── */}
      <div className="col-span-2">
        <LineItemsTable invoiceId={id} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState("Details");
  const [invoice, setInvoice] = useState(() => getInvoice(id));

  if (!invoice) {
    return (
      <div className="p-6">
        <Link href="/invoices" className="flex items-center gap-1.5 text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </Link>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Invoice not found.</p>
      </div>
    );
  }

  const stageConfig = INVOICE_STATUS_STYLE[invoice.status];
  const isOverdue   = invoice.status === "past_due";

  function handleAction(next: InvoiceStatus | "payment") {
    if (next === "payment") {
      alert(`Payment recording will be wired when Supabase is connected.\nRecord a payment against ${invoice!.invoiceNumber}.`);
      return;
    }
    setInvoice(i => i ? { ...i, status: next } : i);
  }

  return (
    <div className="flex flex-col h-full">
      <div style={{ backgroundColor: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link href="/invoices" className="flex items-center gap-1.5 text-sm shrink-0" style={{ color: "var(--text-secondary)" }}>
              <ArrowLeft className="w-4 h-4" /> Invoices
            </Link>
            <div className="w-px h-5 shrink-0" style={{ backgroundColor: "var(--border)" }} />
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <Receipt className="w-4.5 h-4.5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base font-semibold font-mono" style={{ color: "var(--text-primary)" }}>{invoice.invoiceNumber}</h1>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: stageConfig.bg, color: stageConfig.color }}>{stageConfig.label}</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(invoice.total)}</span>
                  {invoice.balanceDue > 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: isOverdue ? "#fee2e2" : "#fef3c7", color: isOverdue ? "#991b1b" : "#92400e" }}>
                      {fmt(invoice.balanceDue)} due
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                  {invoice.customerName} · Due {invoice.dueDate}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusActions status={invoice.status} onAction={handleAction} />
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
        {(tab === "Notes" || tab === "History") && (
          <div className="max-w-xl rounded-xl p-8 text-center" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{tab}</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Coming in Phase 2</p>
          </div>
        )}
      </div>
    </div>
  );
}
