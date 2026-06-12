export type ExitCode = 0 | 1 | 2 | 3 | 4 | 5;

export const exitCodes = {
  ok: 0,
  runtime: 1,
  usage: 2,
  conflict: 3,
  auth: 4,
  notFound: 5,
} as const satisfies Record<string, ExitCode>;

export type MyCronErrorCode =
  | "USAGE_ERROR"
  | "SCHEMA_VALIDATION_FAILED"
  | "MISSING_CONFIRM"
  | "CLIENT_REF_CONFLICT"
  | "UNAUTHORIZED"
  | "APPROVAL_ACTOR_INVALID"
  | "NOT_FOUND"
  | "NOT_IMPLEMENTED"
  | "WRONG_ARTIFACT_KIND"
  | "INVALID_TRANSITION";

export function exitCodeForError(code: MyCronErrorCode): ExitCode {
  if (code === "CLIENT_REF_CONFLICT" || code === "INVALID_TRANSITION") {
    return exitCodes.conflict;
  }
  if (code === "UNAUTHORIZED" || code === "APPROVAL_ACTOR_INVALID") {
    return exitCodes.auth;
  }
  if (code === "NOT_FOUND") {
    return exitCodes.notFound;
  }
  if (code === "USAGE_ERROR" || code === "SCHEMA_VALIDATION_FAILED" || code === "MISSING_CONFIRM" || code === "WRONG_ARTIFACT_KIND") {
    return exitCodes.usage;
  }
  return exitCodes.runtime;
}
