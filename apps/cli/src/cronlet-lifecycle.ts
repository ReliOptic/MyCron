import { exitCodes } from "../../../packages/schema/src";
import { previewArtifact } from "./artifact";
import { errorEnvelope, okEnvelope } from "./envelopes";
import { openStore, stableHash, type CronletRecord, type Store } from "./store";
import type { CliEnv, CliResult, ParsedCommand } from "./types";

export function cronletLifecycle(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  if (parsed.verb === "delete") {
    return jsonError(command, env, "USAGE_ERROR", "cronlet delete is not part of the contract.", "mycron cronlet archive crn_001 --confirm --json", exitCodes.usage);
  }
  if (parsed.verb === "update") {
    return updateCronlet(parsed, env, command);
  }
  if (parsed.verb === "run-now") {
    return runNow(parsed, env, command);
  }
  return transitionCronlet(parsed, env, command);
}

function transitionCronlet(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  if ((parsed.verb === "cancel" || parsed.verb === "archive") && parsed.flags.confirm !== true) {
    return jsonError(command, env, "MISSING_CONFIRM", `${parsed.verb} requires --confirm.`, `mycron cronlet ${parsed.verb} ${parsed.id ?? "crn_001"} --confirm --json`, exitCodes.usage);
  }
  const store = openStore(env);
  const cronlet = findCronlet(store, parsed.id);
  if (cronlet instanceof Error) {
    return notFound(command, env);
  }
  if (!canTransition(cronlet, parsed.verb)) {
    return jsonError(command, env, "INVALID_TRANSITION", "Invalid cronlet state transition.", `mycron cronlet get ${cronlet.id} --json`, exitCodes.conflict);
  }
  cronlet.state = nextState(parsed.verb);
  audit(store, "cronlet", parsed.verb ?? "transition", cronlet.id);
  store.save();
  return jsonOk(okEnvelope(command, env, transitionResult(parsed.verb, cronlet), `mycron cronlet get ${cronlet.id} --json`));
}

function updateCronlet(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const store = openStore(env);
  const cronlet = findCronlet(store, parsed.id);
  if (cronlet instanceof Error) {
    return notFound(command, env);
  }
  const file = parsed.flags.file;
  if (typeof file !== "string") {
    return jsonError(command, env, "USAGE_ERROR", "cronlet update requires --file.", `mycron cronlet update ${cronlet.id} --file patch.json --dry-run --json`, exitCodes.usage);
  }
  const artifact = previewArtifact(file);
  if (artifact instanceof Error || artifact.kind !== "Cronlet") {
    return jsonError(command, env, "SCHEMA_VALIDATION_FAILED", "Invalid cronlet update artifact.", `mycron pack validate --file ${file} --json`, exitCodes.usage);
  }
  const updated = { ...cronlet.spec, ...artifact };
  const result = { outcome: parsed.flags["dry-run"] === true ? "dry_run" : "updated", resource: "cronlet", id: cronlet.id, changed: parsed.flags.confirm === true, diff: { before: cronlet.spec, after: updated } };
  if (parsed.flags["dry-run"] === true) {
    return jsonOk(okEnvelope(command, env, result, `mycron cronlet update ${cronlet.id} --file ${file} --confirm --json`));
  }
  if (parsed.flags.confirm !== true) {
    return jsonError(command, env, "MISSING_CONFIRM", "cronlet update requires --dry-run or --confirm.", `mycron cronlet update ${cronlet.id} --file ${file} --dry-run --json`, exitCodes.usage);
  }
  cronlet.spec = updated;
  cronlet.name = String(updated.name ?? cronlet.name);
  cronlet.spec_hash = stableHash(updated);
  audit(store, "cronlet", "update", cronlet.id);
  store.save();
  return jsonOk(okEnvelope(command, env, result, `mycron cronlet get ${cronlet.id} --json`));
}

function runNow(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const store = openStore(env);
  const cronlet = findCronlet(store, parsed.id);
  if (cronlet instanceof Error) {
    return notFound(command, env);
  }
  const run = { id: store.nextId("run"), cronlet_id: cronlet.id, retry_of: null, context_source: "current_cronlet_spec", run_state: "unverified", done_policy: cronlet.spec.done_policy ?? null, evidence_ids: [] };
  store.data.runs.push(run);
  audit(store, "run", "run-now", run.id);
  store.save();
  return jsonOk(okEnvelope(command, env, { outcome: "created", resource: "run", run, external_execution_approved: false }, `mycron run get ${run.id} --json`));
}

function findCronlet(store: Store, id: string | null): CronletRecord | Error {
  return store.data.cronlets.find(item => item.id === id) ?? new Error("not found");
}

function canTransition(cronlet: CronletRecord, verb: string | null): boolean {
  if (cronlet.state === "cancelled") {
    return false;
  }
  if (verb === "resume") {
    return cronlet.state === "paused";
  }
  return verb === "pause" || verb === "cancel" || verb === "archive";
}

function nextState(verb: string | null): CronletRecord["state"] {
  if (verb === "pause") return "paused";
  if (verb === "resume") return "active";
  if (verb === "archive") return "archived";
  return "cancelled";
}

function transitionResult(verb: string | null, cronlet: CronletRecord) {
  return { outcome: transitionOutcome(verb), resource: "cronlet", id: cronlet.id, state: cronlet.state, future_runs_disabled: verb === "cancel" || verb === "archive", audit_retained: verb === "cancel" || verb === "archive" };
}

function transitionOutcome(verb: string | null): string {
  if (verb === "pause") return "paused";
  if (verb === "resume") return "resumed";
  if (verb === "archive") return "archived";
  return "cancelled";
}

function audit(store: Store, resource: string, action: string, targetId: string): void {
  store.data.audit.push({ id: store.nextId("aud"), resource, action, target_id: targetId });
}

function notFound(command: string, env: CliEnv): CliResult {
  return jsonError(command, env, "NOT_FOUND", "Cronlet not found.", "mycron cronlet list --json", exitCodes.notFound);
}

function jsonOk(envelope: unknown): CliResult {
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode: exitCodes.ok };
}

function jsonError(command: string, env: CliEnv, code: Parameters<typeof errorEnvelope>[2], message: string, nextCommand: string, exitCode: CliResult["exitCode"]): CliResult {
  const envelope = errorEnvelope(command, env, code, message, nextCommand);
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode };
}
