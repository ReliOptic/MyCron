import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli";

const json = (stdout: string) => JSON.parse(stdout);

function env() {
  return {
    MYCRON_REQUEST_ID: "req_cronlet",
    MYCRON_ACCOUNT_ID: "acct_cronlet",
    MYCRON_HOME: mkdtempSync(join(tmpdir(), "mycron-store-")),
  };
}

function artifact(fields: Record<string, unknown>) {
  const dir = mkdtempSync(join(tmpdir(), "mycron-cronlet-"));
  const file = join(dir, "routine.mc");
  writeFileSync(file, JSON.stringify({
    schema: "mycron/v0",
    kind: "Cronlet",
    client_ref: "agent:daily-backup",
    name: "Daily backup",
    schedule: "0 9 * * *",
    timezone: "Asia/Seoul",
    action_type: "email.send",
    args: { to: "ops@example.com", subject: "Backup", body: "Done" },
    ...fields,
  }));
  return file;
}

describe("cronlet create/get/list", () => {
  it("dry-runs without writing", () => {
    const e = env();
    const result = runCli(["cronlet", "create", "--file", artifact({}), "--dry-run", "--json"], e);
    expect(result.exitCode).toBe(0);
    expect(json(result.stdout).result).toMatchObject({ outcome: "dry_run", changed: false });
    expect(json(runCli(["cronlet", "list", "--json"], e).stdout).result.items).toEqual([]);
  });

  it("creates, reads, and lists a cronlet", () => {
    const e = env();
    const created = json(runCli(["cronlet", "create", "--file", artifact({}), "--confirm", "--json"], e).stdout);
    expect(created.result).toMatchObject({
      outcome: "created",
      resource: "cronlet",
      id: "crn_001",
      client_ref: "agent:daily-backup",
      changed: true,
      confirmed_write: true,
      requires_approval: true,
      external_execution_approved: false,
      future_runs_enabled: false,
      required_capabilities: ["email:send"],
    });
    expect(created.result.approval.id).toBe("apr_001");
    const got = json(runCli(["cronlet", "get", "crn_001", "--json"], e).stdout);
    expect(got.result.cronlet).toMatchObject({ id: "crn_001", client_ref: "agent:daily-backup" });
    const list = json(runCli(["cronlet", "list", "--fields", "id,name,state,next_run", "--json"], e).stdout);
    expect(list.result.items).toEqual([{ id: "crn_001", name: "Daily backup", state: "active", next_run: null }]);
  });

  it("returns matched for the same client_ref and normalized spec", () => {
    const e = env();
    const file = artifact({});
    runCli(["cronlet", "create", "--file", file, "--confirm", "--json"], e);
    const matched = runCli(["cronlet", "create", "--file", file, "--confirm", "--json"], e);
    expect(matched.exitCode).toBe(0);
    expect(json(matched.stdout).result).toMatchObject({ outcome: "matched", changed: false, id: "crn_001" });
  });

  it("returns CLIENT_REF_CONFLICT for changed spec under same client_ref", () => {
    const e = env();
    runCli(["cronlet", "create", "--file", artifact({ name: "A" }), "--confirm", "--json"], e);
    const conflict = runCli(["cronlet", "create", "--file", artifact({ name: "B" }), "--confirm", "--json"], e);
    expect(conflict.exitCode).toBe(3);
    expect(json(conflict.stdout)).toMatchObject({ status: "error", error: { code: "CLIENT_REF_CONFLICT" } });
  });

  it("rejects Pack artifacts for cronlet create", () => {
    const e = env();
    const file = artifact({ kind: "Pack", cronlets: [] });
    const result = runCli(["cronlet", "create", "--file", file, "--confirm", "--json"], e);
    expect(result.exitCode).toBe(2);
    expect(json(result.stdout).error.code).toBe("WRONG_ARTIFACT_KIND");
  });

  it("supports limit/cursor pagination", () => {
    const e = env();
    runCli(["cronlet", "create", "--file", artifact({ client_ref: "agent:one", name: "One" }), "--confirm", "--json"], e);
    runCli(["cronlet", "create", "--file", artifact({ client_ref: "agent:two", name: "Two" }), "--confirm", "--json"], e);
    const page = json(runCli(["cronlet", "list", "--limit", "1", "--json"], e).stdout).result;
    expect(page.items).toHaveLength(1);
    expect(page.next_cursor).toBe("1");
    const next = json(runCli(["cronlet", "list", "--limit", "1", "--cursor", "1", "--json"], e).stdout).result;
    expect(next.items[0].id).toBe("crn_002");
  });
});
