"use client";

// Proposal Workspace — the premium, section-based proposal experience for the
// "Proposal From Template" and "Custom Proposal" quote paths. This REPLACES the
// old all-in-one quote builder; it does not import or render it.
//
//   • Template quotes  → render the salesbook/template sections + copied option cards.
//   • Custom quotes    → render an internal pricing summary (from the wizard) + starter sections.
//
// Everything on the quote is a snapshot copy, so editing here never changes the
// master salesbook/template.
//
// Layout: 3 panels under a top bar.
//   Left   → proposal structure: drag-reorder, show/hide, rename, duplicate, delete, add modules.
//   Center → live canvas of selectable section cards (Preview swaps to the paper document).
//   Right  → inspector that edits the selected section.

import { use, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Eye, EyeOff, Send, FileText, MoreHorizontal, Cloud, CloudOff,
  Plus, Trash2, Package, Tag, Monitor, Pencil, Printer, Download, Copy, Link2,
  RotateCcw, Archive, GripVertical, Lock, LayoutTemplate, SlidersHorizontal,
  User, MapPin, TrendingUp, Check, Search, ShieldCheck,
} from "lucide-react";
import UiSelect from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import CatalogPicker from "@/components/quotes/CatalogPicker";
import OptionImageInput from "@/components/quotes/OptionImageInput";
import ProposalDocument from "@/components/quotes/ProposalDocument";
import { buildProposalDoc } from "@/lib/quotes/proposalDoc";
import { downloadProposalPdf } from "@/lib/quotes/proposalPdf";
import {
  getQuote, autosaveQuote, updateQuoteStatus, computeTotals, fmt,
  duplicateQuote, archiveQuote, deleteQuote, quoteSectionId, ensureSectionIds,
  type QuoteRecord, type QuoteSection, type QuoteOption, type LineItem,
} from "@/lib/quotes/data";
import { getAllItems, itemToQuoteLine, getItemDefaults, type Item } from "@/lib/items/data";
import { LINE_ITEM_CATEGORIES, QUOTE_STATUS_STYLE, QUOTE_MODE_LABELS, type LineItemCategory, type QuoteStatus } from "@/lib/quotes/types";
import {
  getProposalBranding, getSectionBlock, SECTION_LABELS, SECTION_CATALOG,
  STRUCTURAL_SECTION_KEYS, INTERNAL_SECTION_KEYS, type SectionKey,
} from "@/lib/proposals/data";

// ─── Draft line item (string-backed) ──────────────────────
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

const OPTION_SECTIONS: SectionKey[] = ["gbb_options", "optional_addons"];

type SaveState = "idle" | "saving" | "saved";

