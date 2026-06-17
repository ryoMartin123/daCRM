"use client";

// REMOVED — the "Proposal From Template" workspace no longer exists.
// Salesbooks are now authored fully in Settings → Salesbook Library, and picking
// one creates the quote instantly and opens the quote overview. This route is
// kept only as a redirect so any stale links/bookmarks land on the quote page.

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RemovedProposalWorkspaceRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  useEffect(() => { router.replace(`/quotes/${id}`); }, [id, router]);
  return <div className="p-10 text-sm" style={{ color: "var(--text-muted)" }}>Redirecting…</div>;
}
