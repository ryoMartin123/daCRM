// ─── PageTitle ────────────────────────────────────────────
// Standard CRM page header: the title with a short, muted subheading directly
// beneath it — matching the platform app pages (HR, Accounting, Documents,
// Admin). The description is always visible (no hover-to-reveal). `count` and
// `extraRows` are still accepted for call-site compatibility but are no longer
// rendered here; per-status counts live in the StatusTabs / summary cards.

export default function PageTitle({ title, description }: {
  title:        React.ReactNode;
  description?: React.ReactNode;
  count?:       number | string;
  extraRows?:   { label: string; node: React.ReactNode }[];
}) {
  return (
    <div className="min-w-0">
      <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h1>
      {description && (
        <p className="text-[13px] mt-0.5 leading-snug" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      )}
    </div>
  );
}
