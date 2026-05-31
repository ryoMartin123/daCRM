"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Plus, SlidersHorizontal, ChevronUp, ChevronDown, LayoutList, Columns3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ALL_LEADS, LEAD_STAGE_CONFIG, LEAD_SOURCE_LABELS, leadAgeDays,
  type Lead, type LeadStage,
} from "@/lib/leads/data";
import { getStages, type PipelineStage, type StageCategory } from "@/lib/pipelines/data";
import { useHierarchy } from "@/components/providers/HierarchyProvider";

// ─── Stage display config, resolved from pipeline settings ──
// Pipeline settings keys (e.g. "new_lead") match the lead.stage values.
// Falls back to LEAD_STAGE_CONFIG for any key not present in settings.
interface StageDisplay { label: string; color: string; bg: string; category: StageCategory }

function buildStageResolver(stages: PipelineStage[]): (key: string) => StageDisplay {
  const byKey = new Map(stages.map(s => [s.key, s]));
  return (key: string) => {
    const s = byKey.get(key);
    if (s) return { label: s.name, color: s.color, bg: s.color + "22", category: s.category };
    const legacy = LEAD_STAGE_CONFIG[key as LeadStage];
    if (legacy) {
      const cat: StageCategory = key === "won" ? "won" : key === "lost" ? "lost" : "open";
      return { label: legacy.label, color: legacy.color, bg: legacy.bg, category: cat };
    }
    return { label: key, color: "#6b7280", bg: "var(--bg-input)", category: "open" };
  };
}

type SortField = "customerName" | "stage" | "source" | "estimatedValue" | "locationName" | "createdAt";

// ─── Age display ──────────────────────────────────────────
function AgeChip({ createdAt }: { createdAt: string }) {
  const days = leadAgeDays(createdAt);
  const urgent = days > 14;
  return (
    <span
      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{
        backgroundColor: urgent ? "#fee2e2" : "var(--bg-input)",
        color: urgent ? "#991b1b" : "var(--text-muted)",
      }}
    >
      {days}d
    </span>
  );
}

// ─── Pipeline card ────────────────────────────────────────
function PipelineCard({ lead }: { lead: Lead }) {
  return (
    <Link
      href={`/leads/${lead.id}`}
      className="block rounded-xl p-3 mb-2 transition-colors hover:border-indigo-200"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
        textDecoration: "none",
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600 shrink-0">
            {lead.customerInitials}
          </div>
          <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {lead.customerName}
          </p>
        </div>
        <AgeChip createdAt={lead.createdAt} />
      </div>

      <p className="text-[11px] leading-snug mb-2" style={{ color: "var(--text-secondary)" }}>
        {lead.title}
      </p>

      <div className="flex items-center justify-between">
        {lead.estimatedValue ? (
          <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
            {lead.estimatedValue}
          </span>
        ) : (
          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>TBD</span>
        )}
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
          style={{ backgroundColor: "#4f46e5" }}
          title={lead.assignedTo}
        >
          {lead.assignedToInitials}
        </div>
      </div>
    </Link>
  );
}

