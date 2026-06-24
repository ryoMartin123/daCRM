"use client";

// ─── Team Workspace · Channels ────────────────────────────
// A structured internal workspace (NOT a chat clone): channels organize team
// communication, shared notes, meetings, action items, and linked documents.
// Immersive 3-panel layout — channel list (with Create/Filter) · selected
// channel workspace · collapsible channel details. The Feed reads bottom-up
// (newest last) with the composer pinned at the bottom. All state is local/mock.

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Hash, Plus, Pin, Archive, Users, MessagesSquare,
  FileText, X, Send, Megaphone, HelpCircle, CheckCircle2, Link2,
  Lock, Pencil, Trash2, Clock, PanelRightClose, PanelRightOpen, UserPlus, ShieldCheck,
} from "lucide-react";
import UiSelect from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { useHierarchy } from "@/components/providers/HierarchyProvider";
import {
  getAllChannels, getChannelPosts, createChannel, updateChannel, archiveChannel,
  togglePinChannel, addChannelPost,
  getChannelMembers, addChannelMember, removeChannelMember,
  canManageChannelMembers, getWorkspacePeople, CHANNEL_ROLE_LABELS, CURRENT_USER,
  CHANNEL_TYPE_LABELS, CHANNEL_TYPE_OPTIONS, VISIBILITY_LABELS, VISIBILITY_OPTIONS,
  POST_TYPE_STYLE, POST_TYPE_OPTIONS,
  type Channel, type ChannelType, type ChannelVisibility, type PostType,
} from "@/lib/team-workspace/data";

const ACCENT = "#2563eb";
const POST_TYPE_ICON: Record<PostType, typeof Megaphone> = {
  update: MessagesSquare, announcement: Megaphone, note: FileText, question: HelpCircle, decision: CheckCircle2,
};

