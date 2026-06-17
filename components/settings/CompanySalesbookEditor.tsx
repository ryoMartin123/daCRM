"use client";

// Company Salesbook editor (Settings → Salesbook Library → Installed → Edit).
// Lets the user tune an installed company-owned salesbook — its sections, option
// cards, and terms — before quoting from it. Edits never touch the CRM master
// template the copy came from.

import { useMemo, useState } from "react";
import {
  ArrowLeft, BookOpen, Plus, Trash2, ChevronUp, ChevronDown, Check, Layers, Package, FileText,
} from "lucide-react";
import UiSelect from "@/components/ui/Select";
import OptionImageInput from "@/components/quotes/OptionImageInput";
import { SECTION_CATALOG, SECTION_LABELS, type SectionKey } from "@/lib/proposals/data";
import {
  getCompanySalesbook, updateCompanySalesbook, blankSalesbookOption,
  INDUSTRY_LABELS, PROPOSAL_TYPE_LABELS, INDUSTRY_ACCENT, type SalesbookOption,
} from "@/lib/salesbooks/data";

export default function CompanySalesbookEditor({ sbId, onBack }: { sbId: string; onBack: () => void }) {
  const original = useMemo(() => getCompanySalesbook(sbId), [sbId]);

  const [name, setName] = useState(original?.name ?? "");
  const [bestFor, setBestFor] = useState(original?.bestFor ?? "");
  const [financingNote, setFinancingNote] = useState(original?.financingNote ?? "");
  const [warranty, setWarranty] = useState(original?.warranty ?? "");
  const [terms, setTerms] = useState(original?.terms ?? "");
  const [sections, setSections] = useState<SectionKey[]>(original?.sections ?? []);
  const [options, setOptions] = useState<SalesbookOption[]>(original?.options ?? []);
  const [saved, setSaved] = useState(false);

  if (!original) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}><ArrowLeft className="w-4 h-4" /> Salesbook Library</button>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Salesbook not found.</p>
      </div>
    );
  }

  const accent = INDUSTRY_ACCENT[original.industry];
  const availableSections = SECTION_CATALOG.filter(c => !sections.includes(c.key));

  function moveSection(i: number, dir: -1 | 1) {
    setSections(p => { const a = [...p]; const j = i + dir; if (j < 0 || j >= a.length) return p; [a[i], a[j]] = [a[j], a[i]]; return a; });
  }
  const removeSection = (k: SectionKey) => setSections(p => p.filter(x => x !== k));
  const addSection = (k: SectionKey) => { if (k && !sections.includes(k)) setSections(p => [...p, k]); };

  const setOption = (id: string, patch: Partial<SalesbookOption>) => setOptions(p => p.map(o => o.id === id ? { ...o, ...patch } : o));
  const removeOption = (id: string) => setOptions(p => p.filter(o => o.id !== id));
  const addOption = () => setOptions(p => [...p, blankSalesbookOption()]);

  function save() {
    updateCompanySalesbook(sbId, { name: name.trim() || original!.name, bestFor, financingNote, warranty, terms, sections, options });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm mb-2" style={{ color: "var(--text-secondary)" }}><ArrowLeft className="w-4 h-4" /> Salesbook Library</button>
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <BookOpen className="w-5 h-5" style={{ color: accent }} /> Edit Salesbook
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {INDUSTRY_LABELS[original.industry]} · {PROPOSAL_TYPE_LABELS[original.proposalType]} · company-owned copy
          </p>
        </div>
        <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors" style={{ backgroundColor: saved ? "#10b981" : accent }}>
          {saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>

      {/* Details */}
      <Card title="Details" icon={FileText}>
        <Field label="Salesbook name"><input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></Field>
        <Field label="Best for"><input value={bestFor} onChange={e => setBestFor(e.target.value)} placeholder="e.g. full system replacement proposals" className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} /></Field>
        <Field label="Financing note"><textarea value={financingNote} onChange={e => setFinancingNote(e.target.value)} rows={2} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Warranty"><textarea value={warranty} onChange={e => setWarranty(e.target.value)} rows={2} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></Field>
          <Field label="Terms"><textarea value={terms} onChange={e => setTerms(e.target.value)} rows={2} className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none" style={inputStyle} /></Field>
        </div>
      </Card>

      {/* Sections */}
      <Card title={`Proposal Sections (${sections.length})`} icon={Layers}>
        <div className="space-y-1.5">
          {sections.map((k, i) => (
            <div key={k} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
              <span className="text-[10px] font-mono w-4 text-center shrink-0" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
              <span className="text-sm flex-1 truncate" style={{ color: "var(--text-primary)" }}>{SECTION_LABELS[k] ?? k}</span>
              <button onClick={() => moveSection(i, -1)} disabled={i === 0} className="disabled:opacity-20 p-0.5" style={{ color: "var(--text-muted)" }}><ChevronUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => moveSection(i, 1)} disabled={i === sections.length - 1} className="disabled:opacity-20 p-0.5" style={{ color: "var(--text-muted)" }}><ChevronDown className="w-3.5 h-3.5" /></button>
              <button onClick={() => removeSection(k)} className="p-0.5" style={{ color: "var(--text-muted)" }}><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        {availableSections.length > 0 && (
          <div className="mt-3 w-64">
            <UiSelect size="sm" value="" onChange={v => addSection(v as SectionKey)} placeholder="+ Add section…"
              options={availableSections.map(c => ({ value: c.key, label: c.label }))} />
          </div>
        )}
      </Card>

      {/* Options */}
      <Card title={`Option Cards (${options.length})`} icon={Package} action={
        <button onClick={addOption} className="flex items-center gap-1 text-xs font-medium" style={{ color: accent }}><Plus className="w-3.5 h-3.5" /> Add option</button>
      }>
        {options.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No option cards. Add one to offer Good/Better/Best tiers or packages.</p>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {options.map(o => <OptionRow key={o.id} o={o} accent={accent} onChange={p => setOption(o.id, p)} onRemove={() => removeOption(o.id)} />)}
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors" style={{ backgroundColor: saved ? "#10b981" : accent }}>
          {saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

// ─── Option editor row ────────────────────────────────────
function OptionRow({ o, accent, onChange, onRemove }: {
  o: SalesbookOption; accent: string; onChange: (patch: Partial<SalesbookOption>) => void; onRemove: () => void;
}) {
  const numOr = (s: string) => (s === "" ? 0 : parseFloat(s) || 0);
  return (
    <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
      <div className="flex items-center gap-2">
        <UiSelect size="sm" value={o.tier ?? ""} onChange={v => onChange({ tier: (v || undefined) as SalesbookOption["tier"] })}
          className="w-28" options={[{ value: "", label: "No tier" }, { value: "good", label: "Good" }, { value: "better", label: "Better" }, { value: "best", label: "Best" }]} />
        <button onClick={onRemove} className="ml-auto p-1 rounded" style={{ color: "var(--text-muted)" }}><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
      <OptionImageInput value={o.image} onChange={v => onChange({ image: v })} accent={accent} />
      <input value={o.name} onChange={e => onChange({ name: e.target.value })} placeholder="Option name" className="w-full rounded-lg px-2.5 py-1.5 text-sm outline-none" style={inputStyle} />
      <div className="flex gap-2">
        <input value={o.brand ?? ""} onChange={e => onChange({ brand: e.target.value || undefined })} placeholder="Brand" className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs outline-none" style={inputStyle} />
        <input value={o.model ?? ""} onChange={e => onChange({ model: e.target.value || undefined })} placeholder="Model" className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs outline-none" style={inputStyle} />
      </div>
      <input value={o.description ?? ""} onChange={e => onChange({ description: e.target.value || undefined })} placeholder="Short description" className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none" style={inputStyle} />
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1"><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>$</span>
          <input type="number" min={0} value={o.price} onChange={e => onChange({ price: numOr(e.target.value) })} className="w-24 rounded-lg px-2 py-1 text-xs outline-none" style={inputStyle} /></div>
        <div className="flex items-center gap-1"><span className="text-[10px]" style={{ color: "var(--text-muted)" }}>$/mo</span>
          <input type="number" min={0} value={o.monthlyPrice ?? ""} onChange={e => onChange({ monthlyPrice: e.target.value === "" ? undefined : numOr(e.target.value) })} className="w-20 rounded-lg px-2 py-1 text-xs outline-none" style={inputStyle} /></div>
      </div>
      <div className="flex gap-2">
        <input value={o.efficiency ?? ""} onChange={e => onChange({ efficiency: e.target.value || undefined })} placeholder="Efficiency" className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs outline-none" style={inputStyle} />
        <input value={o.warranty ?? ""} onChange={e => onChange({ warranty: e.target.value || undefined })} placeholder="Warranty" className="flex-1 min-w-0 rounded-lg px-2.5 py-1.5 text-xs outline-none" style={inputStyle} />
      </div>
      <textarea value={(o.includes ?? []).join("\n")} onChange={e => onChange({ includes: e.target.value.split("\n").map(s => s.trim()).filter(Boolean) })} rows={3} placeholder="Included items (one per line)" className="w-full rounded-lg px-2.5 py-1.5 text-xs outline-none resize-none" style={inputStyle} />
      {(o.includes && o.includes.length > 0) && (
        <div className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
          <Check className="w-3 h-3" style={{ color: accent }} /> {o.includes.length} included item{o.includes.length === 1 ? "" : "s"}
        </div>
      )}
    </div>
  );
}

// ─── Small bits ───────────────────────────────────────────
const inputStyle: React.CSSProperties = { border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" };

function Card({ title, icon: Icon, action, children }: { title: string; icon: typeof FileText; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center justify-between mb-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          <Icon className="w-3.5 h-3.5" /> {title}
        </p>
        {action}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>{label}</label>{children}</div>;
}
