import { z } from "zod";

export const FieldValueSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  unit: z.union([z.string(), z.null()]),
  status: z.enum(["found", "not_found", "conflict", "estimate"]),
  confidence: z.enum(["high", "medium", "low"]),
  sources: z.array(z.string()).max(8),
  notes: z.string(),
});

export const FieldBundleSchema = z.object({
  key: z.string(),
  label: z.string(),
  values: z.record(FieldValueSchema),
});

export const PipelineResponseSchema = z.object({
  meta: z.object({
    generated_at_iso: z.string(),
    model_primary: z.string(),
    model_fallback: z.string(),
    properties_count: z.number(),
    fields_count: z.number(),
    batches: z.number(),
  }),
  fields: z.array(FieldBundleSchema),
});

export type PipelineResponse = z.infer<typeof PipelineResponseSchema>;
