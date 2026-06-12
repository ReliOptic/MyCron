export type SchemaKind = "command" | "action" | "file";

export type ContractSchema = {
  id: string;
  required: string[];
  properties: Record<string, unknown>;
  command?: string;
  action_class?: "internal" | "external";
  risk?: "low" | "medium" | "high";
  requires_capabilities?: string[];
};

const commandSchemas: Record<string, ContractSchema> = {
  "cronlet.create": {
    id: "cronlet.create",
    command: "cronlet create",
    required: ["file"],
    properties: {
      file: { type: "string", description: ".mc Cronlet file" },
      dry_run: { type: "boolean" },
      confirm: { type: "boolean" },
      idempotency_key: { type: "string" },
    },
  },
  "schema.command.get": {
    id: "schema.command.get",
    command: "schema command get",
    required: ["id"],
    properties: { id: { type: "string" } },
  },
};

const actionSchemas: Record<string, ContractSchema> = {
  "email.send": {
    id: "email.send",
    required: ["to", "subject", "body"],
    properties: {
      to: { type: "string" },
      subject: { type: "string" },
      body: { type: "string" },
    },
    action_class: "external",
    risk: "medium",
    requires_capabilities: ["email:send"],
  },
  "memory.note": {
    id: "memory.note",
    required: ["content"],
    properties: { content: { type: "string" } },
    action_class: "internal",
    risk: "low",
    requires_capabilities: [],
  },
};

const fileSchemas: Record<string, ContractSchema> = {
  // Mirrors the canonical zod artifact schemas in packages/schema/src/artifact.ts; update both together.
  "pack.mc": {
    id: "pack.mc",
    required: ["schema", "kind", "client_ref"],
    properties: {
      schema: { const: "mycron/v0" },
      kind: { enum: ["Cronlet", "Pack"] },
      client_ref: { type: "string", pattern: "^[a-z0-9-]+:[a-z0-9-]+$" },
      name: { type: "string" },
      schedule: { type: "string" },
      timezone: { type: "string" },
      action_type: { type: "string" },
      args: { type: "object" },
    },
  },
  "routine.my": {
    id: "routine.my",
    required: ["schema", "kind", "content"],
    properties: {
      schema: { const: "mycron.memory/v0" },
      kind: { enum: ["MemoryItem", "MemoryMigration"] },
      content: { type: "string" },
      client_ref: { type: "string" },
    },
  },
};

export function listSchemaIds(kind: SchemaKind): string[] {
  return Object.keys(registryFor(kind)).sort();
}

export function getContractSchema(kind: SchemaKind, id: string): ContractSchema | null {
  return registryFor(kind)[id] ?? null;
}

export function isSchemaKind(value: string | null): value is SchemaKind {
  return value === "command" || value === "action" || value === "file";
}

function registryFor(kind: SchemaKind): Record<string, ContractSchema> {
  if (kind === "command") {
    return commandSchemas;
  }
  if (kind === "action") {
    return actionSchemas;
  }
  return fileSchemas;
}
