import { FieldDefinition, PropertyInput } from "../schema/fields.js";

/**
 * Build a single compact query for a batch of fields for a given property.
 * You can customize this to be more domain-specific (Pinellas, FEMA, county appraiser, etc.).
 */
export function buildQuery(property: PropertyInput, fields: FieldDefinition[]): string {
  const fieldHints = fields.map(f => f.label).slice(0, 12).join(", ");
  return `${property.address} (${property.id}) data for: ${fieldHints}`;
}
