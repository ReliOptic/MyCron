import { exitCodes } from "../../../packages/schema/src";
import { resolveActor } from "./actor";
import { errorEnvelope, okEnvelope } from "./envelopes";
import { appendAudit, openStore, type ApprovalRecord, type AuditActor, type Store } from "./store";
import type { CliEnv, CliResult, ParsedCommand } from "./types";

export function approvalCommand(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  if (parsed.verb === "list") return listApprovals(env, command);
  if (parsed.verb === "get") return getApproval(parsed, env, command);
  if (parsed.verb === "approve") return decide(parsed, env, command, "approve");
  if (parsed.verb === "reject") return decide(parsed, env, command, "reject");
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

function decide(parsed: ParsedCommand, env: CliEnv, command: string, decision: "approve" | "reject"): CliResult {
  // ADR-0004: approve authorizes external execution → --confirm required.
  // reject is the safe direction → frictionless, no --confirm (grammar §3.5).
  if (decision === "approve" && parsed.flags.confirm !== true) {
    return jsonError(command, env, "MISSING_CONFIRM", "approval approve requires --confirm.", `mycron approval approve ${parsed.id ?? "apr_001"} --confirm --json`, exitCodes.usage);
  }
  const store = openStore(env);
  const approval = findApproval(store, parsed.id);
  if (!approval) return notFound(command, env);
  const actor = resolveActor(parsed, env);
  if (actor.kind !== "user") {
    return denied(parsed, env, command, decision, store, approval, actor);
  }
  if (decision === "approve") {
    approval.state = "approved";
    const cronlet = store.data.cronlets.find(item => item.id === approval.cronlet_id);
    if (cronlet) cronlet.external_execution_approved = true;
  } else {
    approval.state = "rejected";
    approval.reason = typeof parsed.flags.reason === "string" ? parsed.flags.reason : null;
  }
  appendAudit(store, { resource: "approval", action: decision, target_id: approval.id, actor, outcome: approval.state });
  store.save();
  return jsonOk(okEnvelope(command, env, result(approval.state, approval, decision === "approve", actor), `mycron approval get ${approval.id} --json`));
}

/** ADR-0007: non-user actors cannot approve/reject. The denied attempt is
 *  itself ledger-worthy — recorded with the claimed actor and outcome. */
function denied(parsed: ParsedCommand, env: CliEnv, command: string, decision: "approve" | "reject", store: Store, approval: ApprovalRecord, actor: AuditActor): CliResult {
  appendAudit(store, { resource: "approval", action: decision, target_id: approval.id, actor, outcome: "denied" });
  store.save();
  const envelope = errorEnvelope(
    command,
    env,
    "APPROVAL_ACTOR_INVALID",
    `approval ${decision} is valid only for a user actor (ADR-0007); the attempt by '${actor.kind}' was denied and audited.`,
    `mycron approval ${decision} ${approval.id} --actor user${decision === "approve" ? " --confirm" : ""} --json`,
    { outcome: "denied", resource: "approval", id: approval.id, state: approval.state, claimed_actor: actor, confirmed_write: false, external_execution_approved: false },
  );
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode: exitCodes.auth };
}

function result(outcome: string, approval: ApprovalRecord, external: boolean, actor: AuditActor) {
  return { outcome, resource: "approval", id: approval.id, state: approval.state, reason: approval.reason, actor, confirmed_write: true, external_execution_approved: external };
}

function findApproval(store: Store, id: string | null): ApprovalRecord | undefined {
  return store.data.approvals.find(item => item.id === id);
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
