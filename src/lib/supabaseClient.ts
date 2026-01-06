import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (cached !== undefined) return cached;

  const e2eDisableSupabase =
    String(import.meta.env.VITE_E2E_DISABLE_SUPABASE ?? "").toLowerCase() === "true" ||
    String(import.meta.env.VITE_E2E_DISABLE_SUPABASE ?? "") === "1";
  if (e2eDisableSupabase) {
    cached = null;
    return cached;
  }

  let url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (url && /^[a-z0-9]{20}$/.test(url.trim())) {
    url = `https://${url.trim()}.supabase.co`;
  }

  if (!url || !anonKey) {
    console.warn('[SupabaseClient] Missing credentials', { hasUrl: !!url, hasKey: !!anonKey });
    cached = null;
    return cached;
  }

  // Clean the URL
  url = url.trim().replace(/\\n/g, '').replace(/\n/g, '');

  cached = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return cached;
}
