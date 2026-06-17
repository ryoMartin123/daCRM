"use client";

// Customer-facing paper document for a Custom Proposal (block-based). Renders the
// visible blocks on a white sheet with dark ink — used by the builder's Preview
// and the print view. Internal pricing is NEVER rendered here; only blocks the
// rep explicitly added (Price Summary / Line Items / Option cards) show pricing.

import { fmt, type LineItem, type QuoteOption } from "@/lib/quotes/data";
import { RICH_BLOCK_TYPES, type QuoteBlock } from "@/lib/quotes/blocks";
import type { ProposalBranding } from "@/lib/proposals/data";

const INK = "#111827", SUB = "#374151", MUTED = "#6b7280", FAINT = "#9ca3af", LINE = "#e5e7eb", SOFT = "#f9fafb";

export interface CustomDocData {
  branding: ProposalBranding;
  quoteNumber: string;
  customerName: string;
  locationName?: string;
  propertyLabel?: string;
  createdAt?: string;
  expiresAt?: string;
  blocks: QuoteBlock[];
  lineItems: LineItem[];
  options: QuoteOption[];
  subtotal: number; tax: number; total: number; taxRatePct: number;
  monthly?: number;
  customerNotes?: string;
  stamp?: string;
}

export default function CustomProposalDocument({ data, shadow = true }: { data: CustomDocData; shadow?: boolean }) {
  const accent = data.branding.accentColor || "#4f46e5";
  const blocks = data.blocks.filter(b => b.visible);

  return (
    <div className="proposal-sheet mx-auto relative" style={{
      width: "100%", maxWidth: "816px", backgroundColor: "#fff", color: INK,
      boxShadow: shadow ? "0 8px 32px rgba(0,0,0,0.16)" : "none", borderRadius: shadow ? "8px" : "0",
    }}>
      <div style={{ height: "6px", backgroundColor: accent, borderTopLeftRadius: shadow ? "8px" : 0, borderTopRightRadius: shadow ? "8px" : 0 }} />
      <div style={{ padding: "44px 56px 56px" }}>
        {/* Letterhead (document chrome) */}
        <div className="flex items-start justify-between" style={{ marginBottom: "24px" }}>
          <div>
            {data.branding.logoUrl
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={data.branding.logoUrl} alt={data.branding.companyName} style={{ maxHeight: "44px", marginBottom: "6px" }} />
              : <p style={{ fontSize: "20px", fontWeight: 800, color: accent, lineHeight: 1.1 }}>{data.branding.companyName}</p>}
            <p style={{ fontSize: "11px", color: MUTED, marginTop: "4px" }}>{data.branding.companyInfo}</p>
            <p style={{ fontSize: "11px", color: MUTED }}>{data.branding.contactInfo}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em", color: INK }}>PROPOSAL</p>
            <p style={{ fontSize: "11px", color: MUTED, marginTop: "2px" }}>{data.quoteNumber}</p>
            <p style={{ fontSize: "11px", color: MUTED }}>Prepared for {data.customerName}</p>
            {data.expiresAt && <p style={{ fontSize: "11px", color: MUTED }}>Valid until: {data.expiresAt}</p>}
          </div>
        </div>
        <div style={{ height: "2px", backgroundColor: accent, opacity: 0.85, marginBottom: "24px" }} />

        {blocks.length === 0
          ? <p style={{ fontSize: "13px", color: FAINT, fontStyle: "italic" }}>This proposal is empty.</p>
          : blocks.map((b, i) => (
            <div key={b.id} style={{ marginBottom: i === blocks.length - 1 ? 0 : "22px", breakInside: b.type === "page_break" ? undefined : "avoid" }}>
              <Block b={b} data={data} accent={accent} />
            </div>
          ))}

        {data.customerNotes && <p style={{ fontSize: "12px", color: SUB, marginTop: "16px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{data.customerNotes}</p>}
        {data.branding.footer && (
          <p style={{ fontSize: "10px", color: FAINT, textAlign: "center", marginTop: "36px", paddingTop: "16px", borderTop: `1px solid ${LINE}` }}>{data.branding.footer}</p>
        )}
      </div>

      {data.stamp && (
        <div aria-hidden className="proposal-stamp" style={{
          position: "absolute", top: "44%", left: "50%", transform: "translate(-50%,-50%) rotate(-18deg)",
          border: "4px solid #059669", color: "#059669", opacity: 0.85, fontSize: "44px", fontWeight: 800,
          letterSpacing: "0.05em", padding: "4px 22px", borderRadius: "8px", pointerEvents: "none",
        }}>{data.stamp}</div>
      )}
    </div>
  );
}

function Label({ children, accent }: { children: React.ReactNode; accent: string }) {
  return <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accent, marginBottom: "8px" }}>{children}</p>;
}

function Block({ b, data, accent }: { b: QuoteBlock; data: CustomDocData; accent: string }) {
  if (b.type === "divider") return <hr style={{ border: "none", borderTop: `1px solid ${LINE}` }} />;
  if (b.type === "page_break") return <div style={{ breakAfter: "page", borderTop: `1px dashed ${LINE}` }} />;

  if (b.type === "heading") {
    const lvl = b.settings?.level ?? 2;
    const size = lvl === 1 ? "26px" : lvl === 2 ? "20px" : "16px";
    return <p style={{ fontSize: size, fontWeight: 800, color: INK, textAlign: b.settings?.align ?? "left", lineHeight: 1.2 }}>{b.content || b.title}</p>;
  }

  if (RICH_BLOCK_TYPES.includes(b.type)) {
    const hasBody = b.content && b.content.replace(/<[^>]*>/g, "").trim().length > 0;
    return (
      <div>
        {b.title && <Label accent={accent}>{b.title}</Label>}
        {hasBody
          ? <div className="rte-doc" style={{ fontSize: "13px", color: SUB }} dangerouslySetInnerHTML={{ __html: b.content }} />
          : <p style={{ fontSize: "12.5px", color: FAINT, fontStyle: "italic" }}>—</p>}
      </div>
    );
  }

  if (b.type === "image") {
    const img = b.images?.[0];
    if (!img?.src) return <div style={{ border: `1px dashed ${LINE}`, borderRadius: "8px", padding: "28px", textAlign: "center", color: FAINT, fontSize: "12px" }}>Image</div>;
    return (
      <figure style={{ margin: 0, textAlign: b.settings?.align ?? "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.src} alt={img.alt ?? b.title} style={{ width: `${b.settings?.width ?? 100}%`, borderRadius: "8px", display: "inline-block" }} />
        {img.caption && <figcaption style={{ fontSize: "11px", color: MUTED, marginTop: "6px" }}>{img.caption}</figcaption>}
      </figure>
    );
  }

  if (b.type === "image_gallery") {
    const imgs = (b.images ?? []).filter(i => i.src);
    return (
      <div>
        {b.title && <Label accent={accent}>{b.title}</Label>}
        {imgs.length === 0 ? <p style={{ fontSize: "12.5px", color: FAINT, fontStyle: "italic" }}>No photos.</p> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
            {imgs.map(im => (
              <figure key={im.id} style={{ margin: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.src} alt={im.alt ?? ""} style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px", display: "block" }} />
                {im.caption && <figcaption style={{ fontSize: "10.5px", color: MUTED, marginTop: "4px" }}>{im.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (b.type === "equipment_card") {
    const s = b.settings ?? {};
    const img = b.images?.[0];
    return (
      <div style={{ border: `1px solid ${LINE}`, borderRadius: "8px", padding: "14px", display: "flex", gap: "14px" }}>
        {img?.src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img.src} alt={b.title} style={{ width: "110px", height: "110px", objectFit: "cover", borderRadius: "6px" }} />
        )}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: INK }}>{b.title}</p>
          {(s.brand || s.model) && <p style={{ fontSize: "11px", color: MUTED, marginTop: "2px" }}>{[s.brand, s.model].filter(Boolean).join(" · ")}</p>}
          {s.specs && <p style={{ fontSize: "12px", color: SUB, marginTop: "6px", whiteSpace: "pre-wrap" }}>{s.specs}</p>}
          {typeof s.price === "number" && s.price > 0 && <p style={{ fontSize: "16px", fontWeight: 800, color: INK, marginTop: "6px" }}>{fmt(s.price)}</p>}
        </div>
      </div>
    );
  }

  if (b.type === "option_cards") {
    const opts = data.options;
    if (opts.length === 0) return (<div>{b.title && <Label accent={accent}>{b.title}</Label>}<p style={{ fontSize: "12.5px", color: FAINT, fontStyle: "italic" }}>—</p></div>);
    return (
      <div>
        {b.title && <Label accent={accent}>{b.title}</Label>}
        <div style={{ display: "flex", gap: "12px" }}>
          {opts.map(o => {
            const on = o.selected;
            return (
              <div key={o.id} style={{ flex: 1, border: `1.5px solid ${on ? accent : LINE}`, borderRadius: "8px", padding: "14px", backgroundColor: on ? `${accent}0d` : "#fff", overflow: "hidden" }}>
                {o.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.image} alt={o.name} style={{ width: "100%", height: "108px", objectFit: "cover", borderRadius: "6px", marginBottom: "10px", display: "block" }} />
                )}
                {o.tier && <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: accent, marginBottom: "4px" }}>{o.tier}{on ? " · Selected" : ""}</p>}
                <p style={{ fontSize: "13.5px", fontWeight: 700, color: INK, lineHeight: 1.25 }}>{o.name}</p>
                {(o.brand || o.model) && <p style={{ fontSize: "10.5px", color: MUTED, marginTop: "2px" }}>{[o.brand, o.model].filter(Boolean).join(" · ")}</p>}
                <p style={{ fontSize: "20px", fontWeight: 800, color: INK, marginTop: "8px" }}>${o.price.toLocaleString()}</p>
                {o.monthlyPrice ? <p style={{ fontSize: "11px", fontWeight: 600, color: accent }}>${o.monthlyPrice}/mo</p> : null}
                {o.includes && o.includes.length > 0 && (
                  <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
                    {o.includes.map((inc, i) => (
                      <li key={i} style={{ fontSize: "11px", color: SUB, padding: "2px 0", paddingLeft: "12px", position: "relative" }}>
                        <span style={{ position: "absolute", left: 0, color: accent, fontWeight: 700 }}>✓</span>{inc}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (b.type === "line_items") {
    const base = data.lineItems.filter(li => !li.optional);
    const optional = data.lineItems.filter(li => li.optional);
    return (
      <div>
        {b.title && <Label accent={accent}>{b.title}</Label>}
        {base.length === 0 ? <p style={{ fontSize: "13px", color: MUTED }}>No line items.</p> : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
            <thead><tr style={{ backgroundColor: SOFT }}>
              <th style={thStyle}>DESCRIPTION</th>
              <th style={{ ...thStyle, textAlign: "right", width: "48px" }}>QTY</th>
              <th style={{ ...thStyle, textAlign: "right", width: "84px" }}>UNIT</th>
              <th style={{ ...thStyle, textAlign: "right", width: "92px" }}>AMOUNT</th>
            </tr></thead>
            <tbody>
              {base.map(li => (
                <tr key={li.id}>
                  <td style={tdStyle}><span style={{ fontWeight: 600 }}>{li.name ?? li.description}</span>
                    {li.name && li.description && li.name !== li.description && <span style={{ display: "block", color: MUTED, fontSize: "11.5px" }}>{li.description}</span>}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: SUB }}>{li.quantity}</td>
                  <td style={{ ...tdStyle, textAlign: "right", color: SUB }}>{fmt(li.unitPrice)}</td>
                  <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600 }}>{fmt(li.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Totals data={data} accent={accent} />
        {optional.length > 0 && (
          <div style={{ marginTop: "14px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: MUTED, marginBottom: "6px" }}>OPTIONAL ADD-ONS</p>
            {optional.map(li => (
              <div key={li.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", padding: "3px 0", color: SUB }}>
                <span>{li.name ?? li.description} ×{li.quantity}</span><span>{fmt(li.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (b.type === "price_summary") {
    const itemized = b.settings?.itemized ?? true;
    const base = data.lineItems.filter(li => !li.optional);
    return (
      <div>
        {b.title && <Label accent={accent}>{b.title}</Label>}
        {itemized && base.length > 0 && (
          <div style={{ marginBottom: "10px" }}>
            {base.map(li => (
              <div key={li.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", padding: "3px 0", borderBottom: `1px solid ${LINE}` }}>
                <span style={{ color: INK }}>{li.name ?? li.description}</span><span style={{ color: INK, fontWeight: 600 }}>{fmt(li.total)}</span>
              </div>
            ))}
          </div>
        )}
        <Totals data={data} accent={accent} />
        {b.settings?.showMonthly && data.monthly ? (
          <p style={{ fontSize: "12px", color: accent, fontWeight: 600, textAlign: "right", marginTop: "6px" }}>or about {fmt(data.monthly)}/mo with financing</p>
        ) : null}
      </div>
    );
  }

  if (b.type === "approval_signature") {
    return (
      <div>
        {b.title && <Label accent={accent}>{b.title}</Label>}
        {b.content && <p style={{ fontSize: "12.5px", color: SUB, marginBottom: "16px", lineHeight: 1.6 }}>{b.content}</p>}
        <div style={{ display: "flex", gap: "40px", marginTop: "8px" }}>
          {["Customer Signature", "Date"].map(l => (
            <div key={l} style={{ flex: 1 }}><div style={{ borderBottom: `1px solid ${INK}`, height: "32px" }} /><p style={{ fontSize: "10px", color: MUTED, marginTop: "4px" }}>{l}</p></div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

const thStyle: React.CSSProperties = { textAlign: "left", padding: "8px 10px", color: MUTED, fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", borderBottom: `1px solid ${LINE}` };
const tdStyle: React.CSSProperties = { padding: "8px 10px", color: INK, borderBottom: `1px solid ${LINE}` };

function Totals({ data, accent }: { data: CustomDocData; accent: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
      <div style={{ width: "240px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", padding: "3px 0" }}><span style={{ color: MUTED }}>Subtotal</span><span style={{ color: SUB }}>{fmt(data.subtotal)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", padding: "3px 0" }}><span style={{ color: MUTED }}>Tax ({data.taxRatePct}%)</span><span style={{ color: SUB }}>{fmt(data.tax)}</span></div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", paddingTop: "8px", borderTop: `2px solid ${accent}` }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: INK }}>Total</span>
          <span style={{ fontSize: "18px", fontWeight: 800, color: accent }}>{fmt(data.total)}</span>
        </div>
      </div>
    </div>
  );
}
