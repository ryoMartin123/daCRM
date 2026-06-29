"use client";

// ─── Marketing site header ────────────────────────────────
// Sticky frosted nav with a SaaS-style mega-menu (Product / Operations columns),
// primary links, and the two conversion CTAs. Collapses to a hamburger sheet on
// mobile. Links route to /product anchors (matching section ids) so visitors land
// directly on the relevant area.

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, ArrowRight } from "lucide-react";
import Wordmark from "./Wordmark";
import { PRODUCT_AREAS, OPERATIONS_AREAS, NAV_LINKS, APP_LOGIN_HREF } from "./nav";

const areaHref = (id: string) => (id === "overview" ? "/product" : `/product#${id}`);

export default function SiteHeader() {
  const [mega, setMega] = useState(false);
  const [mobile, setMobile] = useState(false);

  return (
    <header className="sticky top-0 z-50 site-nav">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Routiqa home"><Wordmark /></Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 text-sm">
            <div className="relative" onMouseEnter={() => setMega(true)} onMouseLeave={() => setMega(false)}>
              <button
                className="flex items-center gap-1 px-3 py-2 rounded-lg font-medium transition-colors"
                style={{ color: mega ? "var(--text-primary)" : "var(--text-secondary)" }}
                onClick={() => setMega(o => !o)}
                aria-expanded={mega}
              >
                Product
                <ChevronDown className="w-4 h-4 transition-transform" style={{ transform: mega ? "rotate(180deg)" : "none" }} />
              </button>
              {mega && <MegaMenu onNavigate={() => setMega(false)} />}
            </div>
            {NAV_LINKS.map(l => (
              <Link key={l.href} href={l.href} className="px-3 py-2 rounded-lg font-medium transition-colors hover:text-[var(--text-primary)]" style={{ color: "var(--text-secondary)" }}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-2">
            <Link href={APP_LOGIN_HREF} className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:text-[var(--text-primary)]" style={{ color: "var(--text-secondary)" }}>
              Login
            </Link>
            <Link href="/design-partners" className="px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors" style={{ color: "var(--text-primary)", border: "1px solid var(--border)" }}>
              Become a Design Partner
            </Link>
            <Link href="/early-access" className="px-3.5 py-2 rounded-lg text-sm font-semibold text-white transition-colors hover:brightness-110" style={{ backgroundColor: "#4f46e5" }}>
              Request Early Access
            </Link>
          </div>

          {/* Mobile toggle */}
          <button onClick={() => setMobile(o => !o)} className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center" aria-label="Menu" style={{ color: "var(--text-primary)" }}>
            {mobile ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobile && <MobileMenu onNavigate={() => setMobile(false)} />}
    </header>
  );
}

function MegaMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 w-[680px]">
      <div className="rounded-2xl overflow-hidden p-2 grid grid-cols-2 gap-1"
        style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-glow)" }}>
        <MegaColumn label="Product" areas={PRODUCT_AREAS} onNavigate={onNavigate} />
        <MegaColumn label="Operations" areas={OPERATIONS_AREAS} onNavigate={onNavigate} />
        <div className="col-span-2 mt-1 px-3 py-3 rounded-xl flex items-center justify-between" style={{ backgroundColor: "var(--bg-surface-2)" }}>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>One connected platform for the whole operation.</p>
          <Link href="/product" onClick={onNavigate} className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: "var(--accent-text)" }}>
            Platform overview <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function MegaColumn({ label, areas, onNavigate }: { label: string; areas: typeof PRODUCT_AREAS; onNavigate: () => void }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest px-3 pt-2 pb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
      {areas.map(a => {
        const Icon = a.icon;
        return (
          <Link key={a.id} href={areaHref(a.id)} onClick={onNavigate} className="flex items-start gap-3 px-3 py-2 rounded-xl transition-colors hover:bg-[var(--bg-surface-2)]">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "var(--accent-soft-bg)" }}>
              <Icon className="w-4 h-4" style={{ color: "var(--accent-text)" }} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{a.title}</span>
              <span className="block text-xs leading-snug" style={{ color: "var(--text-muted)" }}>{a.blurb}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}

function MobileMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="lg:hidden border-t" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}>
      <div className="px-5 py-4 max-h-[calc(100vh-4rem)] overflow-y-auto space-y-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-muted)" }}>Product</p>
          <div className="grid grid-cols-1 gap-0.5">
            {[...PRODUCT_AREAS, ...OPERATIONS_AREAS].map(a => (
              <Link key={a.id} href={areaHref(a.id)} onClick={onNavigate} className="flex items-center gap-3 px-2 py-2 rounded-lg" style={{ color: "var(--text-secondary)" }}>
                <a.icon className="w-4 h-4 shrink-0" style={{ color: "var(--accent-text)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{a.title}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="grid gap-0.5">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} onClick={onNavigate} className="px-2 py-2 rounded-lg text-sm font-medium" style={{ color: "var(--text-primary)" }}>{l.label}</Link>
          ))}
          <Link href={APP_LOGIN_HREF} onClick={onNavigate} className="px-2 py-2 rounded-lg text-sm font-medium" style={{ color: "var(--text-primary)" }}>Login</Link>
        </div>
        <div className="grid gap-2 pt-1">
          <Link href="/early-access" onClick={onNavigate} className="px-4 py-3 rounded-xl text-sm font-semibold text-white text-center" style={{ backgroundColor: "#4f46e5" }}>Request Early Access</Link>
          <Link href="/design-partners" onClick={onNavigate} className="px-4 py-3 rounded-xl text-sm font-semibold text-center" style={{ color: "var(--text-primary)", border: "1px solid var(--border)" }}>Become a Design Partner</Link>
        </div>
      </div>
    </div>
  );
}
