"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Plus, Pencil, Copy, Trash2, Check, ChevronUp, ChevronDown, Eye, EyeOff,
  FileText, Layers, ScrollText, Palette, Sliders, Star,
} from "lucide-react";
import UiSelect from "@/components/ui/Select";
import {
  getProposalTemplates, saveProposalTemplates, blankProposalTemplate,
  getProposalSections, saveProposalSections,
  getProposalTerms, saveProposalTerms,
  getProposalBranding, saveProposalBranding,
  getProposalDefaults, saveProposalDefaults,
  proposalId,
  SECTION_CATALOG, SECTION_LABELS, TEMPLATE_TYPE_LABELS,
  LINE_ITEM_LAYOUT_LABELS, OPTION_LAYOUT_LABELS, MERGE_FIELDS,
  type ProposalTemplate, type ProposalTemplateType, type ProposalSection,
  type ProposalTermsBlock, type ProposalBranding, type ProposalDefaults,
  type SectionKey, type TemplateSectionRef, type LineItemLayout, type OptionLayout,
} from "@/lib/proposals/data";

type Saver = (save: () => void, dirty: boolean, saved: boolean) => void;
const inputStyle: React.CSSProperties = { border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" };

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} role="switch" aria-checked={on}
      className="relative w-8 h-4 rounded-full transition-colors shrink-0"
      style={{ backgroundColor: on ? "#4f46e5" : "var(--bg-input)", border: "1px solid var(--border)" }}>
      <span className="absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform"
        style={{ transform: on ? "translateX(16px)" : "translateX(0)" }} />
    </button>
  );
}
function Labeled({ label, hint, children, full }: { label: string; hint?: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
        {label}{hint && <span style={{ color: "var(--text-muted)" }}> ({hint})</span>}
      </label>
      {children}
    </div>
  );
}
function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl p-5" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>{children}</div>;
}

