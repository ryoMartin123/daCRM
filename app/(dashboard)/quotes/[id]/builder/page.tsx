"use client";

// DEPRECATED — old all-in-one quote builder.
// The user-facing quote creation flow no longer uses this builder. Quotes are
// now created through the 3-path chooser (Quick / Proposal from Salesbook /
// Custom Proposal) and edited in:
//   • Quick      → /quotes/[id]/quick
//   • Salesbook  → built instantly, opens the quote overview (/quotes/[id])
//   • Custom     → /quotes/[id]/pricing → /quotes/[id]/custom
//
// This route is kept only as a redirect so any stale links/bookmarks land on the
// correct new editor. DO NOT route user-facing quote creation here, and do not
// re-introduce the old builder UI.

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getQuote } from "@/lib/quotes/data";

export default function DeprecatedQuoteBuilderRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  useEffect(() => {
    const q = getQuote(id);
    // Template quotes no longer have a dedicated workspace — they open on the
    // quote overview (built instantly from the salesbook); quick/custom keep theirs.
    const dest = q?.quoteMode === "quick" ? "/quick" : q?.quoteMode === "custom" ? "/custom" : "";
    router.replace(`/quotes/${id}${dest}`);
  }, [id, router]);
  return <div className="p-10 text-sm" style={{ color: "var(--text-muted)" }}>Redirecting…</div>;
}
