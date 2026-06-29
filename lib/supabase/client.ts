// ─── Supabase browser client ──────────────────────────────
// A single shared browser client, created lazily on first use. Returns null on
// the server and when the public env vars are missing, so callers can no-op
// safely (the app still renders; data layers just stay empty until hydrated).
//
// Uses only the PUBLIC anon key — never the service-role key (that stays
// server-side per the project security rules). No auth/SSR wiring yet; the
// app's current user is still hardcoded. Add @supabase/ssr when real auth lands.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (_client !== undefined) return _client;

  if (typeof window === "undefined") { _client = null; return _client; }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY not set — running in localStorage-only mode.");
    _client = null;
    return _client;
  }

  _client = createClient(url, anonKey, {
    auth: { persistSession: false },
  });
  return _client;
}
