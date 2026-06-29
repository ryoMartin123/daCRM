import { CtaGroup, PhoneFrame } from "@/components/site/ui";
import HeroReel from "@/components/site/HeroReel";
import ModuleCard from "@/components/site/ModuleCard";
import MobileAppMockup from "@/components/site/mockups/MobileAppMockup";
import {
  Megaphone, MessagesSquare, FileText, UsersRound, CreditCard,
  Users, CalendarRange, Smartphone, BarChart3,
} from "lucide-react";

// Floating module cards (lg+) — the modules not on the central reel — each wired
// to the core with an animated connector. Center-anchored % positions match the
// connector endpoints in the SVG below.
const FLOATERS = [
  { left: "11%", top: "16%", delay: 0,   icon: Megaphone },
  { left: "89%", top: "13%", delay: 0.6, icon: MessagesSquare },
  { left: "8%",  top: "54%", delay: 1.1, icon: FileText },
  { left: "92%", top: "48%", delay: 0.4, icon: UsersRound },
  { left: "16%", top: "86%", delay: 0.8, icon: CreditCard },
];

// Full module legend (all sizes) — proves the breadth on mobile too.
const CHIPS = [
  { icon: Users, label: "CRM" }, { icon: CalendarRange, label: "Dispatch" },
  { icon: Smartphone, label: "Mobile" }, { icon: Megaphone, label: "Marketing" },
  { icon: BarChart3, label: "Analytics" }, { icon: MessagesSquare, label: "Workspace" },
  { icon: FileText, label: "Documents" }, { icon: UsersRound, label: "HR" },
  { icon: CreditCard, label: "Accounting" },
];

export default function Hero() {
  return (
    <section className="site-hero-bg border-b overflow-hidden" style={{ borderColor: "var(--border-subtle)" }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 pt-20 pb-16 lg:pt-24">
        {/* Copy */}
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#22c55e" }} />
            One connected platform · CRM to field operations
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.04]" style={{ color: "var(--text-primary)" }}>
            Run the entire service business<br className="hidden sm:block" /> from <span className="site-gradient-text">one connected platform</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed mx-auto max-w-2xl" style={{ color: "var(--text-secondary)" }}>
            Routiqa brings CRM, dispatch, marketing, team workspace, documents, HR, accounting, analytics, and field operations into one connected system.
          </p>
          <div className="mt-8 flex justify-center"><CtaGroup /></div>
        </div>

        {/* Platform reveal composition */}
        <div className="relative mx-auto mt-16 lg:mt-20 max-w-[1180px] lg:min-h-[660px] site-reveal">
          {/* connectors (lg only) */}
          <svg className="hidden lg:block absolute inset-0 w-full h-full z-0" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            {FLOATERS.map((f, i) => (
              <g key={i}>
                <line x1="50" y1="50" x2={parseFloat(f.left)} y2={parseFloat(f.top)} stroke="var(--accent-icon)" strokeWidth="0.18" opacity="0.5" className="site-connector" />
                <circle cx={parseFloat(f.left)} cy={parseFloat(f.top)} r="0.6" fill="var(--accent-icon)" opacity="0.7" />
              </g>
            ))}
            <circle cx="50" cy="50" r="1.1" fill="#4f46e5" className="site-halo" />
          </svg>

          {/* core glow */}
          <div className="hidden lg:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[320px] z-0" style={{ background: "radial-gradient(closest-side, rgba(79,70,229,0.25), transparent)" }} />

          {/* floating module cards (lg only) */}
          <div className="hidden lg:block">
            <ModuleCard icon={FLOATERS[0].icon} title="Marketing" left={FLOATERS[0].left} top={FLOATERS[0].top} delay={FLOATERS[0].delay}>
              <div className="space-y-1.5">
                <MiniBar label="Open rate" pct={68} />
                <MiniBar label="Replied" pct={32} />
              </div>
            </ModuleCard>
            <ModuleCard icon={FLOATERS[1].icon} title="Team Workspace" left={FLOATERS[1].left} top={FLOATERS[1].top} delay={FLOATERS[1].delay}>
              <div className="flex items-center gap-1 mb-1.5">
                {["#4f46e5", "#0891b2", "#10b981"].map(c => <span key={c} className="w-5 h-5 rounded-full border-2" style={{ backgroundColor: c, borderColor: "var(--bg-surface)" }} />)}
                <span className="text-[10px] ml-1" style={{ color: "var(--text-muted)" }}>+5</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ backgroundColor: "var(--bg-surface-2)", width: "80%" }} />
            </ModuleCard>
            <ModuleCard icon={FLOATERS[2].icon} title="Documents & SOPs" left={FLOATERS[2].left} top={FLOATERS[2].top} delay={FLOATERS[2].delay}>
              <div className="space-y-1.5">
                {["90%", "70%", "82%"].map((w, i) => <div key={i} className="h-1.5 rounded-full" style={{ backgroundColor: "var(--bg-surface-2)", width: w }} />)}
              </div>
            </ModuleCard>
            <ModuleCard icon={FLOATERS[3].icon} title="HR & Team" left={FLOATERS[3].left} top={FLOATERS[3].top} delay={FLOATERS[3].delay}>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>12</span>
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>on shift today</span>
              </div>
            </ModuleCard>
            <ModuleCard icon={FLOATERS[4].icon} title="Accounting" left={FLOATERS[4].left} top={FLOATERS[4].top} delay={FLOATERS[4].delay}>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>$248k</span>
                <span className="text-[10px] font-semibold" style={{ color: "#22c55e" }}>+12%</span>
              </div>
            </ModuleCard>
          </div>

          {/* central stage — the self-playing product reel */}
          <div className="relative z-10 mx-auto max-w-3xl"><HeroReel /></div>

          {/* layered phone (lg only) */}
          <div className="hidden lg:block absolute z-30" style={{ right: "2%", bottom: "-9%", transform: "rotate(4deg) scale(0.62)", transformOrigin: "bottom right" }}>
            <PhoneFrame><MobileAppMockup /></PhoneFrame>
          </div>
        </div>

        {/* module legend */}
        <div className="mt-14 lg:mt-16 flex flex-wrap justify-center gap-2">
          {CHIPS.map(c => (
            <span key={c.label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
              <c.icon className="w-3.5 h-3.5" style={{ color: "var(--accent-text)" }} /> {c.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function MiniBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between text-[9px] mb-0.5" style={{ color: "var(--text-muted)" }}><span>{label}</span><span>{pct}%</span></div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-surface-2)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "#4f46e5" }} />
      </div>
    </div>
  );
}
