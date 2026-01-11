import { FieldDefinition, PropertyInput } from "../schema/fields.js";

export function systemPrompt(): string {
  return [
    "You are a real-estate market analysis extraction engine.",
    "Return ONLY JSON that matches the provided schema (Structured Outputs is enabled).",
    "Never invent parcel IDs, flood zones, school assignments, HOA dues, or sale history.",
    "If you cannot verify, set value=null and explain why.",
    "If sources conflict, set status='conflict' and include multiple sources + explanation.",
  ].join("\n");
}

export function userPrompt(args: {
  properties: PropertyInput[];
  fields: FieldDefinition[];
  knownData?: Record<string, any>;
  sources: { propertyId: string; items: Array<{ url: string; title?: string; snippet?: string; extracted?: string }> }[];
}): string {
  const { properties, fields, knownData = {}, sources } = args;

  return [
    "PROPERTIES:",
    JSON.stringify(properties, null, 2),
    "",
    "FIELDS (fill EACH for EACH property):",
    JSON.stringify(fields, null, 2),
    "",
    "KNOWN_DATA (authoritative pipeline facts; use where present):",
    JSON.stringify(knownData, null, 2),
    "",
    "WEB_SOURCES (snippets/extracts). Use these for verification & citations:",
    JSON.stringify(sources, null, 2),
    "",
    "OUTPUT RULES:",
    "- Output an array of FieldBundle objects (key,label,values{A/B/C}).",
    "- For each field, include a value object per property id in PROPERTIES.",
    "- Each FieldValue must include: value, unit, status, confidence, sources[], notes.",
    "- sources[] must include URLs used (or empty array if not_found).",
  ].join("\n");
}