export default function ProposalWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const branding = useMemo(() => getProposalBranding(), []);
  const itemDefaults = useMemo(() => getItemDefaults(), []);

  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState<QuoteRecord | null>(null);

  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<QuoteSection[]>([]);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [options, setOptions] = useState<QuoteOption[]>([]);
  const [taxRate, setTaxRate] = useState("0");
  const [customerNotes, setCustomerNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [selected, setSelected] = useState<string>("");      // selected section id
  const [preview, setPreview] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [moreOpen, setMoreOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string>("");
  const [dragId, setDragId] = useState<string>("");
  const [overId, setOverId] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const hydratedRef = useRef(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = getQuote(id);
    if (q) {
      let secs = ensureSectionIds(q.sections ?? [{ key: "line_items", label: "Line Items", body: "", visible: true }]);
      // Custom quotes carry a pricing worksheet — surface it as an internal-only
      // module at the top so the rep can reorder/hide it (excluded from preview/PDF).
      if (q.quoteMode === "custom" && q.pricing && !secs.some(s => s.key === "internal_pricing_summary")) {
        secs = [{ id: quoteSectionId(), key: "internal_pricing_summary", label: "Internal Pricing Summary", body: "", visible: true }, ...secs];
      }
      setQuote(q);
      setTitle(q.title);
      setSections(secs);
      setItems(q.lineItems.length ? q.lineItems.map(lineToDraft) : [blankItem()]);
      setOptions(q.options ?? []);
      setTaxRate(q.subtotal > 0 ? String(Math.round((q.tax / q.subtotal) * 1000) / 10) : "0");
      setCustomerNotes(q.customerNotes ?? "");
      setExpiresAt(q.expiresAt ?? "");
      const firstVisible = secs.find(s => s.visible) ?? secs[0];
      setSelected(firstVisible?.id ?? "");
    }
    setLoading(false);
  }, [id]);

  const lineItems = useMemo(() => draftsToLines(items), [items]);
  const totals = useMemo(() => computeTotals(lineItems, (parseFloat(taxRate) || 0) / 100), [lineItems, taxRate]);
  const catalog = useMemo(() => getAllItems().filter(i => i.active && (!quote || i.companyId === quote.companyId)), [quote]);

  const docData = useMemo(() => {
    if (!quote) return null;
    return buildProposalDoc({
      quoteNumber: quote.quoteNumber, title: title || "Proposal",
      customerName: quote.customerName, locationName: quote.locationName, propertyLabel: quote.propertyLabel,
      assignedTo: quote.assignedTo ?? quote.createdBy, createdAt: quote.createdAt,
      expiresAt: expiresAt || undefined,
      sections, lineItems, options, subtotal: totals.subtotal, tax: totals.tax, total: totals.total,
      taxRatePct: parseFloat(taxRate) || 0, customerNotes: customerNotes || undefined,
    });
  }, [quote, title, sections, lineItems, options, totals.subtotal, totals.tax, totals.total, taxRate, customerNotes, expiresAt]);

  // Autosave (debounced) — skips the first run after hydration.
  useEffect(() => {
    if (loading || !quote) return;
    if (!hydratedRef.current) { hydratedRef.current = true; return; }
    setSaveState("saving");
    const t = setTimeout(() => {
      autosaveQuote(id, {
        title: title.trim() || "Untitled Proposal", sections, lineItems, options,
        subtotal: totals.subtotal, tax: totals.tax, total: totals.total,
        expiresAt: expiresAt || undefined, customerNotes: customerNotes || undefined,
      });
      setSaveState("saved");
    }, 600);
    return () => clearTimeout(t);
  }, [title, sections, lineItems, options, taxRate, customerNotes, expiresAt, loading, quote, id, totals.subtotal, totals.tax, totals.total]);

  useCloseOnOutside(moreRef, moreOpen, () => setMoreOpen(false));
  useCloseOnOutside(addRef, addOpen, () => setAddOpen(false));

  // ─── Section ops (keyed by stable id) ───────────────────
  const setSectionBody = (sid: string, body: string) => setSections(p => p.map(s => s.id === sid ? { ...s, body } : s));
  const renameSection = (sid: string, label: string) => setSections(p => p.map(s => s.id === sid ? { ...s, label } : s));
  const toggleVisible = (sid: string) => setSections(p => p.map(s => s.id === sid ? { ...s, visible: !s.visible } : s));
  function removeSection(sid: string) {
    setSections(prev => {
      const next = prev.filter(s => s.id !== sid);
      if (selected === sid) setSelected(next.find(s => s.visible)?.id ?? next[0]?.id ?? "");
      return next;
    });
  }
  function duplicateSection(sid: string) {
    setSections(prev => {
      const i = prev.findIndex(s => s.id === sid);
      if (i < 0) return prev;
      const copy: QuoteSection = { ...prev[i], id: quoteSectionId(), label: `${prev[i].label} (Copy)`, locked: false };
      const next = [...prev]; next.splice(i + 1, 0, copy);
      setSelected(copy.id!);
      return next;
    });
  }
  function addSection(key: SectionKey) {
    const block = getSectionBlock(key);
    const sec: QuoteSection = {
      id: quoteSectionId(), key, label: SECTION_LABELS[key] ?? "Section",
      body: block?.defaultBody ?? "", visible: true,
    };
    setSections(prev => [...prev, sec]);
    setSelected(sec.id!);
    setAddOpen(false);
  }
  function reorder(fromId: string, targetId: string) {
    if (!fromId || fromId === targetId) return;
    setSections(prev => {
      const from = prev.findIndex(s => s.id === fromId);
      if (from < 0) return prev;
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      const to = arr.findIndex(s => s.id === targetId);
      arr.splice(to < 0 ? arr.length : to, 0, moved);
      return arr;
    });
  }

  // ─── Line item ops ──────────────────────────────────────
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
  // ─── Option ops ─────────────────────────────────────────
  const selectTier = (oid: string) => setOptions(p => p.map(o => ({ ...o, selected: o.id === oid ? !o.selected : o.selected })));
  const setOption = (oid: string, patch: Partial<QuoteOption>) => setOptions(p => p.map(o => o.id === oid ? { ...o, ...patch } : o));
  const removeOption = (oid: string) => setOptions(p => p.filter(o => o.id !== oid));
  const addOption = () => setOptions(p => [...p, { id: `qopt-${Date.now()}-${p.length}`, name: "New option", price: 0 }]);
  function addOptionAsLineItem(o: QuoteOption) {
    setItems(prev => [...prev.filter(it => it.name.trim() || it.description.trim() || it.itemId), {
      id: uid(), name: o.name, description: o.description ?? o.name,
      quantity: "1", unitPrice: String(o.price), category: "Equipment", taxable: true, optional: false,
    }]);
  }

  // ─── Persist + lifecycle ────────────────────────────────
  function persist() {
    autosaveQuote(id, {
      title: title.trim() || "Untitled Proposal", sections, lineItems, options,
      subtotal: totals.subtotal, tax: totals.tax, total: totals.total,
      expiresAt: expiresAt || undefined, customerNotes: customerNotes || undefined,
    });
  }
  function saveDraftAndExit() { persist(); router.push(`/quotes/${id}`); }
  function sendQuote() { persist(); updateQuoteStatus(id, "sent"); router.push(`/quotes/${id}`); }
  function printProposal() {
    setMoreOpen(false);
    const prev = document.title;
    document.title = `${quote?.quoteNumber} — ${quote?.customerName}`;
    const restore = () => { document.title = prev; window.removeEventListener("afterprint", restore); };
    window.addEventListener("afterprint", restore);
    window.print();
  }
  function downloadPdf() { setMoreOpen(false); if (docData) downloadProposalPdf(docData); }
  function handleDuplicate() {
    setMoreOpen(false); persist();
    const copy = duplicateQuote(id);
    if (copy) router.push(`/quotes/${copy.id}/${copy.quoteMode === "quick" ? "quick" : "proposal"}`);
  }
  function copyLink() {
    setMoreOpen(false);
    try {
      navigator.clipboard?.writeText(`${window.location.origin}/quotes/${id}`);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }
  function resetLayout() {
    setMoreOpen(false);
    if (!window.confirm("Reset layout? Every section becomes visible and returns to the standard order. Your content is kept.")) return;
    const order = SECTION_CATALOG.map(c => c.key);
    setSections(prev => [...prev].map(s => ({ ...s, visible: true }))
      .sort((a, b) => order.indexOf(a.key as SectionKey) - order.indexOf(b.key as SectionKey)));
  }
  function handleArchive() { setMoreOpen(false); persist(); archiveQuote(id); router.push(`/quotes/${id}`); }
  function handleDelete() {
    setMoreOpen(false);
    if (!window.confirm("Delete this quote? This removes it from your active quotes.")) return;
    deleteQuote(id); router.push("/quotes");
  }

  if (loading) return <div className="p-10 text-sm" style={{ color: "var(--text-muted)" }}>Loading workspace…</div>;
  if (!quote) return (
    <div className="p-10">
      <Link href="/quotes" className="flex items-center gap-1.5 text-sm mb-3" style={{ color: "var(--text-secondary)" }}><ArrowLeft className="w-4 h-4" /> Back to Quotes</Link>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>Quote not found.</p>
    </div>
  );

  const statusStyle = QUOTE_STATUS_STYLE[quote.status as QuoteStatus];
  const sel = sections.find(s => s.id === selected);
  const accent = branding.accentColor || "#4f46e5";
  const isCustom = quote.quoteMode === "custom";
  const ModeIcon = isCustom ? SlidersHorizontal : LayoutTemplate;
  const modeColor = isCustom ? "#7c3aed" : "#0891b2";
  const modeLabel = QUOTE_MODE_LABELS[quote.quoteMode ?? "custom"];
  const showCost = itemDefaults.showCostField;
  const visibleSections = sections.filter(s => s.visible);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-5 py-2.5 shrink-0" style={{ backgroundColor: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
        <Link href={`/quotes/${id}`} className="flex items-center gap-1.5 text-sm shrink-0 transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft className="w-4 h-4" /> Quotes
        </Link>
        <div className="w-px h-5" style={{ backgroundColor: "var(--border)" }} />
        <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: modeColor + "1a", color: modeColor }}>
          <ModeIcon className="w-3 h-3" /> {modeLabel}
        </span>
        <span className="text-sm font-semibold tabular-nums shrink-0" style={{ color: "var(--text-primary)" }}>{quote.quoteNumber}</span>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}>{statusStyle.label}</span>
        <span className="flex items-center gap-1.5 text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>
          {saveState === "saving" ? <><CloudOff className="w-3.5 h-3.5" /> Saving…</> : saveState === "saved" ? <><Cloud className="w-3.5 h-3.5" style={{ color: "#10b981" }} /> Saved</> : <><Cloud className="w-3.5 h-3.5" /> Autosave on</>}
        </span>

        <div className="flex-1" />

        <button onClick={() => setPreview(p => !p)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
          style={{ border: "1px solid var(--border)", backgroundColor: preview ? "var(--accent-soft-bg)" : "var(--bg-surface)", color: preview ? "var(--accent-text)" : "var(--text-secondary)" }}>
          {preview ? <Pencil className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />} {preview ? "Edit" : "Preview"}
        </button>
        <button onClick={saveDraftAndExit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors hover:bg-[var(--bg-surface-2)]" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
          <FileText className="w-3.5 h-3.5" /> Save Draft
        </button>
        <button onClick={sendQuote} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-white transition-transform active:scale-[0.98]" style={{ backgroundColor: accent, boxShadow: "0 2px 8px " + accent + "55" }}>
          <Send className="w-3.5 h-3.5" /> Send Quote
        </button>
        <div className="relative" ref={moreRef}>
          <button onClick={() => setMoreOpen(o => !o)} className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-surface-2)]" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}><MoreHorizontal className="w-4 h-4" /></button>
          {moreOpen && (
            <div className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl p-1" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 12px 32px rgba(0,0,0,0.28)" }}>
              <MenuItem icon={Copy} label="Duplicate quote" onClick={handleDuplicate} />
              <MenuItem icon={Download} label="Download PDF" onClick={downloadPdf} />
              <MenuItem icon={Printer} label="Print proposal" onClick={printProposal} />
              <MenuItem icon={copied ? Check : Link2} label={copied ? "Link copied" : "Copy link"} onClick={copyLink} />
              <div className="my-1 h-px" style={{ backgroundColor: "var(--border-subtle)" }} />
              <MenuItem icon={RotateCcw} label="Reset layout" onClick={resetLayout} />
              <MenuItem icon={Archive} label="Archive quote" onClick={handleArchive} />
              <MenuItem icon={Trash2} label="Delete quote" onClick={handleDelete} danger />
            </div>
          )}
        </div>
      </div>

      {/* ── Workspace ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: structure */}
        {!preview && (
          <div className="w-[270px] shrink-0 flex flex-col" style={{ backgroundColor: "var(--bg-surface)", borderRight: "1px solid var(--border-subtle)" }}>
            {/* Customer / property summary */}
            <div className="p-3 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <div className="rounded-xl p-3 space-y-2.5" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
                <SummaryRow icon={User} label="Customer" value={quote.customerName} />
                <SummaryRow icon={MapPin} label="Property" value={quote.propertyLabel ?? "—"} muted={!quote.propertyLabel} />
              </div>
            </div>

            {/* Section list */}
            <div className="flex-1 overflow-y-auto thin-scroll-y px-2 py-3">
              <div className="flex items-center justify-between px-2 mb-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Proposal Structure</p>
                <span className="text-[10px] tabular-nums" style={{ color: "var(--text-muted)" }}>{visibleSections.length}/{sections.length}</span>
              </div>

              <div className="space-y-0.5">
                {sections.map((s, i) => {
                  const active = selected === s.id;
                  const isInternal = INTERNAL_SECTION_KEYS.includes(s.key as SectionKey);
                  const isOver = overId === s.id && dragId && dragId !== s.id;
                  const empty = !s.body && !STRUCTURAL_SECTION_KEYS.includes(s.key as SectionKey);
                  return (
                    <div key={s.id}
                      draggable={renamingId !== s.id}
                      onDragStart={e => { setDragId(s.id!); e.dataTransfer.effectAllowed = "move"; }}
                      onDragOver={e => { e.preventDefault(); setOverId(s.id!); }}
                      onDrop={e => { e.preventDefault(); reorder(dragId, s.id!); setDragId(""); setOverId(""); }}
                      onDragEnd={() => { setDragId(""); setOverId(""); }}
                      onClick={() => setSelected(s.id!)}
                      className="group relative flex items-center gap-1 rounded-lg pr-1 transition-colors cursor-pointer"
                      style={{
                        backgroundColor: active ? "var(--accent-soft-bg)" : "transparent",
                        boxShadow: active ? "inset 0 0 0 1px " + accent + "66" : "none",
                        opacity: dragId === s.id ? 0.4 : 1,
                        borderTop: isOver ? `2px solid ${accent}` : "2px solid transparent",
                      }}>
                      <span className="pl-1.5 py-2 cursor-grab active:cursor-grabbing touch-none" style={{ color: "var(--text-muted)" }} onClick={e => e.stopPropagation()}>
                        <GripVertical className="w-3.5 h-3.5" />
                      </span>
                      {renamingId === s.id ? (
                        <input autoFocus value={s.label}
                          onChange={e => renameSection(s.id!, e.target.value)}
                          onBlur={() => setRenamingId("")}
                          onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setRenamingId(""); }}
                          onClick={e => e.stopPropagation()}
                          className="flex-1 min-w-0 rounded px-1.5 py-1 text-sm outline-none" style={inputStyle} />
                      ) : (
                        <button onDoubleClick={e => { e.stopPropagation(); setRenamingId(s.id!); }}
                          className="flex-1 flex items-center gap-1.5 py-2 text-left min-w-0">
                          <span className="text-sm truncate" style={{ color: active ? "var(--accent-text)" : s.visible ? "var(--text-primary)" : "var(--text-muted)", fontWeight: active ? 600 : 400 }}>{s.label}</span>
                          {isInternal && <Lock className="w-2.5 h-2.5 shrink-0" style={{ color: "#d97706" }} aria-label="Internal only" />}
                          {empty && <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: "var(--text-muted)" }} title="Empty section" />}
                        </button>
                      )}
                      {/* Row actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ opacity: active ? 1 : undefined }}>
                        <IconBtn title="Duplicate" onClick={e => { e.stopPropagation(); duplicateSection(s.id!); }}><Copy className="w-3 h-3" /></IconBtn>
                        <IconBtn title="Delete" onClick={e => { e.stopPropagation(); removeSection(s.id!); }}><Trash2 className="w-3 h-3" /></IconBtn>
                      </div>
                      <IconBtn title={s.visible ? "Hide" : "Show"} onClick={e => { e.stopPropagation(); toggleVisible(s.id!); }} active={s.visible} accent={accent}>
                        {s.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </IconBtn>
                    </div>
                  );
                })}
              </div>

              {/* Add module */}
              <div className="relative mt-2 px-1" ref={addRef}>
                <button onClick={() => setAddOpen(o => !o)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--bg-surface-2)]"
                  style={{ border: "1px dashed var(--border)", color: "var(--text-secondary)" }}>
                  <Plus className="w-3.5 h-3.5" /> Add module
                </button>
                {addOpen && (
                  <div className="absolute left-1 right-1 bottom-full mb-1.5 z-40 rounded-xl p-1 max-h-72 overflow-y-auto thin-scroll-y" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 -8px 28px rgba(0,0,0,0.28)" }}>
                    {SECTION_CATALOG.map(c => (
                      <button key={c.key} onClick={() => addSection(c.key)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-sm transition-colors hover:bg-[var(--bg-surface-2)]" style={{ color: "var(--text-secondary)" }}>
                        <Plus className="w-3 h-3 shrink-0" style={{ color: "var(--text-muted)" }} />
                        <span className="truncate">{c.label}</span>
                        {INTERNAL_SECTION_KEYS.includes(c.key) && <Lock className="w-2.5 h-2.5 ml-auto shrink-0" style={{ color: "#d97706" }} />}
                      </button>
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
            <div className="p-6"><ProposalDocument data={docData} /></div>
          ) : (
            <div className="mx-auto px-6 py-6 space-y-3" style={{ maxWidth: "820px" }}>
              {visibleSections.length === 0 ? (
                <div className="rounded-2xl px-8 py-20 text-center" style={{ backgroundColor: "var(--bg-surface)", border: "1px dashed var(--border)" }}>
                  <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No visible sections</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Toggle a section visible or add a module from the left.</p>
                </div>
              ) : visibleSections.map(s => {
                const isSel = selected === s.id;
                const isInternal = INTERNAL_SECTION_KEYS.includes(s.key as SectionKey);
                if (isInternal) {
                  return (
                    <div key={s.id} onClick={() => setSelected(s.id!)}
                      className="rounded-2xl overflow-hidden cursor-pointer transition-shadow"
                      style={{ border: `1px dashed ${isSel ? accent : "#d97706"}`, boxShadow: isSel ? `0 0 0 2px ${accent}55` : "none" }}>
                      {quote.pricing
                        ? <PricingSummary pricing={quote.pricing} accent={modeColor} onEdit={() => router.push(`/quotes/${id}/pricing`)} />
                        : <div className="px-5 py-6 text-center" style={{ backgroundColor: "var(--bg-surface)" }}>
                            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No pricing worksheet yet.</p>
                            <button onClick={() => router.push(`/quotes/${id}/pricing`)} className="mt-2 text-xs font-medium" style={{ color: accent }}>Open the Pricing Wizard →</button>
                          </div>}
                    </div>
                  );
                }
                return (
                  <div key={s.id} onClick={() => setSelected(s.id!)}
                    className="rounded-2xl overflow-hidden cursor-pointer transition-shadow"
                    style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: isSel ? `0 0 0 2px ${accent}, var(--shadow-card)` : "var(--shadow-card)" }}>
                    <div className="px-7 py-5">
                      <SectionBody section={s} branding={branding} accent={accent} title={title} quote={quote}
                        lineItems={lineItems} totals={totals} taxRate={taxRate} customerNotes={customerNotes} expiresAt={expiresAt}
                        options={options} onSelectTier={selectTier} onEditBody={setSectionBody} editable={isSel} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right inspector */}
        {!preview && (
          <div className="w-[330px] shrink-0 overflow-y-auto thin-scroll-y" style={{ backgroundColor: "var(--bg-surface)", borderLeft: "1px solid var(--border-subtle)" }}>
            {!sel ? (
              <div className="p-6 text-center">
                <Search className="w-5 h-5 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Select a section to edit it here.</p>
              </div>
            ) : (
              <div>
                {/* Inspector header */}
                <div className="sticky top-0 z-10 px-4 py-3 space-y-2" style={{ backgroundColor: "var(--bg-surface)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{SECTION_LABELS[sel.key as SectionKey] ?? "Section"}</p>
                  <div className="flex items-center gap-2">
                    <input value={sel.label} onChange={e => renameSection(sel.id!, e.target.value)} placeholder="Section title"
                      className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-sm font-medium outline-none focus:ring-2" style={inputStyle} />
                    <button onClick={() => toggleVisible(sel.id!)} title={sel.visible ? "Visible" : "Hidden"}
                      className="flex items-center gap-1 text-[11px] font-medium px-2 py-1.5 rounded-lg shrink-0 transition-colors"
                      style={{ border: "1px solid var(--border)", color: sel.visible ? "var(--accent-text)" : "var(--text-muted)", backgroundColor: sel.visible ? "var(--accent-soft-bg)" : "var(--bg-surface)" }}>
                      {sel.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <Inspector
                    sel={sel} accent={accent} quote={quote}
                    title={title} setTitle={setTitle}
                    expiresAt={expiresAt} setExpiresAt={setExpiresAt}
                    setSectionBody={setSectionBody}
                    items={items} setItem={setItem} addItem={addItem} removeItem={removeItem}
                    taxRate={taxRate} setTaxRate={setTaxRate} totals={totals}
                    customerNotes={customerNotes} setCustomerNotes={setCustomerNotes}
                    showCatalog={() => setShowCatalog(true)} showCost={showCost}
                    options={options} setOption={setOption} removeOption={removeOption} addOption={addOption}
                    selectTier={selectTier} addOptionAsLineItem={addOptionAsLineItem}
                    onEditPricing={() => router.push(`/quotes/${id}/pricing`)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showCatalog && <CatalogPicker items={catalog} showCost={showCost} onAdd={addCatalogItems} onClose={() => setShowCatalog(false)} />}
      {docData && <div className="print-doc" aria-hidden><ProposalDocument data={docData} shadow={false} /></div>}
    </div>
  );
}

// ─── Small UI helpers ─────────────────────────────────────
function useCloseOnOutside(ref: React.RefObject<HTMLDivElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, ref, close]);
}

function SummaryRow({ icon: Icon, label, value, muted }: { icon: typeof User; label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
      <div className="min-w-0">
        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-xs font-medium truncate" style={{ color: muted ? "var(--text-muted)" : "var(--text-primary)" }}>{value}</p>
      </div>
    </div>
  );
}

function IconBtn({ children, title, onClick, active, accent }: {
  children: React.ReactNode; title: string; onClick: (e: React.MouseEvent) => void; active?: boolean; accent?: string;
}) {
  return (
    <button title={title} onClick={onClick} className="p-1 rounded-md transition-colors hover:bg-[var(--bg-surface-2)]"
      style={{ color: active ? (accent ?? "var(--accent-text)") : "var(--text-muted)" }}>
      {children}
    </button>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: typeof Printer; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-[var(--bg-surface-2)] transition-colors"
      style={{ color: danger ? "#ef4444" : "var(--text-secondary)" }}>
      <Icon className="w-3.5 h-3.5 shrink-0" /> {label}
    </button>
  );
}

// ─── Pricing summary (custom quotes / internal module) ────
function PricingSummary({ pricing, accent, onEdit }: { pricing: NonNullable<QuoteRecord["pricing"]>; accent: string; onEdit: () => void }) {
  return (
    <div style={{ backgroundColor: "var(--bg-surface)" }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/80"><Lock className="w-3 h-3" /> Internal · Recommended Sell Price</p>
          <p className="text-2xl font-bold text-white mt-0.5 tabular-nums">{fmt(pricing.sellPrice)}</p>
          <p className="text-[11px] text-white/80 mt-0.5 tabular-nums">≈ {fmt(pricing.monthly)}/mo · {pricing.financeMonths} mo</p>
        </div>
        <button onClick={e => { e.stopPropagation(); onEdit(); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/20 text-white hover:bg-white/30 transition-colors">
          <Pencil className="w-3.5 h-3.5" /> Edit pricing
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ backgroundColor: "var(--border-subtle)" }}>
        <Metric label="Total cost" value={fmt(pricing.totalCost)} />
        <Metric label="Gross profit" value={fmt(pricing.grossProfit)} sub={`${(pricing.grossMargin * 100).toFixed(1)}% margin`} />
        <Metric label="Net profit (est.)" value={fmt(pricing.netProfit)} sub={`${(pricing.netMargin * 100).toFixed(1)}% margin`} />
        <Metric label="Labor" value={`${pricing.laborHours}h @ $${pricing.laborRate}`} sub={`+${pricing.laborBurdenPct}% burden`} />
      </div>
      <div className="px-4 py-2 flex items-center gap-1.5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <TrendingUp className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Internal figures — never shown to the customer on the proposal.</p>
      </div>
    </div>
  );
}
function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-3 py-2.5" style={{ backgroundColor: "var(--bg-surface)" }}>
      <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-sm font-bold leading-tight mt-0.5 truncate tabular-nums" style={{ color: "var(--text-primary)" }}>{value}</p>
      {sub && <p className="text-[10px] mt-0.5 truncate tabular-nums" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}

// ─── Inspector (right panel — switches on section type) ───
function Inspector(props: {
  sel: QuoteSection; accent: string; quote: QuoteRecord;
  title: string; setTitle: (v: string) => void;
  expiresAt: string; setExpiresAt: (v: string) => void;
  setSectionBody: (id: string, body: string) => void;
  items: DraftItem[]; setItem: (id: string, patch: Partial<DraftItem>) => void; addItem: () => void; removeItem: (id: string) => void;
  taxRate: string; setTaxRate: (v: string) => void; totals: { subtotal: number; tax: number; total: number };
  customerNotes: string; setCustomerNotes: (v: string) => void;
  showCatalog: () => void; showCost: boolean;
  options: QuoteOption[]; setOption: (id: string, patch: Partial<QuoteOption>) => void; removeOption: (id: string) => void; addOption: () => void;
  selectTier: (id: string) => void; addOptionAsLineItem: (o: QuoteOption) => void;
  onEditPricing: () => void;
}) {
  const { sel, accent, quote } = props;
  const key = sel.key as SectionKey;

  if (key === "cover_header") return (
    <>
      <Field label="Proposal title"><input value={props.title} onChange={e => props.setTitle(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2" style={inputStyle} /></Field>
      <Field label="Expires"><DatePicker value={props.expiresAt} onChange={props.setExpiresAt} placeholder="No expiry" /></Field>
      <Field label="Intro wording"><textarea value={sel.body} onChange={e => props.setSectionBody(sel.id!, e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-2" style={inputStyle} /></Field>
      <ReadOnlyNote>The cover shows your company branding from Settings → Proposal Builder.</ReadOnlyNote>
    </>
  );

  if (key === "customer_info" || key === "property_info") return (
    <>
      <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
        {key === "customer_info" ? (
          <><p className="font-medium" style={{ color: "var(--text-primary)" }}>{quote.customerName}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{quote.locationName}</p></>
        ) : (
          <p style={{ color: quote.propertyLabel ? "var(--text-primary)" : "var(--text-muted)" }}>{quote.propertyLabel ?? "No property on this quote."}</p>
        )}
      </div>
      <ReadOnlyNote>Pulled from the account — edit it on the customer record.</ReadOnlyNote>
    </>
  );

  if (key === "internal_pricing_summary") return (
    <>
      <div className="rounded-lg p-3 flex items-start gap-2" style={{ backgroundColor: "#d977061a", border: "1px solid #d9770644" }}>
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#d97706" }} />
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>This module is <strong>internal only</strong>. It never appears on the customer-facing proposal, preview, print, or PDF. Use it to keep your margin math next to the proposal.</p>
      </div>
      {quote.pricing ? (
        <button onClick={props.onEditPricing} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-transform active:scale-[0.98]" style={{ backgroundColor: accent }}>
          <Pencil className="w-3.5 h-3.5" /> Open Pricing Wizard
        </button>
      ) : (
        <ReadOnlyNote>No pricing worksheet yet. Custom quotes build one in the Pricing Wizard.</ReadOnlyNote>
      )}
      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>To put a price in front of the customer, add a line item or option card instead.</p>
    </>
  );

  if (key === "line_items") return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button onClick={props.showCatalog} className="flex items-center gap-1 text-xs font-medium" style={{ color: accent }}><Package className="w-3.5 h-3.5" /> Catalog</button>
        <button onClick={props.addItem} className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--text-secondary)" }}><Plus className="w-3.5 h-3.5" /> Custom line</button>
      </div>
      {props.items.map(it => (
        <div key={it.id} className="rounded-lg p-2.5 space-y-2" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
          {it.itemId && <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: "var(--accent-text)" }}><Tag className="w-2.5 h-2.5" /> From catalog</div>}
          <input value={it.name} onChange={e => props.setItem(it.id, { name: e.target.value })} placeholder="Item name" className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2" style={inputStyle} />
          <input value={it.description} onChange={e => props.setItem(it.id, { description: e.target.value })} placeholder="Description" className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2" style={inputStyle} />
          <UiSelect size="sm" value={it.category} onChange={v => props.setItem(it.id, { category: v as LineItemCategory })} options={LINE_ITEM_CATEGORIES.map(c => ({ value: c, label: c }))} />
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1"><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Qty</span>
              <input type="number" min={0} value={it.quantity} onChange={e => props.setItem(it.id, { quantity: e.target.value })} className="w-14 rounded-lg px-2 py-1 text-xs outline-none tabular-nums focus:ring-2" style={inputStyle} /></div>
            <div className="flex items-center gap-1"><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>$</span>
              <input type="number" min={0} step="0.01" value={it.unitPrice} onChange={e => props.setItem(it.id, { unitPrice: e.target.value })} className="w-20 rounded-lg px-2 py-1 text-xs outline-none tabular-nums focus:ring-2" style={inputStyle} /></div>
            <button onClick={() => props.removeItem(it.id)} className="ml-auto p-1 rounded-lg transition-colors hover:bg-[var(--bg-surface)]" style={{ color: "var(--text-muted)" }}><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: "var(--text-secondary)" }}><input type="checkbox" checked={it.taxable} onChange={e => props.setItem(it.id, { taxable: e.target.checked })} className="accent-indigo-600" /> Taxable</label>
            <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: "var(--text-secondary)" }}><input type="checkbox" checked={it.optional} onChange={e => props.setItem(it.id, { optional: e.target.checked })} className="accent-indigo-600" /> Optional</label>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Tax %</span>
        <input type="number" min={0} step="0.1" value={props.taxRate} onChange={e => props.setTaxRate(e.target.value)} className="w-16 rounded px-1.5 py-0.5 text-xs outline-none tabular-nums focus:ring-2" style={inputStyle} />
        <span className="ml-auto text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>{fmt(props.totals.total)}</span>
      </div>
      <Field label="Customer notes" hint="on the quote"><textarea value={props.customerNotes} onChange={e => props.setCustomerNotes(e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-xs outline-none resize-none focus:ring-2" style={inputStyle} /></Field>
    </div>
  );

  if (OPTION_SECTIONS.includes(key)) return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{props.options.length} option{props.options.length === 1 ? "" : "s"}</p>
        <button onClick={props.addOption} className="flex items-center gap-1 text-xs font-medium" style={{ color: accent }}><Plus className="w-3.5 h-3.5" /> Add option</button>
      </div>
      {props.options.length === 0 && <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>No option cards yet. Add one, or start this quote from a salesbook to prefill tiers.</p>}
      {props.options.map(o => (
        <OptionEditor key={o.id} o={o} accent={accent}
          onChange={patch => props.setOption(o.id, patch)} onRemove={() => props.removeOption(o.id)}
          onToggleSelected={() => props.selectTier(o.id)} onUseAsLine={() => props.addOptionAsLineItem(o)} />
      ))}
    </div>
  );

  if (key === "approval") return (
    <>
      <Field label="Approval wording"><textarea value={sel.body} onChange={e => props.setSectionBody(sel.id!, e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-2" style={inputStyle} /></Field>
      <ReadOnlyNote>E-signature isn&apos;t enabled yet — the proposal shows a signature line placeholder.</ReadOnlyNote>
    </>
  );

  if (key === "photos") return (
    <>
      <div className="rounded-lg px-3 py-4 text-center" style={{ border: "1px dashed var(--border)" }}>
        <Package className="w-4 h-4 mx-auto mb-1" style={{ color: "var(--text-muted)" }} />
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Photo attachments come from the Photos &amp; Files module (coming soon).</p>
      </div>
      <Field label="Caption" hint="customer-facing"><textarea value={sel.body} onChange={e => props.setSectionBody(sel.id!, e.target.value)} rows={3} placeholder="Describe the photos for this section…" className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-2" style={inputStyle} /></Field>
    </>
  );

  // Generic narrative sections (scope_of_work, recommended_solution, problem_need,
  // inspection_findings, warranty, financing_note, terms, equipment_cards, custom_text…)
  return (
    <Field label="Section content" hint="customer-facing">
      <AutoTextarea value={sel.body} onChange={v => props.setSectionBody(sel.id!, v)} placeholder={narrativePlaceholder(key)} minHeight={240} />
      <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>Tip: you can also type directly into this section on the proposal.</p>
    </Field>
  );
}

function narrativePlaceholder(key: SectionKey): string {
  switch (key) {
    case "scope_of_work": return "List the work to be performed — one item per line.";
    case "recommended_solution": return "Describe the recommended solution and why it fits.";
    case "problem_need": return "Summarize the customer's problem or need.";
    case "inspection_findings": return "Document what was found during the inspection.";
    case "warranty": return "Describe warranty coverage and duration.";
    case "financing_note": return "Note financing options available to the customer.";
    case "terms": return "Terms & conditions for this proposal.";
    case "equipment_cards": return "Describe the equipment included in this proposal.";
    default: return "Write this section…";
  }
}

// ─── Option editor (right panel) ──────────────────────────
function OptionEditor({ o, accent, onChange, onRemove, onToggleSelected, onUseAsLine }: {
  o: QuoteOption; accent: string;
  onChange: (patch: Partial<QuoteOption>) => void;
  onRemove: () => void; onToggleSelected: () => void; onUseAsLine: () => void;
}) {
  const numOr = (s: string) => (s === "" ? 0 : parseFloat(s) || 0);
  return (
    <div className="rounded-lg p-2.5 space-y-2" style={{ backgroundColor: "var(--bg-surface-2)", border: `1px solid ${o.selected ? accent : "var(--border-subtle)"}` }}>
      <div className="flex items-center gap-2">
        <UiSelect size="sm" value={o.tier ?? ""} onChange={v => onChange({ tier: (v || undefined) as QuoteOption["tier"] })}
          className="w-28" options={[{ value: "", label: "No tier" }, { value: "good", label: "Good" }, { value: "better", label: "Better" }, { value: "best", label: "Best" }]} />
        <button onClick={onToggleSelected} title="Mark as the customer's selected option" className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-1 rounded" style={{ backgroundColor: o.selected ? accent + "1a" : "var(--bg-input)", color: o.selected ? accent : "var(--text-muted)" }}>
          <Check className="w-3 h-3" /> {o.selected ? "Selected" : "Select"}
        </button>
        <button onClick={onRemove} className="ml-auto p-1 rounded transition-colors hover:bg-[var(--bg-surface)]" style={{ color: "var(--text-muted)" }}><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
      <OptionImageInput value={o.image} onChange={v => onChange({ image: v })} accent={accent} />
      <input value={o.name} onChange={e => onChange({ name: e.target.value })} placeholder="Option name" className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2" style={inputStyle} />
      <div className="flex gap-2">
        <input value={o.brand ?? ""} onChange={e => onChange({ brand: e.target.value || undefined })} placeholder="Brand" className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2" style={inputStyle} />
        <input value={o.model ?? ""} onChange={e => onChange({ model: e.target.value || undefined })} placeholder="Model" className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2" style={inputStyle} />
      </div>
      <input value={o.description ?? ""} onChange={e => onChange({ description: e.target.value || undefined })} placeholder="Short description" className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2" style={inputStyle} />
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1"><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>$</span>
          <input type="number" min={0} value={o.price} onChange={e => onChange({ price: numOr(e.target.value) })} className="w-24 rounded-lg px-2 py-1 text-xs outline-none tabular-nums focus:ring-2" style={inputStyle} /></div>
        <div className="flex items-center gap-1"><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>$/mo</span>
          <input type="number" min={0} value={o.monthlyPrice ?? ""} onChange={e => onChange({ monthlyPrice: e.target.value === "" ? undefined : numOr(e.target.value) })} className="w-20 rounded-lg px-2 py-1 text-xs outline-none tabular-nums focus:ring-2" style={inputStyle} /></div>
      </div>
      <div className="flex gap-2">
        <input value={o.efficiency ?? ""} onChange={e => onChange({ efficiency: e.target.value || undefined })} placeholder="Efficiency" className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2" style={inputStyle} />
        <input value={o.warranty ?? ""} onChange={e => onChange({ warranty: e.target.value || undefined })} placeholder="Warranty" className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2" style={inputStyle} />
      </div>
      <textarea value={(o.includes ?? []).join("\n")} onChange={e => onChange({ includes: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })} rows={3} placeholder="Included items (one per line)" className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none resize-none focus:ring-2" style={inputStyle} />
      <button onClick={onUseAsLine} className="w-full flex items-center justify-center gap-1 text-[11px] font-medium px-2 py-1.5 rounded-lg transition-colors hover:bg-[var(--bg-surface)]" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
        <Plus className="w-3 h-3" /> Add to line items
      </button>
    </div>
  );
}

// ─── Section body (canvas card) ───────────────────────────
function SectionBody({ section: s, branding, accent, title, quote, lineItems, totals, taxRate, customerNotes, expiresAt, options, onSelectTier, onEditBody, editable }: {
  section: QuoteSection; branding: ReturnType<typeof getProposalBranding>; accent: string; title: string; quote: QuoteRecord;
  lineItems: LineItem[]; totals: { subtotal: number; tax: number; total: number }; taxRate: string; customerNotes: string; expiresAt: string;
  options: QuoteOption[]; onSelectTier: (id: string) => void; onEditBody: (id: string, body: string) => void; editable: boolean;
}) {
  const label = s.label || SECTION_LABELS[s.key as SectionKey] || "Section";

  if (s.key === "cover_header") {
    return (
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{title || "Proposal"}</p>
          {s.body && <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>{s.body}</p>}
          <p className="text-xs mt-2 tabular-nums" style={{ color: "var(--text-muted)" }}>{quote.quoteNumber}{expiresAt ? ` · Expires ${expiresAt}` : ""}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold" style={{ color: accent }}>{branding.companyName}</p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{branding.companyInfo}</p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{branding.contactInfo}</p>
        </div>
      </div>
    );
  }
  if (s.key === "customer_info") return (<><SecLabel>{label}</SecLabel><p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{quote.customerName}</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>{quote.locationName}</p></>);
  if (s.key === "property_info") return (<><SecLabel>{label}</SecLabel><p className="text-sm" style={{ color: quote.propertyLabel ? "var(--text-primary)" : "var(--text-muted)" }}>{quote.propertyLabel ?? "—"}</p></>);

  if (s.key === "gbb_options" || s.key === "optional_addons") {
    const relevant = s.key === "gbb_options" ? options : options.filter(o => !o.tier);
    return (
      <>
        <SecLabel>{label}</SecLabel>
        {relevant.length === 0 ? <p className="text-sm" style={{ color: "var(--text-muted)" }}>No option cards on this quote.</p> : (
          <div className="grid sm:grid-cols-3 gap-2.5">
            {relevant.map(o => (
              <button key={o.id} onClick={(e) => { e.stopPropagation(); onSelectTier(o.id); }}
                className="text-left rounded-xl p-3 transition-all overflow-hidden" style={{ border: `1.5px solid ${o.selected ? accent : "var(--border-subtle)"}`, backgroundColor: o.selected ? accent + "0f" : "var(--bg-surface)" }}>
                {o.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.image} alt={o.name} className="w-full rounded-lg mb-2" style={{ height: "96px", objectFit: "cover" }} />
                )}
                <div className="flex items-center justify-between">
                  {o.tier && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: accent + "1a", color: accent }}>{o.tier}</span>}
                  {o.selected && <Check className="w-3.5 h-3.5" style={{ color: accent }} />}
                </div>
                <p className="text-sm font-semibold mt-1.5 leading-snug" style={{ color: "var(--text-primary)" }}>{o.name}</p>
                {(o.brand || o.model) && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{[o.brand, o.model].filter(Boolean).join(" · ")}</p>}
                <p className="text-lg font-bold mt-1.5 tabular-nums" style={{ color: "var(--text-primary)" }}>${o.price.toLocaleString()}</p>
                {o.monthlyPrice ? <p className="text-[11px] tabular-nums" style={{ color: accent }}>${o.monthlyPrice}/mo</p> : null}
                {o.includes && o.includes.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {o.includes.slice(0, 4).map((inc, i) => <li key={i} className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-secondary)" }}><Check className="w-2.5 h-2.5 shrink-0" style={{ color: accent }} /> {inc}</li>)}
                  </ul>
                )}
              </button>
            ))}
          </div>
        )}
      </>
    );
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
                <span className="shrink-0 font-medium tabular-nums" style={{ color: "var(--text-primary)" }}>{fmt(li.total)}</span>
              </div>
            ))}
            {lineItems.some(li => li.optional) && (
              <div className="pt-2 mt-1" style={{ borderTop: "1px dashed var(--border)" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Optional add-ons</p>
                {lineItems.filter(li => li.optional).map(li => (
                  <div key={li.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate" style={{ color: "var(--text-secondary)" }}>{li.name ?? li.description} <span style={{ color: "var(--text-muted)" }}>×{li.quantity}</span></span>
                    <span className="shrink-0 tabular-nums" style={{ color: "var(--text-secondary)" }}>{fmt(li.total)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="pt-2 mt-1 space-y-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <Row label="Subtotal" value={fmt(totals.subtotal)} />
              <Row label={`Tax (${taxRate}%)`} value={fmt(totals.tax)} />
              <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Total</span>
                <span className="text-lg font-bold tabular-nums" style={{ color: accent }}>{fmt(totals.total)}</span>
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

  // Generic narrative section — edit directly here on the proposal canvas.
  return (
    <>
      <SecLabel>{label}</SecLabel>
      <AutoTextarea value={s.body} onChange={v => onEditBody(s.id!, v)}
        placeholder={editable ? "Write this section — type directly here…" : "Click to select, then type…"}
        minHeight={72} seamless editable={editable} />
    </>
  );
}

// Auto-growing textarea — expands with content so long narrative sections
// (Scope of Work, Recommended Solution, Terms…) get a roomy editing area.
// `seamless` renders it borderless for inline editing on the proposal canvas.
function AutoTextarea({ value, onChange, placeholder, minHeight = 0, seamless, editable = true }: {
  value: string; onChange: (v: string) => void; placeholder?: string; minHeight?: number; seamless?: boolean; editable?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, minHeight)}px`;
  }, [value, minHeight]);
  return (
    <textarea
      ref={ref} value={value} placeholder={placeholder} rows={1} readOnly={!editable}
      onChange={e => onChange(e.target.value)}
      onClick={e => { if (editable) e.stopPropagation(); }}
      className={seamless
        ? "w-full bg-transparent outline-none resize-none overflow-hidden leading-relaxed"
        : "w-full rounded-lg px-3 py-2 text-sm outline-none resize-none overflow-hidden leading-relaxed focus:ring-2"}
      style={seamless
        // When the section isn't selected, the textarea ignores pointer events so
        // the click selects the section card first — you select, then you type.
        ? { minHeight, color: "var(--text-secondary)", fontSize: "14px", pointerEvents: editable ? "auto" : "none", cursor: editable ? "text" : "pointer" }
        : { ...inputStyle, minHeight }}
    />
  );
}

const inputStyle: React.CSSProperties = { border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" };
function SecLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>{children}</p>;
}
function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between"><span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span><span className="text-sm tabular-nums" style={{ color: "var(--text-secondary)" }}>{value}</span></div>;
}
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{label}{hint && <span style={{ color: "var(--text-muted)" }}> ({hint})</span>}</label>{children}</div>;
}
function ReadOnlyNote({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{children}</p>;
}
