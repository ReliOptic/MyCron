import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli";
import { openStore } from "./store";

const json = (stdout: string) => JSON.parse(stdout);

function env() {
  return { MYCRON_REQUEST_ID: "req_store", MYCRON_ACCOUNT_ID: "acct_store", MYCRON_HOME: mkdtempSync(join(tmpdir(), "mycron-store-")) };
}

function seedStore(home: string, data: Record<string, unknown>) {
  mkdirSync(home, { recursive: true });
  writeFileSync(join(home, "store.json"), `${JSON.stringify(data)}\n`);
}

function cronletFile(clientRef: string) {
  const dir = mkdtempSync(join(tmpdir(), "mycron-store-file-"));
  const path = join(dir, "routine.mc");
  writeFileSync(path, JSON.stringify({ schema: "mycron/v0", kind: "Cronlet", client_ref: clientRef, name: clientRef, action_type: "memory.note" }));
  return path;
}

describe("store id allocation", () => {
  it("never re-issues an existing id when the sequence has gaps", () => {
    const e = env();
    // A gapped collection is reachable today via a crashed write, manual edit
    // of the user-owned store.json, or any future record-removing feature.
    // Count-based allocation ("records with prefix + 1") re-issues crn_003.
    seedStore(e.MYCRON_HOME, {
      cronlets: [
        { id: "crn_001", client_ref: "agent:a", spec_hash: "h1", state: "active" },
        { id: "crn_003", client_ref: "agent:b", spec_hash: "h2", state: "active" },
      ],
      audit: [
        { id: "aud_001", resource: "cronlet", action: "create", target_id: "crn_001" },
        { id: "aud_007", resource: "cronlet", action: "create", target_id: "crn_003" },
      ],
    });
    const created = json(runCli(["cronlet", "create", "--file", cronletFile("agent:c"), "--confirm", "--json"], e).stdout);
    expect(created.result.outcome).toBe("created");
    const data = JSON.parse(readFileSync(join(e.MYCRON_HOME, "store.json"), "utf8"));
    const cronletIds = data.cronlets.map((item: { id: string }) => item.id);
    expect(new Set(cronletIds).size).toBe(cronletIds.length);
    expect(created.result.id).toBe("crn_004");
    const auditIds = data.audit.map((item: { id: string }) => item.id);
    expect(new Set(auditIds).size).toBe(auditIds.length);
    expect(auditIds[auditIds.length - 1]).toBe("aud_008");
  });

  it("allocates from the highest existing suffix, not the record count", () => {
    const e = env();
    seedStore(e.MYCRON_HOME, { runs: [{ id: "run_009", cronlet_id: "crn_001", retry_of: null, context_source: "current_cronlet_spec", run_state: "unverified", done_policy: null, evidence_ids: [] }] });
    const store = openStore(e);
    expect(store.nextId("run")).toBe("run_010");
    expect(store.nextId("crn")).toBe("crn_001");
  });
});
