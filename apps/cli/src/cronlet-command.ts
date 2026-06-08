import { exitCodes } from "../../../packages/schema/src";
import { previewArtifact } from "./artifact";
import { errorEnvelope, okEnvelope } from "./envelopes";
import { cronletLifecycle } from "./cronlet-lifecycle";
import { openStore, projectFields, stableHash, type CronletRecord } from "./store";
import type { CliEnv, CliResult, ParsedCommand } from "./types";

export function cronletCommand(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  if (parsed.verb === "create") {
    return createCronlet(parsed, env, command);
  }
  if (parsed.verb === "get") {
    return getCronlet(parsed, env, command);
  }
  if (parsed.verb === "list") {
    return listCronlets(parsed, env, command);
  }
  return cronletLifecycle(parsed, env, command);
}

function createCronlet(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const file = parsed.flags.file;
  if (typeof file !== "string") {
    return jsonError(command, env, "USAGE_ERROR", "cronlet create requires --file.", "mycron cronlet create --file routine.mc --dry-run --json", exitCodes.usage);
  }
  const artifact = previewArtifact(file);
  if (artifact instanceof Error) {
    return jsonError(command, env, "SCHEMA_VALIDATION_FAILED", artifact.message, `mycron pack validate --file ${file} --json`, exitCodes.usage);
  }
  if (artifact.kind !== "Cronlet") {
    return jsonError(command, env, "WRONG_ARTIFACT_KIND", "cronlet create accepts kind: Cronlet only.", `mycron pack preview --file ${file} --json`, exitCodes.usage);
  }
  if (parsed.flags["dry-run"] === true) {
    return jsonOk(okEnvelope(command, env, createResult("dry_run", artifact, null, false), null));
  }
  if (parsed.flags.confirm !== true) {
    return jsonError(command, env, "MISSING_CONFIRM", "cronlet create requires --dry-run or --confirm.", "mycron cronlet create --file routine.mc --dry-run --json", exitCodes.usage);
  }
  return persistCronlet(parsed, env, command, artifact);
}

function persistCronlet(parsed: ParsedCommand, env: CliEnv, command: string, artifact: Record<string, unknown>): CliResult {
  const store = openStore(env);
  const existing = store.data.cronlets.find(cronlet => cronlet.client_ref === artifact.client_ref);
  const specHash = stableHash(artifact);
  if (existing && existing.spec_hash === specHash) {
    return jsonOk(okEnvelope(command, env, createResult("matched", artifact, existing, false), `mycron cronlet get ${existing.id} --json`));
  }
  if (existing) {
    return jsonError(command, env, "CLIENT_REF_CONFLICT", "client_ref already exists with a different normalized spec.", `mycron cronlet update ${existing.id} --file ${String(parsed.flags.file)} --dry-run --json`, exitCodes.conflict);
  }
  const cronlet = buildCronlet(store.nextId("crn"), artifact, specHash, store.nextId("apr"));
  store.data.cronlets.push(cronlet);
  if (cronlet.approval_id) {
    store.data.approvals.push({ id: cronlet.approval_id, cronlet_id: cronlet.id, state: "pending", reason: null });
  }
  store.data.audit.push({ id: store.nextId("aud"), resource: "cronlet", action: "create", target_id: cronlet.id });
  store.save();
  return jsonOk(okEnvelope(command, env, createResult("created", artifact, cronlet, true), `mycron cronlet get ${cronlet.id} --json`));
}

function getCronlet(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const store = openStore(env);
  const cronlet = store.data.cronlets.find(item => item.id === parsed.id);
  if (!cronlet) {
    return jsonError(command, env, "NOT_FOUND", "Cronlet not found.", "mycron cronlet list --json", exitCodes.notFound);
  }
  return jsonOk(okEnvelope(command, env, { outcome: "matched", resource: "cronlet", cronlet }, null));
}

function listCronlets(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const store = openStore(env);
  const visible = store.data.cronlets.filter(item => item.state !== "archived");
  const cursor = Number(parsed.flags.cursor ?? 0);
  const limit = Number(parsed.flags.limit ?? (visible.length || 50));
  const page = visible.slice(cursor, cursor + limit).map(item => projectFields(item, stringFlag(parsed.flags.fields)));
  const nextCursor = cursor + limit < visible.length ? String(cursor + limit) : null;
  return jsonOk(okEnvelope(command, env, { outcome: "matched", resource: "cronlet", items: page, next_cursor: nextCursor }, null));
}

function buildCronlet(id: string, artifact: Record<string, unknown>, specHash: string, approvalId: string): CronletRecord {
  const required = requiredCapabilities(String(artifact.action_type ?? ""));
  return {
    id,
    client_ref: String(artifact.client_ref),
    name: String(artifact.name ?? artifact.client_ref),
    state: "active",
    next_run: null,
    spec_hash: specHash,
    spec: artifact,
    required_capabilities: required,
    missing_capabilities: required,
    requires_approval: required.length > 0,
    external_execution_approved: false,
    future_runs_enabled: false,
    approval_id: required.length > 0 ? approvalId : null,
  };
}

function createResult(outcome: string, artifact: Record<string, unknown>, cronlet: CronletRecord | null, changed: boolean) {
  const required = requiredCapabilities(String(artifact.action_type ?? ""));
  return {
    outcome,
    resource: "cronlet",
    id: cronlet?.id ?? null,
    client_ref: artifact.client_ref,
    changed,
    confirmed_write: changed || outcome === "matched",
    requires_approval: required.length > 0,
    external_execution_approved: false,
    required_capabilities: required,
    missing_capabilities: required,
    future_runs_enabled: false,
    approval: cronlet?.approval_id ? { id: cronlet.approval_id, state: "pending" } : null,
  };
}

function requiredCapabilities(actionType: string): string[] {
  return actionType === "email.send" ? ["email:send"] : [];
}

function stringFlag(value: string | boolean | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function jsonOk(envelope: unknown): CliResult {
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode: exitCodes.ok };
}

function jsonError(command: string, env: CliEnv, code: Parameters<typeof errorEnvelope>[2], message: string, nextCommand: string, exitCode: CliResult["exitCode"]): CliResult {
  const envelope = errorEnvelope(command, env, code, message, nextCommand);
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode };
}
