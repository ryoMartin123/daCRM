"use client";

// Global "Create" button — a minimalist icon trigger in the top bar that opens a
// menu to create any primary record. Records with a modal creator (customer,
// job, quote, invoice, agreement) open it in place from any route; the rest jump
// to their section to create there.

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, UserPlus, Briefcase, FileText, Receipt, FileCheck,
  TrendingUp, FolderKanban, ListChecks,
} from "lucide-react";
import NewCustomerModal from "@/components/customers/NewCustomerModal";
import JobWizard from "@/components/jobs/JobWizard";
import QuickCreateQuoteModal from "@/components/quotes/QuickCreateQuoteModal";
import InvoiceWizard from "@/components/quotes/InvoiceWizard";
import AgreementBuilder from "@/components/agreements/AgreementBuilder";

type ModalKind = "customer" | "job" | "quote" | "invoice" | "agreement";

const MODAL_ITEMS: { kind: ModalKind; label: string; sublabel: string; icon: typeof UserPlus }[] = [
  { kind: "customer",  label: "Customer",        sublabel: "Account or prospect",  icon: UserPlus },
  { kind: "job",       label: "Job",             sublabel: "Schedule or dispatch", icon: Briefcase },
  { kind: "quote",     label: "Quote / Estimate", sublabel: "Build a proposal",    icon: FileText },
  { kind: "invoice",   label: "Invoice",         sublabel: "Bill a customer",      icon: Receipt },
  { kind: "agreement", label: "Agreement",       sublabel: "Maintenance plan",     icon: FileCheck },
];

const NAV_ITEMS: { label: string; sublabel: string; href: string; icon: typeof UserPlus }[] = [
  { label: "Lead",    sublabel: "Sales pipeline",  href: "/leads",    icon: TrendingUp },
  { label: "Project", sublabel: "Multi-job work",  href: "/projects", icon: FolderKanban },
  { label: "Task",    sublabel: "Follow-up / to-do", href: "/tasks",  icon: ListChecks },
];

export default function GlobalCreateMenu() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive]     = useState<ModalKind | null>(null);

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setMenuOpen(o => !o)}
          title="Create"
          className="flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          aria-haspopup="menu" aria-expanded={menuOpen}
        >
          <Plus className="w-5 h-5" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div role="menu" className="absolute right-0 mt-1.5 w-60 rounded-xl overflow-hidden z-50 py-1"
              style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border-subtle)", boxShadow: "0 12px 32px rgba(0,0,0,0.18)" }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest px-3 pt-2 pb-1" style={{ color: "var(--text-muted)" }}>Create new</p>
              {MODAL_ITEMS.map(item => (
                <Row key={item.kind} icon={item.icon} label={item.label} sublabel={item.sublabel}
                  onClick={() => { setMenuOpen(false); setActive(item.kind); }} />
              ))}
              <div className="my-1" style={{ borderTop: "1px solid var(--border-subtle)" }} />
              {NAV_ITEMS.map(item => (
                <Row key={item.href} icon={item.icon} label={item.label} sublabel={item.sublabel}
                  onClick={() => { setMenuOpen(false); router.push(item.href); }} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Hosted create modals */}
      <NewCustomerModal open={active === "customer"} onClose={() => setActive(null)} />

      {active === "job" && (
        <JobWizard onClose={() => setActive(null)} onCreated={(id) => { setActive(null); router.push(`/jobs/${id}`); }} />
      )}
      {active === "quote" && (
        <QuickCreateQuoteModal onClose={() => setActive(null)} onContinue={(id) => { setActive(null); router.push(`/quotes/${id}/builder`); }} />
      )}
      {active === "invoice" && (
        <InvoiceWizard onClose={() => setActive(null)} onCreated={(id) => { setActive(null); router.push(`/invoices/${id}`); }} />
      )}
      {active === "agreement" && (
        <AgreementBuilder onClose={() => setActive(null)} onCreated={(id) => { setActive(null); router.push(`/agreements/${id}`); }} />
      )}
    </>
  );
}

function Row({ icon: Icon, label, sublabel, onClick }: { icon: typeof UserPlus; label: string; sublabel: string; onClick: () => void }) {
  return (
    <button role="menuitem" onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[var(--bg-surface-2)]">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-soft-bg)" }}>
        <Icon className="w-4 h-4" style={{ color: "var(--accent-text)" }} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</p>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{sublabel}</p>
      </div>
    </button>
  );
}
