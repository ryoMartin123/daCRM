"use client";

// Custom Proposal Builder — a flexible, block-based document editor (distinct
// from the structured, salesbook-driven /proposal workspace). The rep builds the
// proposal from content blocks: rich text, images, line items, price summary,
// options, etc. — reorder, add, duplicate, hide/show.
//
// Pricing math from the wizard stays available as an INTERNAL pin at the top of
// the canvas. It is never shown to the customer; a customer-facing number only
// appears if the rep adds a Price Summary or Line Items block.
//
// Reached via: chooser → /pricing (wizard) → /custom.  Never the old builder.

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Eye, EyeOff, Send, FileText, MoreHorizontal, Cloud, CloudOff,
  Plus, Trash2, Copy, Link2, RotateCcw, Archive, GripVertical, Monitor, Pencil,
  Printer, Download, Check, SlidersHorizontal, User, MapPin, TrendingUp, Lock,
  Package, Tag, Search, ChevronDown, Image as ImageIcon,
} from "lucide-react";
import UiSelect from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import CatalogPicker from "@/components/quotes/CatalogPicker";
import OptionImageInput from "@/components/quotes/OptionImageInput";
import RichTextEditor from "@/components/quotes/custom/RichTextEditor";
import CustomProposalDocument, { type CustomDocData } from "@/components/quotes/custom/CustomProposalDocument";
import {
  getQuote, autosaveQuote, updateQuoteStatus, computeTotals, fmt,
  duplicateQuote, archiveQuote, deleteQuote,
  type QuoteRecord, type QuoteOption, type LineItem,
} from "@/lib/quotes/data";
import {
  BLOCK_LIBRARY, BLOCK_GROUPS, BLOCK_LABELS, RICH_BLOCK_TYPES, defaultBlock,
  starterBlocks, sectionsToBlocks, blockId, imageId,
  type QuoteBlock, type BlockType, type BlockImage,
} from "@/lib/quotes/blocks";
import { getAllItems, itemToQuoteLine, getItemDefaults, type Item } from "@/lib/items/data";
import { LINE_ITEM_CATEGORIES, QUOTE_STATUS_STYLE, type LineItemCategory, type QuoteStatus } from "@/lib/quotes/types";
import { getProposalBranding, getProposalTerms } from "@/lib/proposals/data";

// ─── Draft line item (string-backed) ──────────────────────
interface DraftItem {
  id: string; name: string; description: string; quantity: string; unitPrice: string;
  category: LineItemCategory; taxable: boolean; optional: boolean; itemId?: string; unitCost?: number;
}
let _seq = 0;
const uid = () => `li-${Date.now()}-${_seq++}`;
function blankItem(): DraftItem { return { id: uid(), name: "", description: "", quantity: "1", unitPrice: "0", category: "Labor", taxable: true, optional: false }; }
function lineToDraft(li: LineItem): DraftItem {
  return { id: li.id, itemId: li.itemId, name: li.name ?? "", description: li.description ?? "", quantity: String(li.quantity), unitPrice: String(li.unitPrice), unitCost: li.unitCost, category: (li.category ?? "Other") as LineItemCategory, taxable: li.taxable ?? true, optional: li.optional ?? false };
}
function draftsToLines(items: DraftItem[]): LineItem[] {
  return items.filter(it => it.name.trim() || it.description.trim()).map(it => {
    const qty = parseFloat(it.quantity) || 0; const price = parseFloat(it.unitPrice) || 0;
    return { id: it.id, name: it.name.trim() || undefined, description: it.description.trim() || it.name.trim(), quantity: qty, unitPrice: price, total: Math.round(qty * price * 100) / 100, category: it.category, taxable: it.taxable, optional: it.optional, itemId: it.itemId, unitCost: it.unitCost };
  });
}

type SaveState = "idle" | "saving" | "saved";

