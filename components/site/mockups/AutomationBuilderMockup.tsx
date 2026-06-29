"use client";

// ─── Marketing Automation Builder (animated replica) ──────
// A high-fidelity, self-building replica of the real Routiqa automation builder
// (components/marketing/automations/AutomationBuilder.tsx): the connected
// When → If → Then rail on the left and the sticky "Live summary" panel on the
// right. It builds itself step by step — trigger → condition → actions → summary
// → checklist → Activate — then loops. CSS-timeline (no Framer Motion dep); indigo
// accent on the dark site theme.

import { useEffect, useState } from "react";
import {
  Zap, SlidersHorizontal, Sparkles, Clock, ScrollText, Check, Plus, X,
  Mail, Star, MessageSquare, Megaphone, CheckSquare, Bell,
} from "lucide-react";

const ACCENT = "#4f46e5";
const STEPS = 8;           // 0 empty · 1 trigger · 2 condition · 3 actions · 4 summary · 5 checklist · 6 activate · 7 hold
const TICK = 1500;

const ACTION_TILES = [
  { key: "send_sms",    label: "Send SMS",    icon: MessageSquare },
  { key: "send_email",  label: "Send Email",  icon: Mail },
  { key: "add_campaign",label: "Add to Campaign", icon: Megaphone },
  { key: "send_review", label: "Review Request",  icon: Star },
  { key: "create_task", label: "Create Task", icon: CheckSquare },
  { key: "notify_team", label: "Notify Team", icon: Bell },
];
const HIGHLIGHT = new Set(["send_email", "send_review"]);

