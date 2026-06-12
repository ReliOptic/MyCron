import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { exitCodeForError } from "../../../packages/schema/src";
import { runCli } from "./cli";

const baseEnv = {
  MYCRON_REQUEST_ID: "req_test_001",
  MYCRON_ACCOUNT_ID: "acct_test",
};

function routineFile(): string {
  const dir = mkdtempSync(join(tmpdir(), "mycron-cli-contract-"));
  const file = join(dir, "routine.mc");
  writeFileSync(file, JSON.stringify({
    schema: "mycron/v0",
    kind: "Cronlet",
    client_ref: "agent:contract",
    name: "Contract check",
    action_type: "email.send",
    args: { to: "ops@example.com", subject: "Check", body: "Done" },
  }));
  return file;
}

describe("MyCron CLI contract v0", () => {
  it("emits the standard status JSON envelope", () => {
    const result = runCli(["status", "--json"], baseEnv);
    expect(result.exitCode).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout)).toEqual({
      meta: {
        api_version: "mycron/v0",
        cli_version: "0.0.0",
        command: "status",
        request_id: "req_test_001",
        account_id: "acct_test",
      },
      status: "ok",
      result: {
        outcome: "matched",
        resource: "status",
        authenticated: false,
        token_present: false,
        account_scope: "acct_test",
      },
      next_command: "mycron config doctor --json",
    });
  });

  it("uses MYCRON_OUTPUT=json as the default machine envelope switch", () => {
    const result = runCli(["config", "doctor"], {
      ...baseEnv,
      MYCRON_OUTPUT: "json",
      MYCRON_TOKEN: "token-value",
    });
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout).result).toMatchObject({
      outcome: "matched",
      resource: "config",
      authenticated: true,
      token_present: true,
    });
  });

  it("keeps --json output-only and rejects payload forms", () => {
    for (const args of [
      ["cronlet", "create", "--json={}"],
      ["cronlet", "create", "--json", "{}"],
    ]) {
      const result = runCli(args, baseEnv);
      expect(result.exitCode).toBe(2);
      expect(JSON.parse(result.stdout)).toMatchObject({
        status: "error",
        error: { code: "USAGE_ERROR" },
        next_command: "mycron cronlet create --file routine.mc --dry-run --json",
      });
    }
  });

  it("maps approval approve without --confirm to MISSING_CONFIRM exit 2", () => {
    const result = runCli(["approval", "approve", "apr_001", "--json"], baseEnv);
    const envelope = JSON.parse(result.stdout);
    expect(result.exitCode).toBe(2);
    expect(envelope).toMatchObject({
      status: "error",
      error: { code: "MISSING_CONFIRM" },
      next_command: "mycron approval approve apr_001 --confirm --json",
    });
  });

  it("separates confirmed_write from external_execution_approved in mutations", () => {
    const result = runCli(["cronlet", "create", "--file", routineFile(), "--confirm", "--json"], {
      ...baseEnv,
      MYCRON_HOME: mkdtempSync(join(tmpdir(), "mycron-cli-contract-home-")),
    });
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: "ok",
      result: {
        outcome: "created",
        resource: "cronlet",
        confirmed_write: true,
        external_execution_approved: false,
      },
    });
  });

  it("returns dry-run as a successful outcome with exit 0", () => {
    const result = runCli(["cronlet", "create", "--file", routineFile(), "--dry-run", "--json"], baseEnv);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      status: "ok",
      result: {
        outcome: "dry_run",
        resource: "cronlet",
        confirmed_write: false,
        external_execution_approved: false,
      },
    });
  });

  it("keeps nested resources in the canonical envelope command", () => {
    const result = runCli(["run", "evidence", "list", "--run", "run_001", "--json"], baseEnv);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      meta: { command: "run evidence list" },
      status: "ok",
      result: { resource: "evidence" },
    });
  });

  it("maps contract error classes to exit codes 1 through 5", () => {
    expect(exitCodeForError("NOT_IMPLEMENTED")).toBe(1);
    expect(exitCodeForError("SCHEMA_VALIDATION_FAILED")).toBe(2);
    expect(exitCodeForError("MISSING_CONFIRM")).toBe(2);
    expect(exitCodeForError("CLIENT_REF_CONFLICT")).toBe(3);
    expect(exitCodeForError("UNAUTHORIZED")).toBe(4);
    expect(exitCodeForError("APPROVAL_ACTOR_INVALID")).toBe(4);
    expect(exitCodeForError("NOT_FOUND")).toBe(5);
  });

  it("renders help as human, non-contract text", () => {
    const result = runCli(["cronlet", "--help"], baseEnv);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("mycron cronlet <verb>");
    expect(() => JSON.parse(result.stdout)).toThrow();
  });
});
