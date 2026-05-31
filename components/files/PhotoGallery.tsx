"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Image as ImageIcon, FileText, Film, File as FileIcon, Upload, X,
  Search, Filter, Calendar, User as UserIcon,
} from "lucide-react";
import { getFiles, getUploaders, addFile } from "@/lib/files/data";
import type { PhotoFile, FileScope, FileType } from "@/lib/files/types";
import { getPhotoCategories } from "@/lib/photo-categories/data";

type RecordLevel = "account" | "property" | "job" | "project" | "work_order" | "global";

interface Props {
  recordLevel: RecordLevel;
  scope?:       FileScope;     // the record's IDs (account/property/job/etc.)
  accountName?: string;
  uploaderName?: string;       // current user, for mock uploads
}

const FILE_ICON: Record<FileType, typeof ImageIcon> = {
  image: ImageIcon, pdf: FileText, document: FileText, video: Film, other: FileIcon,
};

// ─── Scope toggle options ─────────────────────────────────
function buildScopeOptions(level: RecordLevel, scope: FileScope): { key: string; label: string; scope: FileScope }[] {
  const out: { key: string; label: string; scope: FileScope }[] = [];
  if (level === "job"        && scope.jobId)        out.push({ key: "record", label: "This Job", scope: { jobId: scope.jobId } });
  if (level === "project"    && scope.projectId)    out.push({ key: "record", label: "This Project", scope: { projectId: scope.projectId } });
  if (level === "work_order" && scope.workOrderId)  out.push({ key: "record", label: "This Work Order", scope: { workOrderId: scope.workOrderId } });
  if (level === "property"   && scope.propertyId)   out.push({ key: "record", label: "This Property", scope: { propertyId: scope.propertyId } });
  if ((level === "job" || level === "work_order" || level === "project") && scope.propertyId)
    out.push({ key: "property", label: "This Property", scope: { propertyId: scope.propertyId } });
  if (scope.accountId) out.push({ key: "account", label: "This Account", scope: { accountId: scope.accountId } });
  return out;
}

