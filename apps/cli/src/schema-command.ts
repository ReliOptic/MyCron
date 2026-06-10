import { exitCodes } from "../../../packages/schema/src";
import { errorEnvelope, okEnvelope } from "./envelopes";
import { getContractSchema, isSchemaKind, listSchemaIds } from "./schema-registry";
import type { CliEnv, CliResult, ParsedCommand } from "./types";

export function schemaCommand(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const [, rawKind, operation, id] = parsed.args;
  if (!rawKind || !isSchemaKind(rawKind) || (operation !== "list" && operation !== "get")) {
    return jsonError(command, env, "USAGE_ERROR", "Use schema command|action|file list|get.", "mycron schema command list --json", exitCodes.usage);
  }
  if (operation === "list") {
    return jsonOk(okEnvelope(command, env, {
      outcome: "matched",
      resource: "schema",
      kind: rawKind,
      ids: listSchemaIds(rawKind),
    }, `mycron schema ${rawKind} get <id> --json`));
  }
  if (!id) {
    return jsonError(command, env, "USAGE_ERROR", "schema get requires an id.", `mycron schema ${rawKind} list --json`, exitCodes.usage);
  }
  const contract = getContractSchema(rawKind, id);
  if (!contract) {
    return jsonError(command, env, "NOT_FOUND", `${id} was not found in schema ${rawKind}.`, `mycron schema ${rawKind} list --json`, exitCodes.notFound);
  }
  return jsonOk(okEnvelope(command, env, {
    outcome: "matched",
    resource: "schema",
    kind: rawKind,
    ...contract,
  }, null));
}

function jsonOk(envelope: unknown): CliResult {
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode: exitCodes.ok };
}

function jsonError(command: string, env: CliEnv, code: Parameters<typeof errorEnvelope>[2], message: string, nextCommand: string, exitCode: CliResult["exitCode"]): CliResult {
  const envelope = errorEnvelope(command, env, code, message, nextCommand);
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode };
}
