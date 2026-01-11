import { z } from "zod";
import { openai } from "./openai.js";
import { MODELS } from "../config/models.js";
import { FieldDefinition, PropertyInput, FieldBundle } from "../schema/fields.js";
import { FieldBundleSchema } from "../schema/resultSchema.js";
import { systemPrompt, userPrompt } from "./prompts.js";
import { clampText } from "../utils/chunk.js";
import { log } from "../utils/log.js";

/**
 * Build a Structured Outputs JSON schema dynamically.
 * This keeps output strict without hardcoding 181 keys.
 */
function buildJsonSchema(propertyIds: string[]) {
  // Note: We validate again with Zod after parse.
  return {
    type: "array",
    items: {
      type: "object",
      additionalProperties: false,
      properties: {
        key: { type: "string" },
        label: { type: "string" },
        values: {
          type: "object",
          additionalProperties: false,
          properties: Object.fromEntries(propertyIds.map(id => [id, {
            type: "object",
            additionalProperties: false,
            properties: {
              value: { type: ["string", "number", "boolean", "null"] },
              unit: { type: ["string", "null"] },
              status: { type: "string", enum: ["found", "not_found", "conflict", "estimate"] },
              confidence: { type: "string", enum: ["high", "medium", "low"] },
              sources: { type: "array", items: { type: "string" }, maxItems: 8 },
              notes: { type: "string" },
            },
            required: ["value","unit","status","confidence","sources","notes"],
          }]))
          ,
          required: propertyIds,
        }
      },
      required: ["key","label","values"],
    }
  } as const;
}

export async function extractFieldBatch(args: {
  properties: PropertyInput[];
  fields: FieldDefinition[];
  knownData?: Record<string, any>;
  sources: { propertyId: string; items: Array<{ url: string; title?: string; snippet?: string; extracted?: string }> }[];
  preferFallbackModel?: boolean;
  maxInputChars: number;
}): Promise<FieldBundle[]> {
  const { properties, fields, knownData, sources, preferFallbackModel, maxInputChars } = args;
  const propertyIds = properties.map(p => p.id);

  const model = preferFallbackModel ? MODELS.fallback : MODELS.primary;

  const sp = systemPrompt();
  const up = userPrompt({ properties, fields, knownData, sources });

  const inputText = clampText(up, maxInputChars);

  log.info("LLM batch", { model, fields: fields.length, properties: properties.length });

  const response = await openai.responses.create({
    model,
    input: [
      { role: "system", content: sp },
      { role: "user", content: inputText },
    ],
    temperature: 0,
    text: {
      format: {
        type: "json_schema",
        name: "field_batch",
        strict: true,
        schema: buildJsonSchema(propertyIds),
      }
    }
  });

  const raw = response.output_text;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e: any) {
    throw new Error(`OpenAI returned non-JSON. First 300 chars: ${String(raw).slice(0,300)}`);
  }

  // Validate each bundle
  const arr = z.array(FieldBundleSchema).parse(parsed);
  // Extra sanity: ensure we got the same number of fields
  if (arr.length !== fields.length) {
    log.warn("Field count mismatch (model output vs requested)", { requested: fields.length, got: arr.length });
  }
  return arr as FieldBundle[];
}