export default function ChannelsWorkspace() {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);
  const channels = useMemo(() => getAllChannels(), [tick]);
  // Company/location view context (top-bar selector) filters which channels show.
  const { effectiveCompanyId } = useHierarchy();

  const [selectedId, setSelectedId] = useState<string>(() => getAllChannels().find(c => c.status === "active")?.id ?? "");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fType, setFType] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const selected = channels.find(c => c.id === selectedId) ?? null;

  const s = search.trim().toLowerCase();
  // Search matches the channel name/description, any member's name, or any
  // message in the channel (author or content) — so you can find a channel by
  // a person or by something that was said in it.
  function matchesSearch(c: Channel): boolean {
    if (!s) return true;
    if (`${c.name} ${c.description}`.toLowerCase().includes(s)) return true;
    if (c.members.some(m => m.name.toLowerCase().includes(s))) return true;
    return getChannelPosts(c.id).some(p => `${p.author} ${p.content}`.toLowerCase().includes(s));
  }
  const visible = channels.filter(c => {
    if (c.status === "archived") return false;   // archived hidden (managed in Settings)
    // Company view: org-wide channels (no companyId) always show; company-scoped
    // channels only when viewing that company (or the whole org).
    if (effectiveCompanyId && c.companyId && c.companyId !== effectiveCompanyId) return false;
    if (fType !== "all" && c.type !== fType) return false;
    if (!matchesSearch(c)) return false;
    return true;
  });
  const pinned = visible.filter(c => c.pinned);
  const team = visible.filter(c => !c.pinned && c.type !== "project");
  const projects = visible.filter(c => !c.pinned && c.type === "project");
  const activeFilters = fType !== "all" ? 1 : 0;
  const onSelect = (id: string) => setSelectedId(id);

  // Search results — channels (by name/member) and the actual matching messages,
  // so you can see what you're looking for. Capped + single-line to stay clean.
  const inView = channels.filter(c => c.status === "active" && !(effectiveCompanyId && c.companyId && c.companyId !== effectiveCompanyId));
  const channelHits = s ? inView.filter(c => c.name.toLowerCase().includes(s) || c.members.some(m => m.name.toLowerCase().includes(s))).slice(0, 4) : [];
  const messageHits = s
    ? inView.flatMap(c => getChannelPosts(c.id).filter(p => `${p.author} ${p.content}`.toLowerCase().includes(s)).map(p => ({ c, p }))).slice(0, 8)
    : [];
  function openResult(channelId: string) { setSelectedId(channelId); setSearch(""); setSearchOpen(false); }

  return (
    <div className="h-full flex min-h-0">
      {/* Left — channel list */}
      <aside className="w-72 shrink-0 flex flex-col" style={{ borderRight: "1px solid var(--border)", backgroundColor: "var(--bg-surface)" }}>
        <div className="p-2.5 shrink-0 flex items-center gap-1.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="relative flex-1 min-w-0">
            <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: "var(--bg-input)" }}>
              <Hash className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
              <input value={search} onFocusCapture={() => setSearchOpen(true)} onChange={e => { setSearch(e.target.value); setSearchOpen(true); }} placeholder="Search channels, people, messages…" className="bg-transparent text-sm outline-none w-full min-w-0" style={{ color: "var(--text-primary)" }} />
              {search && <button onClick={() => { setSearch(""); setSearchOpen(false); }} title="Clear" className="shrink-0" style={{ color: "var(--text-muted)" }}><X className="w-3.5 h-3.5" /></button>}
            </div>
            {searchOpen && s && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSearchOpen(false)} />
                <div className="absolute left-0 top-full mt-2 z-50 w-80 rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 12px 32px rgba(0,0,0,0.2)" }}>
                  <div className="max-h-[26rem] overflow-y-auto thin-scroll-y py-1">
                    {channelHits.length === 0 && messageHits.length === 0 ? (
                      <p className="px-3 py-4 text-xs text-center" style={{ color: "var(--text-muted)" }}>No matches for &ldquo;{search.trim()}&rdquo;.</p>
                    ) : (
                      <>
                        {channelHits.length > 0 && (
                          <>
                            <p className="text-[10px] font-semibold uppercase tracking-wider px-3 pt-2 pb-1" style={{ color: "var(--text-muted)" }}>Channels</p>
                            {channelHits.map(c => (
                              <button key={c.id} onClick={() => openResult(c.id)} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-colors hover:bg-[var(--bg-surface-2)]">
                                <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[9px] font-bold text-white" style={{ backgroundColor: c.accent }}>{channelInitials(c.name)}</span>
                                <span className="text-sm font-medium truncate flex-1" style={{ color: "var(--text-primary)" }}><Highlight text={c.name} q={s} /></span>
                                <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>{c.membersCount}</span>
                              </button>
                            ))}
                          </>
                        )}
                        {messageHits.length > 0 && (
                          <>
                            <p className="text-[10px] font-semibold uppercase tracking-wider px-3 pt-2 pb-1" style={{ color: "var(--text-muted)", borderTop: channelHits.length ? "1px solid var(--border-subtle)" : "none" }}>Messages</p>
                            {messageHits.map(({ c, p }) => (
                              <button key={p.id} onClick={() => openResult(c.id)} className="w-full flex items-start gap-2.5 px-3 py-1.5 text-left transition-colors hover:bg-[var(--bg-surface-2)]">
                                <span className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-[9px] font-bold text-white mt-0.5" style={{ backgroundColor: c.accent }}>{channelInitials(c.name)}</span>
                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-medium truncate" style={{ color: "var(--text-secondary)" }}>{c.name} · {p.author}</span>
                                    <span className="text-[10px] shrink-0" style={{ color: "var(--text-muted)" }}>{p.createdAt}</span>
                                  </span>
                                  <span className="block text-xs truncate" style={{ color: "var(--text-primary)" }}><Highlight text={p.content} q={s} /></span>
                                </span>
                              </button>
                            ))}
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Single actions menu — create + filters live together */}
          <div className="relative shrink-0">
            <button onClick={() => setMenuOpen(o => !o)} title="Channel actions"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ backgroundColor: ACCENT }}>
              <Plus className="w-4 h-4" />
              {activeFilters > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#f59e0b", border: "1.5px solid var(--bg-surface)" }} />}
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl overflow-hidden" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}>
                  <button onClick={() => { setMenuOpen(false); setCreateOpen(true); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-surface-2)]" style={{ color: "var(--text-primary)" }}>
                    <Plus className="w-4 h-4" style={{ color: ACCENT }} /> Create Channel
                  </button>
                  <div className="p-3 space-y-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <div className="flex items-center">
                      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Filter</span>
                      {activeFilters > 0 && <button onClick={() => setFType("all")} className="ml-auto text-[11px]" style={{ color: "var(--accent-text)" }}>Clear</button>}
                    </div>
                    <UiSelect size="sm" value={fType} onChange={setFType} options={[{ value: "all", label: "Any type" }, ...CHANNEL_TYPE_OPTIONS.map(t => ({ value: t, label: CHANNEL_TYPE_LABELS[t] }))]} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto thin-scroll-y px-2 py-3">
          <ChannelGroup label="Pinned" channels={pinned} selectedId={selectedId} onSelect={onSelect} />
          <ChannelGroup label="Team Channels" channels={team} selectedId={selectedId} onSelect={onSelect} />
          <ChannelGroup label="Project Channels" channels={projects} selectedId={selectedId} onSelect={onSelect} />
          {visible.length === 0 && <p className="text-xs text-center py-8" style={{ color: "var(--text-muted)" }}>No channels match.</p>}
        </div>
      </aside>

      {/* Center — selected channel workspace */}
      <section className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Select a channel to open its workspace.</p>
          </div>
        ) : (
          <ChannelWorkspace key={selected.id} channel={selected} refresh={refresh} tick={tick}
            detailsOpen={detailsOpen} onToggleDetails={() => setDetailsOpen(o => !o)} />
        )}
      </section>

      {/* Right — channel details (collapsible). Kept mounted and width-animated
          so it eases open/closed instead of snapping. */}
      {selected && (
        <div className={cn("shrink-0 h-full overflow-hidden transition-[width] duration-300 ease-in-out", detailsOpen ? "w-80" : "w-0")} aria-hidden={!detailsOpen}>
          <ChannelDetails channel={selected} refresh={refresh} onEdit={() => setEditOpen(true)} onCollapse={() => setDetailsOpen(false)} tick={tick} />
        </div>
      )}

      {createOpen && <CreateChannelModal onClose={() => setCreateOpen(false)} onCreated={(c) => { setCreateOpen(false); refresh(); setSelectedId(c.id); }} />}
      {editOpen && selected && <EditChannelDrawer channel={selected} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); refresh(); }} onArchived={() => { setEditOpen(false); refresh(); }} />}
    </div>
  );
}