// ═══ Templates tab ════════════════════════════════════════
function TemplatesTab({ register }: { register: Saver }) {
  const [items, setItems] = useState<ProposalTemplate[]>([]);
  const [terms, setTerms] = useState<ProposalTermsBlock[]>([]);
  const [editing, setEditing] = useState<ProposalTemplate | null>(null);
  const [adding, setAdding] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addKey, setAddKey] = useState<SectionKey>("scope_of_work");

  useEffect(() => { setItems(getProposalTemplates()); setTerms(getProposalTerms()); }, []);
  const mark = () => { setDirty(true); setSaved(false); };

  function startAdd() { setEditing(blankProposalTemplate()); setAdding(true); }
  function startEdit(t: ProposalTemplate) { setEditing(structuredClone(t)); setAdding(false); }
  function cancel() { setEditing(null); setAdding(false); }
  function commit() {
    if (!editing || !editing.name.trim()) return;
    if (adding) setItems(p => [...p, editing]); else setItems(p => p.map(x => x.id === editing.id ? editing : x));
    cancel(); mark();
  }
  function toggleActive(id: string) { setItems(p => p.map(t => t.id === id ? { ...t, active: !t.active } : t)); mark(); }
  function makeDefault(id: string) { setItems(p => p.map(t => ({ ...t, isDefault: t.id === id }))); mark(); }
  function duplicate(t: ProposalTemplate) { setItems(p => [...p, { ...structuredClone(t), id: proposalId("ptmpl"), name: `${t.name} (Copy)`, isDefault: false }]); mark(); }
  function remove(id: string) { setItems(p => p.filter(t => t.id !== id)); mark(); }
  function doSave() { saveProposalTemplates(items); setItems(getProposalTemplates()); setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  useEffect(() => { register(doSave, dirty, saved); });

  function set<K extends keyof ProposalTemplate>(k: K, v: ProposalTemplate[K]) { setEditing(d => d ? { ...d, [k]: v } : d); }
  // Section list ops (within the editing template)
  function moveSection(idx: number, dir: -1 | 1) {
    setEditing(d => { if (!d) return d; const s = [...d.sections]; const j = idx + dir; if (j < 0 || j >= s.length) return d; [s[idx], s[j]] = [s[j], s[idx]]; return { ...d, sections: s }; });
  }
  function toggleVisible(idx: number) { setEditing(d => d ? { ...d, sections: d.sections.map((s, i) => i === idx ? { ...s, visible: !s.visible } : s) } : d); }
  function removeSection(idx: number) { setEditing(d => d ? { ...d, sections: d.sections.filter((_, i) => i !== idx) } : d); }
  function addSection() { setEditing(d => d ? { ...d, sections: [...d.sections, { key: addKey, visible: true } as TemplateSectionRef] } : d); }

  function Form() {
    if (!editing) return null;
    return (
      <div className="rounded-xl p-4 space-y-4" style={{ backgroundColor: "var(--bg-surface)", border: "2px solid #c7d2fe", boxShadow: "var(--shadow-card)" }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#4f46e5" }}>{adding ? "New Proposal Template" : "Edit Proposal Template"}</p>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Template Name *"><input value={editing.name} onChange={e => set("name", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></Labeled>
          <Labeled label="Type"><UiSelect value={editing.type} onChange={v => set("type", v as ProposalTemplateType)} options={Object.entries(TEMPLATE_TYPE_LABELS).map(([value, label]) => ({ value, label }))} /></Labeled>
          <Labeled label="Description" full><input value={editing.description} onChange={e => set("description", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></Labeled>
          <Labeled label="Default Expiration (days)"><input type="number" min={1} value={editing.defaultExpirationDays} onChange={e => set("defaultExpirationDays", parseInt(e.target.value) || 0)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></Labeled>
          <Labeled label="Default Terms Block"><UiSelect value={editing.defaultTermsBlockId ?? ""} onChange={v => set("defaultTermsBlockId", v || undefined)} placeholder="None" options={[{ value: "", label: "None" }, ...terms.map(t => ({ value: t.id, label: t.title }))]} /></Labeled>
          <Labeled label="Line Item Layout"><UiSelect value={editing.lineItemLayout} onChange={v => set("lineItemLayout", v as LineItemLayout)} options={Object.entries(LINE_ITEM_LAYOUT_LABELS).map(([value, label]) => ({ value, label }))} /></Labeled>
          <Labeled label="Option Layout"><UiSelect value={editing.optionLayout} onChange={v => set("optionLayout", v as OptionLayout)} options={Object.entries(OPTION_LAYOUT_LABELS).map(([value, label]) => ({ value, label }))} /></Labeled>
        </div>
        <div className="flex items-center gap-5">
          <label className="flex items-center gap-2 cursor-pointer"><Toggle on={editing.active} onChange={v => set("active", v)} /><span className="text-sm" style={{ color: "var(--text-secondary)" }}>Active</span></label>
          <label className="flex items-center gap-2 cursor-pointer"><Toggle on={editing.isDefault} onChange={v => set("isDefault", v)} /><span className="text-sm" style={{ color: "var(--text-secondary)" }}>Default template</span></label>
        </div>

        {/* Section list */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Sections · order &amp; visibility</p>
            <div className="flex items-center gap-2">
              <UiSelect size="sm" value={addKey} onChange={v => setAddKey(v as SectionKey)} className="w-52" options={SECTION_CATALOG.map(s => ({ value: s.key, label: s.label }))} />
              <button onClick={addSection} className="flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg text-white" style={{ backgroundColor: "#4f46e5" }}><Plus className="w-3 h-3" /> Add</button>
            </div>
          </div>
          <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
            {editing.sections.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>No sections — add some above.</p>
            ) : editing.sections.map((s, i) => (
              <div key={`${s.key}-${i}`} className="flex items-center gap-2 px-3 py-2"
                style={{ borderBottom: i < editing.sections.length - 1 ? "1px solid var(--border-subtle)" : "none", opacity: s.visible ? 1 : 0.5 }}>
                <span className="text-[10px] font-mono w-5 text-center shrink-0" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                <span className="text-sm flex-1" style={{ color: "var(--text-primary)" }}>{SECTION_LABELS[s.key]}</span>
                <button onClick={() => toggleVisible(i)} title={s.visible ? "Visible" : "Hidden"} style={{ color: s.visible ? "var(--accent-text)" : "var(--text-muted)" }}>
                  {s.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => moveSection(i, -1)} disabled={i === 0} className="disabled:opacity-20" style={{ color: "var(--text-muted)" }}><ChevronUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => moveSection(i, 1)} disabled={i === editing.sections.length - 1} className="disabled:opacity-20" style={{ color: "var(--text-muted)" }}><ChevronDown className="w-3.5 h-3.5" /></button>
                <button onClick={() => removeSection(i)} className="hover:text-red-500" style={{ color: "#d1d5db" }}><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button onClick={cancel} className="px-3 py-1.5 rounded-lg text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Cancel</button>
          <button onClick={commit} disabled={!editing.name.trim()} className="px-4 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-40" style={{ backgroundColor: "#4f46e5" }}>{adding ? "Add Template" : "Update"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {adding && Form()}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Proposal Templates
            <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}>{items.length}</span></p>
          {!adding && <button onClick={startAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: "#4f46e5" }}><Plus className="w-3.5 h-3.5" /> Add Template</button>}
        </div>
        <div className="grid px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider"
          style={{ gridTemplateColumns: "2fr 1.4fr 0.8fr 0.7fr 0.7fr auto", gap: "0.75rem", color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" }}>
          <span>Template</span><span>Type</span><span>Sections</span><span className="text-center">Default</span><span className="text-center">Active</span><span />
        </div>
        {items.map((t, i) => editing && !adding && editing.id === t.id ? (
          <div key={t.id} className="p-4" style={{ borderBottom: i < items.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>{Form()}</div>
        ) : (
          <div key={t.id} className="grid px-4 py-3 items-center hover:bg-[var(--bg-surface-2)] transition-colors"
            style={{ gridTemplateColumns: "2fr 1.4fr 0.8fr 0.7fr 0.7fr auto", gap: "0.75rem", borderBottom: i < items.length - 1 ? "1px solid var(--border-subtle)" : "none", opacity: t.active ? 1 : 0.5 }}>
            <div className="min-w-0"><p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{t.name}</p><p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{t.description}</p></div>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{TEMPLATE_TYPE_LABELS[t.type]}</span>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{t.sections.length}</span>
            <div className="flex justify-center">
              <button onClick={() => makeDefault(t.id)} title="Make default">
                <Star className="w-4 h-4" style={{ color: t.isDefault ? "#f59e0b" : "var(--text-muted)", fill: t.isDefault ? "#f59e0b" : "none" }} />
              </button>
            </div>
            <div className="flex justify-center"><Toggle on={t.active} onChange={() => toggleActive(t.id)} /></div>
            <div className="flex items-center gap-1 justify-end">
              <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]" style={{ color: "var(--text-muted)" }}><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => duplicate(t)} className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]" style={{ color: "var(--text-muted)" }}><Copy className="w-3.5 h-3.5" /></button>
              <button onClick={() => remove(t.id)} className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: "#d1d5db" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")} onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Templates define structure only. When a quote is created from a template, the Quote Builder copies these sections into the quote — editing a template later won&apos;t change existing quotes.
      </p>
    </div>
  );
}

// ═══ Sections Library tab ═════════════════════════════════
function SectionsTab({ register }: { register: Saver }) {
  const [items, setItems] = useState<ProposalSection[]>([]);
  const [editing, setEditing] = useState<ProposalSection | null>(null);
  const [adding, setAdding] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setItems(getProposalSections()); }, []);
  const mark = () => { setDirty(true); setSaved(false); };
  function startAdd() { const max = items.reduce((m, s) => Math.max(m, s.order), 0); setEditing({ id: proposalId("ps"), key: "scope_of_work", name: "", defaultBody: "", mergeFields: [], active: true, order: max + 1 }); setAdding(true); }
  function startEdit(s: ProposalSection) { setEditing({ ...s }); setAdding(false); }
  function cancel() { setEditing(null); setAdding(false); }
  function commit() { if (!editing || !editing.name.trim()) return; if (adding) setItems(p => [...p, editing]); else setItems(p => p.map(x => x.id === editing.id ? editing : x)); cancel(); mark(); }
  function move(idx: number, dir: -1 | 1) { const j = idx + dir; if (j < 0 || j >= items.length) return; const s = [...items]; [s[idx], s[j]] = [s[j], s[idx]]; setItems(s.map((x, i) => ({ ...x, order: i + 1 }))); mark(); }
  function remove(id: string) { setItems(p => p.filter(s => s.id !== id)); mark(); }
  function toggle(id: string) { setItems(p => p.map(s => s.id === id ? { ...s, active: !s.active } : s)); mark(); }
  function doSave() { saveProposalSections(items); setItems(getProposalSections()); setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  useEffect(() => { register(doSave, dirty, saved); });
  function set<K extends keyof ProposalSection>(k: K, v: ProposalSection[K]) { setEditing(d => d ? { ...d, [k]: v } : d); }

  function Form() {
    if (!editing) return null;
    return (
      <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: "var(--bg-surface)", border: "2px solid #c7d2fe", boxShadow: "var(--shadow-card)" }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#4f46e5" }}>{adding ? "New Section Block" : "Edit Section Block"}</p>
        <div className="grid grid-cols-2 gap-3">
          <Labeled label="Name *"><input value={editing.name} onChange={e => set("name", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></Labeled>
          <Labeled label="Section Kind"><UiSelect value={editing.key} onChange={v => set("key", v as SectionKey)} options={SECTION_CATALOG.map(s => ({ value: s.key, label: s.label }))} /></Labeled>
        </div>
        <Labeled label="Default Wording" hint="merge fields supported" full>
          <textarea value={editing.defaultBody} onChange={e => set("defaultBody", e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} />
        </Labeled>
        <div className="flex flex-wrap gap-1.5">
          {MERGE_FIELDS.map(f => (
            <button key={f} onClick={() => set("defaultBody", `${editing.defaultBody}${editing.defaultBody.endsWith(" ") || !editing.defaultBody ? "" : " "}${f}`)}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-secondary)" }}>{f}</button>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer"><Toggle on={editing.active} onChange={v => set("active", v)} /><span className="text-sm" style={{ color: "var(--text-secondary)" }}>Active</span></label>
          <div className="flex gap-2">
            <button onClick={cancel} className="px-3 py-1.5 rounded-lg text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Cancel</button>
            <button onClick={commit} disabled={!editing.name.trim()} className="px-4 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-40" style={{ backgroundColor: "#4f46e5" }}>{adding ? "Add" : "Update"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {adding && Form()}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Sections Library
            <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}>{items.length}</span></p>
          {!adding && <button onClick={startAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: "#4f46e5" }}><Plus className="w-3.5 h-3.5" /> Add Block</button>}
        </div>
        {items.map((s, i) => editing && !adding && editing.id === s.id ? (
          <div key={s.id} className="p-4" style={{ borderBottom: i < items.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>{Form()}</div>
        ) : (
          <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-surface-2)] transition-colors"
            style={{ borderBottom: i < items.length - 1 ? "1px solid var(--border-subtle)" : "none", opacity: s.active ? 1 : 0.5 }}>
            <div className="flex flex-col">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="disabled:opacity-20" style={{ color: "var(--text-muted)" }}><ChevronUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="disabled:opacity-20" style={{ color: "var(--text-muted)" }}><ChevronDown className="w-3.5 h-3.5" /></button>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{s.name} <span className="text-[10px] font-normal" style={{ color: "var(--text-muted)" }}>· {SECTION_LABELS[s.key]}</span></p>
              <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{s.defaultBody || "—"}</p>
            </div>
            <Toggle on={s.active} onChange={() => toggle(s.id)} />
            <button onClick={() => startEdit(s)} className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]" style={{ color: "var(--text-muted)" }}><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => remove(s.id)} className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: "#d1d5db" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")} onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")}><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ Terms Blocks tab ═════════════════════════════════════
function TermsTab({ register }: { register: Saver }) {
  const [items, setItems] = useState<ProposalTermsBlock[]>([]);
  const [editing, setEditing] = useState<ProposalTermsBlock | null>(null);
  const [adding, setAdding] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setItems(getProposalTerms()); }, []);
  const mark = () => { setDirty(true); setSaved(false); };
  function startAdd() { const max = items.reduce((m, t) => Math.max(m, t.order), 0); setEditing({ id: proposalId("pt-terms"), title: "", body: "", isDefault: false, active: true, order: max + 1 }); setAdding(true); }
  function startEdit(t: ProposalTermsBlock) { setEditing({ ...t }); setAdding(false); }
  function cancel() { setEditing(null); setAdding(false); }
  function commit() { if (!editing || !editing.title.trim()) return; if (adding) setItems(p => [...p, editing]); else setItems(p => p.map(x => x.id === editing.id ? editing : x)); cancel(); mark(); }
  function makeDefault(id: string) { setItems(p => p.map(t => ({ ...t, isDefault: t.id === id }))); mark(); }
  function toggle(id: string) { setItems(p => p.map(t => t.id === id ? { ...t, active: !t.active } : t)); mark(); }
  function remove(id: string) { setItems(p => p.filter(t => t.id !== id)); mark(); }
  function doSave() { saveProposalTerms(items); setItems(getProposalTerms()); setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  useEffect(() => { register(doSave, dirty, saved); });
  function set<K extends keyof ProposalTermsBlock>(k: K, v: ProposalTermsBlock[K]) { setEditing(d => d ? { ...d, [k]: v } : d); }

  function Form() {
    if (!editing) return null;
    return (
      <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: "var(--bg-surface)", border: "2px solid #c7d2fe", boxShadow: "var(--shadow-card)" }}>
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#4f46e5" }}>{adding ? "New Terms Block" : "Edit Terms Block"}</p>
        <Labeled label="Title *" full><input value={editing.title} onChange={e => set("title", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></Labeled>
        <Labeled label="Body" full><textarea value={editing.body} onChange={e => set("body", e.target.value)} rows={4} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></Labeled>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer"><Toggle on={editing.active} onChange={v => set("active", v)} /><span className="text-sm" style={{ color: "var(--text-secondary)" }}>Active</span></label>
          <div className="flex gap-2">
            <button onClick={cancel} className="px-3 py-1.5 rounded-lg text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Cancel</button>
            <button onClick={commit} disabled={!editing.title.trim()} className="px-4 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-40" style={{ backgroundColor: "#4f46e5" }}>{adding ? "Add" : "Update"}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {adding && Form()}
      <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Terms Blocks
            <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}>{items.length}</span></p>
          {!adding && <button onClick={startAdd} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: "#4f46e5" }}><Plus className="w-3.5 h-3.5" /> Add Block</button>}
        </div>
        {items.map((t, i) => editing && !adding && editing.id === t.id ? (
          <div key={t.id} className="p-4" style={{ borderBottom: i < items.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>{Form()}</div>
        ) : (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-surface-2)] transition-colors"
            style={{ borderBottom: i < items.length - 1 ? "1px solid var(--border-subtle)" : "none", opacity: t.active ? 1 : 0.5 }}>
            <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{t.title}</p><p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{t.body}</p></div>
            <button onClick={() => makeDefault(t.id)} title="Make default"><Star className="w-4 h-4" style={{ color: t.isDefault ? "#f59e0b" : "var(--text-muted)", fill: t.isDefault ? "#f59e0b" : "none" }} /></button>
            <Toggle on={t.active} onChange={() => toggle(t.id)} />
            <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]" style={{ color: "var(--text-muted)" }}><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => remove(t.id)} className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: "#d1d5db" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")} onMouseLeave={e => (e.currentTarget.style.color = "#d1d5db")}><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══ Branding tab ═════════════════════════════════════════
function BrandingTab({ register }: { register: Saver }) {
  const [b, setB] = useState<ProposalBranding>(() => getProposalBranding());
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setB(getProposalBranding()); }, []);
  function set<K extends keyof ProposalBranding>(k: K, v: ProposalBranding[K]) { setB(p => ({ ...p, [k]: v })); setDirty(true); setSaved(false); }
  function doSave() { saveProposalBranding(b); setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  useEffect(() => { register(doSave, dirty, saved); });

  return (
    <Card>
      <div className="grid grid-cols-2 gap-4">
        <Labeled label="Logo URL" hint="placeholder"><input value={b.logoUrl} onChange={e => set("logoUrl", e.target.value)} placeholder="https://…" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></Labeled>
        <Labeled label="Accent Color">
          <div className="flex items-center gap-2">
            <input type="color" value={b.accentColor} onChange={e => set("accentColor", e.target.value)} className="w-10 h-9 rounded-lg cursor-pointer" style={{ border: "1px solid var(--border)", background: "none" }} />
            <input value={b.accentColor} onChange={e => set("accentColor", e.target.value)} className="flex-1 rounded-lg px-3 py-2 text-sm font-mono outline-none" style={inputStyle} />
          </div>
        </Labeled>
        <Labeled label="Company Name"><input value={b.companyName} onChange={e => set("companyName", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></Labeled>
        <Labeled label="License Number"><input value={b.licenseNumber} onChange={e => set("licenseNumber", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></Labeled>
        <Labeled label="Company Info"><input value={b.companyInfo} onChange={e => set("companyInfo", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></Labeled>
        <Labeled label="Contact Info"><input value={b.contactInfo} onChange={e => set("contactInfo", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></Labeled>
        <Labeled label="Footer" full><input value={b.footer} onChange={e => set("footer", e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></Labeled>
      </div>
    </Card>
  );
}

// ═══ Defaults tab ═════════════════════════════════════════
function DefaultsTab({ register }: { register: Saver }) {
  const [d, setD] = useState<ProposalDefaults>(() => getProposalDefaults());
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setD(getProposalDefaults()); setTemplates(getProposalTemplates()); }, []);
  function set<K extends keyof ProposalDefaults>(k: K, v: ProposalDefaults[K]) { setD(p => ({ ...p, [k]: v })); setDirty(true); setSaved(false); }
  function doSave() { saveProposalDefaults(d); setDirty(false); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  useEffect(() => { register(doSave, dirty, saved); });

  return (
    <Card>
      <div className="grid grid-cols-2 gap-4">
        <Labeled label="Default Proposal Template"><UiSelect value={d.defaultTemplateId} onChange={v => set("defaultTemplateId", v)} options={templates.map(t => ({ value: t.id, label: t.name }))} /></Labeled>
        <Labeled label="Default Expiration (days)"><input type="number" min={1} value={d.defaultExpirationDays} onChange={e => set("defaultExpirationDays", parseInt(e.target.value) || 0)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></Labeled>
        <Labeled label="Default Approval Language" full><textarea value={d.approvalLanguage} onChange={e => set("approvalLanguage", e.target.value)} rows={3} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></Labeled>
      </div>
      <div className="mt-4 space-y-1">
        <div className="flex items-center justify-between py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div><p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Show Optional Add-ons</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>Display optional upgrade lines on proposals.</p></div>
          <Toggle on={d.showOptionalAddons} onChange={v => set("showOptionalAddons", v)} />
        </div>
        <div className="flex items-center justify-between py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div><p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Show Pricing Breakdown</p><p className="text-xs" style={{ color: "var(--text-muted)" }}>Show itemized pricing vs. a single total.</p></div>
          <Toggle on={d.showPricingBreakdown} onChange={v => set("showPricingBreakdown", v)} />
        </div>
      </div>
    </Card>
  );
}

// ═══ Main section ═════════════════════════════════════════
const TABS = [
  { key: "templates", label: "Templates",        icon: FileText },
  { key: "sections",  label: "Sections Library", icon: Layers },
  { key: "terms",     label: "Terms Blocks",     icon: ScrollText },
  { key: "branding",  label: "Branding",         icon: Palette },
  { key: "defaults",  label: "Defaults",         icon: Sliders },
] as const;
type TabKey = typeof TABS[number]["key"];

export default function ProposalBuilderSection() {
  const [tab, setTab] = useState<TabKey>("templates");
  const saverRef = useRef<() => void>(() => {});
  const [hdr, setHdr] = useState<{ dirty: boolean; saved: boolean }>({ dirty: false, saved: false });
  const register = useCallback<Saver>((save, dirty, saved) => {
    saverRef.current = save;
    setHdr(prev => (prev.dirty === dirty && prev.saved === saved) ? prev : { dirty, saved });
  }, []);
  function switchTab(next: TabKey) { setTab(next); setHdr({ dirty: false, saved: false }); }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Proposal Builder</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Reusable proposal templates, section blocks, terms, branding, and defaults. Quotes load these when built.
          </p>
        </div>
        <button onClick={() => saverRef.current()} disabled={!hdr.dirty && !hdr.saved}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 shrink-0"
          style={{ backgroundColor: hdr.saved ? "#10b981" : "#4f46e5" }}>
          <Check className="w-3.5 h-3.5" /> {hdr.saved ? "Saved" : "Save Changes"}
        </button>
      </div>

      <div className="flex items-center gap-1 border-b overflow-x-auto" style={{ borderColor: "var(--border-subtle)" }}>
        {TABS.map(t => {
          const active = tab === t.key; const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => switchTab(t.key)}
              className="relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap"
              style={{ color: active ? "#4f46e5" : "var(--text-muted)" }}>
              <Icon className="w-3.5 h-3.5 shrink-0" /> {t.label}
              {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-indigo-600" />}
            </button>
          );
        })}
      </div>

      {tab === "templates" && <TemplatesTab register={register} />}
      {tab === "sections"  && <SectionsTab register={register} />}
      {tab === "terms"     && <TermsTab register={register} />}
      {tab === "branding"  && <BrandingTab register={register} />}
      {tab === "defaults"  && <DefaultsTab register={register} />}
    </div>
  );
}
