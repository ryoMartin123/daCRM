"use client";

// ─── Guided Role Builder (Create / Edit role) ─────────────
// Replaces the giant blank permission matrix with progressive disclosure across
// four tabs — Basics, Access, Permissions, Review. Most roles start from a preset
// or an existing role and adjust; the full action matrix only appears per-module
// under Advanced/Custom. Sticky header keeps Cancel / Create always reachable.

import { useMemo, useState } from "react";
import { ArrowLeft, Check, Shield, Sparkles, Copy, FileStack } from "lucide-react";
import UiSelect from "@/components/ui/Select";
import {
  AppAccessCards, DataScopeField, PermissionAccordions, SensitiveAccess, AppBadges, ScopeBadge,
} from "@/components/settings/rolesUi";
import {
  START_PRESETS, draftFromPreset, roleApps, roleDataScope, appLevelOf, APP_META,
  APP_LEVELS, sensitiveCount, adminCount,
} from "@/lib/roles/appmap";
import { getOrgRoles, upsertRole, roleKeyFromLabel } from "@/lib/roles/store";
import { roleErrors } from "@/lib/roles/validate";
import type { RoleDefinition } from "@/lib/roles/types";

type Tab = "basics" | "access" | "permissions" | "review";
const TABS: { key: Tab; label: string }[] = [
  { key: "basics", label: "Basics" },
  { key: "access", label: "Access" },
  { key: "permissions", label: "Permissions" },
  { key: "review", label: "Review" },
];

function blankRole(): RoleDefinition {
  return {
    key: "", label: "", description: "", system: false, scopeTier: "employee",
    dataScope: "assigned", apps: ["portal"], allAccess: false, capabilities: {},
    masks: [], flags: [], status: "active",
  };
}

export default function RoleBuilder({ initial, isNew, onCancel, onSaved }: {
  initial?: RoleDefinition; isNew: boolean; onCancel: () => void; onSaved: () => void;
}) {
  const [draft, setDraft] = useState<RoleDefinition>(() => initial ? JSON.parse(JSON.stringify(initial)) : blankRole());
  const [tab, setTab] = useState<Tab>("basics");
  const [errors, setErrors] = useState<string[]>([]);
  const [startId, setStartId] = useState<string | null>(isNew ? null : "existing");
  const others = useMemo(() => getOrgRoles().filter((r) => r.key !== initial?.key), [initial?.key]);

  function applyStart(base: RoleDefinition, id: string) {
    setStartId(id);
    // Preserve anything the admin already typed.
    setDraft((d) => ({ ...base, label: d.label, description: d.description || base.description, status: d.status ?? "active" }));
  }

  function save() {
    const key = draft.key || roleKeyFromLabel(draft.label);
    // Preserve the original type: new/duplicated roles are custom (draft.system
    // already false); editing a system role keeps it a System Default.
    const toSave: RoleDefinition = { ...draft, key };
    const errs = roleErrors(toSave, others);
    if (errs.length) { setErrors(errs); setTab("basics"); return; }
    upsertRole(toSave);
    onSaved();
  }

  return (
    <div className="space-y-5 pb-4">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 -mx-6 px-6 py-3 flex items-center justify-between gap-3"
        style={{ backgroundColor: "var(--bg-page)", borderBottom: "1px solid var(--border-subtle)" }}>
        <button onClick={onCancel} className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80" style={{ color: "var(--text-secondary)" }}>
          <ArrowLeft className="w-4 h-4" /> Roles
        </button>
        <div className="flex items-center gap-2">
          <button onClick={onCancel} className="text-sm font-medium px-3 py-2 rounded-lg" style={{ color: "var(--text-secondary)" }}>Cancel</button>
          <button onClick={save}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg text-white transition-colors" style={{ backgroundColor: "#4f46e5" }}>
            <Check className="w-4 h-4" /> {isNew ? "Create Role" : "Save Role"}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>{isNew ? "New Role" : `Edit "${initial?.label}"`}</h2>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Create a role by choosing a starting point, app access, data scope, and permissions.
        </p>
      </div>

      {errors.length > 0 && (
        <div className="px-3 py-2.5 rounded-lg space-y-1" style={{ backgroundColor: "#fee2e2", border: "1px solid #fecaca" }}>
          {errors.map((e, i) => <p key={i} className="text-xs" style={{ color: "#991b1b" }}>• {e}</p>)}
        </div>
      )}

      {/* Tab nav */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
        {TABS.map((t, i) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: tab === t.key ? "var(--bg-surface)" : "transparent", color: tab === t.key ? "var(--text-primary)" : "var(--text-muted)", boxShadow: tab === t.key ? "var(--shadow-card)" : "none" }}>
            <span className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: tab === t.key ? "#4f46e5" : "var(--bg-input)", color: tab === t.key ? "#fff" : "var(--text-muted)" }}>{i + 1}</span>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "basics" && (
        <BasicsTab draft={draft} setDraft={setDraft} isNew={isNew} startId={startId} applyStart={applyStart} others={others} />
      )}
      {tab === "access" && (
        <div className="space-y-4">
          <SectionHead title="App Access" sub="Choose which apps this role can open. My Portal is always available." />
          <AppAccessCards draft={draft} onChange={setDraft} />
          <SectionHead title="Data Scope" sub="The default visibility window for users with this role." />
          <DataScopeField draft={draft} onChange={setDraft} />
        </div>
      )}
      {tab === "permissions" && (
        <div className="space-y-4">
          <SectionHead title="Permissions" sub="Set a simple level per module. Open Advanced for the full action matrix." />
          <PermissionAccordions draft={draft} onChange={setDraft} />
          <SectionHead title="Sensitive Access" sub="Kept separate from normal permissions." />
          <SensitiveAccess draft={draft} onChange={setDraft} />
        </div>
      )}
      {tab === "review" && <ReviewTab draft={draft} />}
    </div>
  );
}