// ─── Pipeline view ────────────────────────────────────────
function PipelineView({ leads, openStages, resolve }: {
  leads: Lead[];
  openStages: PipelineStage[];
  resolve: (key: string) => StageDisplay;
}) {
  const won  = leads.filter(l => resolve(l.stage).category === "won");
  const lost = leads.filter(l => resolve(l.stage).category === "lost");

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-3 min-w-max px-6 pb-2">
        {openStages.map(stage => {
          const cards = leads.filter(l => l.stage === stage.key);
          return (
            <div key={stage.key} className="w-56 shrink-0">
              {/* Column header */}
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                    {stage.name}
                  </span>
                </div>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}
                >
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div
                className="rounded-xl p-2 min-h-32"
                style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}
              >
                {cards.length === 0 ? (
                  <p className="text-[10px] text-center py-4" style={{ color: "var(--text-muted)" }}>Empty</p>
                ) : (
                  cards.map(l => <PipelineCard key={l.id} lead={l} />)
                )}
              </div>
            </div>
          );
        })}

        {/* Won column */}
        <div className="w-48 shrink-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Won</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#d1fae5", color: "#065f46" }}>
              {won.length}
            </span>
          </div>
          <div className="rounded-xl p-2 min-h-32" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            {won.length === 0 ? <p className="text-[10px] text-center py-4" style={{ color: "#6ee7b7" }}>None yet</p>
              : won.map(l => <PipelineCard key={l.id} lead={l} />)}
          </div>
        </div>

        {/* Lost column */}
        <div className="w-48 shrink-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>Lost</span>
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
              {lost.length}
            </span>
          </div>
          <div className="rounded-xl p-2 min-h-32" style={{ backgroundColor: "#fff5f5", border: "1px solid #fecaca" }}>
            {lost.length === 0 ? <p className="text-[10px] text-center py-4" style={{ color: "#fca5a5" }}>None yet</p>
              : lost.map(l => <PipelineCard key={l.id} lead={l} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────
export default function LeadsPage() {
  const { effectiveCompanyId, effectiveLocationId, effectiveServiceAreaId } = useHierarchy();

  const [view, setView]       = useState<"table" | "pipeline">("table");
  const [tab, setTab]         = useState<string>("all");
  const [search, setSearch]   = useState("");
  const [sortField, setSort]  = useState<SortField>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Active pipeline stages from settings (loaded after mount to avoid hydration mismatch).
  const [activeStages, setActiveStages] = useState<PipelineStage[]>([]);
  useEffect(() => { setActiveStages(getStages().filter(s => s.active)); }, []);

  const resolve   = useMemo(() => buildStageResolver(activeStages), [activeStages]);
  const openStages = activeStages.filter(s => s.category === "open");

  // Table tabs: All / Active / per-open-stage / Won / Lost — derived from settings.
  const tableTabs = useMemo(() => {
    const tabs: { key: string; label: string; fn: (l: Lead) => boolean }[] = [
      { key: "all",    label: "All",    fn: () => true },
      { key: "active", label: "Active", fn: l => resolve(l.stage).category === "open" },
    ];
    if (activeStages.some(s => s.category === "won"))
      tabs.push({ key: "won",  label: "Won",  fn: l => resolve(l.stage).category === "won" });
    if (activeStages.some(s => s.category === "lost"))
      tabs.push({ key: "lost", label: "Lost", fn: l => resolve(l.stage).category === "lost" });
    return tabs;
  }, [activeStages, resolve]);

  // Context filter
  const contextFiltered = ALL_LEADS
    .filter(l => !effectiveCompanyId     || l.companyId     === effectiveCompanyId)
    .filter(l => !effectiveLocationId    || l.locationId    === effectiveLocationId)
    .filter(l => !effectiveServiceAreaId || l.serviceAreaId === effectiveServiceAreaId);

  const tabFn = tableTabs.find(t => t.key === tab)?.fn ?? (() => true);

  const displayed = contextFiltered
    .filter(tabFn)
    .filter(l => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        l.customerName.toLowerCase().includes(q) ||
        l.title.toLowerCase().includes(q) ||
        (l.customerEmail ?? "").toLowerCase().includes(q) ||
        (l.customerPhone ?? "").includes(q)
      );
    })
    .sort((a, b) => {
      const av = a[sortField] ?? "", bv = b[sortField] ?? "";
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  function handleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSort(field); setSortDir("asc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3" style={{ color: "#4f46e5" }} />
      : <ChevronDown className="w-3 h-3" style={{ color: "#4f46e5" }} />;
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>Leads</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}>
              {contextFiltered.length}
            </span>
          </div>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
            Sales pipeline — track, follow up, and convert
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <button
              onClick={() => setView("table")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors"
              style={{
                backgroundColor: view === "table" ? "#4f46e5" : "var(--bg-surface)",
                color: view === "table" ? "#fff" : "var(--text-secondary)",
              }}
            >
              <LayoutList className="w-3.5 h-3.5" /> Table
            </button>
            <button
              onClick={() => setView("pipeline")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors"
              style={{
                backgroundColor: view === "pipeline" ? "#4f46e5" : "var(--bg-surface)",
                color: view === "pipeline" ? "#fff" : "var(--text-secondary)",
              }}
            >
              <Columns3 className="w-3.5 h-3.5" /> Pipeline
            </button>
          </div>
          <button className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" /> New Lead
          </button>
        </div>
      </div>

      {/* Pipeline view */}
      {view === "pipeline" ? (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
          <div className="px-6 py-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Pipeline — {contextFiltered.filter(l => resolve(l.stage).category === "open").length} active leads
            </p>
          </div>
          <PipelineView leads={contextFiltered} openStages={openStages} resolve={resolve} />
        </div>
      ) : (
        /* Table view */
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
          {/* Tabs + search */}
          <div className="flex items-center justify-between px-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-0.5">
              {tableTabs.map(t => {
                const count  = contextFiltered.filter(t.fn).length;
                const active = tab === t.key;
                return (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className="relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors"
                    style={{ color: active ? "#4f46e5" : "var(--text-muted)" }}
                  >
                    {t.label}
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: active ? "#e0e7ff" : "var(--bg-input)", color: active ? "#4f46e5" : "var(--text-muted)" }}>
                      {count}
                    </span>
                    {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-indigo-600" />}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 py-2">
              <div className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ backgroundColor: "var(--bg-input)" }}>
                <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                <input type="text" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)}
                  className="bg-transparent text-sm outline-none w-44" style={{ color: "var(--text-primary)" }} />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
                style={{ border: "1px solid var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--bg-surface)" }}>
                <SlidersHorizontal className="w-3.5 h-3.5" /> Filter
              </button>
            </div>
          </div>

          {/* Column headers */}
          <div className="grid px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider select-none"
            style={{ gridTemplateColumns: "2.5fr 1.2fr 1fr 1fr 1fr 1fr 0.6fr", color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
            {([
              { label: "Lead / Customer",  field: "customerName" },
              { label: "Stage",            field: "stage"        },
              { label: "Source",           field: "source"       },
              { label: "Value",            field: "estimatedValue"},
              { label: "Assigned",         field: null           },
              { label: "Branch",           field: "locationName" },
              { label: "Age",              field: "createdAt"    },
            ] as const).map(({ label, field }) => (
              <button key={label} onClick={() => field && handleSort(field as SortField)}
                className={cn("flex items-center gap-1 text-left", field ? "cursor-pointer hover:opacity-80" : "cursor-default")}
                style={{ color: sortField === field ? "#4f46e5" : "var(--text-muted)" }}>
                {label}{field && <SortIcon field={field as SortField} />}
              </button>
            ))}
          </div>

          {/* Rows */}
          <div>
            {displayed.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No leads match the current filter.</p>
              </div>
            ) : displayed.map((lead, i) => {
              const s = resolve(lead.stage);
              return (
                <Link key={lead.id} href={`/leads/${lead.id}`}
                  className="grid px-4 py-3 items-center hover:bg-[var(--bg-surface-2)] transition-colors"
                  style={{ gridTemplateColumns: "2.5fr 1.2fr 1fr 1fr 1fr 1fr 0.6fr", borderBottom: i < displayed.length - 1 ? "1px solid var(--border-subtle)" : "none", textDecoration: "none" }}>

                  {/* Lead / Customer */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600 shrink-0">
                      {lead.customerInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{lead.title}</p>
                      <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>{lead.customerName}</p>
                    </div>
                  </div>

                  {/* Stage */}
                  <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: s.bg, color: s.color }}>
                    {s.label}
                  </span>

                  {/* Source */}
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {LEAD_SOURCE_LABELS[lead.source]}
                  </span>

                  {/* Value */}
                  <span className="text-sm font-medium" style={{ color: lead.estimatedValue ? "var(--text-primary)" : "var(--text-muted)" }}>
                    {lead.estimatedValue ?? "TBD"}
                  </span>

                  {/* Assigned */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-bold text-white shrink-0">
                      {lead.assignedToInitials}
                    </div>
                    <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>{lead.assignedTo}</span>
                  </div>

                  {/* Branch */}
                  <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>{lead.locationName}</span>

                  {/* Age */}
                  <AgeChip createdAt={lead.createdAt} />
                </Link>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 text-xs"
            style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-muted)", backgroundColor: "var(--bg-surface-2)" }}>
            <span>Showing {displayed.length} of {contextFiltered.filter(tabFn).length} leads</span>
            <div className="flex gap-1">
              <button className="px-2 py-1 rounded" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>← Prev</button>
              <button className="px-2 py-1 rounded" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
