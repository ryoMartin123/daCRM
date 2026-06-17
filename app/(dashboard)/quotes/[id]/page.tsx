"use client";

import React, { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Pencil, Eye, Copy, ChevronRight, ChevronDown, FileCheck,
  Briefcase, FolderKanban, TrendingUp, Send, X, Download, Printer, Archive, ArchiveRestore,
  Trash2, RotateCcw, Link2, RefreshCw, XCircle, Clock, Receipt,
  FileText, Tag, DollarSign, CheckCircle, Calendar, MapPin, User, MessageSquare,
} from "lucide-react";
import HoverInfo, { Pill } from "@/components/shared/HoverInfo";
import {
  getQuote, fmt, duplicateQuote, updateQuoteStatus, convertQuoteToJob, convertQuoteToProject,
  setQuoteNotes, getQuoteActivity, reopenQuote, resendQuote, archiveQuote, unarchiveQuote, deleteQuote,
  createInvoiceFromQuote, type QuoteRecord, type QuoteActivityKind,
} from "@/lib/quotes/data";
import { downloadProposalPdf } from "@/lib/quotes/proposalPdf";
import { proposalDocFromQuote } from "@/lib/quotes/proposalDoc";
import { QUOTE_STATUS_STYLE, type QuoteStatus } from "@/lib/quotes/types";
import { getCustomer } from "@/lib/customers/data";
import ProposalDocument from "@/components/quotes/ProposalDocument";
import Commentable from "@/components/comments/Commentable";
import DetailTabs from "@/components/shared/DetailTabs";
import StatusBadge from "@/components/shared/StatusBadge";

const TABS = ["Details", "Notes", "Activity"];

// Per-event icon + accent for the activity timeline (mirrors the lead/agreement
// activity styling). Amber is the default accent; completions are green, the
// rejection is red, status changes are indigo.
const QUOTE_KIND_META: Record<QuoteActivityKind, { icon: typeof Send; color: string; label: string }> = {
  created:    { icon: FileText,      color: "#d97706", label: "Created" },
  duplicated: { icon: Copy,          color: "#d97706", label: "Duplicated" },
  status:     { icon: RefreshCw,     color: "#4f46e5", label: "Status" },
  sent:       { icon: Send,          color: "#d97706", label: "Sent" },
  approved:   { icon: FileCheck,     color: "#059669", label: "Approved" },
  rejected:   { icon: XCircle,       color: "#b91c1c", label: "Rejected" },
  converted:  { icon: Briefcase,     color: "#059669", label: "Converted" },
  note:       { icon: MessageSquare, color: "#6b7280", label: "Note" },
  edited:     { icon: Pencil,        color: "#d97706", label: "Edited" },
};

// ─── Status-driven action bar ─────────────────────────────
// Visible buttons = the primary actions for the quote's current status; every
// other (uncommon / risky) action lives under More, with destructive actions
// (Archive, Delete) below a divider at the bottom.
type LucideIcon = typeof Send;
type MenuEntry = { label: string; icon: LucideIcon; onClick: () => void; danger?: boolean } | "divider";
type PrimaryBtn = { label: string; icon: LucideIcon; onClick: () => void; color: string; iconOnly?: boolean };

interface ActionHandlers {
  status: QuoteStatus;
  onPreview: () => void;
  onSend: () => void;
  onApprove: () => void;
  onReject: () => void;
  onExpire: () => void;
  onReopen: () => void;
  onResend: () => void;
  onDuplicate: () => void;
  onConvertJob: () => void;
  onConvertProject: () => void;
  onCreateInvoice: () => void;
  onDownloadPdf: () => void;
  onPrint: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  archived?: boolean;
}

