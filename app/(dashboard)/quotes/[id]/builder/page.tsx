"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Eye, EyeOff, Send, FileText, MoreHorizontal, Cloud, CloudOff,
  ChevronUp, ChevronDown, Plus, Trash2, Package, Tag, Monitor, Pencil, Printer, Download,
} from "lucide-react";
import UiSelect from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import CatalogPicker from "@/components/quotes/CatalogPicker";
import {
  getQuote, autosaveQuote, updateQuoteStatus, computeTotals, fmt,
  type QuoteRecord, type QuoteSection, type LineItem,
} from "@/lib/quotes/data";
import { getAllItems, itemToQuoteLine, getItemDefaults, type Item } from "@/lib/items/data";
import { LINE_ITEM_CATEGORIES, QUOTE_STATUS_STYLE, type LineItemCategory, type QuoteStatus } from "@/lib/quotes/types";
import {
  getProposalBranding, getDefaultProposalTemplate, resolveTemplateSections,
  SECTION_LABELS, type SectionKey,
} from "@/lib/proposals/data";
import ProposalDocument from "@/components/quotes/ProposalDocument";
import { buildProposalDoc } from "@/lib/quotes/proposalDoc";
import { downloadProposalPdf } from "@/lib/quotes/proposalPdf";

// ─── Draft line item (string-backed inputs) ──────────────
interface DraftItem {
  id: string; name: string; description: string; quantity: string; unitPrice: string;
  category: LineItemCategory; taxable: boolean; optional: boolean; itemId?: string; unitCost?: number;
}
let _seq = 0;
const uid = () => `li-${Date.now()}-${_seq++}`;
function blankItem(): DraftItem {
  return { id: uid(), name: "", description: "", quantity: "1", unitPrice: "0", category: "Labor", taxable: true, optional: false };
}
function lineToDraft(li: LineItem): DraftItem {
  return {
    id: li.id, itemId: li.itemId, name: li.name ?? "", description: li.description ?? "",
    quantity: String(li.quantity), unitPrice: String(li.unitPrice), unitCost: li.unitCost,
    category: (li.category ?? "Other") as LineItemCategory, taxable: li.taxable ?? true, optional: li.optional ?? false,
  };
}
function draftsToLines(items: DraftItem[]): LineItem[] {
  return items.filter(it => it.name.trim() || it.description.trim()).map(it => {
    const qty = parseFloat(it.quantity) || 0; const price = parseFloat(it.unitPrice) || 0;
    return {
      id: it.id, name: it.name.trim() || undefined, description: it.description.trim() || it.name.trim(),
      quantity: qty, unitPrice: price, total: Math.round(qty * price * 100) / 100,
      category: it.category, taxable: it.taxable, optional: it.optional, itemId: it.itemId, unitCost: it.unitCost,
    };
  });
}

// Sections whose content is the account/quote data, not free text.
const STRUCTURAL: SectionKey[] = ["cover_header", "customer_info", "property_info", "line_items", "approval"];

type SaveState = "idle" | "saving" | "saved";

