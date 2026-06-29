// Marketing Automation — a builder canvas: a trigger flowing through a wait and
// branching actions, the way an estimate-follow-up sequence is composed.

import { Zap, Clock, Mail, Phone, GitBranch } from "lucide-react";

function Node({ icon: Icon, kind, title, sub, tint }: { icon: React.ElementType; kind: string; title: string; sub: string; tint: string }) {
  return (
    <div className="rounded-xl px-3.5 py-3 w-[230px]" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-card)" }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: tint + "22" }}><Icon className="w-3.5 h-3.5" style={{ color: tint }} /></span>
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{kind}</span>
      </div>
      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
      <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{sub}</p>
    </div>
  );
}

function Connector() {
  return <div className="w-px h-6 mx-auto" style={{ backgroundColor: "var(--border)" }} />;
}

export default function AutomationMockup() {
  return (
    <div className="h-[400px] site-grid-bg flex flex-col items-center justify-center py-6 overflow-hidden text-left" style={{ backgroundColor: "var(--bg-page)" }}>
      <div className="absolute right-4 top-4 hidden md:block">
        <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "var(--accent-soft-2-bg)", color: "var(--accent-text-strong)" }}>Estimate follow-up · Active</span>
      </div>
      <Node icon={Zap} kind="Trigger" title="Estimate sent" sub="Any new estimate over $500" tint="#4f46e5" />
      <Connector />
      <Node icon={Clock} kind="Wait" title="Wait 3 days" sub="If not yet approved" tint="#f59e0b" />
      <Connector />
      <div className="flex items-center gap-2 mb-2"><GitBranch className="w-4 h-4" style={{ color: "var(--text-muted)" }} /><span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Then, in parallel</span></div>
      <div className="flex flex-col sm:flex-row gap-4">
        <Node icon={Mail} kind="Action" title="Send follow-up email" sub="Branded estimate reminder" tint="#0891b2" />
        <Node icon={Phone} kind="Action" title="Create call task" sub="Assign to the sales rep" tint="#10b981" />
      </div>
    </div>
  );
}