export default function CustomProposalBuilder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const branding = useMemo(() => getProposalBranding(), []);
  const itemDefaults = useMemo(() => getItemDefaults(), []);
  const accent = branding.accentColor || "#7c3aed";

  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteRecord | null>(null);
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<QuoteBlock[]>([]);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [options, setOptions] = useState<QuoteOption[]>([]);
  const [taxRate, setTaxRate] = useState("0");
  const [customerNotes, setCustomerNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [selected, setSelected] = useState<string>("");
  const [preview, setPreview] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [moreOpen, setMoreOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [renamingId, setRenamingId] = useState("");
  const [dragId, setDragId] = useState("");
  const [overId, setOverId] = useState("");
  const [copied, setCopied] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(true);

  const hydratedRef = useRef(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = getQuote(id);
    if (q) {
      const blks = (q.blocks && q.blocks.length) ? q.blocks : sectionsToBlocks(q.sections ?? [], q.title);
      setQuote(q); setTitle(q.title); setBlocks(blks);
      setItems(q.lineItems.length ? q.lineItems.map(lineToDraft) : [blankItem()]);
      setOptions(q.options ?? []);
      setTaxRate(q.subtotal > 0 ? String(Math.round((q.tax / q.subtotal) * 1000) / 10) : "0");
      setCustomerNotes(q.customerNotes ?? ""); setExpiresAt(q.expiresAt ?? "");
      setSelected((blks.find(b => b.visible) ?? blks[0])?.id ?? "");
    }
    setLoading(false);
  }, [id]);

  const lineItems = useMemo(() => draftsToLines(items), [items]);
  const totals = useMemo(() => computeTotals(lineItems, (parseFloat(taxRate) || 0) / 100), [lineItems, taxRate]);
  const catalog = useMemo(() => getAllItems().filter(i => i.active && (!quote || i.companyId === quote.companyId)), [quote]);
  const savedTerms = useMemo(() => getProposalTerms().filter(t => t.active), []);

  const docData: CustomDocData | null = useMemo(() => {
    if (!quote) return null;
    return {
      branding, quoteNumber: quote.quoteNumber, customerName: quote.customerName,
      locationName: quote.locationName, propertyLabel: quote.propertyLabel,
      createdAt: quote.createdAt, expiresAt: expiresAt || undefined,
      blocks, lineItems, options, subtotal: totals.subtotal, tax: totals.tax, total: totals.total,
      taxRatePct: parseFloat(taxRate) || 0, monthly: quote.pricing?.monthly,
      customerNotes: customerNotes || undefined,
    };
  }, [quote, branding, blocks, lineItems, options, totals, taxRate, customerNotes, expiresAt]);

  // Autosave
  useEffect(() => {
    if (loading || !quote) return;
    if (!hydratedRef.current) { hydratedRef.current = true; return; }
    setSaveState("saving");
    const t = setTimeout(() => {
      autosaveQuote(id, {
        title: title.trim() || "Untitled Proposal", blocks, lineItems, options,
        subtotal: totals.subtotal, tax: totals.tax, total: totals.total,
        expiresAt: expiresAt || undefined, customerNotes: customerNotes || undefined,
      });
      setSaveState("saved");
    }, 600);
    return () => clearTimeout(t);
  }, [title, blocks, lineItems, options, taxRate, customerNotes, expiresAt, loading, quote, id, totals.subtotal, totals.tax, totals.total]);

  useCloseOnOutside(moreRef, moreOpen, () => setMoreOpen(false));
  useCloseOnOutside(addRef, addOpen, () => setAddOpen(false));

  // ─── Block ops ──────────────────────────────────────────
  const patchBlock = (bid: string, patch: Partial<QuoteBlock>) => setBlocks(p => p.map(b => b.id === bid ? { ...b, ...patch } : b));
  const setBlockSettings = (bid: string, patch: Record<string, unknown>) => setBlocks(p => p.map(b => b.id === bid ? { ...b, settings: { ...b.settings, ...patch } } : b));
  const renameBlock = (bid: string, t: string) => patchBlock(bid, { title: t });
  const toggleVisible = (bid: string) => setBlocks(p => p.map(b => b.id === bid ? { ...b, visible: !b.visible } : b));
  function removeBlock(bid: string) {
    setBlocks(prev => { const next = prev.filter(b => b.id !== bid); if (selected === bid) setSelected(next.find(b => b.visible)?.id ?? next[0]?.id ?? ""); return next; });
  }
  function duplicateBlock(bid: string) {
    setBlocks(prev => { const i = prev.findIndex(b => b.id === bid); if (i < 0) return prev;
      const copy: QuoteBlock = { ...prev[i], id: blockId(), title: `${prev[i].title} (Copy)`, locked: false, images: prev[i].images?.map(im => ({ ...im, id: imageId() })) };
      const next = [...prev]; next.splice(i + 1, 0, copy); setSelected(copy.id); return next; });
  }
  function addBlock(type: BlockType) { const b = defaultBlock(type); setBlocks(prev => [...prev, b]); setSelected(b.id); setAddOpen(false); }
  function reorder(fromId: string, targetId: string) {
    if (!fromId || fromId === targetId) return;
    setBlocks(prev => { const from = prev.findIndex(b => b.id === fromId); if (from < 0) return prev;
      const arr = [...prev]; const [m] = arr.splice(from, 1); const to = arr.findIndex(b => b.id === targetId); arr.splice(to < 0 ? arr.length : to, 0, m); return arr; });
  }

  // ─── Line item ops ──────────────────────────────────────
  const setItem = (iid: string, patch: Partial<DraftItem>) => setItems(p => p.map(it => it.id === iid ? { ...it, ...patch } : it));
  const addItem = () => setItems(p => [...p, blankItem()]);
  const removeItem = (iid: string) => setItems(p => p.filter(it => it.id !== iid));
  function addCatalogItems(sel: Item[]) { setItems(prev => { const kept = prev.filter(it => it.name.trim() || it.description.trim() || it.itemId); return [...kept, ...sel.map(it => lineToDraft(itemToQuoteLine(it)))]; }); setShowCatalog(false); }
  // ─── Option ops ─────────────────────────────────────────
  const selectTier = (oid: string) => setOptions(p => p.map(o => ({ ...o, selected: o.id === oid ? !o.selected : o.selected })));
  const setOption = (oid: string, patch: Partial<QuoteOption>) => setOptions(p => p.map(o => o.id === oid ? { ...o, ...patch } : o));
  const removeOption = (oid: string) => setOptions(p => p.filter(o => o.id !== oid));
  const addOption = () => setOptions(p => [...p, { id: `qopt-${Date.now()}-${p.length}`, name: "New option", price: 0 }]);

  // ─── Persist + lifecycle ────────────────────────────────
  function persist() {
    autosaveQuote(id, { title: title.trim() || "Untitled Proposal", blocks, lineItems, options, subtotal: totals.subtotal, tax: totals.tax, total: totals.total, expiresAt: expiresAt || undefined, customerNotes: customerNotes || undefined });
  }
  function saveDraftAndExit() { persist(); router.push(`/quotes/${id}`); }
  function sendQuote() { persist(); updateQuoteStatus(id, "sent"); router.push(`/quotes/${id}`); }
  function printProposal() {
    setMoreOpen(false);
    const prev = document.title; document.title = `${quote?.quoteNumber} — ${quote?.customerName}`;
    const restore = () => { document.title = prev; window.removeEventListener("afterprint", restore); };
    window.addEventListener("afterprint", restore); window.print();
  }
  function handleDuplicate() { setMoreOpen(false); persist(); const c = duplicateQuote(id); if (c) router.push(`/quotes/${c.id}/${c.quoteMode === "quick" ? "quick" : c.quoteMode === "template" ? "proposal" : "custom"}`); }
  function copyLink() { setMoreOpen(false); try { navigator.clipboard?.writeText(`${window.location.origin}/quotes/${id}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ } }
  function resetLayout() { setMoreOpen(false); if (!window.confirm("Reset to the starter proposal structure? This replaces the current blocks (line items, options and pricing are kept).")) return; const b = starterBlocks(); setBlocks(b); setSelected(b[0].id); }
  function handleArchive() { setMoreOpen(false); persist(); archiveQuote(id); router.push(`/quotes/${id}`); }
  function handleDelete() { setMoreOpen(false); if (!window.confirm("Delete this quote?")) return; deleteQuote(id); router.push("/quotes"); }

  if (loading) return <div className="p-10 text-sm" style={{ color: "var(--text-muted)" }}>Loading builder…</div>;
  if (!quote) return (
    <div className="p-10">
      <Link href="/quotes" className="flex items-center gap-1.5 text-sm mb-3" style={{ color: "var(--text-secondary)" }}><ArrowLeft className="w-4 h-4" /> Back to Quotes</Link>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Quote not found.</p>
    </div>
  );

  const statusStyle = QUOTE_STATUS_STYLE[quote.status as QuoteStatus];
  const sel = blocks.find(b => b.id === selected);
  const visibleBlocks = blocks.filter(b => b.visible);
  const showCost = itemDefaults.showCostField;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-5 py-2.5 shrink-0" style={{ backgroundColor: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
        <Link href={`/quotes/${id}`} className="flex items-center gap-1.5 text-sm shrink-0 transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}><ArrowLeft className="w-4 h-4" /> Quotes</Link>
        <div className="w-px h-5" style={{ backgroundColor: "var(--border)" }} />
        <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: accent + "1a", color: accent }}><SlidersHorizontal className="w-3 h-3" /> Custom Proposal</span>
        <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: "var(--text-primary)" }}>{quote.quoteNumber}</span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>{statusStyle.label}</span>
        <span className="flex items-center gap-1.5 text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>
          {saveState === "saving" ? <><CloudOff className="w-3.5 h-3.5" /> Saving…</> : saveState === "saved" ? <><Cloud className="w-3.5 h-3.5" style={{ color: "#10b981" }} /> Saved</> : <><Cloud className="w-3.5 h-3.5" /> Autosave on</>}
        </span>
        <div className="flex-1" />
        <button onClick={() => setPreview(p => !p)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors" style={{ border: "1px solid var(--border)", backgroundColor: preview ? "var(--accent-soft-bg)" : "var(--bg-surface)", color: preview ? "var(--accent-text)" : "var(--text-secondary)" }}>
          {preview ? <Pencil className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />} {preview ? "Edit" : "Preview"}
        </button>
        <button onClick={saveDraftAndExit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-[var(--bg-surface-2)]" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}><FileText className="w-3.5 h-3.5" /> Save Draft</button>
        <button onClick={sendQuote} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-white transition-transform active:scale-[0.98]" style={{ backgroundColor: accent, boxShadow: "0 2px 8px " + accent + "55" }}><Send className="w-3.5 h-3.5" /> Send Quote</button>
        <div className="relative" ref={moreRef}>
          <button onClick={() => setMoreOpen(o => !o)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-surface-2)]" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}><MoreHorizontal className="w-4 h-4" /></button>
          {moreOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl p-1" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 12px 32px rgba(0,0,0,0.28)" }}>
              <MenuItem icon={Copy} label="Duplicate quote" onClick={handleDuplicate} />
              <MenuItem icon={Download} label="Download PDF" onClick={printProposal} />
              <MenuItem icon={Printer} label="Print proposal" onClick={printProposal} />
              <MenuItem icon={copied ? Check : Link2} label={copied ? "Link copied" : "Copy link"} onClick={copyLink} />
              <div className="my-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
              <MenuItem icon={RotateCcw} label="Reset to starter" onClick={resetLayout} />
              <MenuItem icon={Archive} label="Archive quote" onClick={handleArchive} />
              <MenuItem icon={Trash2} label="Delete quote" onClick={handleDelete} danger />
            </div>
          )}
        </div>
      </div>

      {/* ── Workspace ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: outline */}
        {!preview && (
          <div className="w-[270px] shrink-0 flex flex-col" style={{ backgroundColor: "var(--bg-surface)", borderRight: "1px solid var(--border-subtle)" }}>
            <div className="p-3 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="rounded-xl p-3 space-y-2.5" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
                <SummaryRow icon={User} label="Customer" value={quote.customerName} />
                <SummaryRow icon={MapPin} label="Property" value={quote.propertyLabel ?? "—"} muted={!quote.propertyLabel} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto thin-scroll-y px-2 py-3">
              <div className="flex items-center justify-between px-2 mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Document Outline</p>
                <span className="text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>{visibleBlocks.length}/{blocks.length}</span>
              </div>
              <div className="space-y-0.5">
                {blocks.map(b => {
                  const active = selected === b.id;
                  const isOver = overId === b.id && dragId && dragId !== b.id;
                  return (
                    <div key={b.id}
                      draggable={renamingId !== b.id}
                      onDragStart={e => { setDragId(b.id); e.dataTransfer.effectAllowed = "move"; }}
                      onDragOver={e => { e.preventDefault(); setOverId(b.id); }}
                      onDrop={e => { e.preventDefault(); reorder(dragId, b.id); setDragId(""); setOverId(""); }}
                      onDragEnd={() => { setDragId(""); setOverId(""); }}
                      onClick={() => setSelected(b.id)}
                      className="group relative flex items-center gap-1 rounded-lg pr-1 transition-colors cursor-pointer"
                      style={{ backgroundColor: active ? "var(--accent-soft-bg)" : "transparent", boxShadow: active ? "inset 0 0 0 1px " + accent + "66" : "none", opacity: dragId === b.id ? 0.4 : 1, borderTop: isOver ? `2px solid ${accent}` : "2px solid transparent" }}>
                      <span className="pl-1.5 py-2 cursor-grab active:cursor-grabbing" style={{ color: "var(--text-muted)" }} onClick={e => e.stopPropagation()}><GripVertical className="w-3.5 h-3.5" /></span>
                      {renamingId === b.id ? (
                        <input autoFocus value={b.title} onChange={e => renameBlock(b.id, e.target.value)} onBlur={() => setRenamingId("")} onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setRenamingId(""); }} onClick={e => e.stopPropagation()} className="flex-1 min-w-0 rounded px-1.5 py-1 text-sm outline-none" style={inputStyle} />
                      ) : (
                        <button onDoubleClick={e => { e.stopPropagation(); setRenamingId(b.id); }} className="flex-1 flex items-center gap-1.5 py-2 text-left min-w-0">
                          <span className="text-sm truncate" style={{ color: active ? "var(--accent-text)" : b.visible ? "var(--text-primary)" : "var(--text-muted)", fontWeight: active ? 600 : 400 }}>{b.title || BLOCK_LABELS[b.type]}</span>
                          <span className="text-[9px] uppercase tracking-wide shrink-0" style={{ color: "var(--text-muted)" }}>{BLOCK_LABELS[b.type]}</span>
                        </button>
                      )}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: active ? 1 : undefined }}>
                        <IconBtn title="Duplicate" onClick={e => { e.stopPropagation(); duplicateBlock(b.id); }}><Copy className="w-3 h-3" /></IconBtn>
                        <IconBtn title="Delete" onClick={e => { e.stopPropagation(); removeBlock(b.id); }}><Trash2 className="w-3 h-3" /></IconBtn>
                      </div>
                      <IconBtn title={b.visible ? "Hide" : "Show"} onClick={e => { e.stopPropagation(); toggleVisible(b.id); }} active={b.visible} accent={accent}>{b.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</IconBtn>
                    </div>
                  );
                })}
              </div>

              {/* Add block */}
              <div className="relative mt-2 px-1" ref={addRef}>
                <button onClick={() => setAddOpen(o => !o)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-surface-2)]" style={{ border: "1px dashed var(--border)", color: "var(--text-secondary)" }}><Plus className="w-3.5 h-3.5" /> Add block</button>
                {addOpen && (
                  <div className="absolute left-1 right-1 bottom-full mb-1.5 z-40 rounded-xl p-1.5 max-h-80 overflow-y-auto thin-scroll-y" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 -8px 28px rgba(0,0,0,0.28)" }}>
                    {BLOCK_GROUPS.map(group => (
                      <div key={group} className="mb-1">
                        <p className="text-[9px] font-semibold uppercase tracking-widest px-2 py-1" style={{ color: "var(--text-muted)" }}>{group}</p>
                        {BLOCK_LIBRARY.filter(d => d.group === group).map(d => (
                          <button key={d.type} onClick={() => addBlock(d.type)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-sm transition-colors hover:bg-[var(--bg-surface-2)]" style={{ color: "var(--text-secondary)" }}>
                            <Plus className="w-3 h-3 shrink-0" style={{ color: "var(--text-muted)" }} /><span className="truncate">{d.label}</span>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Center canvas */}
        <div className="flex-1 overflow-y-auto thin-scroll-y" style={{ backgroundColor: preview ? "#e5e7eb" : "var(--bg-page)" }}>
          {preview && docData ? (
            <div className="p-6"><CustomProposalDocument data={docData} /></div>
          ) : (
            <div className="mx-auto px-6 py-6 space-y-3" style={{ maxWidth: "860px" }}>
              {/* Internal pricing pin */}
              {quote.pricing && <InternalPricingPin pricing={quote.pricing} open={pricingOpen} onToggle={() => setPricingOpen(o => !o)} onEdit={() => router.push(`/quotes/${id}/pricing`)} />}

              {visibleBlocks.length === 0 ? (
                <div className="rounded-2xl px-8 py-20 text-center" style={{ backgroundColor: "var(--bg-surface)", border: "1px dashed var(--border)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No visible blocks</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Add a block from the left to start building.</p>
                </div>
              ) : visibleBlocks.map(b => {
                const isSel = selected === b.id;
                return (
                  <div key={b.id} onClick={() => setSelected(b.id)}
                    className="rounded-2xl cursor-pointer transition-shadow"
                    style={{ backgroundColor: b.type === "divider" || b.type === "page_break" ? "transparent" : "var(--bg-surface)", border: b.type === "divider" || b.type === "page_break" ? "none" : "1px solid var(--border-subtle)", boxShadow: isSel ? `0 0 0 2px ${accent}, var(--shadow-card)` : (b.type === "divider" || b.type === "page_break" ? "none" : "var(--shadow-card)") }}>
                    <div className={b.type === "divider" || b.type === "page_break" ? "px-7 py-2" : "px-7 py-5"}>
                      <CanvasBlock b={b} selected={isSel} accent={accent} title={title}
                        lineItems={lineItems} totals={totals} taxRate={taxRate} options={options} monthly={quote.pricing?.monthly}
                        onContent={html => patchBlock(b.id, { content: html })} onSelectTier={selectTier} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right inspector */}
        {!preview && (
          <div className="w-[340px] shrink-0 overflow-y-auto thin-scroll-y" style={{ backgroundColor: "var(--bg-surface)", borderLeft: "1px solid var(--border-subtle)" }}>
            {!sel ? (
              <div className="p-6 text-center"><Search className="w-5 h-5 mx-auto mb-2" style={{ color: "var(--text-muted)" }} /><p className="text-sm" style={{ color: "var(--text-muted)" }}>Select a block to edit it here.</p></div>
            ) : (
              <div>
                <div className="sticky top-0 z-10 px-4 py-3 space-y-2" style={{ backgroundColor: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{BLOCK_LABELS[sel.type]}</p>
                  <div className="flex items-center gap-2">
                    <input value={sel.title} onChange={e => renameBlock(sel.id, e.target.value)} placeholder="Block label" className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-sm font-medium outline-none focus:ring-2" style={inputStyle} />
                    <button onClick={() => toggleVisible(sel.id)} title={sel.visible ? "Visible" : "Hidden"} className="flex items-center gap-1 text-[11px] font-medium px-2 py-1.5 rounded-lg shrink-0 transition-colors" style={{ border: "1px solid var(--border)", color: sel.visible ? "var(--accent-text)" : "var(--text-muted)", backgroundColor: sel.visible ? "var(--accent-soft-bg)" : "var(--bg-surface)" }}>{sel.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</button>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  <Inspector sel={sel} accent={accent} quote={quote} expiresAt={expiresAt} setExpiresAt={setExpiresAt}
                    title={title} setTitle={setTitle}
                    setBlockSettings={setBlockSettings} patchBlock={patchBlock} savedTerms={savedTerms}
                    items={items} setItem={setItem} addItem={addItem} removeItem={removeItem} taxRate={taxRate} setTaxRate={setTaxRate} totals={totals}
                    customerNotes={customerNotes} setCustomerNotes={setCustomerNotes} showCatalog={() => setShowCatalog(true)} showCost={showCost}
                    options={options} setOption={setOption} removeOption={removeOption} addOption={addOption} selectTier={selectTier} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showCatalog && <CatalogPicker items={catalog} showCost={showCost} onAdd={addCatalogItems} onClose={() => setShowCatalog(false)} />}
      {docData && <div className="print-doc" aria-hidden><CustomProposalDocument data={docData} shadow={false} /></div>}
    </div>
  );
}

// ─── Internal pricing pin (rep-only) ──────────────────────
function InternalPricingPin({ pricing, open, onToggle, onEdit }: { pricing: NonNullable<QuoteRecord["pricing"]>; open: boolean; onToggle: () => void; onEdit: () => void }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px dashed #d9770066", backgroundColor: "#d977060d" }}>
      <button onClick={onToggle} className="w-full flex items-center gap-2 px-4 py-2.5 text-left">
        <Lock className="w-3.5 h-3.5" style={{ color: "#d97706" }} />
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "#d97706" }}>Internal Pricing</span>
        <span className="text-sm font-bold tabular-nums ml-1" style={{ color: "var(--text-primary)" }}>{fmt(pricing.sellPrice)}</span>
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>sell · {(pricing.grossMargin * 100).toFixed(0)}% GM</span>
        <span className="ml-auto flex items-center gap-2">
          <span onClick={e => { e.stopPropagation(); onEdit(); }} className="flex items-center gap-1 text-[11px] font-medium" style={{ color: "var(--accent-text)" }}><Pencil className="w-3 h-3" /> Edit</span>
          <ChevronDown className="w-4 h-4 transition-transform" style={{ color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "none" }} />
        </span>
      </button>
      {open && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ backgroundColor: "var(--border-subtle)" }}>
          <Metric label="Total cost" value={fmt(pricing.totalCost)} />
          <Metric label="Gross profit" value={fmt(pricing.grossProfit)} sub={`${(pricing.grossMargin * 100).toFixed(1)}%`} />
          <Metric label="Net profit (est.)" value={fmt(pricing.netProfit)} sub={`${(pricing.netMargin * 100).toFixed(1)}%`} />
          <Metric label="Financing" value={`${fmt(pricing.monthly)}/mo`} sub={`${pricing.financeMonths} mo`} />
        </div>
      )}
      <div className="px-4 py-1.5 flex items-center gap-1.5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <TrendingUp className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Internal only — add a Price Summary or Line Items block to show a number to the customer.</p>
      </div>
    </div>
  );
}
function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (<div className="px-3 py-2.5" style={{ backgroundColor: "var(--bg-surface)" }}><p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p><p className="text-sm font-bold leading-tight mt-0.5 truncate tabular-nums" style={{ color: "var(--text-primary)" }}>{value}</p>{sub && <p className="text-[10px] mt-0.5 tabular-nums" style={{ color: "var(--text-muted)" }}>{sub}</p>}</div>);
}

// ─── Canvas block (document representation; rich edits in place) ──
function CanvasBlock({ b, selected, accent, title, lineItems, totals, taxRate, options, monthly, onContent, onSelectTier }: {
  b: QuoteBlock; selected: boolean; accent: string; title: string;
  lineItems: LineItem[]; totals: { subtotal: number; tax: number; total: number }; taxRate: string;
  options: QuoteOption[]; monthly?: number; onContent: (html: string) => void; onSelectTier: (id: string) => void;
}) {
  if (b.type === "divider") return <div className="h-px" style={{ backgroundColor: "var(--border)" }} />;
  if (b.type === "page_break") return <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}><div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} /> Page break <div className="flex-1 h-px" style={{ backgroundColor: "var(--border)" }} /></div>;

  if (b.type === "heading") {
    const lvl = b.settings?.level ?? 2;
    const cls = lvl === 1 ? "text-2xl" : lvl === 2 ? "text-xl" : "text-base";
    if (selected) return <input value={b.content} onChange={e => onContent(e.target.value)} onClick={e => e.stopPropagation()} placeholder="Heading text" className={`${cls} font-bold w-full bg-transparent outline-none`} style={{ color: "var(--text-primary)", textAlign: b.settings?.align ?? "left" }} />;
    return <p className={`${cls} font-bold`} style={{ color: "var(--text-primary)", textAlign: b.settings?.align ?? "left" }}>{b.content || <span style={{ color: "var(--text-muted)" }}>Heading</span>}</p>;
  }

  if (RICH_BLOCK_TYPES.includes(b.type)) {
    return (
      <>
        {b.title && <SecLabel>{b.title}</SecLabel>}
        {selected ? (
          <div onClick={e => e.stopPropagation()}><RichTextEditor key={b.id} value={b.content} onChange={onContent} placeholder="Write or paste text here…" /></div>
        ) : hasHtml(b.content)
          ? <div className="rte text-sm" style={{ color: "var(--text-secondary)" }} dangerouslySetInnerHTML={{ __html: b.content }} />
          : <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>Click to select, then write or paste text…</p>}
      </>
    );
  }

  if (b.type === "image") {
    const img = b.images?.[0];
    return (<>{b.title && <SecLabel>{b.title}</SecLabel>}
      {img?.src ? (<figure className="m-0" style={{ textAlign: b.settings?.align ?? "center" }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={img.src} alt={img.alt ?? b.title} className="inline-block rounded-lg" style={{ width: `${b.settings?.width ?? 100}%` }} />{img.caption && <figcaption className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>{img.caption}</figcaption>}</figure>)
        : <Placeholder icon={ImageIcon} text="Add an image from the inspector →" />}</>);
  }

  if (b.type === "image_gallery") {
    const imgs = (b.images ?? []).filter(i => i.src);
    return (<>{b.title && <SecLabel>{b.title}</SecLabel>}
      {imgs.length ? (<div className="grid grid-cols-2 gap-2.5">{imgs.map(im => (<figure key={im.id} className="m-0">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={im.src} alt={im.alt ?? ""} className="w-full rounded-lg" style={{ height: "130px", objectFit: "cover" }} />{im.caption && <figcaption className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{im.caption}</figcaption>}</figure>))}</div>)
        : <Placeholder icon={ImageIcon} text="Add photos from the inspector →" />}</>);
  }

  if (b.type === "equipment_card") {
    const s = b.settings ?? {}; const img = b.images?.[0];
    return (<><SecLabel>{b.title}</SecLabel>
      <div className="flex gap-3 rounded-xl p-3" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
        {img?.src && (/* eslint-disable-next-line @next/next/no-img-element */<img src={img.src} alt={b.title} className="rounded-lg" style={{ width: "96px", height: "96px", objectFit: "cover" }} />)}
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{b.title}</p>
          {(s.brand || s.model) && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{[s.brand, s.model].filter(Boolean).join(" · ")}</p>}
          {s.specs && <p className="text-xs mt-1 whitespace-pre-wrap" style={{ color: "var(--text-secondary)" }}>{s.specs}</p>}
          {typeof s.price === "number" && s.price > 0 && <p className="text-base font-bold mt-1 tabular-nums" style={{ color: "var(--text-primary)" }}>{fmt(s.price)}</p>}
        </div>
      </div></>);
  }

  if (b.type === "option_cards") {
    return (<><SecLabel>{b.title}</SecLabel>
      {options.length === 0 ? <Placeholder icon={Package} text="Add option cards from the inspector →" /> : (
        <div className="grid sm:grid-cols-3 gap-2.5">{options.map(o => (
          <button key={o.id} onClick={e => { e.stopPropagation(); onSelectTier(o.id); }} className="text-left rounded-xl p-3 transition-all overflow-hidden" style={{ border: `1.5px solid ${o.selected ? accent : "var(--border-subtle)"}`, backgroundColor: o.selected ? accent + "0f" : "var(--bg-surface)" }}>
            {o.image && (/* eslint-disable-next-line @next/next/no-img-element */<img src={o.image} alt={o.name} className="w-full rounded-lg mb-2" style={{ height: "92px", objectFit: "cover" }} />)}
            <div className="flex items-center justify-between">{o.tier && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: accent + "1a", color: accent }}>{o.tier}</span>}{o.selected && <Check className="w-3.5 h-3.5" style={{ color: accent }} />}</div>
            <p className="text-sm font-semibold mt-1.5 leading-snug" style={{ color: "var(--text-primary)" }}>{o.name}</p>
            <p className="text-lg font-bold mt-1 tabular-nums" style={{ color: "var(--text-primary)" }}>${o.price.toLocaleString()}</p>
            {o.monthlyPrice ? <p className="text-[11px] tabular-nums" style={{ color: accent }}>${o.monthlyPrice}/mo</p> : null}
          </button>))}</div>)}</>);
  }

  if (b.type === "line_items" || b.type === "price_summary") {
    const base = lineItems.filter(li => !li.optional);
    const itemized = b.type === "line_items" || (b.settings?.itemized ?? true);
    return (<><SecLabel>{b.title}</SecLabel>
      {base.length === 0 ? <Placeholder icon={Tag} text="Add line items from the inspector →" /> : (
        <div className="space-y-1.5">
          {itemized && base.map(li => (<div key={li.id} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate" style={{ color: "var(--text-primary)" }}>{li.name ?? li.description} <span style={{ color: "var(--text-muted)" }}>×{li.quantity}</span></span><span className="shrink-0 font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>{fmt(li.total)}</span></div>))}
          <div className="pt-2 mt-1 space-y-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <Row label="Subtotal" value={fmt(totals.subtotal)} />
            <Row label={`Tax (${taxRate}%)`} value={fmt(totals.tax)} />
            <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid var(--border-subtle)" }}><span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Total</span><span className="text-lg font-bold tabular-nums" style={{ color: accent }}>{fmt(totals.total)}</span></div>
            {b.type === "price_summary" && b.settings?.showMonthly && monthly ? <p className="text-[11px] text-right tabular-nums" style={{ color: accent }}>≈ {fmt(monthly)}/mo financed</p> : null}
          </div>
        </div>)}</>);
  }

  if (b.type === "approval_signature") {
    return (<><SecLabel>{b.title}</SecLabel>{b.content && <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>{b.content}</p>}
      <div className="grid grid-cols-2 gap-6">{["Customer Signature", "Date"].map(l => (<div key={l}><div className="h-9 rounded-lg" style={{ border: "1px dashed var(--border)", backgroundColor: "var(--bg-surface-2)" }} /><p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{l}</p></div>))}</div></>);
  }
  return null;
}

// ─── Inspector ────────────────────────────────────────────
function Inspector(props: {
  sel: QuoteBlock; accent: string; quote: QuoteRecord; expiresAt: string; setExpiresAt: (v: string) => void;
  title: string; setTitle: (v: string) => void;
  setBlockSettings: (id: string, patch: Record<string, unknown>) => void; patchBlock: (id: string, patch: Partial<QuoteBlock>) => void;
  savedTerms: { id: string; title: string; body: string }[];
  items: DraftItem[]; setItem: (id: string, patch: Partial<DraftItem>) => void; addItem: () => void; removeItem: (id: string) => void;
  taxRate: string; setTaxRate: (v: string) => void; totals: { subtotal: number; tax: number; total: number };
  customerNotes: string; setCustomerNotes: (v: string) => void; showCatalog: () => void; showCost: boolean;
  options: QuoteOption[]; setOption: (id: string, patch: Partial<QuoteOption>) => void; removeOption: (id: string) => void; addOption: () => void; selectTier: (id: string) => void;
}) {
  const { sel, accent } = props; const s = sel.settings ?? {};
  const setImages = (imgs: BlockImage[]) => props.patchBlock(sel.id, { images: imgs });

  if (sel.type === "heading") return (<>
    <Field label="Heading text"><input value={sel.content} onChange={e => props.patchBlock(sel.id, { content: e.target.value })} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2" style={inputStyle} /></Field>
    <Field label="Size"><UiSelect value={String(s.level ?? 2)} onChange={v => props.setBlockSettings(sel.id, { level: Number(v) })} options={[{ value: "1", label: "Large (H1)" }, { value: "2", label: "Medium (H2)" }, { value: "3", label: "Small (H3)" }]} /></Field>
    <Field label="Alignment"><AlignPicker value={s.align ?? "left"} onChange={a => props.setBlockSettings(sel.id, { align: a })} accent={accent} /></Field>
  </>);

  if (RICH_BLOCK_TYPES.includes(sel.type) && sel.type !== "terms") return (<>
    <ReadOnlyNote>Edit this text directly on the proposal — select the block and use its toolbar to format, paste, add lists, links, and a divider.</ReadOnlyNote>
  </>);

  if (sel.type === "terms") return (<>
    {props.savedTerms.length > 0 && (
      <Field label="Insert a saved terms block"><UiSelect value="" placeholder="Choose saved terms…" onChange={v => { const t = props.savedTerms.find(x => x.id === v); if (t) props.patchBlock(sel.id, { content: `<p>${t.body.replace(/\n/g, "</p><p>")}</p>` }); }} options={props.savedTerms.map(t => ({ value: t.id, label: t.title }))} /></Field>
    )}
    <ReadOnlyNote>Then edit the terms directly on the proposal with the block toolbar.</ReadOnlyNote>
  </>);

  if (sel.type === "image") return (<>
    <Field label="Image"><OptionImageInput value={sel.images?.[0]?.src} onChange={src => setImages(src ? [{ id: sel.images?.[0]?.id ?? imageId(), src, caption: sel.images?.[0]?.caption, alt: sel.images?.[0]?.alt }] : [])} accent={accent} /></Field>
    <Field label="Caption"><input value={sel.images?.[0]?.caption ?? ""} onChange={e => setImages([{ id: sel.images?.[0]?.id ?? imageId(), src: sel.images?.[0]?.src ?? "", caption: e.target.value, alt: sel.images?.[0]?.alt }])} placeholder="Optional caption" className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2" style={inputStyle} /></Field>
    <Field label="Alt text" hint="accessibility"><input value={sel.images?.[0]?.alt ?? ""} onChange={e => setImages([{ id: sel.images?.[0]?.id ?? imageId(), src: sel.images?.[0]?.src ?? "", caption: sel.images?.[0]?.caption, alt: e.target.value }])} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2" style={inputStyle} /></Field>
    <Field label={`Width (${s.width ?? 100}%)`}><input type="range" min={25} max={100} step={5} value={s.width ?? 100} onChange={e => props.setBlockSettings(sel.id, { width: Number(e.target.value) })} className="w-full accent-indigo-600" /></Field>
    <Field label="Alignment"><AlignPicker value={s.align ?? "center"} onChange={a => props.setBlockSettings(sel.id, { align: a })} accent={accent} /></Field>
  </>);

  if (sel.type === "image_gallery") {
    const imgs = sel.images ?? [];
    return (<>
      <div className="space-y-3">
        {imgs.map((im, i) => (
          <div key={im.id} className="rounded-lg p-2.5 space-y-2" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center justify-between"><span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Photo {i + 1}</span><button onClick={() => setImages(imgs.filter(x => x.id !== im.id))} className="p-1 rounded" style={{ color: "var(--text-muted)" }}><Trash2 className="w-3.5 h-3.5" /></button></div>
            <OptionImageInput value={im.src} onChange={src => setImages(imgs.map(x => x.id === im.id ? { ...x, src: src ?? "" } : x))} accent={accent} />
            <input value={im.caption ?? ""} onChange={e => setImages(imgs.map(x => x.id === im.id ? { ...x, caption: e.target.value } : x))} placeholder="Caption" className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2" style={inputStyle} />
          </div>
        ))}
        <button onClick={() => setImages([...imgs, { id: imageId(), src: "" }])} className="w-full flex items-center justify-center gap-1 text-xs font-medium py-2 rounded-lg" style={{ border: "1px dashed var(--border)", color: accent }}><Plus className="w-3.5 h-3.5" /> Add photo</button>
      </div>
    </>);
  }

  if (sel.type === "equipment_card") return (<>
    <Field label="Image"><OptionImageInput value={sel.images?.[0]?.src} onChange={src => setImages(src ? [{ id: imageId(), src }] : [])} accent={accent} /></Field>
    <div className="flex gap-2"><Field label="Brand"><input value={s.brand ?? ""} onChange={e => props.setBlockSettings(sel.id, { brand: e.target.value })} className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2" style={inputStyle} /></Field>
      <Field label="Model"><input value={s.model ?? ""} onChange={e => props.setBlockSettings(sel.id, { model: e.target.value })} className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2" style={inputStyle} /></Field></div>
    <Field label="Specs"><textarea value={s.specs ?? ""} onChange={e => props.setBlockSettings(sel.id, { specs: e.target.value })} rows={3} placeholder="Key specs / features" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-2" style={inputStyle} /></Field>
    <Field label="Price" hint="customer-facing"><div className="flex items-center gap-1"><span className="text-sm" style={{ color: "var(--text-muted)" }}>$</span><input type="number" min={0} value={s.price ?? ""} onChange={e => props.setBlockSettings(sel.id, { price: e.target.value === "" ? undefined : parseFloat(e.target.value) || 0 })} className="w-32 rounded-lg px-2.5 py-1.5 text-sm outline-none tabular-nums focus:ring-2" style={inputStyle} /></div></Field>
  </>);

  if (sel.type === "line_items") return <LineItemsEditor {...props} />;

  if (sel.type === "price_summary") return (<>
    <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-secondary)" }}><input type="checkbox" checked={s.itemized ?? true} onChange={e => props.setBlockSettings(sel.id, { itemized: e.target.checked })} className="accent-indigo-600" /> Itemized (list each line)</label>
    <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--text-secondary)" }}><input type="checkbox" checked={s.showMonthly ?? false} onChange={e => props.setBlockSettings(sel.id, { showMonthly: e.target.checked })} className="accent-indigo-600" /> Show monthly financing estimate</label>
    <div className="rounded-lg p-3" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}><div className="flex items-center justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>Customer total</span><span className="text-base font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{fmt(props.totals.total)}</span></div></div>
    <ReadOnlyNote>The total comes from the Line Items. Edit a Line Items block to change it.</ReadOnlyNote>
  </>);

  if (sel.type === "option_cards") return (<div className="space-y-3">
    <div className="flex items-center justify-between"><p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{props.options.length} option{props.options.length === 1 ? "" : "s"}</p><button onClick={props.addOption} className="flex items-center gap-1 text-xs font-medium" style={{ color: accent }}><Plus className="w-3.5 h-3.5" /> Add option</button></div>
    {props.options.length === 0 && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>No option cards yet. Add Good / Better / Best tiers.</p>}
    {props.options.map(o => <OptionEditor key={o.id} o={o} accent={accent} onChange={p => props.setOption(o.id, p)} onRemove={() => props.removeOption(o.id)} onToggleSelected={() => props.selectTier(o.id)} />)}
  </div>);

  if (sel.type === "approval_signature") return (<><Field label="Approval wording"><textarea value={sel.content} onChange={e => props.patchBlock(sel.id, { content: e.target.value })} rows={3} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-2" style={inputStyle} /></Field><ReadOnlyNote>E-signature isn&apos;t enabled yet — the proposal shows a signature line placeholder.</ReadOnlyNote></>);

  if (sel.type === "divider" || sel.type === "page_break") return <ReadOnlyNote>{sel.type === "divider" ? "A horizontal rule separating sections." : "Forces a new page when the proposal is printed or exported to PDF."}</ReadOnlyNote>;

  return <ReadOnlyNote>No settings for this block.</ReadOnlyNote>;
}

function LineItemsEditor(props: { items: DraftItem[]; setItem: (id: string, patch: Partial<DraftItem>) => void; addItem: () => void; removeItem: (id: string) => void; taxRate: string; setTaxRate: (v: string) => void; totals: { total: number }; showCatalog: () => void; accent: string; customerNotes: string; setCustomerNotes: (v: string) => void }) {
  const { accent } = props;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3"><button onClick={props.showCatalog} className="flex items-center gap-1 text-xs font-medium" style={{ color: accent }}><Package className="w-3.5 h-3.5" /> Catalog</button><button onClick={props.addItem} className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}><Plus className="w-3.5 h-3.5" /> Custom line</button></div>
      {props.items.map(it => (
        <div key={it.id} className="rounded-lg p-2.5 space-y-2" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
          {it.itemId && <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "var(--accent-text)" }}><Tag className="w-2.5 h-2.5" /> From catalog</div>}
          <input value={it.name} onChange={e => props.setItem(it.id, { name: e.target.value })} placeholder="Item name" className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2" style={inputStyle} />
          <input value={it.description} onChange={e => props.setItem(it.id, { description: e.target.value })} placeholder="Description" className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2" style={inputStyle} />
          <UiSelect size="sm" value={it.category} onChange={v => props.setItem(it.id, { category: v as LineItemCategory })} options={LINE_ITEM_CATEGORIES.map(c => ({ value: c, label: c }))} />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1"><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Qty</span><input type="number" min={0} value={it.quantity} onChange={e => props.setItem(it.id, { quantity: e.target.value })} className="w-14 rounded-lg px-2 py-1 text-xs outline-none tabular-nums focus:ring-2" style={inputStyle} /></div>
            <div className="flex items-center gap-1"><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>$</span><input type="number" min={0} step="0.01" value={it.unitPrice} onChange={e => props.setItem(it.id, { unitPrice: e.target.value })} className="w-20 rounded-lg px-2 py-1 text-xs outline-none tabular-nums focus:ring-2" style={inputStyle} /></div>
            <button onClick={() => props.removeItem(it.id)} className="ml-auto p-1 rounded-lg" style={{ color: "var(--text-muted)" }}><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: "var(--text-secondary)" }}><input type="checkbox" checked={it.taxable} onChange={e => props.setItem(it.id, { taxable: e.target.checked })} className="accent-indigo-600" /> Taxable</label>
            <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: "var(--text-secondary)" }}><input type="checkbox" checked={it.optional} onChange={e => props.setItem(it.id, { optional: e.target.checked })} className="accent-indigo-600" /> Optional</label>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2"><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Tax %</span><input type="number" min={0} step="0.1" value={props.taxRate} onChange={e => props.setTaxRate(e.target.value)} className="w-16 rounded px-1.5 py-0.5 text-xs outline-none tabular-nums focus:ring-2" style={inputStyle} /><span className="ml-auto text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{fmt(props.totals.total)}</span></div>
      <Field label="Customer notes" hint="on the quote"><textarea value={props.customerNotes} onChange={e => props.setCustomerNotes(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none focus:ring-2" style={inputStyle} /></Field>
    </div>
  );
}

function OptionEditor({ o, accent, onChange, onRemove, onToggleSelected }: { o: QuoteOption; accent: string; onChange: (patch: Partial<QuoteOption>) => void; onRemove: () => void; onToggleSelected: () => void }) {
  const numOr = (s: string) => (s === "" ? 0 : parseFloat(s) || 0);
  return (
    <div className="rounded-lg p-2.5 space-y-2" style={{ backgroundColor: "var(--bg-surface-2)", border: `1px solid ${o.selected ? accent : "var(--border-subtle)"}` }}>
      <div className="flex items-center gap-2">
        <UiSelect size="sm" value={o.tier ?? ""} onChange={v => onChange({ tier: (v || undefined) as QuoteOption["tier"] })} className="w-28" options={[{ value: "", label: "No tier" }, { value: "good", label: "Good" }, { value: "better", label: "Better" }, { value: "best", label: "Best" }]} />
        <button onClick={onToggleSelected} className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-1 rounded" style={{ backgroundColor: o.selected ? accent + "1a" : "var(--bg-input)", color: o.selected ? accent : "var(--text-muted)" }}><Check className="w-3 h-3" /> {o.selected ? "Selected" : "Select"}</button>
        <button onClick={onRemove} className="ml-auto p-1 rounded" style={{ color: "var(--text-muted)" }}><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
      <OptionImageInput value={o.image} onChange={v => onChange({ image: v })} accent={accent} />
      <input value={o.name} onChange={e => onChange({ name: e.target.value })} placeholder="Option name" className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2" style={inputStyle} />
      <div className="flex gap-2"><input value={o.brand ?? ""} onChange={e => onChange({ brand: e.target.value || undefined })} placeholder="Brand" className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2" style={inputStyle} /><input value={o.model ?? ""} onChange={e => onChange({ model: e.target.value || undefined })} placeholder="Model" className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2" style={inputStyle} /></div>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1"><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>$</span><input type="number" min={0} value={o.price} onChange={e => onChange({ price: numOr(e.target.value) })} className="w-24 rounded-lg px-2 py-1 text-xs outline-none tabular-nums focus:ring-2" style={inputStyle} /></div>
        <div className="flex items-center gap-1"><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>$/mo</span><input type="number" min={0} value={o.monthlyPrice ?? ""} onChange={e => onChange({ monthlyPrice: e.target.value === "" ? undefined : numOr(e.target.value) })} className="w-20 rounded-lg px-2 py-1 text-xs outline-none tabular-nums focus:ring-2" style={inputStyle} /></div>
      </div>
      <textarea value={(o.includes ?? []).join("\n")} onChange={e => onChange({ includes: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })} rows={2} placeholder="Included items (one per line)" className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none resize-none focus:ring-2" style={inputStyle} />
    </div>
  );
}

// ─── Small UI helpers ─────────────────────────────────────
function useCloseOnOutside(ref: React.RefObject<HTMLDivElement | null>, open: boolean, close: () => void) {
  useEffect(() => { if (!open) return; const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); }; document.addEventListener("mousedown", onDown); return () => document.removeEventListener("mousedown", onDown); }, [open, ref, close]);
}
function SummaryRow({ icon: Icon, label, value, muted }: { icon: typeof User; label: string; value: string; muted?: boolean }) {
  return (<div className="flex items-center gap-2"><Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} /><div className="min-w-0"><p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{label}</p><p className="text-xs font-medium truncate" style={{ color: muted ? "var(--text-muted)" : "var(--text-primary)" }}>{value}</p></div></div>);
}
function IconBtn({ children, title, onClick, active, accent }: { children: React.ReactNode; title: string; onClick: (e: React.MouseEvent) => void; active?: boolean; accent?: string }) {
  return (<button title={title} onClick={onClick} className="p-1 rounded-md transition-colors hover:bg-[var(--bg-surface-2)]" style={{ color: active ? (accent ?? "var(--accent-text)") : "var(--text-muted)" }}>{children}</button>);
}
function MenuItem({ icon: Icon, label, onClick, danger }: { icon: typeof Printer; label: string; onClick: () => void; danger?: boolean }) {
  return (<button onClick={onClick} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[var(--bg-surface-2)] transition-colors" style={{ color: danger ? "#ef4444" : "var(--text-secondary)" }}><Icon className="w-3.5 h-3.5 shrink-0" /> {label}</button>);
}
function AlignPicker({ value, onChange, accent }: { value: "left" | "center" | "right"; onChange: (a: "left" | "center" | "right") => void; accent: string }) {
  return (
    <div className="flex items-center rounded-lg overflow-hidden w-fit" style={{ border: "1px solid var(--border)" }}>
      {(["left", "center", "right"] as const).map(a => (
        <button key={a} onClick={() => onChange(a)} className="px-3 py-1.5 text-xs font-medium capitalize transition-colors" style={{ backgroundColor: value === a ? accent : "var(--bg-surface)", color: value === a ? "#fff" : "var(--text-secondary)" }}>{a}</button>
      ))}
    </div>
  );
}
function Placeholder({ icon: Icon, text }: { icon: typeof Package; text: string }) {
  return (<div className="rounded-lg px-3 py-5 text-center" style={{ border: "1px dashed var(--border)" }}><Icon className="w-4 h-4 mx-auto mb-1" style={{ color: "var(--text-muted)" }} /><p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{text}</p></div>);
}
function hasHtml(html: string): boolean { return !!html && html.replace(/<[^>]*>/g, "").trim().length > 0; }
const inputStyle: React.CSSProperties = { border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" };
function SecLabel({ children }: { children: React.ReactNode }) { return <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{children}</p>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span><span className="text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>{value}</span></div>; }
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) { return <div><label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{label}{hint && <span style={{ color: "var(--text-muted)" }}> ({hint})</span>}</label>{children}</div>; }
function ReadOnlyNote({ children }: { children: React.ReactNode }) { return <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{children}</p>; }