// ─── Left panel ───────────────────────────────────────────
function ChannelGroup({ label, channels, selectedId, onSelect }: {
  label: string; channels: Channel[]; selectedId: string; onSelect: (id: string) => void;
}) {
  if (channels.length === 0) return null;
  return (
    <div className="mb-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest px-2 mb-1 mt-2" style={{ color: "var(--text-muted)" }}>{label}</p>
      {channels.map(c => {
        const active = c.id === selectedId;
        return (
          <button key={c.id} onClick={() => onSelect(c.id)}
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md mb-0.5 text-left transition-colors"
            style={{ backgroundColor: active ? ACCENT + "1f" : "transparent" }}>
            <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-[11px] font-bold text-white" style={{ backgroundColor: c.accent }}>
              {channelInitials(c.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate" style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}>{c.name}</span>
                {c.pinned && <Pin className="w-3 h-3 shrink-0" style={{ color: "var(--text-muted)" }} />}
              </span>
              <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
                <Users className="w-2.5 h-2.5" /> {c.membersCount} · {c.lastActivity}
              </span>
            </span>
            {c.unreadCount > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 text-white" style={{ backgroundColor: c.accent }}>{c.unreadCount}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── Center workspace ─────────────────────────────────────
// The channel IS its feed for now — meetings, action items, documents, and
// pinned items are surfaced elsewhere in My Workspace and link back to channels
// in a later phase.
function ChannelWorkspace({ channel, refresh, tick, detailsOpen, onToggleDetails }: {
  channel: Channel; refresh: () => void; tick: number;
  detailsOpen: boolean; onToggleDetails: () => void;
}) {
  const posts = useMemo(() => getChannelPosts(channel.id), [channel.id, tick]);

  return (
    <>
      {/* Channel header — name + description · details toggle */}
      <div className="px-5 pt-4 pb-3 shrink-0 flex items-start gap-2" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>{channel.name}</h2>
            {channel.status === "archived" && <Chip tone="muted">Archived</Chip>}
          </div>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{channel.description}</p>
        </div>
        <button onClick={onToggleDetails} title={detailsOpen ? "Hide details" : "Show details"}
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors hover:bg-[var(--bg-surface-2)] mt-0.5" style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
          {detailsOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>
      </div>

      {/* Feed */}
      <div className="flex-1 min-h-0 flex flex-col">
        <FeedTab channel={channel} posts={posts} refresh={refresh} />
      </div>
    </>
  );
}

// ── Feed — newest at the bottom, composer pinned at the bottom ──
function FeedTab({ channel, posts, refresh }: { channel: Channel; posts: ReturnType<typeof getChannelPosts>; refresh: () => void }) {
  const [postType, setPostType] = useState<PostType>("update");
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const ordered = [...posts].reverse(); // oldest → newest

  // Keep the feed pinned to the latest post (on channel switch + new post).
  useEffect(() => { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }, [channel.id, posts.length]);

  // Auto-grow the composer as you type/paste — up to a max, then it scrolls.
  useEffect(() => {
    const el = taRef.current; if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, 44), 200)}px`;
  }, [content]);

  function post() {
    if (!content.trim()) return;
    addChannelPost(channel.id, postType, content);
    setContent(""); setPostType("update"); refresh();
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto thin-scroll-y px-5 py-4">
        <div className="w-full flex flex-col gap-3 min-h-full justify-end">
          {ordered.length === 0 ? <EmptyState icon={MessagesSquare} text="No posts yet. Share the first update below." /> : ordered.map(p => {
            const st = POST_TYPE_STYLE[p.postType];
            const Icon = POST_TYPE_ICON[p.postType];
            return (
              <div key={p.id} className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: "#6b7280" }}>{initials(p.author)}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{p.author}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{p.createdAt}</p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0" style={{ backgroundColor: st.bg, color: st.color }}>
                    <Icon className="w-3 h-3" /> {st.label}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>{p.content}</p>
                {p.linkedRecord && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs px-2 py-1 rounded-lg w-fit" style={{ backgroundColor: "var(--bg-surface-2)", color: "var(--text-secondary)" }}>
                    <Link2 className="w-3 h-3" /> {p.linkedRecord}
                  </div>
                )}
                <div className="flex items-center gap-4 mt-3 pt-2 text-xs" style={{ borderTop: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                  <button className="flex items-center gap-1 hover:text-[var(--text-secondary)]" onClick={() => alert("Reactions come later.")}>👍 {p.reactionsCount}</button>
                  <button className="flex items-center gap-1 hover:text-[var(--text-secondary)]" onClick={() => alert("Comments come later.")}><MessagesSquare className="w-3.5 h-3.5" /> {p.commentsCount}</button>
                  {p.pinned && <span className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}><Pin className="w-3 h-3" /> Pinned</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Composer — pinned at the bottom */}
      <div className="shrink-0 px-5 py-3" style={{ borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
        <div className="w-full rounded-xl p-3" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border)" }}>
          <textarea ref={taRef} id="tw-composer" value={content} onChange={e => setContent(e.target.value)} rows={1} placeholder="Write an update…"
            className="w-full bg-transparent text-sm outline-none resize-none thin-scroll-y" style={{ color: "var(--text-primary)", minHeight: 44, maxHeight: 200, overflowY: "auto" }}
            onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") post(); }} />
          <div className="flex items-center justify-between gap-2 mt-2 pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-36"><UiSelect size="sm" value={postType} onChange={v => setPostType(v as PostType)} options={POST_TYPE_OPTIONS.map(p => ({ value: p, label: POST_TYPE_STYLE[p].label }))} /></div>
              <button title="Attach document (later)" onClick={() => alert("Attachments will connect to Documents later.")} className="p-1.5 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}><FileText className="w-3.5 h-3.5" /></button>
              <button title="Link record (later)" onClick={() => alert("Record linking (CRM/HR/Inventory) comes later.")} className="p-1.5 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}><Link2 className="w-3.5 h-3.5" /></button>
            </div>
            <button onClick={post} disabled={!content.trim()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-40" style={{ backgroundColor: ACCENT }}><Send className="w-3.5 h-3.5" /> Post</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Members section (permission-gated add/remove) ────────
function MembersSection({ channel, refresh, tick }: { channel: Channel; refresh: () => void; tick: number }) {
  const members = useMemo(() => getChannelMembers(channel.id), [channel.id, tick]);
  const canManage = useMemo(() => canManageChannelMembers(channel.id), [channel.id, tick]);
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState("");

  // People not already in this channel — the add picker source.
  const available = useMemo(
    () => getWorkspacePeople().filter(n => !members.some(m => m.name === n)),
    [members],
  );

  function add() {
    if (!pick) return;
    addChannelMember(channel.id, pick, "member");
    setPick(""); setAdding(false); refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Members · {members.length}</p>
        {canManage && !adding && (
          <button onClick={() => setAdding(true)} className="flex items-center gap-1 text-[11px] font-medium" style={{ color: ACCENT }}>
            <UserPlus className="w-3 h-3" /> Add
          </button>
        )}
      </div>

      {/* Add picker — only for channel admins */}
      {canManage && adding && (
        <div className="flex items-center gap-1.5 mb-2">
          <div className="flex-1 min-w-0">
            <UiSelect size="sm" value={pick} onChange={setPick}
              options={available.length ? [{ value: "", label: "Select a person…" }, ...available.map(n => ({ value: n, label: n }))] : [{ value: "", label: "Everyone is already a member" }]} />
          </div>
          <button onClick={add} disabled={!pick} className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-40 shrink-0" style={{ backgroundColor: ACCENT }}>Add</button>
          <button onClick={() => { setAdding(false); setPick(""); }} title="Cancel" className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <ul className="space-y-1">
        {members.map(m => (
          <li key={m.name} className="flex items-center gap-2 group">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: m.role === "admin" ? channel.accent : "#6b7280" }}>{personInitials(m.name)}</span>
            <span className="text-xs truncate flex-1 min-w-0" style={{ color: "var(--text-primary)" }}>{m.name}{m.name === CURRENT_USER && <span className="text-[10px]" style={{ color: "var(--text-muted)" }}> · you</span>}</span>
            {m.role === "admin" && <ShieldCheck className="w-3 h-3 shrink-0" style={{ color: channel.accent }} aria-label={CHANNEL_ROLE_LABELS.admin} />}
            {canManage && m.name !== CURRENT_USER && (
              <button onClick={() => { if (confirm(`Remove ${m.name} from ${channel.name}?`)) { removeChannelMember(channel.id, m.name); refresh(); } }}
                title="Remove" className="w-5 h-5 rounded flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#dc2626" }}>
                <X className="w-3 h-3" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {!canManage && <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>Only channel admins can add or remove members.</p>}
    </div>
  );
}

function personInitials(name: string): string {
  const p = name.trim().split(/\s+/);
  return (p.length >= 2 ? p[0][0] + p[p.length - 1][0] : name.slice(0, 2)).toUpperCase();
}

// ─── Right details panel ──────────────────────────────────
function ChannelDetails({ channel, refresh, onEdit, onCollapse, tick }: { channel: Channel; refresh: () => void; onEdit: () => void; onCollapse: () => void; tick: number }) {
  const recent = useMemo(() => getChannelPosts(channel.id).slice(0, 4), [channel.id, tick]);
  const LINKED_APPS = ["CRM", "HR", "Inventory", "Documents"];
  return (
    <aside className="w-80 h-full shrink-0 overflow-y-auto thin-scroll-y p-4 space-y-4" style={{ borderLeft: "1px solid var(--border)", backgroundColor: "var(--bg-surface)" }}>
      <div className="flex items-center gap-2.5">
        <span className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold text-white" style={{ backgroundColor: channel.accent }}>{channelInitials(channel.name)}</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{channel.name}</p>
          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{CHANNEL_TYPE_LABELS[channel.type]}</p>
        </div>
        <button onClick={onCollapse} title="Hide details" className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors hover:bg-[var(--bg-surface-2)]" style={{ color: "var(--text-muted)" }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      <DetailRow label="Description" value={channel.description} />
      <div className="grid grid-cols-2 gap-3">
        <DetailRow label="Type" value={CHANNEL_TYPE_LABELS[channel.type]} />
        <DetailRow label="Visibility" value={VISIBILITY_LABELS[channel.visibility]} icon={channel.visibility === "private" ? Lock : undefined} />
        <DetailRow label="Status" value={channel.status === "archived" ? "Archived" : "Active"} />
      </div>
      {channel.context && <DetailRow label="Linked company / location" value={channel.context} />}
      {channel.managers.length > 0 && <DetailRow label="Managers / owners" value={channel.managers.join(", ")} />}

      <MembersSection channel={channel} refresh={refresh} tick={tick} />

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Linked apps</p>
        <div className="flex flex-wrap gap-1.5">
          {LINKED_APPS.map(a => <span key={a} className="text-[11px] px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-surface-2)", color: "var(--text-secondary)" }}>{a}</span>)}
        </div>
        <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>Record linking arrives in a later phase.</p>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Recent activity</p>
        {recent.length === 0 ? <p className="text-xs" style={{ color: "var(--text-muted)" }}>No recent posts.</p> : (
          <ul className="space-y-1.5">
            {recent.map(p => (
              <li key={p.id} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                <Clock className="w-3 h-3 mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                <span className="min-w-0"><span className="truncate">{p.content}</span> <span style={{ color: "var(--text-muted)" }}>· {p.createdAt}</span></span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-1 space-y-1.5" style={{ borderTop: "1px solid var(--border-subtle)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5 mt-2" style={{ color: "var(--text-muted)" }}>Quick actions</p>
        <QuickAction icon={Pencil} label="Edit channel" onClick={onEdit} />
        <QuickAction icon={Pin} label={channel.pinned ? "Unpin channel" : "Pin channel"} onClick={() => { togglePinChannel(channel.id); refresh(); }} />
        {channel.status !== "archived" && <QuickAction icon={Archive} label="Archive channel" onClick={() => { if (confirm(`Archive ${channel.name}?`)) { archiveChannel(channel.id); refresh(); } }} />}
      </div>
    </aside>
  );
}

// ─── Create modal ─────────────────────────────────────────
function CreateChannelModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Channel) => void }) {
  const [name, setName] = useState(""); const [description, setDescription] = useState("");
  const [type, setType] = useState<ChannelType>("team"); const [visibility, setVisibility] = useState<ChannelVisibility>("everyone");
  const [context, setContext] = useState("");
  const valid = name.trim().length > 0;
  function create() { if (!valid) return; onCreated(createChannel({ name, description, type, visibility, context: context.trim() || undefined })); }
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()} style={{ backgroundColor: "var(--bg-surface)", boxShadow: "0 16px 48px rgba(0,0,0,0.24)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Create Channel</p>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Channel name *"><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Service Team" className={inp} style={inpStyle} autoFocus /></Field>
          <Field label="Description"><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What's this channel for?" className={inp + " resize-none"} style={inpStyle} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel type"><UiSelect value={type} onChange={v => setType(v as ChannelType)} options={CHANNEL_TYPE_OPTIONS.map(t => ({ value: t, label: CHANNEL_TYPE_LABELS[t] }))} /></Field>
            <Field label="Visibility"><UiSelect value={visibility} onChange={v => setVisibility(v as ChannelVisibility)} options={VISIBILITY_OPTIONS.map(v => ({ value: v, label: VISIBILITY_LABELS[v] }))} /></Field>
          </div>
          <Field label="Company / location context" hint="Optional"><input value={context} onChange={e => setContext(e.target.value)} placeholder="e.g. Augusta Branch" className={inp} style={inpStyle} /></Field>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Members and roles can be managed after creating the channel.</p>
        </div>
        <div className="px-5 py-3 flex items-center justify-end gap-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <button onClick={onClose} className="text-sm font-medium px-3 py-2 rounded-lg" style={{ color: "var(--text-secondary)" }}>Cancel</button>
          <button onClick={create} disabled={!valid} className="text-sm font-medium px-4 py-2 rounded-lg text-white disabled:opacity-40" style={{ backgroundColor: ACCENT }}>Create Channel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit drawer ──────────────────────────────────────────
const ACCENT_SWATCHES = ["#14b8a6", "#0ea5e9", "#6366f1", "#a855f7", "#ec4899", "#f59e0b", "#f97316", "#ef4444", "#10b981", "#8b5cf6", "#6b7280"];
function EditChannelDrawer({ channel, onClose, onSaved, onArchived }: { channel: Channel; onClose: () => void; onSaved: () => void; onArchived: () => void }) {
  const [name, setName] = useState(channel.name); const [description, setDescription] = useState(channel.description);
  const [type, setType] = useState<ChannelType>(channel.type); const [visibility, setVisibility] = useState<ChannelVisibility>(channel.visibility);
  const [accent, setAccent] = useState(channel.accent); const [context, setContext] = useState(channel.context ?? "");
  function save() { updateChannel(channel.id, { name: name.trim() || channel.name, description, type, visibility, accent, context: context.trim() || undefined }); onSaved(); }
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[460px] h-full flex flex-col" style={{ backgroundColor: "var(--bg-surface)", borderLeft: "1px solid var(--border)", boxShadow: "-16px 0 48px -12px rgba(0,0,0,0.3)" }}>
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Channel Settings</p>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-surface-2)]" style={{ color: "var(--text-secondary)" }}><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <Field label="Channel name"><input value={name} onChange={e => setName(e.target.value)} className={inp} style={inpStyle} /></Field>
          <Field label="Description"><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={inp + " resize-none"} style={inpStyle} /></Field>
          <Field label="Icon color">
            <div className="flex flex-wrap gap-1.5">
              {ACCENT_SWATCHES.map(c => (
                <button key={c} onClick={() => setAccent(c)} className="w-7 h-7 rounded-md transition-transform" style={{ backgroundColor: c, outline: accent === c ? "2px solid var(--text-primary)" : "none", outlineOffset: 2 }} />
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel type"><UiSelect value={type} onChange={v => setType(v as ChannelType)} options={CHANNEL_TYPE_OPTIONS.map(t => ({ value: t, label: CHANNEL_TYPE_LABELS[t] }))} /></Field>
            <Field label="Visibility"><UiSelect value={visibility} onChange={v => setVisibility(v as ChannelVisibility)} options={VISIBILITY_OPTIONS.map(v => ({ value: v, label: VISIBILITY_LABELS[v] }))} /></Field>
          </div>
          <Field label="Company / location context" hint="Optional"><input value={context} onChange={e => setContext(e.target.value)} className={inp} style={inpStyle} /></Field>
          <div className="rounded-lg px-3 py-2.5 flex items-center gap-2" style={{ backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border-subtle)" }}>
            <Users className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Member &amp; manager management arrives with the permission model.</span>
          </div>
        </div>
        <div className="px-5 py-3 flex items-center justify-between gap-2 shrink-0" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-1.5">
            {channel.status !== "archived" && <button onClick={() => { if (confirm(`Archive ${channel.name}?`)) { archiveChannel(channel.id); onArchived(); } }} className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}><Archive className="w-3.5 h-3.5" /> Archive</button>}
            <button onClick={() => alert("Delete is a placeholder — channels are archived for now.")} className="p-2 rounded-lg" style={{ border: "1px solid var(--border)", color: "#dc2626" }} title="Delete (placeholder)"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="text-sm font-medium px-3 py-2 rounded-lg" style={{ color: "var(--text-secondary)" }}>Cancel</button>
            <button onClick={save} className="text-sm font-medium px-4 py-2 rounded-lg text-white" style={{ backgroundColor: ACCENT }}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── bits ─────────────────────────────────────────────────
const inp = "w-full rounded-lg px-3 py-2 text-sm outline-none";
const inpStyle: React.CSSProperties = { border: "1px solid var(--border)", backgroundColor: "var(--bg-surface-2)", color: "var(--text-primary)" };

function channelInitials(name: string): string { return name.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase() || "CH"; }

// Renders text with the matched query highlighted. For long messages it shifts
// the window so the match stays visible inside the single-line (truncated) row.
function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  const start = Math.max(0, i - 18);
  return (
    <>
      {start > 0 ? "…" : ""}{text.slice(start, i)}
      <mark style={{ backgroundColor: ACCENT + "33", color: "inherit", borderRadius: 2, padding: "0 1px" }}>{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}
function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return (p.length >= 2 ? p[0][0] + p[p.length - 1][0] : name.slice(0, 2)).toUpperCase();
}
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
        {label}{hint && <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>· {hint}</span>}
      </label>
      {children}
    </div>
  );
}
function DetailRow({ label, value, icon: Icon }: { label: string; value: string; icon?: typeof Lock }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-sm flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>{Icon && <Icon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}{value}</p>
    </div>
  );
}
function QuickAction({ icon: Icon, label, onClick }: { icon: typeof Pencil; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left transition-colors hover:bg-[var(--bg-surface-2)]" style={{ color: "var(--text-secondary)" }}>
      <Icon className="w-4 h-4 shrink-0" /> {label}
    </button>
  );
}
function Chip({ children, tone }: { children: React.ReactNode; tone?: "muted" }) {
  return <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0" style={tone === "muted" ? { backgroundColor: "var(--bg-input)", color: "var(--text-muted)" } : { backgroundColor: "var(--accent-soft-bg)", color: "var(--accent-text)" }}>{children}</span>;
}
function EmptyState({ icon: Icon, text }: { icon: typeof MessagesSquare; text: string }) {
  return (
    <div className="rounded-xl p-10 text-center" style={{ border: "1px dashed var(--border)", backgroundColor: "var(--bg-surface)" }}>
      <Icon className="w-6 h-6 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>{text}</p>
    </div>
  );
}
