export type FieldStatus = "found" | "not_found" | "conflict" | "estimate";
export type Confidence = "high" | "medium" | "low";

export type FieldDefinition = {
  key: string;
  label: string;
  // Optional hints used by the pipeline for routing
  group?: string;
  type?: "string" | "number" | "boolean" | "currency" | "date" | "percent" | "enum";
  needsWeb?: boolean;
};

export type PropertyInput = {
  id: string;          // e.g., "A", "B", "C"
  address: string;     // normalized human address
  extra?: Record<string, unknown>;
};

export type FieldValue = {
  value: string | number | boolean | null;
  unit: string | null;
  status: FieldStatus;
  confidence: Confidence;
  sources: string[];
  notes: string;
};

export type FieldBundle = {
  key: string;
  label: string;
  values: Record<string, FieldValue>; // keyed by property id
};
