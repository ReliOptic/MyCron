import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli";

const json = (stdout: string) => JSON.parse(stdout);

function env() {
  return { MYCRON_REQUEST_ID: "req_mygr", MYCRON_ACCOUNT_ID: "acct_mygr", MYCRON_HOME: mkdtempSync(join(tmpdir(), "mycron-mygr-")) };
}

function writeJson(name: string, value: unknown) {
  const dir = mkdtempSync(join(tmpdir(), "mycron-mygr-file-"));
  const path = join(dir, name);
  writeFileSync(path, JSON.stringify(value));
  return path;
}

function createCronlet(e: Record<string, string>) {
  const file = writeJson("routine.mc", { schema: "mycron/v0", kind: "Cronlet", client_ref: "hermes:daily", name: "Daily", action_type: "memory.note", runtime_binding: { target: "hermes" } });
  return json(runCli(["cronlet", "create", "--file", file, "--confirm", "--json"], e).stdout).result.id;
}

describe("mygration", () => {
  it("imports as stage-only dry-run without creating live cronlets", () => {
    const result = runCli(["mygration", "import", "--from", "hermes", "--dry-run", "--json"], env());
    expect(result.exitCode).toBe(0);
    expect(json(result.stdout).result).toMatchObject({ outcome: "dry_run", live_cronlets_created: 0, future_runs_enabled: false, external_execution_approved: false });
  });

  it("stages, inspects, and diffs candidates", () => {
    const e = env();
    const staged = json(runCli(["mygration", "import", "--from", "hermes", "--confirm", "--json"], e).stdout).result;
    expect(staged).toMatchObject({ outcome: "staged", id: "mygr_001", live_cronlets_created: 0 });
    expect(json(runCli(["mygration", "inspect", "mygr_001", "--json"], e).stdout).result.mygration.id).toBe("mygr_001");
    expect(json(runCli(["mygration", "diff", "mygr_001", "--json"], e).stdout).result.diff).toHaveProperty("candidates");
  });

  it("rebinds runtime only while preserving identity and history", () => {
    const e = env();
    const crn = createCronlet(e);
    runCli(["mygration", "import", "--from", "hermes", "--confirm", "--json"], e);
    const dry = json(runCli(["mygration", "rebind", "mygr_001", "--target", "claude-code", "--dry-run", "--json"], e).stdout).result;
    expect(dry).toMatchObject({ outcome: "dry_run", client_ref_changed: false, history_preserved: true, future_runs_runtime_updated: true });
    const applied = json(runCli(["mygration", "rebind", "mygr_001", "--target", "claude-code", "--confirm", "--json"], e).stdout).result;
    expect(applied).toMatchObject({ outcome: "rebound", cronlet_id: crn, client_ref: "hermes:daily", client_ref_changed: false, history_preserved: true, future_runs_runtime_updated: true });
    expect(json(runCli(["cronlet", "get", crn, "--json"], e).stdout).result.cronlet.spec.runtime_binding.target).toBe("claude-code");
  });

  it("consumes .my MemoryMigration files", () => {
    const e = env();
    const file = writeJson("export.my", { schema: "mycron.memory/v0", kind: "MemoryMigration", source: "hermes", candidates: [{ client_ref: "hermes:daily" }] });
    const staged = json(runCli(["mygration", "import", "--file", file, "--confirm", "--json"], e).stdout).result;
    expect(staged).toMatchObject({ outcome: "staged", source: "hermes" });
  });

  it("does not expose mygration apply or flat import", () => {
    expect(runCli(["mygration", "apply", "mygr_001", "--json"], env()).exitCode).toBe(2);
    expect(runCli(["import", "--from", "hermes", "--json"], env()).exitCode).toBe(2);
  });
});