export default function PhotoGallery({ recordLevel, scope = {}, accountName, uploaderName = "Marcus Reyes" }: Props) {
  const categories = useMemo(() => getPhotoCategories().filter(c => c.active), []);
  const catByKey = useMemo(() => new Map(categories.map(c => [c.key, c])), [categories]);
  const catLabel = (key: string) => catByKey.get(key)?.name ?? key;
  const catColor = (key: string) => catByKey.get(key)?.color ?? "#6b7280";

  const isGlobal = recordLevel === "global";
  const scopeOptions = useMemo(() => buildScopeOptions(recordLevel, scope), [recordLevel, scope]);

  // Active scope: record-level → toggle between record/property/account; global → {}.
  const [activeScopeKey, setActiveScopeKey] = useState(scopeOptions[0]?.key ?? "account");
  const activeScope = isGlobal ? {} : (scopeOptions.find(s => s.key === activeScopeKey)?.scope ?? {});

  // Filters
  const [search, setSearch]   = useState("");
  const [catFilter, setCat]   = useState("all");
  const [typeFilter, setType] = useState<"all" | FileType>("all");
  const [uploader, setUploader] = useState("all");

  const [files, setFiles] = useState<PhotoFile[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => { setFiles(getFiles(activeScope)); }, [activeScopeKey, activeScope.accountId, activeScope.jobId, activeScope.projectId, activeScope.propertyId, activeScope.workOrderId]);

  const displayed = files
    .filter(f => catFilter === "all" || f.categoryKey === catFilter)
    .filter(f => typeFilter === "all" || f.fileType === typeFilter)
    .filter(f => uploader === "all" || f.uploadedBy === uploader)
    .filter(f => {
      if (!search) return true;
      const q = search.toLowerCase();
      return f.fileName.toLowerCase().includes(q) || (f.notes ?? "").toLowerCase().includes(q) || f.tags.some(t => t.toLowerCase().includes(q));
    });

  const uploaders = useMemo(() => getUploaders(), []);

  function handleUpload(fileName: string, fileType: FileType, categoryKey: string, notes: string) {
    // Auto-fill the scope chain from the record we're mounted on.
    const uploadScope: FileScope = isGlobal ? { accountId: scope.accountId } : scope;
    addFile({ scope: uploadScope, fileName, fileType, categoryKey, uploadedBy: uploaderName, notes, accountName });
    setFiles(getFiles(activeScope));
    setShowUpload(false);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Scope toggle (record mode) */}
          {!isGlobal && scopeOptions.length > 1 && (
            <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {scopeOptions.map(opt => {
                const active = activeScopeKey === opt.key;
                return (
                  <button key={opt.key} onClick={() => setActiveScopeKey(opt.key)}
                    className="px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{ backgroundColor: active ? "#4f46e5" : "var(--bg-surface)", color: active ? "#fff" : "var(--text-secondary)" }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Search */}
          <div className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ backgroundColor: "var(--bg-input)" }}>
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files…"
              className="bg-transparent text-sm outline-none w-36" style={{ color: "var(--text-primary)" }} />
          </div>
        </div>

        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors">
          <Upload className="w-3.5 h-3.5" /> Upload
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect icon={Filter} value={catFilter} onChange={setCat}
          options={[{ value: "all", label: "All Categories" }, ...categories.map(c => ({ value: c.key, label: c.name }))]} />
        <FilterSelect icon={FileIcon} value={typeFilter} onChange={v => setType(v as "all" | FileType)}
          options={[{ value: "all", label: "All Types" }, { value: "image", label: "Images" }, { value: "pdf", label: "PDFs" }, { value: "document", label: "Documents" }, { value: "video", label: "Video" }, { value: "other", label: "Other" }]} />
        {isGlobal && (
          <FilterSelect icon={UserIcon} value={uploader} onChange={setUploader}
            options={[{ value: "all", label: "All Uploaders" }, ...uploaders.map(u => ({ value: u, label: u }))]} />
        )}
        <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>{displayed.length} file{displayed.length === 1 ? "" : "s"}</span>
      </div>

      {/* Grid */}
      {displayed.length === 0 ? (
        <div className="rounded-xl py-16 text-center" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>No files match.</p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
          {displayed.map(f => {
            const Icon = FILE_ICON[f.fileType];
            const color = catColor(f.categoryKey);
            return (
              <div key={f.id} className="rounded-xl overflow-hidden group"
                style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
                {/* Thumbnail */}
                <div className="aspect-[4/3] flex items-center justify-center relative"
                  style={{ background: f.fileType === "image" ? `linear-gradient(135deg, ${color}22, ${color}44)` : "var(--bg-surface-2)" }}>
                  <Icon className="w-8 h-8" style={{ color: f.fileType === "image" ? color : "var(--text-muted)" }} />
                  <span className="absolute top-2 left-2 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: color + "33", color }}>
                    {catLabel(f.categoryKey)}
                  </span>
                </div>
                {/* Meta */}
                <div className="p-2.5">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{f.fileName}</p>
                  {f.notes && <p className="text-[10px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{f.notes}</p>}
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{f.uploadedBy}</span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{f.displayDate}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showUpload && (
        <UploadModal categories={categories.map(c => ({ key: c.key, name: c.name }))}
          onClose={() => setShowUpload(false)} onUpload={handleUpload} />
      )}
    </div>
  );
}

// ─── Filter select ────────────────────────────────────────
function FilterSelect({ icon: Icon, value, onChange, options }: {
  icon: typeof Filter; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)" }}>
      <Icon className="w-3 h-3 shrink-0" style={{ color: "var(--text-muted)" }} />
      <select value={value} onChange={e => onChange(e.target.value)}
        className="bg-transparent text-xs outline-none" style={{ color: "var(--text-secondary)" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── Mock upload modal ────────────────────────────────────
function UploadModal({ categories, onClose, onUpload }: {
  categories: { key: string; name: string }[];
  onClose: () => void;
  onUpload: (fileName: string, fileType: FileType, categoryKey: string, notes: string) => void;
}) {
  const [fileName, setFileName] = useState("");
  const [fileType, setFileType] = useState<FileType>("image");
  const [categoryKey, setCategoryKey] = useState(categories[0]?.key ?? "");
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}
        style={{ backgroundColor: "var(--bg-surface)", boxShadow: "0 16px 48px rgba(0,0,0,0.24)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Upload File</p>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          {/* Drop zone (mock) */}
          <div className="rounded-xl py-8 text-center" style={{ border: "2px dashed var(--border)", backgroundColor: "var(--bg-surface-2)" }}>
            <Upload className="w-6 h-6 mx-auto mb-1.5" style={{ color: "var(--text-muted)" }} />
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Drag &amp; drop or enter a file name below</p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>File Name</label>
            <input value={fileName} onChange={e => setFileName(e.target.value)} placeholder="e.g. unit-after.jpg"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Category</label>
              <select value={categoryKey} onChange={e => setCategoryKey(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}>
                {categories.map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>File Type</label>
              <select value={fileType} onChange={e => setFileType(e.target.value as FileType)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }}>
                <option value="image">Image</option><option value="pdf">PDF</option>
                <option value="document">Document</option><option value="video">Video</option><option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }} />
          </div>
        </div>
        <div className="px-5 py-4 flex justify-end gap-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Cancel</button>
          <button onClick={() => onUpload(fileName.trim() || "untitled", fileType, categoryKey, notes.trim())} disabled={!fileName.trim()}
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-40" style={{ backgroundColor: "#4f46e5" }}>
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}
