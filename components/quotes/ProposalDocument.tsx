"use client";

import { fmt } from "@/lib/quotes/data";
import { SECTION_LABELS, type SectionKey } from "@/lib/proposals/data";
import type { ProposalDocData } from "@/lib/quotes/proposalDoc";

// Professional, paper-styled proposal document. Always renders on a white sheet
// with dark text (independent of app theme) so it looks like a real PDF in the
// preview, the print view, and exported PDF. Shared by all three.
//
// Palette is intentionally hard-coded (not theme vars) — a proposal is "paper".
const INK = "#111827";
const SUB = "#374151";
const MUTED = "#6b7280";
const FAINT = "#9ca3af";
const LINE = "#e5e7eb";
const SOFT = "#f9fafb";

export default function ProposalDocument({ data, shadow = true }: { data: ProposalDocData; shadow?: boolean }) {
  const accent = data.branding.accentColor || "#4f46e5";
  const visible = data.sections.filter(s => s.visible);

  return (
    <div
      className="proposal-sheet mx-auto relative"
      style={{
        width: "100%", maxWidth: "816px", backgroundColor: "#ffffff", color: INK,
        boxShadow: shadow ? "0 8px 32px rgba(0,0,0,0.16)" : "none",
        borderRadius: shadow ? "8px" : "0",
      }}
    >
      {/* Accent top band */}
      <div style={{ height: "6px", backgroundColor: accent, borderTopLeftRadius: shadow ? "8px" : 0, borderTopRightRadius: shadow ? "8px" : 0 }} />

      <div style={{ padding: "44px 56px 56px" }}>
        {/* ── Letterhead ── */}
        <div className="flex items-start justify-between" style={{ marginBottom: "28px" }}>
          <div>
            {data.branding.logoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={data.branding.logoUrl} alt={data.branding.companyName} style={{ maxHeight: "44px", marginBottom: "6px" }} />
              : <p style={{ fontSize: "20px", fontWeight: 800, color: accent, lineHeight: 1.1 }}>{data.branding.companyName}</p>}
            <p style={{ fontSize: "11px", color: MUTED, marginTop: "4px" }}>{data.branding.companyInfo}</p>
            <p style={{ fontSize: "11px", color: MUTED }}>{data.branding.contactInfo}</p>
            {data.branding.licenseNumber && <p style={{ fontSize: "10px", color: FAINT, marginTop: "2px" }}>Lic. {data.branding.licenseNumber}</p>}
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", color: INK }}>PROPOSAL</p>
            <p style={{ fontSize: "11px", color: MUTED, marginTop: "2px" }}>{data.quoteNumber}</p>
            {data.createdAt && <p style={{ fontSize: "11px", color: MUTED }}>Date: {data.createdAt}</p>}
            {data.expiresAt && <p style={{ fontSize: "11px", color: MUTED }}>Valid until: {data.expiresAt}</p>}
          </div>
        </div>

        <div style={{ height: "2px", backgroundColor: accent, opacity: 0.85, marginBottom: "26px" }} />

        {/* ── Sections ── */}
        {visible.map((s, i) => (
          <div key={s.key} className="proposal-block" style={{ marginBottom: i === visible.length - 1 ? 0 : "24px" }}>
            <SectionContent data={data} sectionKey={s.key} label={SECTION_LABELS[s.key as SectionKey] ?? s.label} body={s.body} accent={accent} />
          </div>
        ))}

        {/* ── Footer ── */}
        {data.branding.footer && (
          <p style={{ fontSize: "10px", color: FAINT, textAlign: "center", marginTop: "40px", paddingTop: "16px", borderTop: `1px solid ${LINE}` }}>
            {data.branding.footer}
          </p>
        )}
      </div>

      {/* ── Status stamp ── */}
      {data.stamp && (
        <div aria-hidden className="proposal-stamp" style={{
          position: "absolute", top: "44%", left: "50%", transform: "translate(-50%,-50%) rotate(-18deg)",
          border: "4px solid #059669", color: "#059669", opacity: 0.85,
          fontSize: "44px", fontWeight: 800, letterSpacing: "0.05em", padding: "4px 22px", borderRadius: "8px",
          pointerEvents: "none",
        }}>{data.stamp}</div>
      )}
    </div>
  );
}

function Label({ children, accent }: { children: React.ReactNode; accent: string }) {
  return <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accent, marginBottom: "8px" }}>{children}</p>;
}

