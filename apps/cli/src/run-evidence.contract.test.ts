import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli";

const json = (stdout: string) => JSON.parse(stdout);

function env() {
  return { MYCRON_REQUEST_ID: "req_run", MYCRON_ACCOUNT_ID: "acct_run", MYCRON_HOME: mkdtempSync(join(tmpdir(), "mycron-run-")) };
}

function writeJson(name: string, value: unknown) {
  const dir = mkdtempSync(join(tmpdir(), "mycron-run-file-"));
  const path = join(dir, name);
  writeFileSync(path, JSON.stringify(value));
  return path;
}

function createRun(e: Record<string, string>) {
  const mc = writeJson("routine.mc", { schema: "mycron/v0", kind: "Cronlet", client_ref: "agent:run", name: "Run", action_type: "email.send", done_policy: { require_runtime_attested: true } });
  const crn = json(runCli(["cronlet", "create", "--file", mc, "--confirm", "--json"], e).stdout).result.id;
  return json(runCli(["cronlet", "run-now", crn, "--json"], e).stdout).result.run.id;
}

describe("run and nested evidence", () => {
  it("lists and gets runs for a cronlet", () => {
    const e = env();
    const runId = createRun(e);
    const run = json(runCli(["run", "get", runId, "--json"], e).stdout).result.run;
    expect(run).toMatchObject({ id: runId, context_source: "current_cronlet_spec" });
    const runs = json(runCli(["run", "list", "--cronlet", run.cronlet_id, "--json"], e).stdout).result.items;
    expect(runs).toHaveLength(1);
  });

  it("adds self_reported evidence without changing run state", () => {
    const e = env();
    const runId = createRun(e);
    const evFile = writeJson("evidence.json", { summary: "I checked it", provenance: "verified", verification_state: "verified" });
    const dry = json(runCli(["run", "evidence", "add", "--run", runId, "--file", evFile, "--dry-run", "--json"], e).stdout).result;
    expect(dry).toMatchObject({ outcome: "dry_run", run_state_changed: false });
    expect(json(runCli(["run", "evidence", "list", "--run", runId, "--json"], e).stdout).result.items).toEqual([]);
    const added = json(runCli(["run", "evidence", "add", "--run", runId, "--file", evFile, "--json"], e).stdout).result;
    expect(added).toMatchObject({ outcome: "created", evidence: { id: "ev_001", provenance: "self_reported", verification_state: "unverified" }, counts_toward_done: false, run_state_changed: false });
  });

  it("verifies deterministically and ignores self_reported evidence", () => {
    const e = env();
    const runId = createRun(e);
    const evFile = writeJson("evidence.json", { summary: "not proof" });
    runCli(["run", "evidence", "add", "--run", runId, "--file", evFile, "--json"], e);
    const verified = json(runCli(["run", "verify", runId, "--json"], e).stdout).result;
    expect(verified).toMatchObject({ outcome: "verified", previous_run_state: "unverified", run_state: "unverified", run_state_changed: false, override: false, manual_marking: false, evaluated_counts: { self_reported_ignored: 1 } });
  });

  it("gets evidence and keeps evidence nested under run", () => {
    const e = env();
    const runId = createRun(e);
    const evFile = writeJson("evidence.json", { summary: "nested" });
    const evId = json(runCli(["run", "evidence", "add", "--run", runId, "--file", evFile, "--json"], e).stdout).result.evidence.id;
    expect(json(runCli(["run", "evidence", "get", evId, "--run", runId, "--json"], e).stdout).result.evidence.id).toBe(evId);
    expect(runCli(["evidence", "list", "--json"], e).exitCode).toBe(2);
  });

  it("retries and escalates with reason", () => {
    const e = env();
    const runId = createRun(e);
    const retry = json(runCli(["run", "retry", runId, "--json"], e).stdout).result.run;
    expect(retry).toMatchObject({ id: "run_002", retry_of: runId, context_source: "original_run" });
    const escalated = json(runCli(["run", "escalate", runId, "--reason", "on-call", "--json"], e).stdout).result;
    expect(escalated).toMatchObject({ outcome: "escalated", reason: "on-call" });
  });
});
