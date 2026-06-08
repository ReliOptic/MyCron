const resources = [
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
];

export function topHelp(): string {
  return [
    "MyCron CLI",
    "Usage: mycron <resource> <verb> [id] [flags]",
    "Resources: " + resources.join(", "),
    "Global flags: --json --file --input-json --dry-run --confirm --fields --limit --cursor --page-all --idempotency-key --reason",
  ].join("\n");
}

export function resourceHelp(resource: string): string {
  if (resource === "cronlet") {
    return [
      "Usage: mycron cronlet <verb> [id] [flags]",
      "Verbs: create, list, get, update, pause, resume, run-now, cancel, archive",
      "Examples:",
      "  mycron cronlet create --file routine.mc --dry-run --json",
    ].join("\n");
  }
  return `Usage: mycron ${resource} <verb> [id] [flags]`;
}
