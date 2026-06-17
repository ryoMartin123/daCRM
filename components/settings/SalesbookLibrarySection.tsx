"use client";

// Salesbook Library (Settings → Sales & Catalog).
// A premium template gallery of CRM-provided salesbooks the user can preview and
// copy ("Use This Salesbook") into their own company workspace. Installed copies
// are company-owned and editable without affecting the CRM master template.
//
// Phase 1: gallery + preview drawer + install flow + installed list. Spreadsheet
// import and the company-salesbook editor land later.

import { useMemo, useState } from "react";
import {
  BookOpen, Search, Eye, Check, Download, Trash2, X, Layers, Package,
  CreditCard, ShieldCheck, FileText, Sparkles, Pencil,
} from "lucide-react";
import UiSelect from "@/components/ui/Select";
import CompanySalesbookEditor from "@/components/settings/CompanySalesbookEditor";
import { useHierarchy } from "@/components/providers/HierarchyProvider";
import { SECTION_LABELS, type SectionKey } from "@/lib/proposals/data";
import {
  getSalesbookTemplates, getCompanySalesbooks, isTemplateInstalled,
  installSalesbook, uninstallSalesbook,
  INDUSTRY_LABELS, PROPOSAL_TYPE_LABELS, COMPLEXITY_LABELS, INDUSTRY_ACCENT,
  type SalesbookTemplate, type SalesbookOption, type SalesbookIndustry,
  type SalesbookProposalType, type SalesbookComplexity,
} from "@/lib/salesbooks/data";

type View = "library" | "installed";
type StatusFilter = "all" | "available" | "installed";