export default function QuoteBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const branding = useMemo(() => getProposalBranding(), []);
  const itemDefaults = useMemo(() => getItemDefaults(), []);

  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteRecord | null>(null);

  // Editable state
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<QuoteSection[]>([]);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [taxRate, setTaxRate] = useState("0");
  const [customerNotes, setCustomerNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [selected, setSelected] = useState<string>("");
  const [preview, setPreview] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [moreOpen, setMoreOpen] = useState(false);

  const hydratedRef = useRef(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Load the quote (seed on server; session-created resolved on the client).
  useEffect(() => {
    const q = getQuote(id);
    if (q) {
      // Legacy/quick-add quotes have no sections — seed from the default
      // proposal template so the builder is usable (persists on first edit).
      let secs = q.sections ?? [];
      if (secs.length === 0) {
        const tmpl = getDefaultProposalTemplate();
        secs = tmpl
          ? resolveTemplateSections(tmpl).map(s => ({ key: s.key, label: s.label, body: s.body, visible: s.visible }))
          : [{ key: "line_items", label: "Line Items", body: "", visible: true }];
      }
      setQuote(q);
      setTitle(q.title);
      setSections(secs);
      setItems(q.lineItems.length ? q.lineItems.map(lineToDraft) : [blankItem()]);
      setTaxRate(q.subtotal > 0 ? String(Math.round((q.tax / q.subtotal) * 1000) / 10) : "0");
      setCustomerNotes(q.customerNotes ?? "");
      setExpiresAt(q.expiresAt ?? "");
      setSelected(secs.find(s => s.visible)?.key ?? secs[0]?.key ?? "line_items");
    }
    setLoading(false);
  }, [id]);

  const lineItems = useMemo(() => draftsToLines(items), [items]);
  const totals = useMemo(() => computeTotals(lineItems, (parseFloat(taxRate) || 0) / 100), [lineItems, taxRate]);

  // Catalog scoped to the quote's company.
  const catalog = useMemo(() => getAllItems().filter(i => i.active && (!quote || i.companyId === quote.companyId)), [quote]);
  const showCost = itemDefaults.showCostField;

  // Live proposal document (drives Preview, Print, and PDF from current edits).
  const docData = useMemo(() => {
    if (!quote) return null;
    return buildProposalDoc({
      quoteNumber: quote.quoteNumber, title: title || "Proposal",
      customerName: quote.customerName, locationName: quote.locationName, propertyLabel: quote.propertyLabel,
      assignedTo: quote.assignedTo ?? quote.createdBy, createdAt: quote.createdAt,
      expiresAt: expiresAt || undefined,
      sections, lineItems, subtotal: totals.subtotal, tax: totals.tax, total: totals.total,
      taxRatePct: parseFloat(taxRate) || 0, customerNotes: customerNotes || undefined,
    });
  }, [quote, title, sections, lineItems, totals.subtotal, totals.tax, totals.total, taxRate, customerNotes, expiresAt]);

  // Autosave (quiet) — debounced, skips the first run after hydration.
  useEffect(() => {
    if (loading || !quote) return;
    if (!hydratedRef.current) { hydratedRef.current = true; return; }
    setSaveState("saving");
    const t = setTimeout(() => {
      autosaveQuote(id, {
        title: title.trim() || "Untitled Quote", sections, lineItems,
        subtotal: totals.subtotal, tax: totals.tax, total: totals.total,
        expiresAt: expiresAt || undefined, customerNotes: customerNotes || undefined,
      });
      setSaveState("saved");
    }, 600);
    return () => clearTimeout(t);
  }, [title, sections, lineItems, taxRate, customerNotes, expiresAt, loading, quote, id, totals.subtotal, totals.tax, totals.total]);

  useEffect(() => {
    if (!moreOpen) return;
    const onDown = (e: MouseEvent) => { if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [moreOpen]);

  // ── Section ops ──
  function setSectionBody(key: string, body: string) { setSections(p => p.map(s => s.key === key ? { ...s, body } : s)); }
  function toggleVisible(key: string) { setSections(p => p.map(s => s.key === key ? { ...s, visible: !s.visible } : s)); }
  function moveSection(idx: number, dir: -1 | 1) {
    setSections(p => { const a = [...p]; const j = idx + dir; if (j < 0 || j >= a.length) return p; [a[idx], a[j]] = [a[j], a[idx]]; return a; });
  }

  // ── Line item ops ──
  const setItem = (iid: string, patch: Partial<DraftItem>) => setItems(p => p.map(it => it.id === iid ? { ...it, ...patch } : it));
  const addItem = () => setItems(p => [...p, blankItem()]);
  const removeItem = (iid: string) => setItems(p => p.filter(it => it.id !== iid));
  function addCatalogItems(sel: Item[]) {
    setItems(prev => {
      const kept = prev.filter(it => it.name.trim() || it.description.trim() || it.itemId);
      return [...kept, ...sel.map(it => lineToDraft(itemToQuoteLine(it)))];
    });
    setShowCatalog(false);
  }

  function saveDraftAndExit() {
    autosaveQuote(id, {
      title: title.trim() || "Untitled Quote", sections, lineItems,
      subtotal: totals.subtotal, tax: totals.tax, total: totals.total,
      expiresAt: expiresAt || undefined, customerNotes: customerNotes || undefined,
    });
    router.push(`/quotes/${id}`);
  }
  function sendQuote() {
    autosaveQuote(id, {
      title: title.trim() || "Untitled Quote", sections, lineItems,
      subtotal: totals.subtotal, tax: totals.tax, total: totals.total,
      expiresAt: expiresAt || undefined, customerNotes: customerNotes || undefined,
    });
    updateQuoteStatus(id, "sent");
    router.push(`/quotes/${id}`);
  }
  function printProposal() {
    setMoreOpen(false);
    const prev = document.title;
    document.title = `${quote?.quoteNumber} — ${quote?.customerName}`;
    const restore = () => { document.title = prev; window.removeEventListener("afterprint", restore); };
    window.addEventListener("afterprint", restore);
    window.print();
  }
  function downloadPdf() { setMoreOpen(false); if (docData) downloadProposalPdf(docData); }

  if (loading) return <div className="p-10 text-sm" style={{ color: "var(--text-muted)" }}>Loading builder…</div>;
  if (!quote) return (
    <div className="p-10">
      <Link href="/quotes" className="flex items-center gap-1.5 text-sm mb-3" style={{ color: "var(--text-secondary)" }}><ArrowLeft className="w-4 h-4" /> Back to Quotes</Link>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Quote not found.</p>
    </div>
  );

  const statusStyle = QUOTE_STATUS_STYLE[quote.status as QuoteStatus];
  const sel = sections.find(s => s.key === selected);
  const accent = branding.accentColor || "#4f46e5";

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* ── Top action bar ── */}
      <div className="flex items-center gap-3 px-5 py-3 shrink-0" style={{ backgroundColor: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
        <Link href={`/quotes/${id}`} className="flex items-center gap-1.5 text-sm shrink-0" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft className="w-4 h-4" /> Quote
        </Link>
        <div className="w-px h-5" style={{ backgroundColor: "var(--border)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{quote.quoteNumber}</span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>{statusStyle.label}</span>
        {/* Autosave indicator */}
        <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
          {saveState === "saving" ? <><CloudOff className="w-3.5 h-3.5" /> Saving…</> : saveState === "saved" ? <><Cloud className="w-3.5 h-3.5" style={{ color: "#10b981" }} /> All changes saved</> : <><Cloud className="w-3.5 h-3.5" /> Autosave on</>}
        </span>

        <div className="flex-1" />

        <button onClick={() => setPreview(p => !p)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
          style={{ border: "1px solid var(--border)", backgroundColor: preview ? "var(--accent-soft-bg)" : "var(--bg-surface)", color: preview ? "var(--accent-text)" : "var(--text-secondary)" }}>
          {preview ? <Pencil className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />} {preview ? "Edit" : "Preview"}
        </button>
        <button onClick={saveDraftAndExit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
          <FileText className="w-3.5 h-3.5" /> Save Draft
        </button>
        <button onClick={sendQuote} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: accent }}>
          <Send className="w-3.5 h-3.5" /> Send Quote
        </button>
        <div className="relative" ref={moreRef}>
          <button onClick={() => setMoreOpen(o => !o)} className="p-1.5 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}><MoreHorizontal className="w-4 h-4" /></button>
          {moreOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-48 rounded-xl p-1" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 12px 32px rgba(0,0,0,0.16)" }}>
              <MenuItem icon={Printer} label="Print proposal" onClick={printProposal} />
              <MenuItem icon={Download} label="Download PDF" onClick={downloadPdf} />
              <div className="my-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
              <MenuItem icon={FileText} label="Open quote detail" onClick={() => { setMoreOpen(false); router.push(`/quotes/${id}`); }} />
            </div>
          )}
        </div>
      </div>

      {/* ── Workspace ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: section nav */}
        {!preview && (
          <div className="w-56 shrink-0 overflow-y-auto thin-scroll-y py-3 px-2" style={{ backgroundColor: "var(--bg-surface)", borderRight: "1px solid var(--border-subtle)" }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2" style={{ color: "var(--text-muted)" }}>Sections</p>
            {sections.map((s, i) => {
              const active = selected === s.key;
              return (
                <div key={s.key} className="flex items-center gap-1 rounded-lg" style={{ backgroundColor: active ? "var(--bg-surface-2)" : "transparent" }}>
                  <button onClick={() => setSelected(s.key)} className="flex-1 flex items-center gap-2 px-2 py-2 text-left min-w-0">
                    <span className="text-[10px] font-mono w-4 text-center shrink-0" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                    <span className="text-sm truncate" style={{ color: active ? "var(--accent-text)" : s.visible ? "var(--text-primary)" : "var(--text-muted)", fontWeight: active ? 600 : 400 }}>{s.label}</span>
                  </button>
                  <button onClick={() => moveSection(i, -1)} disabled={i === 0} className="disabled:opacity-20 p-0.5" style={{ color: "var(--text-muted)" }}><ChevronUp className="w-3 h-3" /></button>
                  <button onClick={() => moveSection(i, 1)} disabled={i === sections.length - 1} className="disabled:opacity-20 p-0.5" style={{ color: "var(--text-muted)" }}><ChevronDown className="w-3 h-3" /></button>
                  <button onClick={() => toggleVisible(s.key)} className="p-0.5 mr-1" style={{ color: s.visible ? "var(--accent-text)" : "var(--text-muted)" }} title={s.visible ? "Visible" : "Hidden"}>
                    {s.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Center: customer-facing canvas (edit) / professional document (preview) */}
        <div className="flex-1 overflow-y-auto thin-scroll-y p-6" style={{ backgroundColor: preview ? "#e5e7eb" : undefined }}>
          {preview && docData ? (
            <ProposalDocument data={docData} />
          ) : (
            <div className="mx-auto" style={{ maxWidth: "760px" }}>
              <Canvas
                branding={branding} accent={accent} title={title} quote={quote}
                sections={sections} lineItems={lineItems} totals={totals} taxRate={taxRate}
                customerNotes={customerNotes} expiresAt={expiresAt}
                selected={selected} onSelect={setSelected} preview={false}
              />
            </div>
          )}
        </div>

        {/* Right: edit panel for the selected section */}
        {!preview && (
          <div className="w-80 shrink-0 overflow-y-auto thin-scroll-y p-4" style={{ backgroundColor: "var(--bg-surface)", borderLeft: "1px solid var(--border-subtle)" }}>
            {!sel ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Select a section to edit.</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{sel.label}</p>
                  <label className="flex items-center gap-1.5 text-[11px] cursor-pointer" style={{ color: "var(--text-secondary)" }}>
                    {sel.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <input type="checkbox" checked={sel.visible} onChange={() => toggleVisible(sel.key)} className="accent-indigo-600" /> Visible
                  </label>
                </div>

                {/* Header / cover editor */}
                {(sel.key === "cover_header") && (
                  <>
                    <Field label="Quote Title">
                      <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
                    </Field>
                    <Field label="Expires">
                      <DatePicker value={expiresAt} onChange={setExpiresAt} placeholder="No expiry" />
                    </Field>
                    <Field label="Intro wording">
                      <textarea value={sel.body} onChange={e => setSectionBody(sel.key, e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} />
                    </Field>
                  </>
                )}

                {/* Customer / property — sourced from the account */}
                {(sel.key === "customer_info" || sel.key === "property_info") && (
                  <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
                    {sel.key === "customer_info" ? (
                      <><p className="font-medium" style={{ color: "var(--text-primary)" }}>{quote.customerName}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{quote.locationName}</p></>
                    ) : (
                      <p style={{ color: quote.propertyLabel ? "var(--text-primary)" : "var(--text-muted)" }}>{quote.propertyLabel ?? "No property on this quote."}</p>
                    )}
                    <p className="text-[11px] mt-2" style={{ color: "var(--text-muted)" }}>Pulled from the account — edit on the customer record.</p>
                  </div>
                )}

                {/* Line items editor */}
                {sel.key === "line_items" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setShowCatalog(true)} className="flex items-center gap-1 text-xs font-medium" style={{ color: accent }}><Package className="w-3.5 h-3.5" /> Catalog</button>
                      <button onClick={addItem} className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}><Plus className="w-3.5 h-3.5" /> Custom line</button>
                    </div>
                    {items.map(it => (
                      <div key={it.id} className="rounded-lg p-2.5 space-y-2" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
                        {it.itemId && <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "var(--accent-text)" }}><Tag className="w-2.5 h-2.5" /> From catalog</div>}
                        <input value={it.name} onChange={e => setItem(it.id, { name: e.target.value })} placeholder="Item name" className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none" style={inputStyle} />
                        <input value={it.description} onChange={e => setItem(it.id, { description: e.target.value })} placeholder="Description" className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none" style={inputStyle} />
                        <UiSelect size="sm" value={it.category} onChange={v => setItem(it.id, { category: v as LineItemCategory })} options={LINE_ITEM_CATEGORIES.map(c => ({ value: c, label: c }))} />
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1"><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Qty</span>
                            <input type="number" min={0} value={it.quantity} onChange={e => setItem(it.id, { quantity: e.target.value })} className="w-14 rounded-lg px-2 py-1 text-xs outline-none" style={inputStyle} /></div>
                          <div className="flex items-center gap-1"><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>$</span>
                            <input type="number" min={0} step="0.01" value={it.unitPrice} onChange={e => setItem(it.id, { unitPrice: e.target.value })} className="w-20 rounded-lg px-2 py-1 text-xs outline-none" style={inputStyle} /></div>
                          <button onClick={() => removeItem(it.id)} className="ml-auto p-1 rounded-lg" style={{ color: "var(--text-muted)" }}><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: "var(--text-secondary)" }}><input type="checkbox" checked={it.taxable} onChange={e => setItem(it.id, { taxable: e.target.checked })} className="accent-indigo-600" /> Taxable</label>
                          <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: "var(--text-secondary)" }}><input type="checkbox" checked={it.optional} onChange={e => setItem(it.id, { optional: e.target.checked })} className="accent-indigo-600" /> Optional</label>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Tax %</span>
                      <input type="number" min={0} step="0.1" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="w-16 rounded px-1.5 py-0.5 text-xs outline-none" style={inputStyle} />
                      <span className="ml-auto text-sm font-bold" style={{ color: "var(--text-primary)" }}>{fmt(totals.total)}</span>
                    </div>
                  </div>
                )}

                {/* Approval */}
                {sel.key === "approval" && (
                  <>
                    <Field label="Approval wording">
                      <textarea value={sel.body} onChange={e => setSectionBody(sel.key, e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} />
                    </Field>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>E-signature isn&apos;t enabled yet — the canvas shows a signature placeholder.</p>
                  </>
                )}

                {/* Generic free-text sections */}
                {!STRUCTURAL.includes(sel.key as SectionKey) && (
                  <>
                    {sel.key === "photos" && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Photo attachments come from the Photos &amp; Files module (coming soon). Add a caption below.</p>}
                    <Field label="Section content" hint="customer-facing">
                      <textarea value={sel.body} onChange={e => setSectionBody(sel.key, e.target.value)} rows={6} placeholder="Write this section…" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} />
                    </Field>
                  </>
                )}

                {/* Customer notes always editable from line_items area */}
                {sel.key === "line_items" && (
                  <Field label="Customer notes" hint="on the quote">
                    <textarea value={customerNotes} onChange={e => setCustomerNotes(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none" style={inputStyle} />
                  </Field>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showCatalog && <CatalogPicker items={catalog} showCost={showCost} onAdd={addCatalogItems} onClose={() => setShowCatalog(false)} />}

      {/* Hidden printable document — the only thing shown when Print triggers. */}
      {docData && <div className="print-doc" aria-hidden><ProposalDocument data={docData} shadow={false} /></div>}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: typeof Printer; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[var(--bg-surface-2)]" style={{ color: "var(--text-secondary)" }}>
      <Icon className="w-3.5 h-3.5 shrink-0" /> {label}
    </button>
  );
}

// ─── Canvas (customer-facing document) ────────────────────
function Canvas({
  branding, accent, title, quote, sections, lineItems, totals, taxRate, customerNotes, expiresAt, selected, onSelect, preview,
}: {
  branding: ReturnType<typeof getProposalBranding>; accent: string; title: string; quote: QuoteRecord;
  sections: QuoteSection[]; lineItems: LineItem[]; totals: { subtotal: number; tax: number; total: number };
  taxRate: string; customerNotes: string; expiresAt: string;
  selected: string; onSelect: (k: string) => void; preview: boolean;
}) {
  const visible = sections.filter(s => s.visible);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
      {visible.map(s => {
        const isSel = selected === s.key;
        const ring = !preview && isSel ? { outline: `2px solid ${accent}`, outlineOffset: "-2px" } : {};
        return (
          <div key={s.key} onClick={() => !preview && onSelect(s.key)}
            className="px-8 py-5 cursor-default transition-colors"
            style={{ borderBottom: "1px solid var(--border-subtle)", ...ring }}>
            <SectionBody
              section={s} branding={branding} accent={accent} title={title} quote={quote}
              lineItems={lineItems} totals={totals} taxRate={taxRate} customerNotes={customerNotes} expiresAt={expiresAt}
            />
          </div>
        );
      })}
      {visible.length === 0 && <div className="px-8 py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>All sections are hidden. Toggle one visible to start.</div>}
    </div>
  );
}

function SectionBody({ section: s, branding, accent, title, quote, lineItems, totals, taxRate, customerNotes, expiresAt }: {
  section: QuoteSection; branding: ReturnType<typeof getProposalBranding>; accent: string; title: string; quote: QuoteRecord;
  lineItems: LineItem[]; totals: { subtotal: number; tax: number; total: number }; taxRate: string; customerNotes: string; expiresAt: string;
}) {
  const label = SECTION_LABELS[s.key as SectionKey] ?? s.label;

  if (s.key === "cover_header") {
    return (
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{title || "Proposal"}</p>
          {s.body && <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{s.body}</p>}
          <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>{quote.quoteNumber}{expiresAt ? ` · Expires ${expiresAt}` : ""}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold" style={{ color: accent }}>{branding.companyName}</p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{branding.companyInfo}</p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{branding.contactInfo}</p>
        </div>
      </div>
    );
  }
  if (s.key === "customer_info") {
    return (<><SecLabel>{label}</SecLabel><p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{quote.customerName}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{quote.locationName}</p></>);
  }
  if (s.key === "property_info") {
    return (<><SecLabel>{label}</SecLabel><p className="text-sm" style={{ color: quote.propertyLabel ? "var(--text-primary)" : "var(--text-muted)" }}>{quote.propertyLabel ?? "—"}</p></>);
  }
  if (s.key === "line_items") {
    return (
      <>
        <SecLabel>{label}</SecLabel>
        {lineItems.length === 0 ? <p className="text-sm" style={{ color: "var(--text-muted)" }}>No line items yet — add some from the edit panel.</p> : (
          <div className="space-y-1.5">
            {lineItems.filter(li => !li.optional).map(li => (
              <div key={li.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate" style={{ color: "var(--text-primary)" }}>{li.name ?? li.description} <span style={{ color: "var(--text-muted)" }}>×{li.quantity}</span></span>
                <span className="shrink-0 font-medium" style={{ color: "var(--text-primary)" }}>{fmt(li.total)}</span>
              </div>
            ))}
            {lineItems.some(li => li.optional) && (
              <div className="pt-2 mt-1" style={{ borderTop: "1px dashed var(--border)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Optional add-ons</p>
                {lineItems.filter(li => li.optional).map(li => (
                  <div key={li.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate" style={{ color: "var(--text-secondary)" }}>{li.name ?? li.description} <span style={{ color: "var(--text-muted)" }}>×{li.quantity}</span></span>
                    <span className="shrink-0" style={{ color: "var(--text-secondary)" }}>{fmt(li.total)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-2 mt-1 space-y-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <Row label="Subtotal" value={fmt(totals.subtotal)} />
              <Row label={`Tax (${taxRate}%)`} value={fmt(totals.tax)} />
              <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Total</span>
                <span className="text-lg font-bold" style={{ color: accent }}>{fmt(totals.total)}</span>
              </div>
            </div>
            {customerNotes && <p className="text-xs mt-2" style={{ color: "var(--text-secondary)" }}>{customerNotes}</p>}
          </div>
        )}
      </>
    );
  }
  if (s.key === "approval") {
    return (
      <>
        <SecLabel>{label}</SecLabel>
        {s.body && <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>{s.body}</p>}
        <div className="grid grid-cols-2 gap-6">
          {["Customer Signature", "Date"].map(l => (
            <div key={l}><div className="h-9 rounded-lg" style={{ border: "1px dashed var(--border)", backgroundColor: "var(--bg-surface-2)" }} /><p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{l}</p></div>
          ))}
        </div>
      </>
    );
  }
  // Generic free-text section
  return (
    <>
      <SecLabel>{label}</SecLabel>
      {s.body ? <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text-secondary)" }}>{s.body}</p>
        : <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Empty — add content in the edit panel.</p>}
    </>
  );
}

// ─── Small bits ───────────────────────────────────────────
const inputStyle: React.CSSProperties = { border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" };
function SecLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{children}</p>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span><span className="text-sm" style={{ color: "var(--text-secondary)" }}>{value}</span></div>;
}
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{label}{hint && <span style={{ color: "var(--text-muted)" }}> ({hint})</span>}</label>{children}</div>;
}
