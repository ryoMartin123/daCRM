"use client";

// ─── Settings · Projects · Maps ───────────────────────────
// Lists the project Map templates (built-in + custom) with a clean, modern card:
// a lane-strip preview + workflow stats. New/Edit opens the full-screen MapBuilder.
// Persisted via the scoped settings store; project types are fixed CRM defaults.

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Copy, ChevronRight, GitBranch, Layers, Link2, CheckSquare } from "lucide-react";
import { useScopedSetting } from "@/lib/settings-scope/useScopedSetting";
import InheritanceChip from "@/components/settings/InheritanceChip";
import { useRegisterSaveAction } from "@/components/settings/SettingsActions";
import MapBuilder from "@/components/settings/MapBuilder";
import { DEFAULT_MAP_TEMPLATES, MAP_TEMPLATES_KEY, newMapTemplateId, type MapTemplate } from "@/lib/projects/map-templates";
import { DEFAULT_PROJECT_TYPES } from "@/lib/projects/settings";

const ACCENT = "#4f46e5";
const clone = (t: MapTemplate): MapTemplate => JSON.parse(JSON.stringify(t));
const isBuiltIn = (id: string) => DEFAULT_MAP_TEMPLATES.some(t => t.id === id);
const typeLabel = (key: string) => DEFAULT_PROJECT_TYPES.find(t => t.key === key)?.label ?? key;

// ─── Modern lane-strip preview ──
function TemplatePreview({ t }: { t: MapTemplate }) {
  const groups = [...t.groups];
  const extra = t.nodes.some(n => !groups.includes(n.group));
  const lanes = [...groups, ...(extra ? ["Other"] : [])];
  const count = (g: string) => t.nodes.filter(n => g === "Other" ? !t.groups.includes(n.group) : n.group === g).length;
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto thin-scroll-x pb-0.5">
      {lanes.map((g, i) => (
        <div key={g} className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
            <span className="text-[11px] font-medium whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>{g}</span>
            <span className="text-[10px] font-bold px-1.5 rounded-full tabular-nums" style={{ backgroundColor: "var(--accent-soft-bg)", color: "var(--accent-text)" }}>{count(g)}</span>
          </div>
          {i < lanes.length - 1 && <ChevronRight className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />}
        </div>
      ))}
    </div>
  );
}

