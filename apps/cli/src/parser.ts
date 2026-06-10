import type { CliEnv, ParsedCommand } from "./types";

const valueFlags = new Set([
  "file",
  "input-json",
  "fields",
  "limit",
  "cursor",
  "idempotency-key",
  "reason",
  "run",
  "cronlet",
  "from",
  "target",
]);

const booleanFlags = new Set(["json", "dry-run", "confirm", "page-all", "help"]);

export function parseArgs(args: string[], env: CliEnv): ParsedCommand | Error {
  const flags: Record<string, string | boolean> = {};
  const positional: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const token = args[index] ?? "";
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const raw = token.slice(2);
    const [name, inlineValue] = raw.split("=", 2);
    if (name === "json" && inlineValue !== undefined) {
      return new Error("--json is output-only; use --input-json or --file for payloads.");
    }
    if (booleanFlags.has(name)) {
      if (name === "json" && looksLikePayload(args[index + 1])) {
        return new Error("--json is output-only; use --input-json or --file for payloads.");
      }
      flags[name] = true;
      continue;
    }
    if (!valueFlags.has(name)) {
      return new Error(`Unknown flag --${name}.`);
    }
    const value = inlineValue ?? args[index + 1];
    if (!value || value.startsWith("--")) {
      return new Error(`Missing value for --${name}.`);
    }
    flags[name] = value;
    if (inlineValue === undefined) {
      index += 1;
    }
  }

  const [resource = null, verb = null] = positional;
  const commandWidth = commandPartCount(resource, verb);
  const commandParts = positional.slice(0, commandWidth).filter(Boolean);
  const id = positional[commandWidth] ?? null;
  return {
    args,
    canonicalCommand: commandParts.join(" ") || "help",
    outputJson: flags.json === true || env.MYCRON_OUTPUT === "json",
    resource,
    verb,
    id,
    flags,
  };
}

function commandPartCount(resource: string | null, verb: string | null): number {
  if (resource === "status") {
    return 1;
  }
  if (resource === "run" && verb === "evidence") {
    return 3;
  }
  if (resource === "account" && ["settings", "budget", "alerts"].includes(verb ?? "")) {
    return 3;
  }
  return resource ? 2 : 1;
}

function looksLikePayload(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  return value.startsWith("{") || value.startsWith("[") || /\.(json|ya?ml|mc|my)$/.test(value);
}