export default function SalesbookLibrarySection() {
  const { allCompanies, allLocations, effectiveCompanyId } = useHierarchy();

  const [tick, setTick] = useState(0);          // bump to re-read after install/uninstall
  const refresh = () => setTick(t => t + 1);

  const [view, setView] = useState<View>("library");
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState<SalesbookIndustry | "all">("all");
  const [ptype, setPtype] = useState<SalesbookProposalType | "all">("all");
  const [complexity, setComplexity] = useState<SalesbookComplexity | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const [previewId, setPreviewId] = useState<string | null>(null);
  const [installId, setInstallId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const templates = getSalesbookTemplates();
  const installed = useMemo(() => getCompanySalesbooks(), [tick]);

  const filtered = templates.filter(t => {
    const inst = isTemplateInstalled(t.id);
    return (
      (industry === "all" || t.industry === industry) &&
      (ptype === "all" || t.proposalType === ptype) &&
      (complexity === "all" || t.complexity === complexity) &&
      (status === "all" || (status === "installed" ? inst : !inst)) &&
      (!search || t.name.toLowerCase().includes(search.toLowerCase()) || t.bestFor.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const previewTmpl = templates.find(t => t.id === previewId) ?? null;
  const installTmpl = templates.find(t => t.id === installId) ?? null;

  // Editing an installed company salesbook takes over the whole section.
  if (editingId) {
    return <CompanySalesbookEditor sbId={editingId} onBack={() => { setEditingId(null); refresh(); }} />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <BookOpen className="w-5 h-5" style={{ color: "#4f46e5" }} /> Salesbook Library
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Premium proposal libraries to copy into your company and customize. Used by the “Proposal From Template” quote path.
          </p>
        </div>
        {/* View toggle */}
        <div className="flex items-center rounded-lg overflow-hidden shrink-0" style={{ border: "1px solid var(--border)" }}>
          {([["library", "Library"], ["installed", `Installed${installed.length ? ` (${installed.length})` : ""}`]] as const).map(([k, label]) => {
            const active = view === k;
            return (
              <button key={k} onClick={() => setView(k as View)} className="px-3 py-1.5 text-xs font-medium transition-colors"
                style={{ backgroundColor: active ? "#4f46e5" : "var(--bg-surface)", color: active ? "#fff" : "var(--text-secondary)" }}>{label}</button>
            );
          })}
        </div>
      </div>

      {view === "library" ? (
        <>
          {/* Filters */}
          <div className="rounded-xl p-3 flex items-center gap-2 flex-wrap" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 flex-1 min-w-[180px]" style={{ backgroundColor: "var(--bg-input)" }}>
              <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search salesbooks…"
                className="bg-transparent text-sm outline-none w-full" style={{ color: "var(--text-primary)" }} />
            </div>
            <div className="w-40"><UiSelect size="sm" value={industry} onChange={v => setIndustry(v as typeof industry)}
              options={[{ value: "all", label: "All Industries" }, ...Object.entries(INDUSTRY_LABELS).map(([v, l]) => ({ value: v, label: l }))]} /></div>
            <div className="w-44"><UiSelect size="sm" value={ptype} onChange={v => setPtype(v as typeof ptype)}
              options={[{ value: "all", label: "All Proposal Types" }, ...Object.entries(PROPOSAL_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))]} /></div>
            <div className="w-36"><UiSelect size="sm" value={complexity} onChange={v => setComplexity(v as typeof complexity)}
              options={[{ value: "all", label: "All Complexity" }, ...Object.entries(COMPLEXITY_LABELS).map(([v, l]) => ({ value: v, label: l }))]} /></div>
            <div className="w-36"><UiSelect size="sm" value={status} onChange={v => setStatus(v as StatusFilter)}
              options={[{ value: "all", label: "All Status" }, { value: "available", label: "Available" }, { value: "installed", label: "Installed" }]} /></div>
          </div>

          {/* Gallery */}
          {filtered.length === 0 ? (
            <div className="rounded-xl py-16 text-center" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No salesbooks match your filters.</p>
            </div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {filtered.map(t => (
                <SalesbookCard key={t.id} t={t} installed={isTemplateInstalled(t.id)}
                  onPreview={() => setPreviewId(t.id)} onUse={() => setInstallId(t.id)} />
              ))}
            </div>
          )}
        </>
      ) : (
        <InstalledList installed={installed} onRefresh={refresh} onEdit={setEditingId} />
      )}

      {previewTmpl && <PreviewDrawer t={previewTmpl} installed={isTemplateInstalled(previewTmpl.id)}
        onClose={() => setPreviewId(null)} onUse={() => { setPreviewId(null); setInstallId(previewTmpl.id); }} />}

      {installTmpl && <InstallModal t={installTmpl} companies={allCompanies} locations={allLocations}
        defaultCompanyId={effectiveCompanyId ?? allCompanies[0]?.id ?? ""}
        onClose={() => setInstallId(null)} onInstalled={() => { setInstallId(null); refresh(); setView("installed"); }} />}
    </div>
  );
}

// ─── Gallery card ─────────────────────────────────────────
function SalesbookCard({ t, installed, onPreview, onUse }: { t: SalesbookTemplate; installed: boolean; onPreview: () => void; onUse: () => void }) {
  const accent = INDUSTRY_ACCENT[t.industry];
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-md"
      style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
      {/* Visual header */}
      <div className="px-4 pt-4 pb-3 relative" style={{ background: `linear-gradient(135deg, ${accent}14, transparent)` }}>
        <div className="flex items-start justify-between gap-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: accent + "1f" }}>
            <BookOpen className="w-5 h-5" style={{ color: accent }} />
          </div>
          {installed ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: "#d1fae5", color: "#065f46" }}>
              <Check className="w-3 h-3" /> Installed
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}>{t.styleBadge}</span>
          )}
        </div>
        <p className="text-sm font-semibold mt-2.5 leading-snug" style={{ color: "var(--text-primary)" }}>{t.name}</p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <Badge color={accent}>{INDUSTRY_LABELS[t.industry]}</Badge>
          <Badge>{PROPOSAL_TYPE_LABELS[t.proposalType]}</Badge>
          <Badge>{COMPLEXITY_LABELS[t.complexity]}</Badge>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 flex-1">
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>{t.bestFor}</p>
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}><Layers className="w-3.5 h-3.5" /> {t.sections.length} sections</span>
          <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}><Package className="w-3.5 h-3.5" /> {t.options.length} option{t.options.length === 1 ? "" : "s"}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <button onClick={onPreview} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
          style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
          <Eye className="w-3.5 h-3.5" /> Preview
        </button>
        <button onClick={onUse} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-white"
          style={{ backgroundColor: installed ? "var(--text-muted)" : accent }}>
          {installed ? <><Download className="w-3.5 h-3.5" /> Install again</> : <><Download className="w-3.5 h-3.5" /> Use This Salesbook</>}
        </button>
      </div>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
      style={{ backgroundColor: color ? color + "1a" : "var(--bg-input)", color: color ?? "var(--text-muted)" }}>{children}</span>
  );
}

