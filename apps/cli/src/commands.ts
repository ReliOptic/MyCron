import { exitCodes } from "../../../packages/schema/src";
import { approvalCommand } from "./approval-command";
import { commandFor, errorEnvelope, okEnvelope } from "./envelopes";
import { cronletCommand } from "./cronlet-command";
import { packCommand } from "./pack-command";
import { runCommand } from "./run-command";
import { schemaCommand } from "./schema-command";
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
  if (parsed.resource === "schema") {
    return schemaCommand(parsed, env, command);
  }
  if (parsed.resource === "pack") {
    return packCommand(parsed, env, command);
  }
  if (parsed.resource === "cronlet") {
    return cronletCommand(parsed, env, command);
  }
  if (parsed.resource === "run") {
    return runCommand(parsed, env, command);
  }
  if (!parsed.resource || !knownResources.has(parsed.resource)) {
    return jsonError(command, env, "USAGE_ERROR", "Unknown MyCron resource.", "mycron --help", exitCodes.usage);
  }
  if (parsed.resource === "approval") {
    return approvalCommand(parsed, env, command);
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