export default function AutomationBuilderMockup() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep(s => (s + 1) % STEPS), TICK);
    return () => clearInterval(t);
  }, []);

  const hasTrigger = step >= 1;
  const hasCond = step >= 2;
  const hasActions = step >= 3;
  const hasSummary = step >= 4;
  const checked = step >= 5;
  const live = step >= 6;

  return (
    <div className="h-[440px] overflow-hidden text-left p-4" style={{ backgroundColor: "var(--bg-page)" }}>
      {/* Builder header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "var(--accent-soft-bg)" }}><Zap className="w-4 h-4" style={{ color: ACCENT }} /></span>
          <div>
            <p className="text-sm font-bold leading-none" style={{ color: "var(--text-primary)" }}>Estimate follow-up</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>New automation</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full transition-colors" style={live ? { backgroundColor: "#16a34a22", color: "#22c55e" } : { backgroundColor: "var(--bg-surface-2)", color: "var(--text-muted)" }}>{live ? "Active" : "Draft"}</span>
      </div>

      <div className="grid grid-cols-[1fr_240px] gap-4 items-start">
        {/* Build rail */}
        <div className="relative pl-7">
          {/* connector spine */}
          <span className="absolute left-[11px] top-2 bottom-2 w-px" style={{ backgroundColor: "var(--border)" }} />

          <RailStep eyebrow="When" title="Trigger" icon={Zap} active={hasTrigger}>
            {hasTrigger ? (
              <Chip className="site-build-in"><Zap className="w-3.5 h-3.5" style={{ color: ACCENT }} /> Estimate sent</Chip>
            ) : (
              <Placeholder>Choose a trigger…</Placeholder>
            )}
          </RailStep>

          <RailStep eyebrow="If" title="Conditions" icon={SlidersHorizontal} active={hasCond} optional>
            <div className="overflow-hidden transition-all duration-500" style={{ maxHeight: hasCond ? 60 : 0, opacity: hasCond ? 1 : 0 }}>
              <div className="site-build-in flex items-center gap-1.5 flex-wrap rounded-xl pl-2.5 pr-1.5 py-2 mb-2" style={{ border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
                <span className="text-[11px] font-semibold" style={{ color: "var(--text-muted)" }}>Where</span>
                <Pill>Customer type</Pill><Pill>is</Pill><Pill accent>Residential</Pill>
                <span className="ml-auto p-1 rounded-lg"><X className="w-3 h-3" style={{ color: "var(--text-muted)" }} /></span>
              </div>
            </div>
            <button className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl text-xs font-medium" style={{ border: "1px dashed var(--border)", color: ACCENT }}>
              <Plus className="w-3 h-3" /> Add condition
            </button>
          </RailStep>

          <RailStep eyebrow="Then" title="Action" icon={Sparkles} active={hasActions}>
            <div className="grid grid-cols-3 gap-1.5">
              {ACTION_TILES.map(a => {
                const on = hasActions && HIGHLIGHT.has(a.key);
                return (
                  <div key={a.key} className="rounded-lg px-2 py-2 flex flex-col items-center gap-1 text-center transition-all duration-300"
                    style={on
                      ? { backgroundColor: "var(--accent-soft-bg)", border: `1px solid ${ACCENT}`, boxShadow: `0 0 0 3px ${ACCENT}22` }
                      : { backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
                    <a.icon className="w-4 h-4" style={{ color: on ? ACCENT : "var(--text-muted)" }} />
                    <span className="text-[9px] font-medium leading-tight" style={{ color: on ? "var(--accent-text-strong)" : "var(--text-secondary)" }}>{a.label}</span>
                  </div>
                );
              })}
            </div>
          </RailStep>

          <RailStep eyebrow="With" title="Timing" icon={Clock} active={hasActions} last>
            <Chip>Send immediately · business hours</Chip>
          </RailStep>
        </div>

        {/* Live summary */}
        <aside className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", boxShadow: "var(--shadow-card)" }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
            <ScrollText className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Live summary</span>
          </div>
          <div className="px-4 py-3 min-h-[72px]">
            {hasSummary ? (
              <p className="text-xs leading-relaxed site-build-in" style={{ color: "var(--text-primary)" }}>
                When an <b style={{ color: "var(--accent-text)" }}>estimate is sent</b> to a <b style={{ color: "var(--accent-text)" }}>residential</b> customer, <b style={{ color: "var(--accent-text)" }}>send a follow-up email</b> and <b style={{ color: "var(--accent-text)" }}>request a review</b>.
              </p>
            ) : (
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>Your rule in plain English will appear here…</p>
            )}
          </div>
          <div className="px-4 pb-3">
            <p className="text-[9px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>Required to activate</p>
            <div className="space-y-1.5">
              <Req label="Name" ok={checked} />
              <Req label="Trigger" ok={checked} />
              <Req label="Action" ok={checked} />
            </div>
          </div>
          <div className="px-4 py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <button className="w-full text-xs font-semibold text-white px-4 py-2 rounded-lg transition-all duration-300"
              style={live
                ? { backgroundColor: ACCENT, boxShadow: `0 6px 18px -6px ${ACCENT}` }
                : { backgroundColor: "var(--bg-surface-2)", color: "var(--text-muted)" }}>
              {live ? "Activate" : "Activate"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function RailStep({ eyebrow, title, icon: Icon, active, optional, last, children }: {
  eyebrow: string; title: string; icon: React.ElementType; active: boolean; optional?: boolean; last?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`relative ${last ? "" : "pb-4"}`}>
      <span className="absolute -left-7 top-0.5 w-[22px] h-[22px] rounded-full flex items-center justify-center transition-colors z-10"
        style={active ? { backgroundColor: "var(--accent-soft-bg)", border: `1px solid ${ACCENT}` } : { backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)" }}>
        <Icon className="w-3 h-3" style={{ color: active ? ACCENT : "var(--text-muted)" }} />
      </span>
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: ACCENT }}>{eyebrow}</span>
        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{title}</span>
        {optional && <span className="text-[9px]" style={{ color: "var(--text-muted)" }}>· optional</span>}
      </div>
      {children}
    </div>
  );
}

function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${className}`} style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>{children}</span>;
}
function Placeholder({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-lg px-2.5 py-1.5 text-xs" style={{ backgroundColor: "var(--bg-surface)", border: "1px dashed var(--border)", color: "var(--text-muted)" }}>{children}</span>;
}
function Pill({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return <span className="text-[11px] font-medium px-1.5 py-0.5 rounded" style={accent ? { backgroundColor: "var(--accent-soft-2-bg)", color: "var(--accent-text-strong)" } : { backgroundColor: "var(--bg-surface-2)", color: "var(--text-secondary)" }}>{children}</span>;
}
function Req({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300" style={ok ? { backgroundColor: "#16a34a", transform: "scale(1)" } : { backgroundColor: "var(--bg-surface-2)", border: "1px solid var(--border)", transform: "scale(0.9)" }}>
        {ok && <Check className="w-2.5 h-2.5 text-white site-build-in" />}
      </span>
      <span className="text-[11px]" style={{ color: ok ? "var(--text-primary)" : "var(--text-muted)" }}>{label}</span>
    </div>
  );
}
