"use client";

import { useMemo, useState } from "react";
import {
  Search, MessageSquare, Mail, Phone, PhoneMissed, Paperclip, Send, Plus,
  ExternalLink, MoreHorizontal, CheckCheck, Smile, Clock, User, Briefcase, Zap, Inbox as InboxIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────
type Channel = "sms" | "email" | "call";

interface Message {
  id: number;
  from: "customer" | "us";
  text: string;
  time: string;
}

interface ActiveJob { title: string; time: string; tech: string }

interface Conversation {
  id: number;
  name: string;
  preview: string;
  time: string;
  job: string;
  type: Channel;
  unread: boolean;
  missed?: boolean;
  contact: { name: string; phone: string; email?: string };
  activeJob: ActiveJob | null;
  messages: Message[];
}

// ─── Channel config ───────────────────────────────────────
// Colors stay hex (composed with an alpha suffix for the soft chips below).
const CHANNELS: Record<Channel, { label: string; icon: typeof MessageSquare; color: string }> = {
  sms:   { label: "SMS",   icon: MessageSquare, color: "#4f46e5" },
  email: { label: "Email", icon: Mail,          color: "#0891b2" },
  call:  { label: "Call",  icon: Phone,         color: "#059669" },
};

// Soft accent — the customer-profile look from the Customers list
// (indigo-100 fill + indigo-600 content). ACCENT_SOFT fills avatars/buttons;
// ACCENT_STRONG is the indigo text/icon on those fills and the small
// unread / selection indicators.
const ACCENT_SOFT = "#e0e7ff";
const ACCENT_STRONG = "#4f46e5";

const QUICK_REPLIES = [
  "On the way 🚐",
  "Running ~15 min late",
  "Job complete — invoice sent",
  "Can we reschedule?",
  "Thanks! Let us know if anything else comes up.",
];

// ─── Sample conversations ─────────────────────────────────
// Realistic service-business threads so the inbox reads as a live workspace.
const SEED: Conversation[] = [
  {
    id: 1, name: "Ryo Martin", preview: "Sounds good, see you at 9!", time: "9:02 AM",
    job: "AC Tune-Up", type: "sms", unread: true,
    contact: { name: "Ryo Martin", phone: "(706) 555-0142", email: "ryo.martin@example.com" },
    activeJob: { title: "AC Tune-Up", time: "Today · 9:00 AM", tech: "Ryo Martin" },
    messages: [
      { id: 1, from: "customer", text: "Hi, are we still on for this morning?", time: "8:48 AM" },
      { id: 2, from: "us",       text: "Yes! Marcus is on the way 🚐", time: "8:50 AM" },
      { id: 3, from: "customer", text: "Sounds good, see you at 9!", time: "9:02 AM" },
    ],
  },
  {
    id: 2, name: "Brecht Holdings", preview: "Following up — can you send the updated quote?", time: "8:30 AM",
    job: "Rooftop Unit", type: "email", unread: true,
    contact: { name: "Facilities Team", phone: "(706) 555-0188", email: "facilities@brechtholdings.com" },
    activeJob: null,
    messages: [
      { id: 1, from: "customer", text: "Following up on the rooftop replacement — can you send the updated quote?", time: "8:30 AM" },
    ],
  },
  {
    id: 3, name: "Southern Rentals", preview: "Missed call · 0:42", time: "Yesterday",
    job: "Unit 4B Furnace", type: "call", unread: false, missed: true,
    contact: { name: "Dana Pierce", phone: "(803) 555-0177" },
    activeJob: { title: "Furnace Repair — Unit 4B", time: "Jun 12 · 1:00 PM", tech: "Luis Romero" },
    messages: [
      { id: 1, from: "customer", text: "Missed call · 0:42", time: "4:15 PM" },
    ],
  },
  {
    id: 4, name: "Giesbrecht Property Group", preview: "Thanks for the quick service!", time: "Yesterday",
    job: "Quarterly Inspection", type: "sms", unread: false,
    contact: { name: "Ops Desk", phone: "(706) 555-0211", email: "ops@giesbrechtpg.com" },
    activeJob: null,
    messages: [
      { id: 1, from: "us",       text: "Inspection complete — report attached. Anything else we can help with?", time: "2:10 PM" },
      { id: 2, from: "customer", text: "Thanks for the quick service!", time: "2:40 PM" },
    ],
  },
  {
    id: 5, name: "Augusta Community Center", preview: "We'd like to schedule a walkthrough", time: "Mon",
    job: "Estimate", type: "email", unread: false,
    contact: { name: "Front Office", phone: "(706) 555-0133", email: "info@augustacc.org" },
    activeJob: null,
    messages: [
      { id: 1, from: "customer", text: "We'd like to schedule a walkthrough for a new system estimate.", time: "Mon · 11:20 AM" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────
function initials(name: string): string {
  const p = name.replace(/\(.*\)/, "").trim().split(/\s+/);
  return (p.length >= 2 ? p[0][0] + p[p.length - 1][0] : name.slice(0, 2)).toUpperCase();
}
function nowLabel(): string {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ─── Page ─────────────────────────────────────────────────
export default function InboxPage() {
  const [convos, setConvos]       = useState<Conversation[]>(SEED);
  const [selectedId, setSelected] = useState<number | null>(SEED[0]?.id ?? null);
  const [filter, setFilter]       = useState<"all" | "unread" | Channel>("all");
  const [search, setSearch]       = useState("");
  const [reply, setReply]         = useState("");
  const [channel, setChannel]     = useState<Channel>("sms");

  const selected = convos.find(c => c.id === selectedId) ?? null;

  const counts = useMemo(() => ({
    all:    convos.length,
    unread: convos.filter(c => c.unread).length,
    sms:    convos.filter(c => c.type === "sms").length,
    email:  convos.filter(c => c.type === "email").length,
    call:   convos.filter(c => c.type === "call").length,
  }), [convos]);

  const filtered = convos.filter(c => {
    if (filter === "unread" && !c.unread) return false;
    if (filter !== "all" && filter !== "unread" && c.type !== filter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q) || c.job.toLowerCase().includes(q);
  });

  function openConversation(id: number) {
    setSelected(id);
    setConvos(cs => cs.map(c => (c.id === id ? { ...c, unread: false } : c)));
    const c = convos.find(x => x.id === id);
    setChannel(c?.type === "email" ? "email" : "sms");
  }

  function send() {
    const text = reply.trim();
    if (!text || selectedId == null) return;
    setConvos(cs => cs.map(c => c.id === selectedId
      ? { ...c, preview: text, time: "now", unread: false,
          messages: [...c.messages, { id: Date.now(), from: "us", text, time: nowLabel() }] }
      : c));
    setReply("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const composerChannel = CHANNELS[channel];

  const FILTERS = [
    { key: "all"    as const, label: "All" },
    { key: "unread" as const, label: "Unread" },
    { key: "sms"    as const, label: "SMS" },
    { key: "email"  as const, label: "Email" },
    { key: "call"   as const, label: "Calls" },
  ];

  return (
    <div className="flex h-full overflow-hidden" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* ── Left: conversation list ───────────────────────── */}
      <aside className="flex flex-col shrink-0 w-[320px]" style={{ backgroundColor: "var(--bg-surface)", borderRight: "1px solid var(--border-subtle)" }}>
        {/* Header */}
        <div className="px-4 pt-5 pb-3 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Inbox</h1>
              {counts.unread > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "var(--warning-soft-bg)", color: "var(--warning-text)" }}>
                  {counts.unread} new
                </span>
              )}
            </div>
            <button title="New message" className="flex items-center justify-center w-8 h-8 rounded-lg transition-opacity hover:opacity-90" style={{ backgroundColor: ACCENT_SOFT, color: ACCENT_STRONG }}>
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: "var(--bg-input)" }}>
            <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages"
              className="bg-transparent text-sm outline-none flex-1 min-w-0" style={{ color: "var(--text-primary)" }} />
          </div>

          {/* Channel filter — same glossy sub-tab style as the CRM record tabs */}
          <div className="flex items-center gap-0.5 mt-3 overflow-x-auto">
            {FILTERS.map(t => (
              <button key={t.key} onClick={() => setFilter(t.key)}
                data-active={filter === t.key}
                className="detail-tab flex-1 text-center px-2 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap">
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-center py-10" style={{ color: "var(--text-muted)" }}>No conversations found.</p>
          ) : filtered.map(c => {
            const ch = CHANNELS[c.type];
            const isSel = c.id === selectedId;
            return (
              <button key={c.id} onClick={() => openConversation(c.id)}
                className="w-full text-left px-3 py-3 flex items-start gap-3 transition-colors hover:bg-[var(--bg-surface-2)] relative"
                style={{
                  backgroundColor: isSel ? "var(--warning-soft-bg)" : "transparent",
                  borderBottom: "1px solid var(--border-subtle)",
                }}>
                {isSel && <span className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: ACCENT_STRONG }} />}
                {/* Avatar + channel chip */}
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ backgroundColor: isSel ? ACCENT_SOFT : "#6b7280", color: isSel ? ACCENT_STRONG : "#fff" }}>
                    {initials(c.name)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--bg-surface)" }}>
                    <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ backgroundColor: ch.color + "22" }}>
                      {c.missed
                        ? <PhoneMissed className="w-2 h-2" style={{ color: "#dc2626" }} />
                        : <ch.icon className="w-2 h-2" style={{ color: ch.color }} />}
                    </span>
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className={cn("text-sm truncate", c.unread ? "font-semibold" : "font-medium")} style={{ color: "var(--text-primary)" }}>{c.name}</span>
                    <span className="text-[10px] shrink-0" style={{ color: c.unread ? "var(--warning-text)" : "var(--text-muted)" }}>{c.time}</span>
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: c.unread ? "var(--text-secondary)" : "var(--text-muted)" }}>{c.preview}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}>{c.job}</span>
                    {c.unread && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ACCENT_STRONG }} />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ── Center: chat ──────────────────────────────────── */}
      <section className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: "var(--bg-surface)" }}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "var(--warning-soft-bg)" }}>
              <InboxIcon className="w-6 h-6" style={{ color: "var(--warning-icon)" }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Pick a conversation</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Select a thread on the left to read and reply.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <header className="flex items-center justify-between gap-3 px-5 py-3 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0" style={{ backgroundColor: ACCENT_SOFT, color: ACCENT_STRONG }}>{initials(selected.name)}</div>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{selected.name}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <ChannelBadge type={selected.type} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>· {selected.contact.phone}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <IconBtn title="Call"><Phone className="w-4 h-4" /></IconBtn>
                <IconBtn title="Email"><Mail className="w-4 h-4" /></IconBtn>
                {selected.activeJob && (
                  <button className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-[var(--bg-surface-2)]" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                    <ExternalLink className="w-3.5 h-3.5" /> Open job
                  </button>
                )}
                <IconBtn title="More"><MoreHorizontal className="w-4 h-4" /></IconBtn>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5" style={{ backgroundColor: "var(--bg-page)" }}>
              <div className="flex justify-center mb-5">
                <span className="text-[10px] font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--bg-surface-2)", color: "var(--text-muted)" }}>Today</span>
              </div>
              <div className="space-y-3">
                {selected.messages.map(m => {
                  const isUs = m.from === "us";
                  return (
                    <div key={m.id} className={cn("flex items-end gap-2", isUs ? "justify-end" : "justify-start")}>
                      {!isUs && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ backgroundColor: "#6b7280" }}>{initials(selected.name)}</div>
                      )}
                      <div className={cn("flex flex-col max-w-[68%]", isUs ? "items-end" : "items-start")}>
                        <div className="px-3.5 py-2.5 text-sm leading-relaxed break-words"
                          style={{
                            backgroundColor: isUs ? "var(--bubble-out-bg)" : "var(--bubble-in-bg)",
                            color: isUs ? "var(--bubble-out-text)" : "var(--bubble-in-text)",
                            borderRadius: isUs ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          }}>
                          {m.text}
                        </div>
                        <div className="flex items-center gap-1 mt-1 px-1">
                          <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{m.time}</span>
                          {isUs && <CheckCheck className="w-3 h-3" style={{ color: "var(--warning-text)" }} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Composer */}
            <div className="shrink-0 px-5 py-3" style={{ borderTop: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
              {/* Quick replies */}
              <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto thin-scroll-x pb-0.5">
                <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                {QUICK_REPLIES.map(r => (
                  <button key={r} onClick={() => setReply(r)}
                    className="shrink-0 text-[11px] px-2.5 py-1 rounded-full transition-colors hover:bg-[var(--warning-soft-bg)]"
                    style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                    {r}
                  </button>
                ))}
              </div>

              {/* Input row */}
              <div className="rounded-xl px-3 py-2 transition-colors" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)" }}>
                <textarea value={reply} onChange={e => setReply(e.target.value)} onKeyDown={onKeyDown}
                  placeholder={`Message ${selected.name} via ${composerChannel.label}…`} rows={2}
                  className="w-full resize-none text-sm outline-none bg-transparent" style={{ color: "var(--text-primary)" }} />
                <div className="flex items-center justify-between pt-1.5">
                  <div className="flex items-center gap-1">
                    {/* Channel toggle — same sub-tab style */}
                    <div className="flex items-center gap-0.5 mr-1">
                      {(["sms", "email"] as const).map(ch => {
                        const C = CHANNELS[ch];
                        return (
                          <button key={ch} onClick={() => setChannel(ch)} title={C.label}
                            data-active={channel === ch}
                            className="detail-tab inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                            <C.icon className="w-3 h-3" /> {C.label}
                          </button>
                        );
                      })}
                    </div>
                    <IconBtn title="Attach"><Paperclip className="w-4 h-4" /></IconBtn>
                    <IconBtn title="Emoji"><Smile className="w-4 h-4" /></IconBtn>
                  </div>
                  <button onClick={send} disabled={!reply.trim()}
                    className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 rounded-lg transition-opacity disabled:opacity-40"
                    style={{ backgroundColor: ACCENT_SOFT, color: ACCENT_STRONG }}>
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── Right: context ────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col shrink-0 w-[300px] overflow-y-auto p-4 gap-4" style={{ borderLeft: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-page)" }}>
        {selected && (
          <>
            {/* Contact card */}
            <Card>
              <SectionLabel icon={User}>Contact</SectionLabel>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: ACCENT_SOFT, color: ACCENT_STRONG }}>{initials(selected.contact.name)}</div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{selected.contact.name}</p>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} /> {selected.contact.phone}
                </div>
                {selected.contact.email && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <Mail className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} /> <span className="truncate">{selected.contact.email}</span>
                  </div>
                )}
              </div>
              <button className="w-full mt-3 text-xs font-medium px-3 py-2 rounded-lg transition-colors hover:bg-[var(--bg-surface-2)]" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                View customer
              </button>
            </Card>

            {/* Active job card */}
            {selected.activeJob ? (
              <Card>
                <SectionLabel icon={Briefcase}>Active Job</SectionLabel>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{selected.activeJob.title}</p>
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} /> {selected.activeJob.time}
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                    <User className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} /> {selected.activeJob.tech}
                  </div>
                </div>
                <span className="inline-block mt-2.5 text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}>{selected.job}</span>
              </Card>
            ) : (
              <Card>
                <SectionLabel icon={Briefcase}>Active Job</SectionLabel>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>No job linked to this conversation yet.</p>
                <button className="w-full mt-3 text-xs font-medium px-3 py-2 rounded-lg transition-colors hover:bg-[var(--bg-surface-2)]" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                  Link a job
                </button>
              </Card>
            )}

            {/* Quick actions */}
            <Card>
              <SectionLabel icon={Zap}>Quick Actions</SectionLabel>
              <div className="space-y-1.5">
                {[
                  { label: "Create task", icon: Clock },
                  { label: "Schedule job", icon: Briefcase },
                  { label: "Send invoice", icon: Mail },
                ].map(a => (
                  <button key={a.label} className="w-full flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-colors hover:bg-[var(--bg-surface-2)]" style={{ border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
                    <a.icon className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} /> {a.label}
                  </button>
                ))}
              </div>
            </Card>
          </>
        )}
      </aside>
    </div>
  );
}

// ─── Small shared bits ────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-4" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)" }}>
      {children}
    </div>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: typeof User; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <Icon className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{children}</p>
    </div>
  );
}

function ChannelBadge({ type }: { type: Channel }) {
  const ch = CHANNELS[type];
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: ch.color + "22", color: ch.color }}>
      <ch.icon className="w-2.5 h-2.5" /> {ch.label}
    </span>
  );
}

function IconBtn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <button title={title} className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-[var(--bg-surface-2)]" style={{ color: "var(--text-secondary)" }}>
      {children}
    </button>
  );
}
