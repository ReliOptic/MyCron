import { describe, expect, it } from "vitest";
import { EmptyApi } from "@contract/data/provider";
import { SeededDemoApi } from "../demo/seededDemoApi";
import { resolveApi } from "./resolveApi";
import { SupabaseApi } from "./supabaseApi";

const env = {
  VITE_SUPABASE_URL: "https://example.supabase.co",
  VITE_SUPABASE_ANON_KEY: "sb_publishable_test",
};
const session = { user: { id: "acct_123" } };

describe("resolveApi", () => {
  it("keeps demo mode first", () => {
    expect(resolveApi({ demoMode: true, env, session })).toBeInstanceOf(SeededDemoApi);
  });

  it("uses EmptyApi without Supabase env or without a session", () => {
    expect(resolveApi({ demoMode: false, env: {}, session })).toBe(EmptyApi);
    expect(resolveApi({ demoMode: false, env, session: null })).toBe(EmptyApi);
  });

  it("uses SupabaseApi only when env and session are present", () => {
    expect(resolveApi({ demoMode: false, env, session })).toBeInstanceOf(SupabaseApi);
  });
});
