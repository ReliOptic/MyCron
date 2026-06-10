import { describe, expect, it } from "vitest";
import { runCli } from "./cli";

const env = { MYCRON_REQUEST_ID: "req_schema", MYCRON_ACCOUNT_ID: "acct_schema" };
const json = (stdout: string) => JSON.parse(stdout);

describe("schema introspection", () => {
  it("returns command schema derived from the CLI grammar", () => {
    const result = runCli(["schema", "command", "get", "cronlet.create", "--json"], env);
    expect(result.exitCode).toBe(0);
    const envelope = json(result.stdout);
    expect(envelope).toMatchObject({
      status: "ok",
      result: {
        outcome: "matched",
        resource: "schema",
        kind: "command",
        id: "cronlet.create",
        command: "cronlet create",
        required: ["file"],
      },
    });
    expect(envelope.result.properties).toHaveProperty("confirm");
    expect(envelope.result.properties).toHaveProperty("dry_run");
  });

  it("returns action planning metadata including capabilities", () => {
    const result = runCli(["schema", "action", "get", "email.send", "--json"], env);
    expect(result.exitCode).toBe(0);
    expect(json(result.stdout).result).toMatchObject({
      outcome: "matched",
      kind: "action",
      id: "email.send",
      action_class: "external",
      risk: "medium",
      requires_capabilities: ["email:send"],
      required: ["to", "subject", "body"],
    });
  });

  it("returns file schema for pack.mc", () => {
    const result = runCli(["schema", "file", "get", "pack.mc", "--json"], env);
    expect(result.exitCode).toBe(0);
    expect(json(result.stdout).result).toMatchObject({
      outcome: "matched",
      kind: "file",
      id: "pack.mc",
      required: ["schema", "kind", "client_ref"],
    });
    expect(json(result.stdout).result.properties.kind.enum).toEqual(["Cronlet", "Pack"]);
  });

  it("lists each namespace independently", () => {
    expect(json(runCli(["schema", "command", "list", "--json"], env).stdout).result.ids).toContain("cronlet.create");
    expect(json(runCli(["schema", "action", "list", "--json"], env).stdout).result.ids).toContain("email.send");
    expect(json(runCli(["schema", "file", "list", "--json"], env).stdout).result.ids).toContain("pack.mc");
  });

  it("does not resolve ids across schema namespaces", () => {
    const result = runCli(["schema", "command", "get", "email.send", "--json"], env);
    expect(result.exitCode).toBe(5);
    expect(json(result.stdout)).toMatchObject({
      status: "error",
      error: { code: "NOT_FOUND" },
    });
  });

  it("returns usage error for malformed schema usage", () => {
    const result = runCli(["schema", "thing", "list", "--json"], env);
    expect(result.exitCode).toBe(2);
    expect(json(result.stdout).error.code).toBe("USAGE_ERROR");
  });
});
