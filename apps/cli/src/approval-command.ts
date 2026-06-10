import { exitCodes } from "../../../packages/schema/src";
import { errorEnvelope, okEnvelope } from "./envelopes";
import { openStore, type ApprovalRecord, type Store } from "./store";
import type { CliEnv, CliResult, ParsedCommand } from "./types";

export function approvalCommand(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  if (parsed.verb === "list") return listApprovals(env, command);
  if (parsed.verb === "get") return getApproval(parsed, env, command);
  if (parsed.verb === "approve") return approve(parsed, env, command);
  if (parsed.verb === "reject") return reject(parsed, env, command);
  return jsonError(command, env, "USAGE_ERROR", "Approvals are gate-created only.", "mycron approval list --json", exitCodes.usage);
}

function listApprovals(env: CliEnv, command: string): CliResult {
  const store = openStore(env);
  return jsonOk(okEnvelope(command, env, { outcome: "matched", resource: "approval", items: store.data.approvals }, null));
}

function getApproval(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const store = openStore(env);
  const approval = findApproval(store, parsed.id);
  if (!approval) return notFound(command, env);
  return jsonOk(okEnvelope(command, env, { outcome: "matched", resource: "approval", approval }, null));
}

function approve(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  if (parsed.flags.confirm !== true) {
    return jsonError(command, env, "MISSING_CONFIRM", "approval approve requires --confirm.", `mycron approval approve ${parsed.id ?? "apr_001"} --confirm --json`, exitCodes.usage);
  }
  const store = openStore(env);
  const approval = findApproval(store, parsed.id);
  if (!approval) return notFound(command, env);
  approval.state = "approved";
  const cronlet = store.data.cronlets.find(item => item.id === approval.cronlet_id);
  if (cronlet) cronlet.external_execution_approved = true;
  audit(store, "approve", approval.id);
  store.save();
  return jsonOk(okEnvelope(command, env, result("approved", approval, true, null), `mycron approval get ${approval.id} --json`));
}

function reject(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const store = openStore(env);
  const approval = findApproval(store, parsed.id);
  if (!approval) return notFound(command, env);
  approval.state = "rejected";
  approval.reason = typeof parsed.flags.reason === "string" ? parsed.flags.reason : null;
  audit(store, "reject", approval.id);
  store.save();
  return jsonOk(okEnvelope(command, env, result("rejected", approval, false, approval.reason), `mycron approval get ${approval.id} --json`));
}

function result(outcome: string, approval: ApprovalRecord, external: boolean, reason: string | null) {
  return { outcome, resource: "approval", id: approval.id, state: approval.state, reason, confirmed_write: true, external_execution_approved: external };
}

function findApproval(store: Store, id: string | null): ApprovalRecord | undefined {
  return store.data.approvals.find(item => item.id === id);
}

function audit(store: Store, action: string, targetId: string): void {
  store.data.audit.push({ id: store.nextId("aud"), resource: "approval", action, target_id: targetId });
}

function notFound(command: string, env: CliEnv): CliResult {
  return jsonError(command, env, "NOT_FOUND", "Approval not found.", "mycron approval list --json", exitCodes.notFound);
}

function jsonOk(envelope: unknown): CliResult {
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode: exitCodes.ok };
}

function jsonError(command: string, env: CliEnv, code: Parameters<typeof errorEnvelope>[2], message: string, nextCommand: string, exitCode: CliResult["exitCode"]): CliResult {
  const envelope = errorEnvelope(command, env, code, message, nextCommand);
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode };
}
