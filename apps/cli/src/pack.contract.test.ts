import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli";

const baseEnv = { MYCRON_REQUEST_ID: "req_pack", MYCRON_ACCOUNT_ID: "acct_pack" };
const json = (stdout: string) => JSON.parse(stdout);

function tempFile(name: string, content: string): string {
  const dir = mkdtempSync(join(tmpdir(), "mycron-pack-"));
  const file = join(dir, name);
  writeFileSync(file, content);
  return file;
}

const cronlet = JSON.stringify({
  schema: "mycron/v0",
  kind: "Cronlet",
  client_ref: "agent:daily-backup",
  name: "Daily backup",
  schedule: "0 9 * * *",
  timezone: "Asia/Seoul",
  action_type: "email.send",
  args: { to: "ops@example.com", subject: "Backup", body: "Done" },
});

describe("pack validate and preview", () => {
  it("validates a Cronlet .mc file without persisting", () => {
    const file = tempFile("routine.mc", cronlet);
    const result = runCli(["pack", "validate", "--file", file, "--json"], baseEnv);
    expect(result.exitCode).toBe(0);
    expect(json(result.stdout).result).toMatchObject({
      outcome: "validated",
      resource: "pack",
      valid: true,
      errors: [],
      artifact: { kind: "Cronlet", client_ref: "agent:daily-backup" },
    });
  });

  it("previews a normalized Cronlet .mc file with no id", () => {
    const file = tempFile("routine.mc", cronlet);
    const result = runCli(["pack", "preview", "--file", file, "--json"], baseEnv);
    expect(result.exitCode).toBe(0);
    const preview = json(result.stdout).result.preview;
    expect(preview).toMatchObject({
      kind: "Cronlet",
      client_ref: "agent:daily-backup",
      action_type: "email.send",
    });
    expect(preview).not.toHaveProperty("id");
  });

  it("fails validation when client_ref is missing", () => {
    const file = tempFile("missing.mc", JSON.stringify({ schema: "mycron/v0", kind: "Cronlet", name: "No ref" }));
    const result = runCli(["pack", "validate", "--file", file, "--json"], baseEnv);
    expect(result.exitCode).toBe(0);
    expect(json(result.stdout).result).toMatchObject({
      valid: false,
      errors: [{ code: "MISSING_CLIENT_REF", location: "client_ref" }],
    });
  });

  it("returns schema validation error for malformed input", () => {
    const file = tempFile("bad.mc", "schema: [unterminated");
    const result = runCli(["pack", "preview", "--file", file, "--json"], baseEnv);
    expect(result.exitCode).toBe(2);
    expect(json(result.stdout)).toMatchObject({
      status: "error",
      error: { code: "SCHEMA_VALIDATION_FAILED" },
    });
  });

  it("validates .my MemoryItem schema stubs", () => {
    const file = tempFile("note.my", JSON.stringify({
      schema: "mycron.memory/v0",
      kind: "MemoryItem",
      content: "Prefer short copy.",
      client_ref: "agent:daily-backup",
    }));
    const result = runCli(["pack", "validate", "--file", file, "--json"], baseEnv);
    expect(result.exitCode).toBe(0);
    expect(json(result.stdout).result).toMatchObject({
      valid: true,
      artifact: { kind: "MemoryItem" },
    });
  });

  it("keeps pack install out of scope", () => {
    const result = runCli(["pack", "install", "--file", "routine.mc", "--json"], baseEnv);
    expect(result.exitCode).toBe(2);
    expect(json(result.stdout).error.code).toBe("USAGE_ERROR");
  });
});