function QuoteActionBar(h: ActionHandlers) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function copyLink() {
    try { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  }

  // Reusable menu entries
  const PREVIEW: MenuEntry = { label: "Preview", icon: Eye, onClick: h.onPreview };
  const EDIT: MenuEntry = { label: "Edit", icon: Pencil, onClick: h.onEdit };
  const DUP:  MenuEntry = { label: "Duplicate", icon: Copy, onClick: h.onDuplicate };
  const PDF:  MenuEntry = { label: "Download PDF", icon: Download, onClick: h.onDownloadPdf };
  const PRINT: MenuEntry = { label: "Print", icon: Printer, onClick: h.onPrint };
  const COPY: MenuEntry = { label: copied ? "Link copied ✓" : "Copy Quote Link", icon: Link2, onClick: copyLink };
  const ARCH: MenuEntry = h.archived
    ? { label: "Unarchive", icon: ArchiveRestore, onClick: h.onUnarchive }
    : { label: "Archive", icon: Archive, onClick: h.onArchive };
  const DEL:  MenuEntry = { label: "Delete", icon: Trash2, onClick: h.onDelete, danger: true };

  let primary: PrimaryBtn[] = [];
  let menu: MenuEntry[] = [];

  switch (h.status) {
    case "draft":
      primary = [{ label: "Send Quote", icon: Send, onClick: h.onSend, color: "#4f46e5" }];
      menu = [PREVIEW, EDIT, DUP, PDF, PRINT, "divider", ARCH, DEL];
      break;
    case "sent":
    case "viewed":
      primary = [{ label: "Mark Approved", icon: FileCheck, onClick: h.onApprove, color: "#10b981" }];
      menu = [
        PREVIEW, EDIT, DUP,
        { label: "Resend Quote", icon: RefreshCw, onClick: h.onResend },
        COPY, PDF, PRINT,
        { label: "Mark Rejected", icon: XCircle, onClick: h.onReject },
        { label: "Mark Expired", icon: Clock, onClick: h.onExpire },
        "divider", ARCH, DEL,
      ];
      break;
    case "approved":
      primary = [{ label: "Convert to Job", icon: Briefcase, onClick: h.onConvertJob, color: "#4f46e5" }];
      menu = [
        PREVIEW, DUP, PDF, PRINT, COPY,
        { label: "Convert to Project", icon: FolderKanban, onClick: h.onConvertProject },
        { label: "Create Invoice", icon: Receipt, onClick: h.onCreateInvoice },
        "divider", ARCH,
      ];
      break;
    case "converted":
      primary = [];
      menu = [
        PREVIEW, DUP, PDF, PRINT, COPY,
        { label: "Create Invoice", icon: Receipt, onClick: h.onCreateInvoice },
        "divider", ARCH,
      ];
      break;
    case "rejected":
    case "expired":
      primary = [{ label: "Duplicate", icon: Copy, onClick: h.onDuplicate, color: "#4f46e5" }];
      menu = [
        PREVIEW,
        { label: "Reopen as Draft", icon: RotateCcw, onClick: h.onReopen },
        PDF, PRINT, "divider", ARCH, DEL,
      ];
      break;
  }

  return (
    <div className="flex items-center gap-2">
      {primary.map(p => (
        <button key={p.label} onClick={p.onClick} title={p.iconOnly ? p.label : undefined}
          className={`flex items-center gap-1.5 py-1.5 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90 ${p.iconOnly ? "px-2" : "px-3"}`}
          style={{ backgroundColor: p.color }}>
          <p.icon className="w-3.5 h-3.5" /> {!p.iconOnly && p.label}
        </button>
      ))}
      <div className="relative" ref={ref}>
        <button onClick={() => setOpen(o => !o)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-[var(--bg-surface-2)]"
          style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
          More <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-56 rounded-xl overflow-hidden z-20 py-1"
            style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 8px 24px rgba(0,0,0,0.16)" }}>
            {menu.map((m, i) => m === "divider" ? (
              <div key={`d${i}`} className="my-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
            ) : (
              <button key={m.label}
                onClick={() => { m.onClick(); if (m.label !== "Copy Quote Link") setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors hover:bg-[var(--bg-surface-2)]"
                style={{ color: m.danger ? "#dc2626" : "var(--text-primary)" }}>
                <m.icon className="w-3.5 h-3.5" style={{ color: m.danger ? "#dc2626" : "var(--text-muted)" }} /> {m.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
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

// ─── Overview helpers (mirror Agreement/Customer overview) ─
function expiryInfo(expiresAt?: string): { text: string; overdue: boolean } | null {
  if (!expiresAt) return null;
  const t = new Date(expiresAt).getTime();
  if (isNaN(t)) return { text: "Valid", overdue: false };
  const days = Math.round((t - Date.now()) / 86_400_000);
  if (days < 0)  return { text: `Expired ${Math.abs(days)}d ago`, overdue: true };
  if (days === 0) return { text: "Expires today", overdue: true };
  return { text: `${days}d left`, overdue: false };
}

function OvCard({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-4 ${className}`} style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>{title}</p>
      {children}
    </div>
  );
}

function DetailField({ icon: Icon, label, value }: { icon?: LucideIcon; label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }} />}
      <div className="min-w-0 flex-1">
        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-sm font-medium break-words" style={{ color: "var(--text-primary)" }}>{value || "—"}</p>
      </div>
    </div>
  );
}

function SectionCard({ title, count, action, children, className = "" }: {
  title: string; count: number; action?: { label: string; onClick: () => void }; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`rounded-xl overflow-hidden flex flex-col ${className}`} style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
          {count > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}>{count}</span>}
        </div>
        {action && <button onClick={action.onClick} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">{action.label}</button>}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
    </div>
  );
}

// ─── Details (overview) tab ───────────────────────────────
function DetailsTab({ id, onTab }: { id: string; onTab: (tab: string) => void }) {
  const quote    = getQuote(id)!;
  const customer = getCustomer(quote.customerId);
  const stageConfig = QUOTE_STATUS_STYLE[quote.status];
  const activity = [...getQuoteActivity(quote)].reverse();

  const LinkedIcon = quote.linkedType === "job" ? Briefcase
    : quote.linkedType === "project" ? FolderKanban
    : quote.linkedType === "lead" ? TrendingUp
    : ChevronRight;
  const linkedHref = quote.linkedType === "job"     ? `/jobs/${quote.linkedId}`
    : quote.linkedType === "project"  ? `/projects/${quote.linkedId}`
    : quote.linkedType === "lead"     ? `/leads/${quote.linkedId}`
    : "#";

  const exp = expiryInfo(quote.expiresAt);
  const salesperson = quote.assignedTo ?? quote.createdBy;

  const summary: { icon: LucideIcon; label: string; value: string; sub?: string; accent?: string }[] = [
    { icon: CheckCircle, label: "Status", value: stageConfig.label, accent: stageConfig.color, sub: quote.archived ? "Archived" : quote.linkedType ? `Linked ${quote.linkedType}` : "Quote" },
    { icon: DollarSign, label: "Total", value: quote.total > 0 ? fmt(quote.total) : "TBD", sub: quote.total > 0 ? `${fmt(quote.subtotal)} + ${fmt(quote.tax)} tax` : `${quote.lineItems.length} item${quote.lineItems.length === 1 ? "" : "s"}` },
    { icon: Clock, label: "Expires", value: quote.expiresAt ?? "—", accent: exp?.overdue ? "#dc2626" : undefined, sub: exp ? exp.text : "No expiry" },
    { icon: FileText, label: "Line Items", value: String(quote.lineItems.length), sub: quote.lineItems.length === 1 ? "item" : "items" },
    { icon: User, label: "Salesperson", value: salesperson || "—", sub: "Owner" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* ── Summary cards ───────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {summary.map(c => (
          <div key={c.label} className="rounded-xl px-3 py-2.5" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-1.5 mb-1">
              <c.icon className="w-3 h-3" style={{ color: c.accent ?? "var(--text-muted)" }} />
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{c.label}</p>
            </div>
            <p className="text-sm font-bold leading-tight truncate" style={{ color: c.accent ?? "var(--text-primary)" }}>{c.value}</p>
            {c.sub && <p className="text-[11px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{c.sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Snapshot grid: quote details (left) · customer/links/activity (right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT — wide quote details card */}
        <OvCard title="Quote Details" className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <DetailField icon={FileText}    label="Quote #"  value={<span className="font-mono">{quote.quoteNumber}</span>} />
            <DetailField icon={Tag}         label="Title"    value={quote.title} />
            <DetailField icon={CheckCircle} label="Status"   value={<span style={{ color: stageConfig.color, fontWeight: 600 }}>{stageConfig.label}</span>} />
            <DetailField icon={DollarSign}  label="Total"    value={quote.total > 0 ? fmt(quote.total) : "TBD"} />
            <DetailField icon={DollarSign}  label="Subtotal" value={fmt(quote.subtotal)} />
            <DetailField icon={Receipt}     label="Tax"      value={fmt(quote.tax)} />
            <DetailField icon={Calendar}    label="Created"  value={quote.createdAt} />
            <DetailField icon={Clock}       label="Expires"  value={quote.expiresAt ?? "—"} />
            {quote.approvedAt && (
              <DetailField icon={FileCheck} label="Approved" value={<span style={{ color: "#059669", fontWeight: 600 }}>{quote.approvedAt}</span>} />
            )}
            <DetailField icon={User}        label="Salesperson" value={salesperson} />
            {quote.propertyLabel && (
              <DetailField icon={MapPin}    label="Property" value={quote.propertyLabel} />
            )}
          </div>
        </OvCard>

        {/* RIGHT — customer · linked · recent activity */}
        <div className="flex flex-col gap-4">
          <OvCard title="Customer">
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
          </OvCard>

          {quote.linkedLabel && (
            <OvCard title="Linked To">
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
            </OvCard>
          )}

          <SectionCard title="Recent Activity" count={activity.length} action={{ label: "View all", onClick: () => onTab("Activity") }}>
            {activity.length === 0 ? (
              <div className="px-4 py-8 text-center"><p className="text-sm" style={{ color: "var(--text-muted)" }}>No activity yet</p></div>
            ) : activity.slice(0, 4).map((a, i) => {
              const meta = QUOTE_KIND_META[a.kind];
              const Icon = meta.icon;
              const last = i === Math.min(3, activity.length - 1);
              return (
                <div key={a.id} className="flex items-center px-4 py-3 hover:bg-[var(--bg-surface-2)] transition-colors" style={!last ? { borderBottom: "1px solid var(--border-subtle)" } : undefined}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mr-2.5" style={{ backgroundColor: meta.color + "1a" }}>
                    <Icon className="w-3 h-3" style={{ color: meta.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug truncate" style={{ color: "var(--text-primary)" }}>{a.message}</p>
                    <p className="text-[10px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{a.actor} · {a.at}</p>
                  </div>
                </div>
              );
            })}
          </SectionCard>
        </div>
      </div>

      {/* ── Line items — full width ───────────────────── */}
      <LineItemsTable quoteId={id} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [tab, setTab] = useState("Details");
  const [quote, setQuote] = useState(() => getQuote(id));
  const [showPreview, setShowPreview] = useState(false);

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
  const refresh = () => setQuote(getQuote(id));

  function changeStatus(next: QuoteStatus) { updateQuoteStatus(id, next); refresh(); }
  function doDuplicate() { const copy = duplicateQuote(id); if (copy) router.push(`/quotes/${copy.id}`); }
  function doConvertJob() { const job = convertQuoteToJob(id); if (job) router.push(`/jobs/${job.id}`); else refresh(); }
  function doConvertProject() { const p = convertQuoteToProject(id); if (p) router.push(`/projects/${p.id}`); else refresh(); }
  function doReopen() { reopenQuote(id); refresh(); }
  function doResend() { resendQuote(id); refresh(); }
  function doArchive() { archiveQuote(id); router.push("/quotes"); }
  function doUnarchive() { unarchiveQuote(id); refresh(); }
  function doDelete() {
    if (!window.confirm(`Delete ${quote!.quoteNumber}? This can't be undone.`)) return;
    deleteQuote(id); router.push("/quotes");
  }
  function doCreateInvoice() { const inv = createInvoiceFromQuote(id); if (inv) router.push(`/invoices/${inv.id}`); }

  // The full customer-facing proposal used by Preview, instant PDF, and Print —
  // includes every section the quote carries, not just line items.
  const docData = proposalDocFromQuote(quote);

  // Instant PDF: builds and saves "<quote-number>.pdf" — no print dialog.
  function downloadPdf() { downloadProposalPdf(docData); }

  // Print = open the system print dialog showing only the quote document.
  function printQuote() {
    const prevTitle = document.title;
    document.title = `${quote!.quoteNumber} — ${quote!.customerName}`;
    const restore = () => { document.title = prevTitle; window.removeEventListener("afterprint", restore); };
    window.addEventListener("afterprint", restore);
    window.print();
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
            <Commentable anchor={{ recordType: "quote", recordId: id, recordLabel: quote.quoteNumber }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base font-semibold font-mono" style={{ color: "var(--text-primary)" }}>{quote.quoteNumber}</h1>
                  <HoverInfo rows={[
                    { label: "Customer", node: <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{quote.customerName}</span> },
                    { label: "Title", node: <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{quote.title}</span> },
                    { label: "Status", node: <Pill text={stageConfig.label} style={{ backgroundColor: stageConfig.bg, color: stageConfig.color }} /> },
                    ...(quote.total > 0 ? [{ label: "Total", node: <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(quote.total)}</span> }] : []),
                    ...(quote.expiresAt ? [{ label: "Expires", node: <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{quote.expiresAt}</span> }] : []),
                    ...(quote.createdAt ? [{ label: "Created", node: <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{quote.createdAt}</span> }] : []),
                  ]} />
                  <StatusBadge label={stageConfig.label} color={stageConfig.color} />
                  {quote.total > 0 && (
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(quote.total)}</span>
                  )}
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                  {quote.title} · {quote.customerName}
                </p>
              </div>
            </div>
            </Commentable>
          </div>
          <div className="shrink-0">
            <QuoteActionBar
              status={quote.status}
              onPreview={() => setShowPreview(true)}
              onSend={() => changeStatus("sent")}
              onApprove={() => changeStatus("approved")}
              onReject={() => changeStatus("rejected")}
              onExpire={() => changeStatus("expired")}
              onReopen={doReopen}
              onResend={doResend}
              onDuplicate={doDuplicate}
              onConvertJob={doConvertJob}
              onConvertProject={doConvertProject}
              onCreateInvoice={doCreateInvoice}
              onDownloadPdf={downloadPdf}
              onPrint={printQuote}
              onEdit={() => router.push(`/quotes/${id}/${quote.quoteMode === "quick" ? "quick" : "proposal"}`)}
              onArchive={doArchive}
              onUnarchive={doUnarchive}
              onDelete={doDelete}
              archived={!!quote.archived}
            />
          </div>
        </div>

        <DetailTabs tabs={TABS} active={tab} onChange={setTab} className="px-6 py-2" />
      </div>

      <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: "var(--bg-page)" }}>
        {tab === "Details" && <DetailsTab id={id} onTab={setTab} />}
        {tab === "Notes" && <NotesTab quote={quote} onSaved={refresh} />}
        {tab === "Activity" && <ActivityTab quote={quote} />}
      </div>

      {/* Preview modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowPreview(false)}>
          <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2 rounded-t-2xl sticky top-0" style={{ backgroundColor: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Proposal Preview</p>
              <button onClick={() => setShowPreview(false)} style={{ color: "var(--text-muted)" }}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4" style={{ backgroundColor: "#e5e7eb" }}>
              <ProposalDocument data={docData} />
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable document — the only thing shown when Print triggers. */}
      <div className="print-doc" aria-hidden>
        <ProposalDocument data={docData} shadow={false} />
      </div>
    </div>
  );
}

// ─── Notes tab ────────────────────────────────────────────
function NotesTab({ quote, onSaved }: { quote: QuoteRecord; onSaved: () => void }) {
  const [customerNotes, setCustomerNotes] = useState(quote.customerNotes ?? "");
  const [internalNotes, setInternalNotes] = useState(quote.internalNotes ?? "");
  const [saved, setSaved] = useState(false);

  function save() {
    setQuoteNotes(quote.id, { customerNotes, internalNotes });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
    onSaved();
  }
  const dirty = customerNotes !== (quote.customerNotes ?? "") || internalNotes !== (quote.internalNotes ?? "");

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
        <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Customer Notes <span className="normal-case font-normal">(shown on the quote)</span></label>
        <textarea value={customerNotes} onChange={e => setCustomerNotes(e.target.value)} rows={4} placeholder="Terms, scope notes, scheduling…"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }} />
      </div>
      <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
        <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Internal Notes <span className="normal-case font-normal">(team only)</span></label>
        <textarea value={internalNotes} onChange={e => setInternalNotes(e.target.value)} rows={3} placeholder="Internal context not shown to the customer…"
          className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }} />
      </div>
      <div className="flex justify-end">
        <button onClick={save} disabled={!dirty && !saved}
          className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-40"
          style={{ backgroundColor: saved ? "#10b981" : "#4f46e5" }}>{saved ? "Saved ✓" : "Save Notes"}</button>
      </div>
    </div>
  );
}

// ─── Activity tab ─────────────────────────────────────────
// Full-width timeline matching the lead & agreement activity tabs: an icon on
// the connector line, a uniform surface container per event with a category
// badge, the date/time on the right, and the actor in the footer. Newest first.
function timeOf(iso?: string): string | undefined {
  if (!iso) return undefined;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return undefined;
  return new Date(t).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function ActivityTab({ quote }: { quote: QuoteRecord }) {
  const activity = [...getQuoteActivity(quote)].reverse();

  if (activity.length === 0) {
    return (
      <div className="py-12 text-center rounded-xl" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>No activity yet</p>
      </div>
    );
  }

  return (
    <div>
      {activity.map((a, i) => {
        const meta = QUOTE_KIND_META[a.kind];
        const Icon = meta.icon;
        const last = i === activity.length - 1;
        const time = timeOf(a.iso);
        return (
          <div key={a.id} className="flex gap-3">
            {/* Icon + connector */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center z-10"
                style={{ backgroundColor: meta.color + "1a", border: `1px solid ${meta.color}33` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
              </div>
              {!last && <div className="w-px flex-1 my-1" style={{ backgroundColor: "var(--border-subtle)" }} />}
            </div>

            {/* Content container — uniform regardless of content */}
            <div className="flex-1 min-w-0 rounded-xl px-4 py-3 mb-3 flex flex-col"
              style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)", minHeight: 80 }}>
              <div className="flex items-start justify-between gap-3">
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0"
                  style={{ backgroundColor: meta.color + "1a", color: meta.color }}>{meta.label}</span>
                <div className="text-right shrink-0">
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{a.at}</p>
                  {time && <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{time}</p>}
                </div>
              </div>
              <p className="text-sm font-medium mt-1.5 break-words leading-relaxed" style={{ color: "var(--text-primary)" }}>{a.message}</p>
              <div className="flex items-center gap-1.5 mt-auto pt-1.5">
                <User className="w-3 h-3 shrink-0" style={{ color: "var(--text-muted)" }} />
                <span className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{a.actor || "System"}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
