import { exitCodes } from "../../../packages/schema/src";
import { errorEnvelope, okEnvelope } from "./envelopes";
import { openStore } from "./store";
import type { CliEnv, CliResult, ParsedCommand } from "./types";

export function accountCommand(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  if (!env.MYCRON_TOKEN) return unauthorized(command, env);
  if (parsed.verb === "get") return getAccount(env, command);
  if (parsed.verb === "settings" && parsed.args[2] === "get") return settings(env, command);
  if (parsed.verb === "budget" && parsed.args[2] === "get") return budget(env, command);
  if (parsed.verb === "alerts" && parsed.args[2] === "list") return alertsList(env, command);
  if (parsed.verb === "alerts" && parsed.args[2] === "set") return alertsSet(parsed, env, command);
  return jsonError(command, env, "USAGE_ERROR", "Use account get/settings get/budget get/alerts list|set. No workspace.", "mycron account get --json", exitCodes.usage);
}

function getAccount(env: CliEnv, command: string): CliResult {
  return jsonOk(okEnvelope(command, env, { outcome: "matched", resource: "account", account: { id: env.MYCRON_ACCOUNT_ID ?? null, name: null, plan: null } }, null));
}

function settings(env: CliEnv, command: string): CliResult {
  return jsonOk(okEnvelope(command, env, { outcome: "matched", resource: "account", settings: {} }, null));
}

function budget(env: CliEnv, command: string): CliResult {
  return jsonOk(okEnvelope(command, env, { outcome: "matched", resource: "account", budget: { used: null, limit: null, cycle: null } }, null));
}

function alertsList(env: CliEnv, command: string): CliResult {
  const store = openStore(env);
  return jsonOk(okEnvelope(command, env, { outcome: "matched", resource: "account", alerts: store.data.account.alerts }, null));
}

function alertsSet(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  const key = parsed.id;
  const enabled = parseBoolean(parsed.flags.enabled);
  if (!key || enabled === null) return jsonError(command, env, "USAGE_ERROR", "alerts set requires <key> --enabled true|false.", "mycron account alerts set failure --enabled true --json", exitCodes.usage);
  const store = openStore(env);
  store.data.account.alerts[key] = enabled;
  store.data.audit.push({ id: store.nextId("aud"), resource: "account", action: "alerts.set", target_id: key });
  store.save();
  return jsonOk(okEnvelope(command, env, { outcome: "updated", resource: "account", key, enabled, alerts: store.data.account.alerts }, "mycron account alerts list --json"));
}

function parseBoolean(value: string | boolean | undefined): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function unauthorized(command: string, env: CliEnv): CliResult {
  return jsonError(command, env, "UNAUTHORIZED", "Set MYCRON_TOKEN to access account scope.", "mycron status --json", exitCodes.auth);
}

function jsonOk(envelope: unknown): CliResult {
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode: exitCodes.ok };
}

function jsonError(command: string, env: CliEnv, code: Parameters<typeof errorEnvelope>[2], message: string, nextCommand: string, exitCode: CliResult["exitCode"]): CliResult {
  const envelope = errorEnvelope(command, env, code, message, nextCommand);
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode };
}
