import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli";

const json = (stdout: string) => JSON.parse(stdout);

function env() {
  return { MYCRON_REQUEST_ID: "req_lifecycle", MYCRON_ACCOUNT_ID: "acct_lifecycle", MYCRON_HOME: mkdtempSync(join(tmpdir(), "mycron-life-")) };
}

function file(fields: Record<string, unknown>) {
  const dir = mkdtempSync(join(tmpdir(), "mycron-life-file-"));
  const path = join(dir, "routine.mc");
  writeFileSync(path, JSON.stringify({ schema: "mycron/v0", kind: "Cronlet", client_ref: "agent:life", name: "Life", action_type: "email.send", ...fields }));
  return path;
}

function create(e: Record<string, string>) {
  return json(runCli(["cronlet", "create", "--file", file({}), "--confirm", "--json"], e).stdout).result.id;
}

describe("cronlet lifecycle", () => {
  it("pauses and resumes with visible state changes", () => {
    const e = env();
    const id = create(e);
    expect(json(runCli(["cronlet", "pause", id, "--json"], e).stdout).result).toMatchObject({ outcome: "paused", state: "paused" });
    expect(json(runCli(["cronlet", "resume", id, "--json"], e).stdout).result).toMatchObject({ outcome: "resumed", state: "active" });
    expect(json(runCli(["cronlet", "get", id, "--json"], e).stdout).result.cronlet.state).toBe("active");
  });

  it("requires --confirm for cancel and makes cancel terminal", () => {
    const e = env();
    const id = create(e);
    const missing = runCli(["cronlet", "cancel", id, "--json"], e);
    expect(missing.exitCode).toBe(2);
    expect(json(missing.stdout).error.code).toBe("MISSING_CONFIRM");
    const cancelled = json(runCli(["cronlet", "cancel", id, "--confirm", "--json"], e).stdout).result;
    expect(cancelled).toMatchObject({ outcome: "cancelled", future_runs_disabled: true, audit_retained: true });
    const resume = runCli(["cronlet", "resume", id, "--json"], e);
    expect(resume.exitCode).toBe(3);
  });

  it("archives out of default list while remaining gettable", () => {
    const e = env();
    const id = create(e);
    expect(json(runCli(["cronlet", "archive", id, "--confirm", "--json"], e).stdout).result).toMatchObject({ outcome: "archived", audit_retained: true });
    expect(json(runCli(["cronlet", "list", "--json"], e).stdout).result.items).toEqual([]);
    expect(json(runCli(["cronlet", "get", id, "--json"], e).stdout).result.cronlet.state).toBe("archived");
  });

  it("updates with dry-run diff before confirmed apply", () => {
    const e = env();
    const id = create(e);
    const patch = file({ name: "Life updated" });
    const dry = json(runCli(["cronlet", "update", id, "--file", patch, "--dry-run", "--json"], e).stdout).result;
    expect(dry).toMatchObject({ outcome: "dry_run", changed: false });
    expect(json(runCli(["cronlet", "get", id, "--json"], e).stdout).result.cronlet.name).toBe("Life");
    const applied = json(runCli(["cronlet", "update", id, "--file", patch, "--confirm", "--json"], e).stdout).result;
    expect(applied).toMatchObject({ outcome: "updated", changed: true });
    expect(json(runCli(["cronlet", "get", id, "--json"], e).stdout).result.cronlet.name).toBe("Life updated");
  });

  it("run-now creates a gated run distinct from retry", () => {
    const e = env();
    const id = create(e);
    const run = json(runCli(["cronlet", "run-now", id, "--json"], e).stdout).result;
    expect(run).toMatchObject({ outcome: "created", run: { id: "run_001", retry_of: null, context_source: "current_cronlet_spec" }, external_execution_approved: false });
  });

  it("has no cronlet delete command", () => {
    const result = runCli(["cronlet", "delete", "crn_001", "--json"], env());
    expect(result.exitCode).toBe(2);
    expect(json(result.stdout).error.code).toBe("USAGE_ERROR");
  });
});
