import { describe, expect, it } from "vitest";
import { NotImplementedError } from "@contract/data/provider";
import { SupabaseApi } from "./supabaseApi";
import { mapCronletRow } from "./supabaseCronletMapper";

const row = {
  id: "crn_001",
  account_id: "acct_123",
  client_ref: "hermes:daily-telegram-summary",
  name: "Daily Telegram Summary",
  state: "active",
  action_type: "email.send",
  schedule: "0 22 * * *",
  timezone: "Asia/Seoul",
  requires_approval: true,
  external_execution_approved: false,
  next_run: "2026-06-12T13:00:00.000Z",
  spec: {
    intent: "Send a daily conversation summary to Telegram.",
    delivery: { target: "telegram" },
  },
  created_at: "2026-06-12T10:00:00.000Z",
};

describe("mapCronletRow", () => {
  it("maps account-scoped rows into UI Cronlets without pretending proof exists", () => {
    const cronlet = mapCronletRow(row);

    expect(cronlet).toMatchObject({
      id: "crn_001",
      name: "Daily Telegram Summary",
      action_type: "external",
      intent: "Send a daily conversation summary to Telegram.",
      cron: "0 22 * * *",
      timezone: "Asia/Seoul",
      state: "unverified",
      binding: { agent: "hermes", runtime: "Host Agent" },
      latestRun: { state: "unverified", evidence: [] },
    });
    expect(cronlet.nextRunLabel).toContain("2026");
    expect(cronlet.approvalEvent?.outcome).toBe("pending");
  });
});

describe("SupabaseApi", () => {
  it("keeps writes explicitly unimplemented", async () => {
    const api = new SupabaseApi({} as never, { user: { id: "acct_123" } } as never);

    await expect(api.createCronlet({} as never)).rejects.toBeInstanceOf(NotImplementedError);
    await expect(api.setAlertPreference("failure", true)).rejects.toBeInstanceOf(NotImplementedError);
  });
});
