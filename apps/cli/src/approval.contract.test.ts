import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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

function auditEvents(e: { MYCRON_HOME: string }) {
  return JSON.parse(readFileSync(join(e.MYCRON_HOME, "store.json"), "utf8")).audit as Array<Record<string, unknown>>;
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

  it("requires --confirm and a user actor to approve, then flips execution approval", () => {
    const e = env();
    const id = json(runCli(["cronlet", "create", "--file", file("email.send"), "--confirm", "--json"], e).stdout).result.approval.id;
    const missing = runCli(["approval", "approve", id, "--actor", "user", "--json"], e);
    expect(missing.exitCode).toBe(2);
    expect(json(missing.stdout).error.code).toBe("MISSING_CONFIRM");
    const approved = json(runCli(["approval", "approve", id, "--actor", "user", "--confirm", "--json"], e).stdout).result;
    expect(approved).toMatchObject({ outcome: "approved", confirmed_write: true, external_execution_approved: true, actor: { kind: "user" } });
    expect(json(runCli(["approval", "get", id, "--json"], e).stdout).result.approval.state).toBe("approved");
  });

  it("denies host_agent self-approval and records the attempt in the audit log (ADR-0007)", () => {
    const e = env();
    const id = json(runCli(["cronlet", "create", "--file", file("email.send"), "--confirm", "--json"], e).stdout).result.approval.id;
    const denied = runCli(["approval", "approve", id, "--confirm", "--json"], e);
    expect(denied.exitCode).toBe(4);
    const envelope = json(denied.stdout);
    expect(envelope.error.code).toBe("APPROVAL_ACTOR_INVALID");
    expect(envelope.result).toMatchObject({ outcome: "denied", claimed_actor: { kind: "host_agent" }, confirmed_write: false, external_execution_approved: false });
    expect(envelope.next_command).toBe(`mycron approval approve ${id} --actor user --confirm --json`);
    expect(json(runCli(["approval", "get", id, "--json"], e).stdout).result.approval.state).toBe("pending");
    const attempt = auditEvents(e).find(event => event.resource === "approval" && event.action === "approve");
    expect(attempt).toMatchObject({ target_id: id, outcome: "denied", actor: { kind: "host_agent", id: null } });
    expect(Number.isNaN(Date.parse(String(attempt?.ts)))).toBe(false);
  });

  it("requires a user actor to reject (no --confirm) and records reason plus audit outcome", () => {
    const e = { ...env(), MYCRON_ACTOR_ID: "usr_owner" };
    const id = json(runCli(["cronlet", "create", "--file", file("email.send"), "--confirm", "--json"], e).stdout).result.approval.id;
    const denied = runCli(["approval", "reject", id, "--reason", "not now", "--json"], e);
    expect(denied.exitCode).toBe(4);
    expect(json(denied.stdout).error.code).toBe("APPROVAL_ACTOR_INVALID");
    const rejected = json(runCli(["approval", "reject", id, "--actor", "user", "--reason", "not now", "--json"], e).stdout).result;
    expect(rejected).toMatchObject({ outcome: "rejected", confirmed_write: true, external_execution_approved: false, reason: "not now", actor: { kind: "user", id: "usr_owner" } });
    const events = auditEvents(e).filter(event => event.resource === "approval" && event.action === "reject");
    expect(events).toMatchObject([
      { target_id: id, outcome: "denied", actor: { kind: "host_agent", id: "usr_owner" } },
      { target_id: id, outcome: "rejected", actor: { kind: "user", id: "usr_owner" } },
    ]);
  });

  it("rejects --actor values outside user/host_agent at parse time", () => {
    const result = runCli(["approval", "approve", "apr_001", "--actor", "system", "--confirm", "--json"], env());
    expect(result.exitCode).toBe(2);
    expect(json(result.stdout).error.code).toBe("USAGE_ERROR");
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
