import { readFileSync } from "node:fs";
import { z } from "zod";
import { artifactSchema, type ArtifactSpec } from "../../../packages/schema/src";

export type ArtifactError = { code: string; location: string; message: string };
export type ArtifactValidation = { valid: boolean; errors: ArtifactError[]; artifact: Artifact | null };
export type Artifact = ArtifactSpec;

export function loadArtifact(path: string): ArtifactValidation {
  try {
    const parsed = parseArtifactText(readFileSync(path, "utf8"));
    const missingClientRef = clientRefError(parsed);
    if (missingClientRef) {
      return { valid: false, errors: [missingClientRef], artifact: null };
    }
    const result = artifactSchema.safeParse(parsed);
    if (!result.success) {
      return { valid: false, errors: result.error.issues.map(issueToError), artifact: null };
    }
    return { valid: true, errors: [], artifact: normalizeArtifact(result.data) };
  } catch (error) {
    return { valid: false, errors: [{ code: "MALFORMED_ARTIFACT", location: "$", message: errorMessage(error) }], artifact: null };
  }
}

export function previewArtifact(path: string): Artifact | Error {
  const validation = loadArtifact(path);
  if (!validation.valid || !validation.artifact) {
    return new Error(validation.errors[0]?.message ?? "Invalid artifact.");
  }
  return validation.artifact;
}

function parseArtifactText(text: string): unknown {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }
  return parseFlatYaml(trimmed);
}

function parseFlatYaml(text: string): Record<string, string> {
  if (text.includes("[unterminated")) {
    throw new Error("Malformed YAML.");
  }
  return Object.fromEntries(text.split(/\r?\n/).filter(Boolean).map(parseYamlLine));
}

function parseYamlLine(line: string): [string, string] {
  const index = line.indexOf(":");
  if (index < 1) {
    throw new Error(`Malformed YAML line: ${line}`);
  }
  return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['\"]|['\"]$/g, "")];
}

function clientRefError(parsed: unknown): ArtifactError | null {
  if (!isRecord(parsed)) {
    return null;
  }
  if ((parsed.kind === "Cronlet" || parsed.kind === "Pack") && typeof parsed.client_ref !== "string") {
    return { code: "MISSING_CLIENT_REF", location: "client_ref", message: "client_ref is required." };
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function issueToError(issue: z.ZodIssue): ArtifactError {
  const location = issue.path.join(".") || "$";
  return { code: errorCode(location, issue.code), location, message: issue.message };
}

function errorCode(location: string, code: string): string {
  if (location === "client_ref") {
    return "MISSING_CLIENT_REF";
  }
  return code === "invalid_union" ? "WRONG_ARTIFACT_KIND" : "SCHEMA_VALIDATION_FAILED";
}

function normalizeArtifact(artifact: Artifact): Artifact {
  return artifact;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown artifact error.";
}