// ─── Preview drawer ───────────────────────────────────────
function PreviewDrawer({ t, installed, onClose, onUse }: { t: SalesbookTemplate; installed: boolean; onClose: () => void; onUse: () => void }) {
  const accent = INDUSTRY_ACCENT[t.industry];
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ backgroundColor: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="w-full max-w-xl h-full overflow-y-auto thin-scroll-y" onClick={e => e.stopPropagation()}
        style={{ backgroundColor: "var(--bg-surface)", boxShadow: "-12px 0 40px rgba(0,0,0,0.2)" }}>
        {/* Cover / header style */}
        <div className="px-6 py-6 relative" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}>
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/80">{INDUSTRY_LABELS[t.industry]} Salesbook</p>
          <p className="text-xl font-bold text-white mt-1">{t.name}</p>
          <p className="text-sm text-white/85 mt-1.5">{t.bestFor}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">{PROPOSAL_TYPE_LABELS[t.proposalType]}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">{COMPLEXITY_LABELS[t.complexity]}</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">{t.styleBadge}</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Section list */}
          <PreviewBlock icon={Layers} title={`Proposal sections (${t.sections.length})`}>
            <div className="grid grid-cols-2 gap-1.5">
              {t.sections.map((k, i) => (
                <div key={k} className="flex items-center gap-2 text-sm px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: "var(--bg-surface-2)" }}>
                  <span className="text-[10px] font-mono w-4 text-center shrink-0" style={{ color: "var(--text-muted)" }}>{i + 1}</span>
                  <span className="truncate" style={{ color: "var(--text-secondary)" }}>{SECTION_LABELS[k as SectionKey] ?? k}</span>
                </div>
              ))}
            </div>
          </PreviewBlock>

          {/* Sample option cards */}
          {t.options.length > 0 && (
            <PreviewBlock icon={Package} title={`Sample option cards (${t.options.length})`}>
              <div className="space-y-2.5">
                {t.options.map(o => <OptionCard key={o.id} o={o} accent={accent} />)}
              </div>
            </PreviewBlock>
          )}

          {/* Financing */}
          {t.financingNote && (
            <PreviewBlock icon={CreditCard} title="Financing">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t.financingNote}</p>
            </PreviewBlock>
          )}
          {/* Warranty / terms */}
          {(t.warranty || t.terms) && (
            <PreviewBlock icon={ShieldCheck} title="Warranty & terms">
              {t.warranty && <p className="text-sm mb-1.5" style={{ color: "var(--text-secondary)" }}>{t.warranty}</p>}
              {t.terms && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{t.terms}</p>}
            </PreviewBlock>
          )}

          <div className="rounded-xl p-3 flex items-start gap-2" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px dashed var(--border)" }}>
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }} />
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              When you install this, everything above is copied into your company workspace. You can rename it, edit option pricing, swap images, and adjust terms — the master template stays untouched.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 py-4 flex items-center justify-between" style={{ backgroundColor: "var(--bg-surface)", borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={onClose} className="text-sm px-3 py-2 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Close</button>
          <button onClick={onUse} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: accent }}>
            <Download className="w-4 h-4" /> {installed ? "Install again" : "Use This Salesbook"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewBlock({ icon: Icon, title, children }: { icon: typeof Layers; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
        <Icon className="w-3.5 h-3.5" /> {title}
      </p>
      {children}
    </div>
  );
}

function OptionCard({ o, accent }: { o: SalesbookOption; accent: string }) {
  const tierLabel = o.tier ? o.tier[0].toUpperCase() + o.tier.slice(1) : null;
  return (
    <div className="rounded-xl p-3.5" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
      {o.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={o.image} alt={o.name} className="w-full rounded-lg mb-3" style={{ height: "120px", objectFit: "cover" }} />
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {tierLabel && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: accent + "1a", color: accent }}>{tierLabel}</span>}
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{o.name}</p>
          </div>
          {(o.brand || o.model) && <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{[o.brand, o.model].filter(Boolean).join(" · ")}</p>}
          {o.description && <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{o.description}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>${o.price.toLocaleString()}</p>
          {o.monthlyPrice ? <p className="text-[11px]" style={{ color: accent }}>${o.monthlyPrice}/mo</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {o.efficiency && <Badge>{o.efficiency}</Badge>}
        {o.warranty && <Badge>{o.warranty}</Badge>}
      </div>
      {o.includes && o.includes.length > 0 && (
        <ul className="mt-2 space-y-1">
          {o.includes.map((inc, i) => (
            <li key={i} className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
              <Check className="w-3 h-3 shrink-0" style={{ color: accent }} /> {inc}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Install modal ────────────────────────────────────────
function InstallModal({ t, companies, locations, defaultCompanyId, onClose, onInstalled }: {
  t: SalesbookTemplate;
  companies: { id: string; name: string }[];
  locations: { id: string; name: string; companyId: string }[];
  defaultCompanyId: string;
  onClose: () => void;
  onInstalled: () => void;
}) {
  const accent = INDUSTRY_ACCENT[t.industry];
  const [companyId, setCompanyId] = useState(defaultCompanyId);
  const [locationId, setLocationId] = useState("");
  const [name, setName] = useState(t.name);
  const [includeOptions, setIncludeOptions] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);
  const [includeTerms, setIncludeTerms] = useState(true);

  const companyLocations = locations.filter(l => l.companyId === companyId);

  function doInstall() {
    if (!companyId) return;
    installSalesbook(t.id, {
      companyId, locationId: locationId || undefined,
      name, includeOptions, includeImages, includeTerms,
    });
    onInstalled();
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}
        style={{ backgroundColor: "var(--bg-surface)", boxShadow: "0 16px 48px rgba(0,0,0,0.28)" }}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Use This Salesbook</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Copy “{t.name}” into your company workspace.</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Company *</label>
              <UiSelect value={companyId} onChange={v => { setCompanyId(v); setLocationId(""); }}
                options={companies.map(c => ({ value: c.id, label: c.name }))} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Location <span style={{ color: "var(--text-muted)" }}>(opt.)</span></label>
              <UiSelect value={locationId} onChange={setLocationId} placeholder="All locations"
                options={[{ value: "", label: "All locations" }, ...companyLocations.map(l => ({ value: l.id, label: l.name }))]} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Salesbook name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }} />
          </div>
          <div className="space-y-2">
            <CheckRow label="Include sample items / options" checked={includeOptions} onChange={setIncludeOptions} />
            <CheckRow label="Include sample images" checked={includeImages} onChange={setIncludeImages} />
            <CheckRow label="Include default terms" checked={includeTerms} onChange={setIncludeTerms} />
          </div>
        </div>
        <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Cancel</button>
          <button onClick={doInstall} disabled={!companyId} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40" style={{ backgroundColor: accent }}>
            <Download className="w-4 h-4" /> Create Company Salesbook
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg cursor-pointer" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="accent-indigo-600 w-4 h-4" />
    </label>
  );
}

// ─── Installed list ───────────────────────────────────────
function InstalledList({ installed, onRefresh, onEdit }: { installed: ReturnType<typeof getCompanySalesbooks>; onRefresh: () => void; onEdit: (id: string) => void }) {
  if (installed.length === 0) {
    return (
      <div className="rounded-xl py-16 text-center" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
        <BookOpen className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No salesbooks installed yet</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Browse the Library and choose “Use This Salesbook” to copy one in.</p>
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      {installed.map(sb => {
        const accent = INDUSTRY_ACCENT[sb.industry];
        return (
          <div key={sb.id} className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: accent + "1a" }}>
              <BookOpen className="w-4 h-4" style={{ color: accent }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{sb.name}</p>
              <p className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                {INDUSTRY_LABELS[sb.industry]} · {PROPOSAL_TYPE_LABELS[sb.proposalType]} · {sb.sections.length} sections · {sb.options.length} options · installed {sb.installedAt}
              </p>
            </div>
            <span className="hidden sm:flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full shrink-0" style={{ backgroundColor: "#d1fae5", color: "#065f46" }}>
              <Check className="w-3 h-3" /> Company-owned
            </span>
            <button onClick={() => onEdit(sb.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium shrink-0" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
              <Pencil className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => { uninstallSalesbook(sb.id); onRefresh(); }} title="Remove" className="p-2 rounded-lg shrink-0" style={{ color: "var(--text-muted)" }}>
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      })}
      <div className="flex items-center gap-1.5 text-[11px] px-1 pt-1" style={{ color: "var(--text-muted)" }}>
        <FileText className="w-3.5 h-3.5" /> Edit a salesbook to tune its sections, option pricing, and terms. Spreadsheet import is coming next.
      </div>
    </div>
  );
}