function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</p>
    </div>
  );
}

// ─── Basics + Start From ──────────────────────────────────
function BasicsTab({ draft, setDraft, isNew, startId, applyStart, others }: {
  draft: RoleDefinition; setDraft: (r: RoleDefinition) => void; isNew: boolean;
  startId: string | null; applyStart: (base: RoleDefinition, id: string) => void; others: RoleDefinition[];
}) {
  const [copyKey, setCopyKey] = useState("");
  return (
    <div className="space-y-5">
      {isNew && (
        <div>
          <SectionHead title="Start From" sub="Most roles start from a preset or an existing role, then adjust. You don't have to start blank." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3">
            <StartCard active={startId === "blank"} icon={Sparkles} title="Start Blank" desc="An empty custom role."
              onClick={() => applyStart(blankRole(), "blank")} />
            {START_PRESETS.map((p) => (
              <StartCard key={p.id} active={startId === p.id} icon={Shield} title={p.label} desc={p.description}
                onClick={() => applyStart(draftFromPreset(p.id), p.id)} />
            ))}
          </div>
          <div className="mt-3 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center gap-3" style={{ backgroundColor: "var(--bg-surface)", border: `1px solid ${startId === "copy" ? "var(--accent-soft-border)" : "var(--border-subtle)"}` }}>
            <div className="flex items-center gap-2 shrink-0">
              <Copy className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Copy existing role</span>
            </div>
            <div className="flex-1">
              <UiSelect size="sm" value={copyKey} onChange={(v) => {
                setCopyKey(v);
                const src = others.find((r) => r.key === v);
                if (src) { const c: RoleDefinition = JSON.parse(JSON.stringify(src)); c.key = ""; c.system = false; c.locked = false; applyStart(c, "copy"); }
              }} options={[{ value: "", label: "Select a role to copy…" }, ...others.map((r) => ({ value: r.key, label: r.label }))]} />
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl p-4 grid sm:grid-cols-2 gap-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
        <LField label="Role name">
          <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="e.g. Service Manager"
            className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface-2)", color: "var(--text-primary)" }} />
        </LField>
        <LField label="Role type">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-input)", color: "var(--text-secondary)" }}>
            <FileStack className="w-3.5 h-3.5" /> {draft.system ? "System Default" : "Custom"}
          </div>
        </LField>
        <div className="sm:col-span-2">
          <LField label="Description">
            <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="What this role is for"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface-2)", color: "var(--text-primary)" }} />
          </LField>
        </div>
        <LField label="Status">
          <div className="flex gap-2">
            {(["active", "draft"] as const).map((s) => {
              const on = (draft.status ?? "active") === s;
              return (
                <button key={s} onClick={() => setDraft({ ...draft, status: s })}
                  className="flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all"
                  style={{ border: `1.5px solid ${on ? "#4f46e5" : "var(--border)"}`, backgroundColor: on ? "#e0e7ff" : "var(--bg-surface-2)", color: on ? "#4f46e5" : "var(--text-secondary)" }}>
                  {s}
                </button>
              );
            })}
          </div>
        </LField>
      </div>
    </div>
  );
}

function StartCard({ active, icon: Icon, title, desc, onClick }: { active: boolean; icon: typeof Shield; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left rounded-xl p-3 transition-all"
      style={{ border: `1.5px solid ${active ? "#4f46e5" : "var(--border-subtle)"}`, backgroundColor: active ? "#f5f3ff" : "var(--bg-surface)" }}>
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: active ? "#e0e7ff" : "var(--bg-input)" }}>
          <Icon className="w-3.5 h-3.5" style={{ color: active ? "#4f46e5" : "var(--text-muted)" }} />
        </span>
        <span className="text-sm font-semibold" style={{ color: active ? "#4f46e5" : "var(--text-primary)" }}>{title}</span>
      </div>
      <p className="text-[11px] mt-1.5 leading-snug" style={{ color: "var(--text-muted)" }}>{desc}</p>
    </button>
  );
}

function LField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Review ───────────────────────────────────────────────
function ReviewTab({ draft }: { draft: RoleDefinition }) {
  const apps = roleApps(draft).filter((a) => a !== "portal" && APP_META[a]);
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{draft.label || "Untitled role"}</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{draft.description || "No description"}</p>
      </div>
      <ReviewRow label="Apps enabled"><AppBadges role={draft} /></ReviewRow>
      <ReviewRow label="Default data scope"><ScopeBadge scope={roleDataScope(draft)} /></ReviewRow>
      <ReviewRow label="Permission level by app">
        <div className="flex flex-col gap-1 items-end">
          {apps.length === 0 ? <span className="text-xs italic" style={{ color: "var(--text-muted)" }}>No apps enabled</span> :
            apps.map((a) => (
              <span key={a} className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {APP_META[a].name}: <span className="font-medium">{draft.allAccess ? "Full access" : (APP_LEVELS.find((l) => l.value === appLevelOf(draft, a))?.label ?? "Custom")}</span>
              </span>
            ))}
        </div>
      </ReviewRow>
      <ReviewRow label="Sensitive permissions"><Count n={sensitiveCount(draft)} /></ReviewRow>
      <ReviewRow label="Administrative permissions"><Count n={adminCount(draft)} /></ReviewRow>
    </div>
  );
}

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
      <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

function Count({ n }: { n: number }) {
  return <span className="text-sm font-semibold" style={{ color: n > 0 ? "var(--text-primary)" : "var(--text-muted)" }}>{n}</span>;
}
