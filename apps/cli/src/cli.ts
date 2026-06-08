import { exitCodes } from "../../../packages/schema/src";
import { errorEnvelope } from "./envelopes";
import { executeJson } from "./commands";
import { parseArgs } from "./parser";
import { resourceHelp, topHelp } from "./help";
import type { CliEnv, CliResult } from "./types";

export function runCli(args: string[], env: CliEnv = {}): CliResult {
  const parsed = parseArgs(args, env);
  if (parsed instanceof Error) {
    return usageError(parsed.message, env);
  }
  if (parsed.flags.help === true || args.length === 0) {
    return human(parsed.resource ? resourceHelp(parsed.resource) : topHelp());
  }
  if (!parsed.outputJson) {
    return human(`MyCron ${parsed.resource ?? "CLI"} ready. Use --json for the stable machine contract.`);
  }
  return executeJson(parsed, env);
}

function usageError(message: string, env: CliEnv): CliResult {
  const envelope = errorEnvelope(
    "help",
    env,
    "USAGE_ERROR",
    message,
    "mycron cronlet create --file routine.mc --dry-run --json",
  );
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode: exitCodes.usage };
}

function human(stdout: string): CliResult {
  return { stdout: `${stdout}\n`, stderr: "", exitCode: exitCodes.ok };
}
