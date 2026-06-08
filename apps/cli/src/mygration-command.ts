import { exitCodes } from "../../../packages/schema/src";
import { previewArtifact } from "./artifact";
import { errorEnvelope, okEnvelope } from "./envelopes";
import { openStore, type MygrationRecord, type Store } from "./store";
import type { CliEnv, CliResult, ParsedCommand } from "./types";

export function mygrationCommand(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  if (parsed.verb === "import") return importMygration(parsed, env, command);
  if (parsed.verb === "inspect") return inspectMygration(parsed, env, command);
  if (parsed.verb === "diff") return diffMygration(parsed, env, command);
  if (parsed.verb === "rebind") return rebindMygration(parsed, env, command);
  return jsonError(command, env, "USAGE_ERROR", "No mygration apply; activation uses cronlet create.", "mycron mygration import --from hermes --dry-run --json", exitCodes.usage);
}

function importMygration(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const candidate = migrationCandidate(parsed);
  if (candidate instanceof Error) {
    return jsonError(command, env, "SCHEMA_VALIDATION_FAILED", candidate.message, "mycron mygration import --from hermes --dry-run --json", exitCodes.usage);
  }
  if (parsed.flags["dry-run"] === true) {
    return jsonOk(okEnvelope(command, env, importResult("dry_run", candidate, null), null));
  }
  if (parsed.flags.confirm !== true) {
    return jsonError(command, env, "MISSING_CONFIRM", "mygration import requires --dry-run or --confirm.", "mycron mygration import --from hermes --dry-run --json", exitCodes.usage);
  }
  const store = openStore(env);
  const record = { id: store.nextId("mygr"), ...candidate };
  store.data.mygrations.push(record);
  audit(store, "import", record.id);
  store.save();
  return jsonOk(okEnvelope(command, env, importResult("staged", record, record.id), `mycron mygration inspect ${record.id} --json`));
}

function inspectMygration(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const record = findMygration(openStore(env), parsed.id);
  if (!record) return notFound(command, env);
  return jsonOk(okEnvelope(command, env, { outcome: "matched", resource: "mygration", mygration: record }, null));
}

function diffMygration(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const store = openStore(env);
  const record = findMygration(store, parsed.id);
  if (!record) return notFound(command, env);
  return jsonOk(okEnvelope(command, env, { outcome: "matched", resource: "mygration", diff: { candidates: record.candidates, existing: matchingCronlets(store, record) } }, null));
}

function rebindMygration(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const store = openStore(env);
  const record = findMygration(store, parsed.id);
  if (!record) return notFound(command, env);
  const target = stringFlag(parsed.flags.target);
  if (!target) return jsonError(command, env, "USAGE_ERROR", "rebind requires --target.", `mycron mygration rebind ${record.id} --target claude-code --dry-run --json`, exitCodes.usage);
  const cronlet = matchingCronlets(store, record)[0];
  const result = rebindResult(parsed.flags["dry-run"] === true ? "dry_run" : "rebound", record, target, cronlet?.id ?? null);
  if (parsed.flags["dry-run"] === true) return jsonOk(okEnvelope(command, env, result, `mycron mygration rebind ${record.id} --target ${target} --confirm --json`));
  if (parsed.flags.confirm !== true) return jsonError(command, env, "MISSING_CONFIRM", "rebind requires --dry-run or --confirm.", `mycron mygration rebind ${record.id} --target ${target} --dry-run --json`, exitCodes.usage);
  if (cronlet) cronlet.spec = { ...cronlet.spec, runtime_binding: { target } };
  audit(store, "rebind", record.id);
  store.save();
  return jsonOk(okEnvelope(command, env, result, cronlet ? `mycron cronlet get ${cronlet.id} --json` : null));
}

function migrationCandidate(parsed: ParsedCommand): Omit<MygrationRecord, "id"> | Error {
  if (typeof parsed.flags.file === "string") return fromFile(parsed.flags.file);
  const source = stringFlag(parsed.flags.from) ?? "hermes";
  return { source, candidates: [{ client_ref: `${source}:daily` }] };
}

function fromFile(file: string): Omit<MygrationRecord, "id"> | Error {
  const artifact = previewArtifact(file);
  if (artifact instanceof Error) return artifact;
  if (artifact.kind !== "MemoryMigration") return new Error("Expected kind: MemoryMigration.");
  const source = typeof artifact.source === "string" ? artifact.source : "unknown";
  const candidates = Array.isArray(artifact.candidates) ? artifact.candidates as Array<{ client_ref: string }> : [];
  return { source, candidates };
}

function importResult(outcome: string, record: Omit<MygrationRecord, "id">, id: string | null) {
  return { outcome, id, resource: "mygration", source: record.source, candidates: record.candidates, live_cronlets_created: 0, future_runs_enabled: false, external_execution_approved: false };
}

function rebindResult(outcome: string, record: MygrationRecord, target: string, cronletId: string | null) {
  return { outcome, resource: "mygration", id: record.id, cronlet_id: cronletId, target, client_ref: record.candidates[0]?.client_ref ?? null, client_ref_changed: false, history_preserved: true, future_runs_runtime_updated: true };
}

function matchingCronlets(store: Store, record: MygrationRecord) {
  const refs = new Set(record.candidates.map(candidate => candidate.client_ref));
  return store.data.cronlets.filter(cronlet => refs.has(cronlet.client_ref));
}

function findMygration(store: Store, id: string | null): MygrationRecord | undefined {
  return store.data.mygrations.find(item => item.id === id);
}

function audit(store: Store, action: string, targetId: string): void {
  store.data.audit.push({ id: store.nextId("aud"), resource: "mygration", action, target_id: targetId });
}

function stringFlag(value: string | boolean | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function notFound(command: string, env: CliEnv): CliResult {
  return jsonError(command, env, "NOT_FOUND", "Mygration not found.", "mycron mygration import --from hermes --dry-run --json", exitCodes.notFound);
}

function jsonOk(envelope: unknown): CliResult {
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode: exitCodes.ok };
}

function jsonError(command: string, env: CliEnv, code: Parameters<typeof errorEnvelope>[2], message: string, nextCommand: string, exitCode: CliResult["exitCode"]): CliResult {
  const envelope = errorEnvelope(command, env, code, message, nextCommand);
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode };
}
