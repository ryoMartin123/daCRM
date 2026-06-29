// ─── Live data sync (mock-store edition) ──────────────────
// Desktop CRM and the mobile PWA share the same localStorage-backed stores. This
// lets a change in one surface show up in another WITHOUT a manual refresh:
//   • cross-tab / iframe  → the browser's native `storage` event (automatic)
//   • same document       → a custom `routiqa:data` event (call notifyDataChanged)
// Stores also invalidate their in-memory cache on `storage` so reads return the
// fresh data. Swap this for Supabase Realtime when the backend lands.

export const DATA_EVENT = "routiqa:data";

// Call after any write so same-document listeners (e.g. the mobile preview)
// refresh immediately. Cross-tab refresh happens automatically via `storage`.
export function notifyDataChanged(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(DATA_EVENT));
}

// Helper for stores: invalidate an in-memory cache when another tab writes one of
// the given localStorage keys. `reset` should null the module's cache(s).
export function invalidateOnStorage(keys: string[], reset: () => void): void {
  if (typeof window === "undefined") return;
  window.addEventListener("storage", (e) => {
    if (e.key === null || keys.includes(e.key)) reset();
  });
}
