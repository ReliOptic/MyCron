import type { AuditActor } from "./store";
import type { CliEnv, ParsedCommand } from "./types";

// ADR-0007: the CLI default actor is host_agent; a user must claim
// `--actor user` explicitly. The parser rejects non-claimable kinds,
// so the cast below is safe. Until backend auth lands, the actor is
// self-declared — the invariant and error boundary exist now so the
// same rule can later bind to an authenticated principal.
export function resolveActor(parsed: ParsedCommand, env: CliEnv): AuditActor {
  const kind = typeof parsed.flags.actor === "string" ? (parsed.flags.actor as AuditActor["kind"]) : "host_agent";
  return { kind, id: env.MYCRON_ACTOR_ID ?? null };
}
