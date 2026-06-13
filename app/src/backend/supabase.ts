import { createClient } from "@supabase/supabase-js";

export type SupabaseEnv = {
  readonly [key: string]: string | boolean | undefined;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
};

export type SupabaseConfig = {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
};

export function getSupabaseConfig(env: SupabaseEnv): SupabaseConfig | null {
  const url = typeof env.VITE_SUPABASE_URL === "string" ? env.VITE_SUPABASE_URL.trim() : "";
  const anonKey =
    typeof env.VITE_SUPABASE_ANON_KEY === "string"
      ? env.VITE_SUPABASE_ANON_KEY.trim()
      : "";
  return url && anonKey
    ? { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: anonKey }
    : null;
}

export function createSupabaseBrowserClient(env: SupabaseEnv) {
  const config = getSupabaseConfig(env);
  if (!config) return null;
  return createClient(
    config.VITE_SUPABASE_URL,
    config.VITE_SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    },
  );
}