function SectionContent({ data, sectionKey, label, body, accent }: {
  data: ProposalDocData; sectionKey: string; label: string; body: string; accent: string;
}) {
  // Cover / header — large title block
  if (sectionKey === "cover_header") {
    return (
      <div>
        <p style={{ fontSize: "24px", fontWeight: 800, color: INK, lineHeight: 1.15 }}>{data.title || "Proposal"}</p>
        {body && <p style={{ fontSize: "13px", color: SUB, marginTop: "8px", lineHeight: 1.6 }}>{body}</p>}
        <p style={{ fontSize: "11px", color: MUTED, marginTop: "10px" }}>Prepared for <span style={{ fontWeight: 600, color: INK }}>{data.customerName}</span></p>
      </div>
    );
  }
  if (sectionKey === "customer_info") {
    return (<div><Label accent={accent}>{label}</Label>
      <p style={{ fontSize: "14px", fontWeight: 600, color: INK }}>{data.customerName}</p>
      {data.locationName && <p style={{ fontSize: "12px", color: MUTED }}>{data.locationName}</p>}
      {data.assignedTo && <p style={{ fontSize: "12px", color: MUTED }}>Salesperson: {data.assignedTo}</p>}
    </div>);
  }
  if (sectionKey === "property_info") {
    return (<div><Label accent={accent}>{label}</Label>
      <p style={{ fontSize: "13px", color: data.propertyLabel ? INK : MUTED }}>{data.propertyLabel ?? "—"}</p>
    </div>);
  }
  if (sectionKey === "line_items") {
    const base = data.lineItems.filter(li => !li.optional);
    const optional = data.lineItems.filter(li => li.optional);
    return (
      <div>
        <Label accent={accent}>{label}</Label>
        {base.length === 0 ? <p style={{ fontSize: "13px", color: MUTED }}>No line items.</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ backgroundColor: SOFT }}>
                <th style={{ textAlign: "left", padding: "8px 10px", color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", borderBottom: `1px solid ${LINE}` }}>DESCRIPTION</th>
                <th style={{ textAlign: "right", padding: "8px 10px", color: MUTED, fontSize: "10px", fontWeight: 700, width: "48px", borderBottom: `1px solid ${LINE}` }}>QTY</th>
                <th style={{ textAlign: "right", padding: "8px 10px", color: MUTED, fontSize: "10px", fontWeight: 700, width: "84px", borderBottom: `1px solid ${LINE}` }}>UNIT</th>
                <th style={{ textAlign: "right", padding: "8px 10px", color: MUTED, fontSize: "10px", fontWeight: 700, width: "92px", borderBottom: `1px solid ${LINE}` }}>AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {base.map(li => (
                <tr key={li.id} style={{ breakInside: "avoid" }}>
                  <td style={{ padding: "8px 10px", color: INK, borderBottom: `1px solid ${LINE}` }}>
                    <span style={{ fontWeight: 600 }}>{li.name ?? li.description}</span>
                    {li.name && li.description && li.name !== li.description && <span style={{ display: "block", color: MUTED, fontSize: "11.5px" }}>{li.description}</span>}
                  </td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: SUB, borderBottom: `1px solid ${LINE}` }}>{li.quantity}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: SUB, borderBottom: `1px solid ${LINE}` }}>{fmt(li.unitPrice)}</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", color: INK, fontWeight: 600, borderBottom: `1px solid ${LINE}` }}>{fmt(li.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Totals */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
          <div style={{ width: "240px" }}>
            <Row label="Subtotal" value={fmt(data.subtotal)} />
            <Row label={`Tax (${data.taxRatePct}%)`} value={fmt(data.tax)} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", paddingTop: "8px", borderTop: `2px solid ${accent}` }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: INK }}>Total</span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: accent }}>{fmt(data.total)}</span>
            </div>
          </div>
        </div>

        {/* Optional add-ons */}
        {optional.length > 0 && (
          <div style={{ marginTop: "16px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: MUTED, marginBottom: "6px" }}>OPTIONAL ADD-ONS</p>
            {optional.map(li => (
              <div key={li.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", padding: "3px 0", color: SUB }}>
                <span>{li.name ?? li.description} <span style={{ color: FAINT }}>×{li.quantity}</span></span>
                <span>{fmt(li.total)}</span>
              </div>
            ))}
            <p style={{ fontSize: "10px", color: FAINT, marginTop: "4px" }}>Add-ons are not included in the total above.</p>
          </div>
        )}

        {data.customerNotes && <p style={{ fontSize: "12px", color: SUB, marginTop: "14px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{data.customerNotes}</p>}
      </div>
    );
  }
  if (sectionKey === "approval") {
    return (
      <div>
        <Label accent={accent}>{label}</Label>
        {body && <p style={{ fontSize: "12.5px", color: SUB, marginBottom: "16px", lineHeight: 1.6 }}>{body}</p>}
        <div style={{ display: "flex", gap: "40px", marginTop: "8px" }}>
          {["Customer Signature", "Date"].map(l => (
            <div key={l} style={{ flex: 1 }}>
              <div style={{ borderBottom: `1px solid ${INK}`, height: "32px" }} />
              <p style={{ fontSize: "10px", color: MUTED, marginTop: "4px" }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  // Generic narrative section
  return (
    <div>
      <Label accent={accent}>{label}</Label>
      {body
        ? <p style={{ fontSize: "13px", color: SUB, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{body}</p>
        : <p style={{ fontSize: "12.5px", color: FAINT, fontStyle: "italic" }}>—</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", padding: "3px 0" }}>
      <span style={{ color: MUTED }}>{label}</span>
      <span style={{ color: SUB }}>{value}</span>
    </div>
  );
}
