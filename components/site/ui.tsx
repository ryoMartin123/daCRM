// ─── Marketing primitives ─────────────────────────────────
// Small building blocks shared across the site sections. They mirror the app's
// idioms (rounded-2xl, 1px var(--border-subtle), var(--shadow-glow), indigo soft
// tints) so the site reads as the same product family.

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Section({ id, children, className = "", grid = false }: { id?: string; children: React.ReactNode; className?: string; grid?: boolean }) {
  return (
    <section id={id} className={`${grid ? "site-grid-bg" : ""} ${className}`} style={id ? { scrollMarginTop: "5rem" } : undefined}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-20 lg:py-28">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--accent-text)" }}>
      <span className="w-5 h-px" style={{ backgroundColor: "var(--accent-text)" }} />
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, sub, center = false, className = "" }: { eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; center?: boolean; className?: string }) {
  return (
    <div className={`${center ? "text-center mx-auto" : ""} max-w-2xl ${className}`}>
      {eyebrow && <div className={center ? "flex justify-center mb-4" : "mb-4"}><Eyebrow>{eyebrow}</Eyebrow></div>}
      <h2 className="text-3xl lg:text-[2.6rem] font-bold tracking-tight leading-[1.1]" style={{ color: "var(--text-primary)" }}>{title}</h2>
      {sub && <p className="mt-4 text-base lg:text-lg leading-relaxed" style={{ color: "var(--text-secondary)" }}>{sub}</p>}
    </div>
  );
}

export function PrimaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:brightness-110 hover:gap-2.5" style={{ backgroundColor: "#4f46e5", boxShadow: "0 8px 28px -8px rgba(79,70,229,0.6)" }}>
      {children} <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

export function GhostCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-[var(--bg-surface-2)]" style={{ color: "var(--text-primary)", border: "1px solid var(--border)" }}>
      {children}
    </Link>
  );
}

export function CtaGroup({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <PrimaryCta href="/early-access">Request Early Access</PrimaryCta>
      <GhostCta href="/design-partners">Become a Design Partner</GhostCta>
    </div>
  );
}

// Card mirroring the app's elevated "glow" card.
export function Card({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-2xl ${className}`} style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-glow)", ...style }}>
      {children}
    </div>
  );
}

// A macOS-style browser window for desktop product mockups.
export function BrowserFrame({ children, url = "app.routiqa.com", className = "" }: { children: React.ReactNode; url?: string; className?: string }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`} style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "0 30px 80px -24px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)" }}>
      <div className="flex items-center gap-2 px-3.5 h-10 border-b" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface-2)" }}>
        <span className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#22c55e" }} />
        </span>
        <span className="mx-auto px-3 h-6 rounded-md text-[11px] flex items-center" style={{ backgroundColor: "var(--bg-input)", color: "var(--text-muted)" }}>{url}</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

// A phone bezel for mobile mockups.
export function PhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[2.5rem] p-2.5 ${className}`} style={{ backgroundColor: "#0a0a0a", border: "1px solid var(--border)", boxShadow: "0 30px 80px -24px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)" }}>
      <div className="rounded-[2rem] overflow-hidden relative" style={{ backgroundColor: "var(--bg-page)" }}>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full z-10" style={{ backgroundColor: "#0a0a0a" }} />
        {children}
      </div>
    </div>
  );
}

// Compact hero band for inner pages.
export function PageHero({ eyebrow, title, sub, children }: { eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <section className="site-hero-bg border-b" style={{ borderColor: "var(--border-subtle)" }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 pt-20 pb-16 lg:pt-24 text-center">
        {eyebrow && <div className="flex justify-center mb-4"><Eyebrow>{eyebrow}</Eyebrow></div>}
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08] max-w-3xl mx-auto" style={{ color: "var(--text-primary)" }}>{title}</h1>
        {sub && <p className="mt-5 text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>{sub}</p>}
        {children && <div className="mt-8 flex justify-center">{children}</div>}
      </div>
    </section>
  );
}

export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl px-4 py-3" style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}>
      <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</div>
      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}
