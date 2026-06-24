"use client";

// ─── Documents & Company Info — dashboard ─────────────────
// "Where records and company knowledge live." Mock cards + recent activity over
// the documents library data. The library/explorer lives under Company Library.

import Link from "next/link";
import { FileText, CheckCircle2, FilePen, FolderTree, ArrowRight, Clock } from "lucide-react";
import { PageHeader, StatCard } from "@/components/platform/ui";
import { DOCS, DOC_TREE } from "@/lib/documents/mock";

const ACCENT = "#f59e0b";
const STATUS_DOT: Record<string, string> = { Published: "#10b981", Draft: "#f59e0b", Archived: "#9ca3af" };

export default function DocumentsDashboard() {
  const published = DOCS.filter(d => d.status === "Published").length;
  const drafts = DOCS.filter(d => d.status === "Draft").length;
  const categories = DOC_TREE.children?.length ?? 0;
  const recent = DOCS.slice(0, 5);

  // Top folders by document count (across the tree's first level).
  const topFolders = (DOC_TREE.children ?? []).map(f => ({
    name: f.name,
    count: DOCS.filter(d => d.folderId === f.id || (f.children ?? []).some(c => c.id === d.folderId)).length,
  })).sort((a, b) => b.count - a.count).slice(0, 6);

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Dashboard" subtitle="SOPs, policies, templates, vendor docs, and company knowledge — all in one library." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Documents" value={String(DOCS.length)} hint="In the library" icon={FileText} accent={ACCENT} />
        <StatCard label="Published" value={String(published)} hint="Live & current" icon={CheckCircle2} accent="#10b981" />
        <StatCard label="Drafts" value={String(drafts)} hint="In progress" icon={FilePen} accent="#6366f1" />
        <StatCard label="Categories" value={String(categories)} hint="Top-level folders" icon={FolderTree} accent="#0ea5e9" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent documents */}
        <Panel title="Recent Documents" icon={Clock} accent={ACCENT} href="/documents/library">
          <ul className="space-y-2.5">
            {recent.map(d => (
              <li key={d.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{d.title}</p>
                  <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{d.type} · {d.owner} · {d.updated}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-[11px] shrink-0" style={{ color: "var(--text-secondary)" }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_DOT[d.status] }} /> {d.status}
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Categories */}
        <Panel title="Library Categories" icon={FolderTree} accent="#0ea5e9" href="/documents/library">
          <div className="grid grid-cols-2 gap-2">
            {topFolders.map(f => (
              <div key={f.name} className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-2" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
                <span className="flex items-center gap-1.5 min-w-0">
                  <FolderTree className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                  <span className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{f.name}</span>
                </span>
                <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>{f.count}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, accent, href, children }: {
  title: string; icon: typeof Clock; accent: string; href: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: accent + "22" }}>
            <Icon className="w-4 h-4" style={{ color: accent }} />
          </span>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h2>
        </div>
        <Link href={href} className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--accent-text)" }}>
          View <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      {children}
    </div>
  );
}
