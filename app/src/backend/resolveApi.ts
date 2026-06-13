import type { MyCronApi } from "@contract/data/api";
import { EmptyApi } from "@contract/data/provider";
import { SeededDemoApi } from "../demo/seededDemoApi";
import { createSupabaseBrowserClient, getSupabaseConfig, type SupabaseEnv } from "./supabase";
import { SupabaseApi, type SupabaseSession } from "./supabaseApi";

export type ResolveApiInput = {
  demoMode: boolean;
  env: SupabaseEnv;
  session: SupabaseSession | null;
  client?: unknown;
};

export function resolveApi(input: ResolveApiInput): MyCronApi {
  if (input.demoMode) return new SeededDemoApi();
  if (!input.session || !getSupabaseConfig(input.env)) return EmptyApi;
  const client = input.client ?? createSupabaseBrowserClient(input.env);
  return client ? new SupabaseApi(client, input.session) : EmptyApi;
}
