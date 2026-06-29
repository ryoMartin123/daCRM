// ─── Marketing site footer ────────────────────────────────

import Link from "next/link";
import Wordmark from "./Wordmark";
import { PRODUCT_AREAS, OPERATIONS_AREAS, INDUSTRIES, APP_LOGIN_HREF } from "./nav";

const areaHref = (id: string) => (id === "overview" ? "/product" : `/product#${id}`);

export default function SiteFooter() {
  return (
    <footer className="border-t" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-page)" }}>
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-14">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Wordmark />
            <p className="mt-4 text-sm max-w-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              The operating system for service businesses — customers, jobs, dispatch, technicians, and operations in one connected platform.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/early-access" className="px-3.5 py-2 rounded-lg text-sm font-semibold text-white" style={{ backgroundColor: "#4f46e5" }}>Request Early Access</Link>
              <Link href="/design-partners" className="px-3.5 py-2 rounded-lg text-sm font-semibold" style={{ color: "var(--text-primary)", border: "1px solid var(--border)" }}>Become a Design Partner</Link>
            </div>
          </div>

          <FooterCol label="Product" links={PRODUCT_AREAS.map(a => ({ label: a.title, href: areaHref(a.id) }))} />
          <FooterCol label="Operations" links={OPERATIONS_AREAS.map(a => ({ label: a.title, href: areaHref(a.id) }))} />
          <FooterCol label="Company" links={[
            { label: "Industries", href: "/industries" },
            { label: "Design Partners", href: "/design-partners" },
            { label: "Early Access", href: "/early-access" },
            { label: "Contact", href: "/contact" },
            { label: "Login", href: APP_LOGIN_HREF },
          ]} />
        </div>

        <div className="mt-12 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>© {new Date().getFullYear()} Routiqa. All rights reserved.</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Built for {INDUSTRIES.slice(0, 4).map(i => i.name).join(" · ")} & more.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ label, links }: { label: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>{label}</p>
      <ul className="space-y-2.5">
        {links.map(l => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm transition-colors hover:text-[var(--text-primary)]" style={{ color: "var(--text-secondary)" }}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