function Stat({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return <span className="flex items-center gap-1" style={{ color: "var(--text-muted)" }}><Icon className="w-3.5 h-3.5" />{children}</span>;
}

// ─── Main editor ──────────────────────────────────────────
export default function ProjectMapsEditor() {
  const scoped = useScopedSetting<MapTemplate[]>(MAP_TEMPLATES_KEY, DEFAULT_MAP_TEMPLATES);
  const [templates, setTemplates] = useState<MapTemplate[]>(DEFAULT_MAP_TEMPLATES);
  const [baseline, setBaseline] = useState(() => JSON.stringify(DEFAULT_MAP_TEMPLATES));
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState<MapTemplate | null>(null);

  useEffect(() => { setTemplates(scoped.value); setBaseline(JSON.stringify(scoped.value)); setEditing(null); }, [scoped.value]);

  const dirty = JSON.stringify(templates) !== baseline;
  function handleSave() { scoped.save(templates); setBaseline(JSON.stringify(templates)); setSaved(true); setTimeout(() => setSaved(false), 2000); }
  useRegisterSaveAction({ dirty, saved, onSave: handleSave });

  const typeOpts = DEFAULT_PROJECT_TYPES.filter(t => t.active);

  function startNew() {
    setEditing({
      id: newMapTemplateId(), name: "New Map", projectTypes: [], groups: ["Planning", "Work", "Closeout"],
      nodes: [{ key: "created", title: "Project Created", type: "milestone", group: "Planning", manual: true, deps: [] }],
    });
  }
  function startEdit(t: MapTemplate) { setEditing(clone(t)); }
  function duplicate(t: MapTemplate) {
    const copy = clone(t); copy.id = newMapTemplateId(); copy.name = `${t.name} (Copy)`; copy.projectTypes = [];
    setTemplates(prev => [...prev, copy]); setSaved(false);
  }
  function removeTemplate(id: string) { setTemplates(prev => prev.filter(t => t.id !== id)); setSaved(false); }
  function onBuilderSave(updated: MapTemplate) {
    setTemplates(prev => {
      const next = prev.some(t => t.id === updated.id) ? prev.map(t => t.id === updated.id ? updated : t) : [...prev, updated];
      scoped.save(next); setBaseline(JSON.stringify(next));
      return next;
    });
    setEditing(null); setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  if (editing) return <MapBuilder key={editing.id} template={editing} typeOptions={typeOpts} onSave={onBuilderSave} onCancel={() => setEditing(null)} />;

  return (
    <div className="space-y-4">
      <InheritanceChip source={scoped.source} isOverride={scoped.isOverride} parentSource={scoped.parentSource} onOverride={scoped.override} onReset={scoped.reset} />
      {dirty && <div className="rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>You have unsaved changes.</div>}

      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{templates.length} map{templates.length === 1 ? "" : "s"} · drive the project workflow and new-project wizard.</p>
        <button onClick={startNew} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white shrink-0" style={{ backgroundColor: ACCENT }}><Plus className="w-3.5 h-3.5" /> New Map</button>
      </div>

      <div className="grid gap-3">
        {templates.map(t => {
          const mirrored = t.nodes.filter(n => !n.manual).length;
          const manual = t.nodes.length - mirrored;
          return (
            <div key={t.id} className="group rounded-2xl overflow-hidden transition-shadow hover:shadow-md" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
              {/* Header */}
              <div className="flex items-start gap-3 p-4">
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-soft-bg)" }}><GitBranch className="w-[18px] h-[18px]" style={{ color: ACCENT }} /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{t.name}</p>
                    {isBuiltIn(t.id) && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}>Built-in</span>}
                  </div>
                  {t.projectTypes.length ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {t.projectTypes.map(k => <span key={k} className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--accent-soft-bg)", color: "var(--accent-text)" }}>{typeLabel(k)}</span>)}
                    </div>
                  ) : <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>No project type assigned</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(t)} title="Edit" className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]" style={{ color: "var(--text-muted)" }}><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => duplicate(t)} title="Duplicate" className="p-1.5 rounded-lg hover:bg-[var(--bg-input)]" style={{ color: "var(--text-muted)" }}><Copy className="w-3.5 h-3.5" /></button>
                  {!isBuiltIn(t.id) && <button onClick={() => removeTemplate(t.id)} title="Delete" className="p-1.5 rounded-lg hover:bg-red-50" style={{ color: "#9ca3af" }}><Trash2 className="w-3.5 h-3.5" /></button>}
                </div>
              </div>

              {/* Lane strip */}
              <div className="px-4 pb-3"><TemplatePreview t={t} /></div>

              {/* Stats */}
              <div className="flex items-center gap-3 px-4 py-2.5 text-[11px] font-medium" style={{ borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
                <Stat icon={CheckSquare}>{t.nodes.length} steps</Stat>
                <span style={{ color: "var(--border)" }}>·</span>
                <Stat icon={Layers}>{t.groups.length} lanes</Stat>
                <span style={{ color: "var(--border)" }}>·</span>
                <Stat icon={Link2}>{mirrored} mirrored</Stat>
                <span style={{ color: "var(--border)" }}>·</span>
                <Stat icon={CheckSquare}>{manual} manual</Stat>
                <button onClick={() => startEdit(t)} className="ml-auto flex items-center gap-1 font-semibold" style={{ color: ACCENT }}>Open builder <ChevronRight className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          );
        })}
        {templates.length === 0 && (
          <div className="rounded-2xl p-10 text-center" style={{ border: "1.5px dashed var(--border)", backgroundColor: "var(--bg-surface-2)" }}>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No maps yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Create your first project map to drive the workflow.</p>
            <button onClick={startNew} className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: ACCENT }}><Plus className="w-3.5 h-3.5" /> New Map</button>
          </div>
        )}
      </div>
    </div>
  );
}
