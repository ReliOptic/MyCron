import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli";

const json = (stdout: string) => JSON.parse(stdout);

function env() {
  return { MYCRON_REQUEST_ID: "req_memory", MYCRON_ACCOUNT_ID: "acct_memory", MYCRON_HOME: mkdtempSync(join(tmpdir(), "mycron-memory-")) };
}

function note(fields: Record<string, unknown>) {
  const dir = mkdtempSync(join(tmpdir(), "mycron-memory-file-"));
  const file = join(dir, "note.my");
  writeFileSync(file, JSON.stringify({ schema: "mycron.memory/v0", kind: "MemoryItem", content: "Prefer concise copy.", client_ref: "agent:copy", domain: "product", type: "preference", ...fields }));
  return file;
}

describe("memory MVP", () => {
  it("adds, lists, and gets memory entries", () => {
    const e = env();
    const added = json(runCli(["memory", "add", "--file", note({}), "--json"], e).stdout).result;
    expect(added).toMatchObject({ outcome: "created", id: "mem_001", client_ref: "agent:copy" });
    expect(json(runCli(["memory", "list", "--json"], e).stdout).result.items).toHaveLength(1);
    expect(json(runCli(["memory", "get", "mem_001", "--json"], e).stdout).result.memory.content).toBe("Prefer concise copy.");
  });

  it("supports input-json and list filters", () => {
    const e = env();
    runCli(["memory", "add", "--input-json", JSON.stringify({ schema: "mycron.memory/v0", kind: "MemoryItem", content: "Ops note", domain: "ops", type: "note" }), "--json"], e);
    runCli(["memory", "add", "--file", note({}), "--json"], e);
    const filtered = json(runCli(["memory", "list", "--domain", "ops", "--type", "note", "--json"], e).stdout).result.items;
    expect(filtered).toHaveLength(1);
    expect(filtered[0].content).toBe("Ops note");
  });

  it("updates as an audited revision", () => {
    const e = env();
    runCli(["memory", "add", "--file", note({}), "--json"], e);
    const updated = json(runCli(["memory", "update", "mem_001", "--file", note({ content: "Updated" }), "--json"], e).stdout).result;
    expect(updated).toMatchObject({ outcome: "updated", revision: 2, supersedes_revision: 1 });
    expect(json(runCli(["memory", "get", "mem_001", "--json"], e).stdout).result.memory.content).toBe("Updated");
  });

  it("forgets with tombstone and no hard delete", () => {
    const e = env();
    runCli(["memory", "add", "--file", note({}), "--json"], e);
    const missing = runCli(["memory", "forget", "mem_001", "--json"], e);
    expect(missing.exitCode).toBe(2);
    const forgotten = json(runCli(["memory", "forget", "mem_001", "--confirm", "--json"], e).stdout).result;
    expect(forgotten).toMatchObject({ outcome: "forgotten", content_purged: true, tombstone_retained: true, detached_from_future_context: true, affected_cronlets: [] });
    expect(json(runCli(["memory", "get", "mem_001", "--json"], e).stdout).result.memory.content).toBeNull();
  });

  it("rejects MemoryMigration and memory import/delete", () => {
    const e = env();
    const migration = note({ kind: "MemoryMigration", source: "hermes", candidates: [] });
    const rejected = runCli(["memory", "add", "--file", migration, "--json"], e);
    expect(rejected.exitCode).toBe(2);
    expect(json(rejected.stdout)).toMatchObject({ error: { code: "WRONG_ARTIFACT_KIND" }, next_command: "mycron mygration inspect <migration> --json" });
    expect(runCli(["memory", "import", "--json"], e).exitCode).toBe(2);
    expect(runCli(["memory", "delete", "mem_001", "--json"], e).exitCode).toBe(2);
  });
});
