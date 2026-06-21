"use client";

// ─── Documents explorer (3-panel file tree) ───────────────
// Left: nested folder tree with counts + expand/collapse + selected state.
// Center: documents in the selected folder as a table.
// Right: document preview / details placeholder.
// Mock data only (lib/documents/mock); permissions are shown as visibility chips.

import { useState } from "react";
import {
  ChevronRight, Folder, FolderOpen, FileText, Eye, Tag, User, Clock, Shield, X,
} from "lucide-react";
import {
  DOC_TREE, DOCS, docCount, docsInFolder,
  type DocFolder, type DocItem, type DocStatus, type DocVisibility,
} from "@/lib/documents/mock";

const STATUS_COLOR: Record<DocStatus, string> = {
  Published: "#10b981",
  Draft: "#f59e0b",
  Archived: "#6b7280",
};

const VIS_COLOR: Record<DocVisibility, string> = {
  Everyone: "#0ea5e9",
  "Managers only": "#a855f7",
  "HR / Accounting": "#ec4899",
  "Sales / Admin": "#6366f1",
  "Field employees": "#10b981",
  Confidential: "#ef4444",
};

export default function DocumentsExplorer() {
  const [selectedFolder, setSelectedFolder] = useState<string>("hvac-service");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["root", "hvac"]));
  const [selectedDoc, setSelectedDoc] = useState<DocItem | null>(DOCS.find((d) => d.folderId === "hvac-service") ?? null);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const docs = docsInFolder(selectedFolder);

  return (
    <div className="flex h-full min-h-0">
      {/* Left — folder tree */}
      <aside
        className="w-64 shrink-0 overflow-y-auto thin-scroll-y p-3"
        style={{ borderRight: "1px solid var(--border)", backgroundColor: "var(--bg-surface)" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-2" style={{ color: "var(--text-muted)" }}>
          Folders
        </p>
        <TreeNode
          folder={DOC_TREE}
          depth={0}
          expanded={expanded}
          selected={selectedFolder}
          onToggle={toggle}
          onSelect={(id) => setSelectedFolder(id)}
        />
      </aside>

      {/* Center — folder contents */}
      <section className="flex-1 min-w-0 overflow-y-auto p-5">
        <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
          {findFolder(DOC_TREE, selectedFolder)?.name ?? "Documents"}
        </h2>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          {docs.length} document{docs.length === 1 ? "" : "s"}
        </p>

        {docs.length === 0 ? (
          <div className="rounded-xl p-8 text-center" style={{ border: "1px dashed var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No documents in this folder yet.</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "var(--bg-surface-2)" }}>
                  {["Name", "Type", "Status", "Visibility", "Updated"].map((h) => (
                    <th key={h} className="text-left font-medium px-3 py-2" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => {
                  const active = selectedDoc?.id === d.id;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDoc(d)}
                      className="cursor-pointer transition-colors"
                      style={{
                        borderTop: "1px solid var(--border-subtle)",
                        backgroundColor: active ? "var(--accent-soft-bg)" : "transparent",
                      }}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--accent-icon)" }} />
                          <span style={{ color: "var(--text-primary)" }}>{d.title}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5" style={{ color: "var(--text-secondary)" }}>{d.type}</td>
                      <td className="px-3 py-2.5">
                        <Chip color={STATUS_COLOR[d.status]}>{d.status}</Chip>
                      </td>
                      <td className="px-3 py-2.5">
                        <Chip color={VIS_COLOR[d.visibility]}>{d.visibility}</Chip>
                      </td>
                      <td className="px-3 py-2.5" style={{ color: "var(--text-muted)" }}>{d.updated}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Right — preview / details */}
      <aside
        className="w-80 shrink-0 overflow-y-auto p-5"
        style={{ borderLeft: "1px solid var(--border)", backgroundColor: "var(--bg-surface)" }}
      >
        {selectedDoc ? (
          <>
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 shrink-0" style={{ color: "var(--accent-icon)" }} />
                <h3 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{selectedDoc.title}</h3>
              </div>
              <button onClick={() => setSelectedDoc(null)} className="p-1 rounded hover:bg-[var(--bg-surface-2)]" style={{ color: "var(--text-muted)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preview placeholder */}
            <div
              className="rounded-lg mb-4 flex items-center justify-center"
              style={{ height: 160, backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border)" }}
            >
              <div className="text-center">
                <Eye className="w-6 h-6 mx-auto mb-1" style={{ color: "var(--text-muted)" }} />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{selectedDoc.type} preview</p>
              </div>
            </div>

            <dl className="space-y-3">
              <Detail icon={Shield} label="Status"><Chip color={STATUS_COLOR[selectedDoc.status]}>{selectedDoc.status}</Chip></Detail>
              <Detail icon={Eye} label="Visibility"><Chip color={VIS_COLOR[selectedDoc.visibility]}>{selectedDoc.visibility}</Chip></Detail>
              <Detail icon={User} label="Owner"><span style={{ color: "var(--text-secondary)" }}>{selectedDoc.owner}</span></Detail>
              <Detail icon={Clock} label="Updated"><span style={{ color: "var(--text-secondary)" }}>{selectedDoc.updated}</span></Detail>
              {selectedDoc.linkedApp && (
                <Detail icon={Tag} label="Linked app"><span style={{ color: "var(--text-secondary)" }}>{selectedDoc.linkedApp}</span></Detail>
              )}
            </dl>

            <div className="flex flex-wrap gap-1.5 mt-4">
              {selectedDoc.tags.map((t) => (
                <span key={t} className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--bg-surface-2)", color: "var(--text-muted)" }}>#{t}</span>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Select a document to preview its details.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function TreeNode({
  folder, depth, expanded, selected, onToggle, onSelect,
}: {
  folder: DocFolder;
  depth: number;
  expanded: Set<string>;
  selected: string;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const hasChildren = (folder.children?.length ?? 0) > 0;
  const isOpen = expanded.has(folder.id);
  const isSelected = selected === folder.id;
  const count = docCount(folder);

  return (
    <div>
      <button
        onClick={() => { onSelect(folder.id); if (hasChildren) onToggle(folder.id); }}
        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors"
        style={{
          paddingLeft: 8 + depth * 14,
          backgroundColor: isSelected ? "var(--accent-soft-bg)" : "transparent",
          color: isSelected ? "var(--accent-text-strong)" : "var(--text-secondary)",
        }}
      >
        {hasChildren ? (
          <ChevronRight className="w-3.5 h-3.5 shrink-0 transition-transform" style={{ transform: isOpen ? "rotate(90deg)" : "none" }} />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {isOpen && hasChildren ? <FolderOpen className="w-4 h-4 shrink-0" style={{ color: "var(--accent-icon)" }} /> : <Folder className="w-4 h-4 shrink-0" style={{ color: "var(--accent-icon)" }} />}
        <span className="truncate flex-1 text-left">{folder.name}</span>
        {count > 0 && <span className="text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>{count}</span>}
      </button>
      {hasChildren && isOpen && (
        <div>
          {folder.children!.map((c) => (
            <TreeNode key={c.id} folder={c} depth={depth + 1} expanded={expanded} selected={selected} onToggle={onToggle} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: color + "22", color }}>
      {children}
    </span>
  );
}

function Detail({ icon: Icon, label, children }: { icon: typeof Eye; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
        <Icon className="w-3.5 h-3.5" /> {label}
      </span>
      {children}
    </div>
  );
}

function findFolder(folder: DocFolder, id: string): DocFolder | undefined {
  if (folder.id === id) return folder;
  for (const c of folder.children ?? []) {
    const f = findFolder(c, id);
    if (f) return f;
  }
  return undefined;
}
