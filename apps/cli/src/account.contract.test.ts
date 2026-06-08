import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli";

const json = (stdout: string) => JSON.parse(stdout);

function env(token = "token") {
  return { MYCRON_REQUEST_ID: "req_account", MYCRON_ACCOUNT_ID: "acct_account", MYCRON_HOME: mkdtempSync(join(tmpdir(), "mycron-account-")), MYCRON_TOKEN: token };
}

describe("account scope", () => {
  it("requires MYCRON_TOKEN for account reads", () => {
    const result = runCli(["account", "get", "--json"], { MYCRON_REQUEST_ID: "req_account" });
    expect(result.exitCode).toBe(4);
    expect(json(result.stdout).error.code).toBe("UNAUTHORIZED");
  });

  it("returns token-scoped account identity without workspace", () => {
    const result = runCli(["account", "get", "--json"], env());
    expect(result.exitCode).toBe(0);
    expect(json(result.stdout)).toMatchObject({
      meta: { account_id: "acct_account" },
      result: { outcome: "matched", account: { id: "acct_account", name: null, plan: null } },
    });
    expect(json(result.stdout).result.account).not.toHaveProperty("workspace");
  });

  it("returns settings and budget shapes", () => {
    expect(json(runCli(["account", "settings", "get", "--json"], env()).stdout).result.settings).toEqual({});
    expect(json(runCli(["account", "budget", "get", "--json"], env()).stdout).result.budget).toEqual({ used: null, limit: null, cycle: null });
  });

  it("persists alert toggles", () => {
    const e = env();
    expect(json(runCli(["account", "alerts", "list", "--json"], e).stdout).result.alerts).toEqual({});
    const set = json(runCli(["account", "alerts", "set", "failure", "--enabled", "true", "--json"], e).stdout).result;
    expect(set).toMatchObject({ outcome: "updated", key: "failure", enabled: true });
    expect(json(runCli(["account", "alerts", "list", "--json"], e).stdout).result.alerts).toEqual({ failure: true });
  });

  it("does not introduce workspace", () => {
    expect(runCli(["account", "workspace", "get", "--json"], env()).exitCode).toBe(2);
  });
});
