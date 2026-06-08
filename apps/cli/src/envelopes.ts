import { apiVersion, cliVersion, envelopeSchema } from "../../../packages/schema/src";
import type { ErrorEnvelope, OkEnvelope } from "../../../packages/schema/src";
import type { CliEnv, ParsedCommand } from "./types";

function meta(command: string, env: CliEnv) {
  return {
    api_version: apiVersion,
    cli_version: cliVersion,
    command,
    request_id: env.MYCRON_REQUEST_ID ?? `req_${cryptoId()}`,
    account_id: env.MYCRON_ACCOUNT_ID ?? null,
  };
}

export function okEnvelope(
  command: string,
  env: CliEnv,
  result: OkEnvelope["result"],
  nextCommand: string | null,
): OkEnvelope {
  return envelopeSchema.parse({
    meta: meta(command, env),
    status: "ok",
    result,
    next_command: nextCommand,
  }) as OkEnvelope;
}

export function errorEnvelope(
  command: string,
  env: CliEnv,
  code: ErrorEnvelope["error"]["code"],
  message: string,
  nextCommand: string | null,
  result?: ErrorEnvelope["result"],
): ErrorEnvelope {
  return envelopeSchema.parse({
    meta: meta(command, env),
    status: "error",
    error: { code, message },
    result,
    next_command: nextCommand,
  }) as ErrorEnvelope;
}

export function commandFor(parsed: ParsedCommand): string {
  if (parsed.resource === "status") {
    return "status";
  }
  return parsed.canonicalCommand;
}

function cryptoId(): string {
  return Math.random().toString(16).slice(2, 10);
}
