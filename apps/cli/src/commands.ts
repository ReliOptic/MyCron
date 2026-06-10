import { exitCodes } from "../../../packages/schema/src";
import { commandFor, errorEnvelope, okEnvelope } from "./envelopes";
import type { CliEnv, CliResult, ParsedCommand } from "./types";

const knownResources = new Set([
  "schema",
  "pack",
  "cronlet",
  "run",
  "approval",
  "memory",
  "mygration",
  "account",
  "config",
  "status",
]);

export function executeJson(parsed: ParsedCommand, env: CliEnv): CliResult {
  const command = commandFor(parsed);
  if (parsed.resource === "status") {
    return jsonOk(statusEnvelope(command, env));
  }
  if (parsed.resource === "config" && parsed.verb === "doctor") {
    return jsonOk(configDoctorEnvelope(command, env));
  }
  if (!parsed.resource || !knownResources.has(parsed.resource)) {
    return jsonError(command, env, "USAGE_ERROR", "Unknown MyCron resource.", "mycron --help", exitCodes.usage);
  }
  if (parsed.resource === "approval" && parsed.verb === "approve") {
    return approvalApprove(parsed, env, command);
  }
  if (parsed.resource === "cronlet" && parsed.verb === "create") {
    return cronletCreate(parsed, env, command);
  }
  return jsonError(
    command,
    env,
    "NOT_IMPLEMENTED",
    `Handler for '${command}' is not implemented yet.`,
    `mycron ${command} --help`,
    exitCodes.runtime,
    { outcome: "not_implemented", resource: parsed.resource, verb: parsed.verb ?? null },
  );
}

function statusEnvelope(command: string, env: CliEnv) {
  const tokenPresent = Boolean(env.MYCRON_TOKEN);
  return okEnvelope(command, env, {
    outcome: "matched",
    resource: "status",
    authenticated: tokenPresent,
    token_present: tokenPresent,
    account_scope: env.MYCRON_ACCOUNT_ID ?? "unauthenticated",
  }, "mycron config doctor --json");
}

function configDoctorEnvelope(command: string, env: CliEnv) {
  const tokenPresent = Boolean(env.MYCRON_TOKEN);
  return okEnvelope(command, env, {
    outcome: "matched",
    resource: "config",
    authenticated: tokenPresent,
    token_present: tokenPresent,
    checks: [
      { name: "token", ok: tokenPresent, source: tokenPresent ? "MYCRON_TOKEN" : null },
      { name: "output", ok: true, source: env.MYCRON_OUTPUT === "json" ? "MYCRON_OUTPUT" : "default" },
    ],
  }, "mycron status --json");
}

function approvalApprove(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const approvalId = parsed.id ?? "<approval-id>";
  if (parsed.flags.confirm !== true) {
    return jsonError(
      command,
      env,
      "MISSING_CONFIRM",
      "approval approve requires --confirm.",
      `mycron approval approve ${approvalId} --confirm --json`,
      exitCodes.usage,
    );
  }
  return jsonError(
    command,
    env,
    "NOT_IMPLEMENTED",
    "Approval execution is not implemented in the skeleton.",
    `mycron approval get ${approvalId} --json`,
    exitCodes.runtime,
    {
      outcome: "not_implemented",
      resource: "approval",
      verb: "approve",
      id: approvalId,
      confirmed_write: true,
      external_execution_approved: true,
    },
  );
}

function cronletCreate(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  if (parsed.flags["dry-run"] === true) {
    const envelope = okEnvelope(command, env, mutationResult(parsed, "dry_run", false), null);
    return jsonOk(envelope);
  }
  if (parsed.flags.confirm !== true) {
    return jsonError(
      command,
      env,
      "MISSING_CONFIRM",
      "cronlet create requires --dry-run or --confirm.",
      "mycron cronlet create --file routine.mc --dry-run --json",
      exitCodes.usage,
    );
  }
  return jsonError(
    command,
    env,
    "NOT_IMPLEMENTED",
    "Cronlet persistence is not implemented in the skeleton.",
    "mycron cronlet create --file routine.mc --dry-run --json",
    exitCodes.runtime,
    mutationResult(parsed, "not_implemented", true),
  );
}

function mutationResult(parsed: ParsedCommand, outcome: string, confirmedWrite: boolean) {
  return {
    outcome,
    resource: parsed.resource,
    verb: parsed.verb,
    input_file: typeof parsed.flags.file === "string" ? parsed.flags.file : null,
    changed: false,
    confirmed_write: confirmedWrite,
    external_execution_approved: false,
  };
}

function jsonOk(envelope: unknown): CliResult {
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode: exitCodes.ok };
}

function jsonError(
  command: string,
  env: CliEnv,
  code: Parameters<typeof errorEnvelope>[2],
  message: string,
  nextCommand: string | null,
  exitCode: CliResult["exitCode"],
  result?: Parameters<typeof errorEnvelope>[5],
): CliResult {
  const envelope = errorEnvelope(command, env, code, message, nextCommand, result);
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode };
}
