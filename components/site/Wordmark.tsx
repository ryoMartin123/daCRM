// ─── Routiqa wordmark ─────────────────────────────────────
// The brand mark (the indigo rounded-square "R" from public/icon.svg, inlined so
// it scales crisply) + the "Routiqa" wordmark. Used in the site header + footer.

export default function Wordmark({ className = "", markSize = 30 }: { className?: string; markSize?: number }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width={markSize} height={markSize} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 rounded-[28%]" aria-hidden>
        <rect width="512" height="512" rx="112" fill="#4f46e5" />
        <path d="M176 368V144h84c46 0 78 28 78 70 0 30-16 53-43 63l52 91h-58l-45-82h-21v82h-47Zm47-122h34c21 0 34-12 34-31s-13-31-34-31h-34v62Z" fill="#ffffff" />
      </svg>
      <span className="text-[19px] font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>Routiqa</span>
    </span>
  );
}
