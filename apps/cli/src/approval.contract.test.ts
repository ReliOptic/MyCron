import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli";

const json = (stdout: string) => JSON.parse(stdout);

function env() {
  return { MYCRON_REQUEST_ID: "req_approval", MYCRON_ACCOUNT_ID: "acct_approval", MYCRON_HOME: mkdtempSync(join(tmpdir(), "mycron-approval-")) };
}

function file(actionType: string) {
  const dir = mkdtempSync(join(tmpdir(), "mycron-approval-file-"));
  const path = join(dir, "routine.mc");
  writeFileSync(path, JSON.stringify({ schema: "mycron/v0", kind: "Cronlet", client_ref: `agent:${actionType.replace(".", "-")}`, name: actionType, action_type: actionType }));
  return path;
}

describe("approval gate", () => {
  it("lists and gets pending approvals from external cronlet create", () => {
    const e = env();
    const created = json(runCli(["cronlet", "create", "--file", file("email.send"), "--confirm", "--json"], e).stdout);
    expect(created.result).toMatchObject({ confirmed_write: true, external_execution_approved: false });
    const id = created.result.approval.id;
    expect(json(runCli(["approval", "list", "--json"], e).stdout).result.items).toMatchObject([{ id, state: "pending" }]);
    expect(json(runCli(["approval", "get", id, "--json"], e).stdout).result.approval).toMatchObject({ id, state: "pending" });
  });

  it("requires --confirm to approve and then flips execution approval", () => {
    const e = env();
    const id = json(runCli(["cronlet", "create", "--file", file("email.send"), "--confirm", "--json"], e).stdout).result.approval.id;
    const missing = runCli(["approval", "approve", id, "--json"], e);
    expect(missing.exitCode).toBe(2);
    expect(json(missing.stdout).error.code).toBe("MISSING_CONFIRM");
    const approved = json(runCli(["approval", "approve", id, "--confirm", "--json"], e).stdout).result;
    expect(approved).toMatchObject({ outcome: "approved", confirmed_write: true, external_execution_approved: true });
    expect(json(runCli(["approval", "get", id, "--json"], e).stdout).result.approval.state).toBe("approved");
  });

  it("rejects without --confirm and records reason", () => {
    const e = env();
    const id = json(runCli(["cronlet", "create", "--file", file("email.send"), "--confirm", "--json"], e).stdout).result.approval.id;
    const rejected = json(runCli(["approval", "reject", id, "--reason", "not now", "--json"], e).stdout).result;
    expect(rejected).toMatchObject({ outcome: "rejected", confirmed_write: true, external_execution_approved: false, reason: "not now" });
  });

  it("does not create approvals for internal actions", () => {
    const e = env();
    const created = json(runCli(["cronlet", "create", "--file", file("memory.note"), "--confirm", "--json"], e).stdout);
    expect(created.result).toMatchObject({ requires_approval: false, approval: null, external_execution_approved: false });
    expect(json(runCli(["approval", "list", "--json"], e).stdout).result.items).toEqual([]);
  });

  it("has no approval create/delete commands", () => {
    expect(runCli(["approval", "create", "--json"], env()).exitCode).toBe(2);
    expect(runCli(["approval", "delete", "apr_001", "--json"], env()).exitCode).toBe(2);
  });
});
