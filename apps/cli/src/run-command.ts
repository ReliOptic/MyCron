import { readFileSync } from "node:fs";
import { exitCodes } from "../../../packages/schema/src";
import { resolveActor } from "./actor";
import { errorEnvelope, okEnvelope } from "./envelopes";
import { appendAudit, openStore, type EvidenceRecord, type RunRecord, type Store } from "./store";
import type { CliEnv, CliResult, ParsedCommand } from "./types";

export function runCommand(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  if (parsed.verb === "evidence") return evidenceCommand(parsed, env, command);
  if (parsed.verb === "list") return listRuns(parsed, env, command);
  if (parsed.verb === "get") return getRun(parsed, env, command);
  if (parsed.verb === "verify") return verifyRun(parsed, env, command);
  if (parsed.verb === "retry") return retryRun(parsed, env, command);
  if (parsed.verb === "escalate") return escalateRun(parsed, env, command);
  return jsonError(command, env, "USAGE_ERROR", "Runs are read/control only; no run create/delete.", "mycron run list --cronlet crn_001 --json", exitCodes.usage);
}

function evidenceCommand(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const operation = parsed.args[2];
  if (operation === "list") return listEvidence(parsed, env, command);
  if (operation === "get") return getEvidence(parsed, env, command);
  if (operation === "add") return addEvidence(parsed, env, command);
  return jsonError(command, env, "USAGE_ERROR", "Use run evidence list|get|add.", "mycron run evidence list --run run_001 --json", exitCodes.usage);
}

function listRuns(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const store = openStore(env);
  const cronletId = stringFlag(parsed.flags.cronlet);
  const items = store.data.runs.filter(run => !cronletId || run.cronlet_id === cronletId);
  return jsonOk(okEnvelope(command, env, { outcome: "matched", resource: "run", items }, null));
}

function getRun(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const run = findRun(openStore(env), parsed.id);
  if (!run) return notFound(command, env, "Run");
  return jsonOk(okEnvelope(command, env, { outcome: "matched", resource: "run", run }, null));
}

function verifyRun(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const store = openStore(env);
  const run = findRun(store, parsed.id);
  if (!run) return notFound(command, env, "Run");
  const previous = run.run_state;
  const evidence = store.data.evidence.filter(item => item.run_id === run.id);
  const trusted = evidence.filter(item => item.provenance === "runtime_attested").length;
  run.run_state = trusted > 0 ? "verified" : "unverified";
  const changed = previous !== run.run_state;
  if (changed) audit(store, parsed, env, "run", "verify", run.id, "verified");
  store.save();
  return jsonOk(okEnvelope(command, env, { outcome: "verified", resource: "run", previous_run_state: previous, run_state: run.run_state, run_state_changed: changed, override: false, manual_marking: false, evaluated_counts: { runtime_attested: trusted, self_reported_ignored: evidence.length - trusted } }, null));
}

function retryRun(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const store = openStore(env);
  const original = findRun(store, parsed.id);
  if (!original) return notFound(command, env, "Run");
  const run = cloneRun(store.nextId("run"), original, "original_run");
  store.data.runs.push(run);
  audit(store, parsed, env, "run", "retry", run.id, "created");
  store.save();
  return jsonOk(okEnvelope(command, env, { outcome: "created", resource: "run", run }, `mycron run get ${run.id} --json`));
}

function escalateRun(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const store = openStore(env);
  const run = findRun(store, parsed.id);
  if (!run) return notFound(command, env, "Run");
  const reason = stringFlag(parsed.flags.reason) ?? null;
  audit(store, parsed, env, "run", "escalate", run.id, "escalated");
  store.save();
  return jsonOk(okEnvelope(command, env, { outcome: "escalated", resource: "run", id: run.id, reason }, `mycron run get ${run.id} --json`));
}

function listEvidence(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const runId = stringFlag(parsed.flags.run);
  const items = openStore(env).data.evidence.filter(item => item.run_id === runId);
  return jsonOk(okEnvelope(command, env, { outcome: "matched", resource: "evidence", items }, null));
}

function getEvidence(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const runId = stringFlag(parsed.flags.run);
  const evidence = openStore(env).data.evidence.find(item => item.id === parsed.id && item.run_id === runId);
  if (!evidence) return notFound(command, env, "Evidence");
  return jsonOk(okEnvelope(command, env, { outcome: "matched", resource: "evidence", evidence }, null));
}

function addEvidence(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const store = openStore(env);
  const run = findRun(store, stringFlag(parsed.flags.run) ?? null);
  if (!run) return notFound(command, env, "Run");
  const file = stringFlag(parsed.flags.file);
  if (!file) return jsonError(command, env, "USAGE_ERROR", "run evidence add requires --file.", `mycron run evidence add --run ${run.id} --file evidence.json --json`, exitCodes.usage);
  const evidence = selfReported(store.nextId("ev"), run.id, file);
  if (parsed.flags["dry-run"] === true) {
    return jsonOk(okEnvelope(command, env, evidenceResult("dry_run", evidence), `mycron run evidence add --run ${run.id} --file ${file} --json`));
  }
  store.data.evidence.push(evidence);
  run.evidence_ids.push(evidence.id);
  audit(store, parsed, env, "evidence", "add", evidence.id, "created");
  store.save();
  return jsonOk(okEnvelope(command, env, evidenceResult("created", evidence), `mycron run verify ${run.id} --json`));
}

function selfReported(id: string, runId: string, file: string): EvidenceRecord {
  return { id, run_id: runId, payload: JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>, provenance: "self_reported", verification_state: "unverified", counts_toward_done: false };
}

function evidenceResult(outcome: string, evidence: EvidenceRecord) {
  return { outcome, resource: "evidence", evidence, counts_toward_done: false, run_state_changed: false };
}

function cloneRun(id: string, original: RunRecord, contextSource: string): RunRecord {
  return { ...original, id, retry_of: original.id, context_source: contextSource, run_state: "unverified", evidence_ids: [] };
}

function findRun(store: Store, id: string | null): RunRecord | undefined {
  return store.data.runs.find(item => item.id === id);
}

function audit(store: Store, parsed: ParsedCommand, env: CliEnv, resource: string, action: string, targetId: string, outcome: string): void {
  appendAudit(store, { resource, action, target_id: targetId, actor: resolveActor(parsed, env), outcome });
}

function stringFlag(value: string | boolean | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function notFound(command: string, env: CliEnv, label: string): CliResult {
  return jsonError(command, env, "NOT_FOUND", `${label} not found.`, "mycron run list --json", exitCodes.notFound);
}

function jsonOk(envelope: unknown): CliResult {
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode: exitCodes.ok };
}

function jsonError(command: string, env: CliEnv, code: Parameters<typeof errorEnvelope>[2], message: string, nextCommand: string, exitCode: CliResult["exitCode"]): CliResult {
  const envelope = errorEnvelope(command, env, code, message, nextCommand);
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode };
}
