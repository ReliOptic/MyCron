import { z } from "zod";

export const apiVersion = "mycron/v0";
export const cliVersion = "0.0.0";

export const metaSchema = z.object({
  api_version: z.literal(apiVersion),
  cli_version: z.string().min(1),
  command: z.string().min(1),
  request_id: z.string().min(1),
  account_id: z.string().nullable(),
});

export const okEnvelopeSchema = z.object({
  meta: metaSchema,
  status: z.literal("ok"),
  result: z.object({ outcome: z.string().min(1) }).passthrough(),
  next_command: z.string().nullable(),
});

export const errorEnvelopeSchema = z.object({
  meta: metaSchema,
  status: z.literal("error"),
  error: z.object({
    code: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
    message: z.string().min(1),
  }),
  result: z.object({ outcome: z.string().min(1) }).passthrough().optional(),
  next_command: z.string().nullable(),
});

export const envelopeSchema = z.union([okEnvelopeSchema, errorEnvelopeSchema]);
export type OkEnvelope = z.infer<typeof okEnvelopeSchema>;
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
export type Envelope = z.infer<typeof envelopeSchema>;
