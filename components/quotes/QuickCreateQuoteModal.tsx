"use client";

import { useMemo, useState } from "react";
import { X, ArrowRight, FileText } from "lucide-react";
import UiSelect from "@/components/ui/Select";
import AccountSearchSelect from "@/components/customers/AccountSearchSelect";
import { getAllCustomers, getProperties, getLeads, getJobs } from "@/lib/customers/data";
import { ALL_PROJECTS } from "@/lib/projects/data";
import { createQuote, type QuoteSection } from "@/lib/quotes/data";
import {
  getProposalTemplates, getDefaultProposalTemplate, resolveTemplateSections, SECTION_LABELS,
} from "@/lib/proposals/data";

type RelatedKind = "none" | "lead" | "job" | "project";

export interface QuickCreateQuotePreset {
  customerId?: string;
  propertyId?: string;
  leadId?: string;
  jobId?: string;
  projectId?: string;
  lockCustomer?: boolean;
}

// Lightweight "Quick Create" step — collects only the starting info, then hands
// off to the full Quote Builder workspace. The proposal template's sections are
// snapshot-copied onto the new draft quote so later template edits don't change
// this quote.
export default function QuickCreateQuoteModal({ preset, onClose, onContinue }: {
  preset?: QuickCreateQuotePreset;
  onClose: () => void;
  onContinue: (id: string) => void;
}) {
  const customers = getAllCustomers();
  const templates = useMemo(() => getProposalTemplates().filter(t => t.active), []);
  const defaultTmpl = useMemo(() => getDefaultProposalTemplate(), []);

  const [customerId, setCustomerId] = useState(preset?.customerId ?? customers[0]?.id ?? "");
  const [propertyId, setPropertyId] = useState(preset?.propertyId ?? "");
  const [relatedKind, setRelatedKind] = useState<RelatedKind>(
    preset?.leadId ? "lead" : preset?.jobId ? "job" : preset?.projectId ? "project" : "none");
  const [relatedId, setRelatedId] = useState(preset?.leadId ?? preset?.jobId ?? preset?.projectId ?? "");
  const [templateId, setTemplateId] = useState(defaultTmpl?.id ?? templates[0]?.id ?? "");
  const [title, setTitle] = useState("");

  const customer = customers.find(c => c.id === customerId);
  const properties = useMemo(() => (customerId ? getProperties(customerId) : []), [customerId]);
  const leads = useMemo(() => (customerId ? getLeads(customerId) : []), [customerId]);
  const jobs = useMemo(() => (customerId ? getJobs(customerId) : []), [customerId]);
  const projects = useMemo(() => ALL_PROJECTS.filter(p => p.accountId === customerId), [customerId]);
  const template = templates.find(t => t.id === templateId);

  function relatedOptions() {
    if (relatedKind === "lead") return leads.map(l => ({ value: l.id, label: l.title }));
    if (relatedKind === "job") return jobs.map(j => ({ value: j.id, label: j.title }));
    if (relatedKind === "project") return projects.map(p => ({ value: p.id, label: p.name }));
    return [];
  }
  function linkFields() {
    if (relatedKind === "none" || !relatedId) return {};
    if (relatedKind === "lead") { const l = leads.find(x => x.id === relatedId); return { leadId: relatedId, linkedType: "lead" as const, linkedId: relatedId, linkedLabel: l ? `Lead: ${l.title}` : "Lead" }; }
    if (relatedKind === "job") { const j = jobs.find(x => x.id === relatedId); return { jobId: relatedId, linkedType: "job" as const, linkedId: relatedId, linkedLabel: j ? `Job: ${j.title}` : "Job" }; }
    const p = projects.find(x => x.id === relatedId); return { projectId: relatedId, linkedType: "project" as const, linkedId: relatedId, linkedLabel: p ? `Project: ${p.name}` : "Project" };
  }

  const selProperty = properties.find(p => p.id === propertyId);
  const propertyLabel = selProperty ? `${selProperty.label ? selProperty.label + " — " : ""}${selProperty.address}, ${selProperty.city}` : undefined;

  const canContinue = Boolean(customerId && templateId);

  function handleContinue() {
    if (!customer || !template) return;
    // Snapshot the template sections onto the new quote.
    const sections: QuoteSection[] = resolveTemplateSections(template).map(s => ({
      key: s.key, label: s.label, body: s.body, visible: s.visible,
    }));
    // Default expiry from the template.
    const exp = new Date(); exp.setDate(exp.getDate() + (template.defaultExpirationDays || 30));
    const expiresAt = exp.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const q = createQuote({
      customerId, customerName: customer.name, customerInitials: customer.initials, locationName: customer.locationName,
      companyId: customer.companyId, locationId: customer.locationId, serviceAreaId: customer.serviceAreaId,
      title: title.trim() || template.name,
      lineItems: [], taxRate: 0, expiresAt,
      propertyId: propertyId || undefined, propertyLabel,
      proposalTemplateId: template.id, sections,
      ...linkFields(),
    });
    onContinue(q.id);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}
        style={{ backgroundColor: "var(--bg-surface)", boxShadow: "0 16px 48px rgba(0,0,0,0.24)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div>
            <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>New Quote</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Pick the basics — you&apos;ll build the proposal next.</p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}><X className="w-4 h-4" /></button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Customer / Account *</label>
            <AccountSearchSelect customers={customers} value={customerId}
              onChange={v => { setCustomerId(v); setPropertyId(""); setRelatedId(""); }} disabled={Boolean(preset?.lockCustomer)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Property <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
            <UiSelect value={propertyId} onChange={setPropertyId} placeholder="No specific property"
              options={[{ value: "", label: "No specific property" }, ...properties.map(p => ({ value: p.id, label: `${p.label ? p.label + " — " : ""}${p.address}, ${p.city}` }))]} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Related to <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
            <div className="flex items-center rounded-lg overflow-hidden w-fit mb-2" style={{ border: "1px solid var(--border)" }}>
              {(["none", "lead", "job", "project"] as RelatedKind[]).map(k => {
                const active = relatedKind === k;
                return (
                  <button key={k} onClick={() => { setRelatedKind(k); setRelatedId(""); }}
                    className="px-3 py-1.5 text-xs font-medium capitalize transition-colors"
                    style={{ backgroundColor: active ? "#4f46e5" : "var(--bg-surface)", color: active ? "#fff" : "var(--text-secondary)" }}>
                    {k === "none" ? "None" : k}
                  </button>
                );
              })}
            </div>
            {relatedKind !== "none" && (
              relatedOptions().length > 0
                ? <UiSelect value={relatedId} onChange={setRelatedId} placeholder={`Select a ${relatedKind}…`} options={relatedOptions()} />
                : <p className="text-xs" style={{ color: "var(--text-muted)" }}>No {relatedKind}s for this customer.</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Proposal Template *</label>
            <UiSelect value={templateId} onChange={setTemplateId} options={templates.map(t => ({ value: t.id, label: t.name }))} />
            {template && (
              <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                {template.description} · {template.sections.filter(s => s.visible).length} sections
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Title <span style={{ color: "var(--text-muted)" }}>(optional)</span></label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={template?.name ?? "e.g. HVAC System Replacement"}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ border: "1px solid var(--border)", backgroundColor: "var(--bg-surface)", color: "var(--text-primary)" }} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--text-muted)" }}><FileText className="w-3.5 h-3.5" /> Creates a draft you can refine in the builder</span>
          <button onClick={handleContinue} disabled={!canContinue}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40" style={{ backgroundColor: "#4f46e5" }}>
            Continue to Builder <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
