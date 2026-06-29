// ─── Route compute client ─────────────────────────────────
// Thin wrapper over the backend endpoint. The frontend never calls Google
// directly (no key in the browser) — it goes through /api/routes/compute.

import type { ComputeRouteRequest, RouteData } from "./types";

export async function computeRoute(req: ComputeRouteRequest): Promise<RouteData> {
  const res = await fetch("/api/routes/compute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Route compute failed (${res.status})`);
  return res.json();
}
