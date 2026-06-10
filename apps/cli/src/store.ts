import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { CliEnv } from "./types";

export type CronletRecord = {
  id: string;
  client_ref: string;
  name: string;
  state: "active" | "paused" | "cancelled" | "archived";
  next_run: string | null;
  spec_hash: string;
  spec: Record<string, unknown>;
  required_capabilities: string[];
  missing_capabilities: string[];
  requires_approval: boolean;
  external_execution_approved: boolean;
  future_runs_enabled: boolean;
  approval_id: string | null;
};

export type ApprovalRecord = {
  id: string;
  cronlet_id: string;
  state: "pending" | "approved" | "rejected";
  reason: string | null;
};

export type RunRecord = { id: string; cronlet_id: string; retry_of: string | null; context_source: string; run_state: string; done_policy: unknown; evidence_ids: string[] };
export type AuditEvent = { id: string; resource: string; action: string; target_id: string };
export type EvidenceRecord = { id: string; run_id: string; payload: Record<string, unknown>; provenance: "self_reported" | "runtime_attested" | "verified" | "rejected"; verification_state: "unverified" | "verified" | "rejected"; counts_toward_done: boolean };
export type MygrationRecord = { id: string; source: string; candidates: Array<{ client_ref: string }> };
export type MemoryRecord = { id: string; content: string | null; client_ref: string | null; domain: string | null; type: string | null; revision: number; supersedes_revision: number | null; content_purged: boolean; detached_from_future_context: boolean };
export type StoreData = { cronlets: CronletRecord[]; approvals: ApprovalRecord[]; runs: RunRecord[]; evidence: EvidenceRecord[]; mygrations: MygrationRecord[]; memories: MemoryRecord[]; audit: AuditEvent[] };

export type Store = {
  data: StoreData;
  save(): void;
  nextId(prefix: "crn" | "apr" | "run" | "ev" | "mygr" | "mem" | "aud"): string;
};

export function openStore(env: CliEnv): Store {
  const path = storePath(env);
  const data = readData(path);
  return {
    data,
    save: () => writeData(path, data),
    nextId: prefix => `${prefix}_${String(nextNumber(data, prefix)).padStart(3, "0")}`,
  };
}

export function stableHash(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function projectFields<T extends Record<string, unknown>>(item: T, fields?: string): Record<string, unknown> {
  if (!fields) {
    return item;
  }
  return Object.fromEntries(fields.split(",").map(field => [field, item[field]]));
}

function storePath(env: CliEnv): string {
  const home = env.MYCRON_HOME ?? join(process.env.HOME ?? ".", ".mycron");
  return join(home, "store.json");
}

function readData(path: string): StoreData {
  if (!existsSync(path)) {
    return { cronlets: [], approvals: [], runs: [], evidence: [], mygrations: [], memories: [], audit: [] };
  }
  return normalizeData(JSON.parse(readFileSync(path, "utf8")) as Partial<StoreData>);
}

function normalizeData(data: Partial<StoreData>): StoreData {
  return { cronlets: data.cronlets ?? [], approvals: data.approvals ?? [], runs: data.runs ?? [], evidence: data.evidence ?? [], mygrations: data.mygrations ?? [], memories: data.memories ?? [], audit: data.audit ?? [] };
}

function writeData(path: string, data: StoreData): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function nextNumber(data: StoreData, prefix: string): number {
  const ids = [...data.cronlets, ...data.approvals, ...data.runs, ...data.evidence, ...data.mygrations, ...data.memories, ...data.audit].map(item => item.id);
  return ids.filter(id => id.startsWith(`${prefix}_`)).length + 1;
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, val]) => [key, sortValue(val)]));
  }
  return value;
}
