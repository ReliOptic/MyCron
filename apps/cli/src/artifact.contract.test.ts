import { describe, expect, it } from "vitest";
import { artifactSchema, cronletSpecSchema, memorySpecSchema, packSpecSchema } from "../../../packages/schema/src";

const cronletFixture = {
  schema: "mycron/v0",
  kind: "Cronlet",
  client_ref: "agent:daily-backup",
  name: "Daily backup",
  schedule: "0 9 * * *",
  timezone: "Asia/Seoul",
  action_type: "email.send",
  args: { to: "ops@example.com", subject: "Backup", body: "Done" },
};

const packFixture = {
  schema: "mycron/v0",
  kind: "Pack",
  client_ref: "agent:ops-pack",
  name: "Ops pack",
  cronlets: [cronletFixture],
};

const memoryFixture = {
  schema: "mycron.memory/v0",
  kind: "MemoryItem",
  content: "Prefer concise copy.",
  client_ref: "agent:copy",
  domain: "product",
  type: "preference",
};

describe("canonical artifact schema", () => {
  it("accepts valid Cronlet, Pack, and MemoryItem fixtures", () => {
    expect(cronletSpecSchema.safeParse(cronletFixture).success).toBe(true);
    expect(packSpecSchema.safeParse(packFixture).success).toBe(true);
    expect(memorySpecSchema.safeParse(memoryFixture).success).toBe(true);
    expect(artifactSchema.safeParse(cronletFixture).success).toBe(true);
    expect(artifactSchema.safeParse(packFixture).success).toBe(true);
    expect(artifactSchema.safeParse(memoryFixture).success).toBe(true);
  });

  it("rejects wrong kind, bad client_ref, and wrong schema literal", () => {
    expect(artifactSchema.safeParse({ ...cronletFixture, kind: "Task" }).success).toBe(false);
    expect(artifactSchema.safeParse({ ...cronletFixture, client_ref: "Agent:Daily" }).success).toBe(false);
    expect(artifactSchema.safeParse({ ...cronletFixture, schema: "mycron/v1" }).success).toBe(false);
  });
});
