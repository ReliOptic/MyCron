import type { ExitCode } from "../../../packages/schema/src";

export type CliEnv = Readonly<Record<string, string | undefined>>;

export type CliResult = {
  stdout: string;
  stderr: string;
  exitCode: ExitCode;
};

export type ParsedCommand = {
  args: string[];
  canonicalCommand: string;
  outputJson: boolean;
  resource: string | null;
  verb: string | null;
  id: string | null;
  flags: Record<string, string | boolean>;
};
