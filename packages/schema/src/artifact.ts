import { z } from "zod";

export const cronletSpecSchema = z.object({
  schema: z.literal("mycron/v0"),
  kind: z.literal("Cronlet"),
  client_ref: z.string().regex(/^[a-z0-9-]+:[a-z0-9-]+$/),
  name: z.string().optional(),
  schedule: z.string().optional(),
  timezone: z.string().optional(),
  action_type: z.string().optional(),
  args: z.record(z.unknown()).optional(),
});

export const packSpecSchema = z.object({
  schema: z.literal("mycron/v0"),
  kind: z.literal("Pack"),
  client_ref: z.string().regex(/^[a-z0-9-]+:[a-z0-9-]+$/),
  name: z.string().optional(),
  cronlets: z.array(cronletSpecSchema).optional(),
});

export const memorySpecSchema = z.object({
  schema: z.literal("mycron.memory/v0"),
  kind: z.union([z.literal("MemoryItem"), z.literal("MemoryMigration")]),
  content: z.string().optional(),
  client_ref: z.string().optional(),
  source: z.string().optional(),
  candidates: z.array(z.object({ client_ref: z.string() })).optional(),
  domain: z.string().optional(),
  type: z.string().optional(),
});

export const artifactSchema = z.union([cronletSpecSchema, packSpecSchema, memorySpecSchema]);

export type CronletSpec = z.infer<typeof cronletSpecSchema>;
export type PackSpec = z.infer<typeof packSpecSchema>;
export type MemorySpec = z.infer<typeof memorySpecSchema>;
export type ArtifactSpec = z.infer<typeof artifactSchema>;
