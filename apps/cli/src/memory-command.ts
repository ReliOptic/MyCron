import { exitCodes } from "../../../packages/schema/src";
import { resolveActor } from "./actor";
import { artifactSchema, previewArtifact } from "./artifact";
import { errorEnvelope, okEnvelope } from "./envelopes";
import { appendAudit, openStore, type MemoryRecord, type Store } from "./store";

type MemoryItemInput = { content?: string; client_ref?: string; domain?: string; type?: string };
import type { CliEnv, CliResult, ParsedCommand } from "./types";

export function memoryCommand(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  if (parsed.verb === "add") return addMemory(parsed, env, command);
  if (parsed.verb === "list") return listMemory(parsed, env, command);
  if (parsed.verb === "get") return getMemory(parsed, env, command);
  if (parsed.verb === "update") return updateMemory(parsed, env, command);
  if (parsed.verb === "forget") return forgetMemory(parsed, env, command);
  return jsonError(command, env, "USAGE_ERROR", "Use memory add/list/get/update/forget. No memory import/delete.", "mycron memory list --json", exitCodes.usage);
}

function addMemory(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const artifact = memoryArtifact(parsed);
  if (artifact instanceof Error) return jsonError(command, env, "SCHEMA_VALIDATION_FAILED", artifact.message, "mycron schema file get routine.my --json", exitCodes.usage);
  if (artifact.kind !== "MemoryItem") return wrongKind(command, env);
  const store = openStore(env);
  const memory = buildMemory(store.nextId("mem"), artifact);
  store.data.memories.push(memory);
  audit(store, parsed, env, "add", memory.id, "created");
  store.save();
  return jsonOk(okEnvelope(command, env, result("created", memory), `mycron memory get ${memory.id} --json`));
}

function listMemory(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const domain = stringFlag(parsed.flags.domain);
  const type = stringFlag(parsed.flags.type);
  const items = openStore(env).data.memories.filter(item => !item.content_purged && (!domain || item.domain === domain) && (!type || item.type === type));
  return jsonOk(okEnvelope(command, env, { outcome: "matched", resource: "memory", items }, null));
}

function getMemory(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const memory = findMemory(openStore(env), parsed.id);
  if (!memory) return notFound(command, env);
  return jsonOk(okEnvelope(command, env, { outcome: "matched", resource: "memory", memory }, null));
}

function updateMemory(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const store = openStore(env);
  const memory = findMemory(store, parsed.id);
  if (!memory) return notFound(command, env);
  const artifact = memoryArtifact(parsed);
  if (artifact instanceof Error || artifact.kind !== "MemoryItem") return wrongKind(command, env);
  const previous = memory.revision;
  memory.content = artifact.content ?? memory.content;
  memory.domain = artifact.domain ?? memory.domain;
  memory.type = artifact.type ?? memory.type;
  memory.revision += 1;
  memory.supersedes_revision = previous;
  audit(store, parsed, env, "update", memory.id, "updated");
  store.save();
  return jsonOk(okEnvelope(command, env, { ...result("updated", memory), revision: memory.revision, supersedes_revision: previous }, `mycron memory get ${memory.id} --json`));
}

function forgetMemory(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  if (parsed.flags.confirm !== true) return jsonError(command, env, "MISSING_CONFIRM", "memory forget requires --confirm.", `mycron memory forget ${parsed.id ?? "mem_001"} --confirm --json`, exitCodes.usage);
  const store = openStore(env);
  const memory = findMemory(store, parsed.id);
  if (!memory) return notFound(command, env);
  memory.content = null;
  memory.content_purged = true;
  memory.detached_from_future_context = true;
  audit(store, parsed, env, "forget", memory.id, "forgotten");
  store.save();
  return jsonOk(okEnvelope(command, env, { outcome: "forgotten", resource: "memory", id: memory.id, content_purged: true, tombstone_retained: true, detached_from_future_context: true, affected_cronlets: [] }, null));
}

function memoryArtifact(parsed: ParsedCommand) {
  if (typeof parsed.flags.file === "string") return previewArtifact(parsed.flags.file);
  if (typeof parsed.flags["input-json"] === "string") {
    const parsedJson = JSON.parse(parsed.flags["input-json"]);
    const result = artifactSchema.safeParse(parsedJson);
    return result.success ? result.data : new Error("Invalid .my payload.");
  }
  return new Error("memory add/update requires --file or --input-json.");
}

function buildMemory(id: string, artifact: MemoryItemInput): MemoryRecord {
  return { id, content: artifact.content ?? null, client_ref: artifact.client_ref ?? null, domain: artifact.domain ?? null, type: artifact.type ?? null, revision: 1, supersedes_revision: null, content_purged: false, detached_from_future_context: false };
}

function result(outcome: string, memory: MemoryRecord) {
  return { outcome, resource: "memory", id: memory.id, client_ref: memory.client_ref, memory };
}

function findMemory(store: Store, id: string | null): MemoryRecord | undefined {
  return store.data.memories.find(item => item.id === id);
}

function wrongKind(command: string, env: CliEnv): CliResult {
  return jsonError(command, env, "WRONG_ARTIFACT_KIND", "memory add accepts kind: MemoryItem only.", "mycron mygration inspect <migration> --json", exitCodes.usage);
}

function audit(store: Store, parsed: ParsedCommand, env: CliEnv, action: string, targetId: string, outcome: string): void {
  appendAudit(store, { resource: "memory", action, target_id: targetId, actor: resolveActor(parsed, env), outcome });
}

function stringFlag(value: string | boolean | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function notFound(command: string, env: CliEnv): CliResult {
  return jsonError(command, env, "NOT_FOUND", "Memory not found.", "mycron memory list --json", exitCodes.notFound);
}

function jsonOk(envelope: unknown): CliResult {
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode: exitCodes.ok };
}

function jsonError(command: string, env: CliEnv, code: Parameters<typeof errorEnvelope>[2], message: string, nextCommand: string, exitCode: CliResult["exitCode"]): CliResult {
  const envelope = errorEnvelope(command, env, code, message, nextCommand);
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode };
}
