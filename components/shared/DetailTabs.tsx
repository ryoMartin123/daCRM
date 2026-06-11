"use client";

// Sub-tabs shown inside a single record — a specific customer, project, job,
// quote, invoice, lead, or agreement. Same flat pill as StatusTabs (the main
// list-page tabs); only the color differs — amber instead of indigo, so being
// "inside a record" reads distinctly. Styling lives in `.detail-tab` (globals.css).
export default function DetailTabs({ tabs, active, onChange, className = "" }: {
  tabs: readonly string[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-0.5 overflow-x-auto ${className}`}>
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          data-active={active === t}
          className="detail-tab px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0"
        >
          {t}
        </button>
      ))}
    </div>
  );
}
