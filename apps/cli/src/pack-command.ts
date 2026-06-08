import { exitCodes } from "../../../packages/schema/src";
import { loadArtifact, previewArtifact } from "./artifact";
import { errorEnvelope, okEnvelope } from "./envelopes";
import type { CliEnv, CliResult, ParsedCommand } from "./types";

export function packCommand(parsed: ParsedCommand, env: CliEnv, command: string): CliResult {
  if (parsed.verb !== "validate" && parsed.verb !== "preview") {
    return jsonError(command, env, "USAGE_ERROR", "Only pack validate and pack preview are in scope.", "mycron pack validate --file routine.mc --json", exitCodes.usage);
  }
  const file = parsed.flags.file;
  if (typeof file !== "string") {
    return jsonError(command, env, "USAGE_ERROR", "pack commands require --file.", `mycron pack ${parsed.verb} --file routine.mc --json`, exitCodes.usage);
  }
  return parsed.verb === "validate" ? validate(file, env, command) : preview(file, env, command);
}

function validate(file: string, env: CliEnv, command: string): CliResult {
  const validation = loadArtifact(file);
  const envelope = okEnvelope(command, env, {
    outcome: "validated",
    resource: "pack",
    valid: validation.valid,
    errors: validation.errors,
    artifact: validation.artifact ? artifactSummary(validation.artifact) : null,
  }, validation.valid ? `mycron pack preview --file ${file} --json` : null);
  return jsonOk(envelope);
}

function preview(file: string, env: CliEnv, command: string): CliResult {
  const artifact = previewArtifact(file);
  if (artifact instanceof Error) {
    return jsonError(command, env, "SCHEMA_VALIDATION_FAILED", artifact.message, `mycron pack validate --file ${file} --json`, exitCodes.usage);
  }
  const envelope = okEnvelope(command, env, {
    outcome: "previewed",
    resource: "pack",
    preview: artifact,
  }, null);
  return jsonOk(envelope);
}

function artifactSummary(artifact: { kind: string; client_ref?: string }) {
  return { kind: artifact.kind, client_ref: artifact.client_ref ?? null };
}

function jsonOk(envelope: unknown): CliResult {
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode: exitCodes.ok };
}

function jsonError(command: string, env: CliEnv, code: Parameters<typeof errorEnvelope>[2], message: string, nextCommand: string, exitCode: CliResult["exitCode"]): CliResult {
  const envelope = errorEnvelope(command, env, code, message, nextCommand);
  return { stdout: `${JSON.stringify(envelope, null, 2)}\n`, stderr: "", exitCode };
}
