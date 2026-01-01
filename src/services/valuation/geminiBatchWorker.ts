/**
 * Gemini 2.0 Flash Batch Worker - Tier 3.5 Field Extraction
 *
 * Executes 3 specialist batches in parallel using Promise.allSettled
 * for graceful degradation (one batch failure doesn't kill the others).
 *
 * Uses Zod schemas converted to Gemini JSON format with county-specific portal URLs.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  getBatch1Instructions,
  BATCH_1_SCHEMA,
  BATCH_2_INSTRUCTIONS,
  BATCH_2_SCHEMA,
  BATCH_3_INSTRUCTIONS,
  BATCH_3_SCHEMA,
  TIER_35_FIELD_IDS
} from "./geminiConfig.js";
import {
  safeParseBatch1,
  safeParseBatch2,
  safeParseBatch3
} from "./geminiZodSchemas.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Configuration for Gemini 2.0 Flash generation
 * - Temperature 0: Deterministic, no creativity
 * - JSON mode: Structured output only
 * - Max tokens: 8192 (executive ceiling for safety)
 */
const generationConfig = {
  temperature: 0,
  topP: 0.95,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

/**
 * Main entry point: Fetches all 20 Tier 3.5 fields in parallel
 *
 * @param address - Full property address
 * @param county - County name (e.g., "Hillsborough", "Pinellas")
 * @returns Mapped field results in app's standard format
 */
export async function fetchAllMissingFields(
  address: string,
  county: string
): Promise<Record<number, any>> {

  // Construct full address with county for better search accuracy
  const fullAddress = `${address}, ${county} County, Florida`;

  console.log(`[Tier 3.5] Starting Gemini batch extraction for: ${fullAddress}`);

  // Generate county-specific instructions for Batch 1
  const batch1Instructions = getBatch1Instructions(county);

  // Execute all 3 batches in parallel using Promise.allSettled
  // This ensures that if one batch fails (e.g., county site down),
  // the other batches still complete and return data
  const settledResults = await Promise.allSettled([
    executeWorker(fullAddress, "Batch 1: Public Records", batch1Instructions, BATCH_1_SCHEMA, safeParseBatch1),
    executeWorker(fullAddress, "Batch 2: Neighborhood", BATCH_2_INSTRUCTIONS, BATCH_2_SCHEMA, safeParseBatch2),
    executeWorker(fullAddress, "Batch 3: Portals", BATCH_3_INSTRUCTIONS, BATCH_3_SCHEMA, safeParseBatch3)
  ]);

  // Merge successful results
  const rawMergedData: Record<string, any> = {};

  settledResults.forEach((result, index) => {
    const batchName = ["Public Records", "Neighborhood", "Portals"][index];

    if (result.status === 'fulfilled') {
      console.log(`[Tier 3.5] ${batchName} batch succeeded`);
      Object.assign(rawMergedData, result.value);
    } else {
      console.error(`[Tier 3.5] ${batchName} batch FAILED:`, result.reason);
      // Failed batch fields will remain null and fall through to Tier 4
    }
  });

  // Log extraction summary
  const extractedFields = Object.keys(rawMergedData).filter(k => rawMergedData[k] !== null);
  console.log(`[Tier 3.5] Extracted ${extractedFields.length}/20 fields:`, extractedFields);

  // Convert Gemini's output format to app's field structure
  return mapGeminiResultToFields(rawMergedData);
}

/**
 * Executes a single batch worker
 *
 * @param address - Full address string with county
 * @param batchName - Name for logging purposes
 * @param instructions - System instructions for this batch
 * @param schema - JSON schema for structured output
 * @param validator - Zod safeParse function for validation
 * @returns Raw JSON response from Gemini
 */
async function executeWorker(
  address: string,
  batchName: string,
  instructions: string,
  schema: any,
  validator: (data: unknown) => any
): Promise<Record<string, any>> {

  const startTime = Date.now();

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp",
      tools: [{ googleSearch: {} }] as any, // Enable Google Search grounding
    });

    // Normalize address for better search results (COURT → CT, STREET → ST, etc.)
    const normalizedAddress = address
      .replace(/\bCOURT\b/gi, 'CT')
      .replace(/\bSTREET\b/gi, 'ST')
      .replace(/\bDRIVE\b/gi, 'DR')
      .replace(/\bAVENUE\b/gi, 'AVE')
      .replace(/\bBOULEVARD\b/gi, 'BLVD');

    // Add search hints based on batch type
    let searchHint = address;
    if (batchName.includes('Public Records')) {
      // For Batch 1: Add "Property Appraiser" and "building permits" to prioritize .gov sites
      const county = address.match(/,\s*(\w+)\s+County/)?.[1] || '';
      searchHint = `${address} AND ${normalizedAddress} ${county} County Property Appraiser building permits tax records`;
    } else if (batchName.includes('Neighborhood')) {
      // For Batch 2: Add WalkScore and market data hints
      searchHint = `${address} WalkScore transit bike score median home price days on market`;
    } else if (batchName.includes('Portals')) {
      // For Batch 3: Add Zillow/Redfin hints
      searchHint = `${address} Zestimate "Redfin Estimate" rental estimate HOA`;
    }

    const prompt = `Address: ${searchHint}\n\n${instructions}`;

    console.log(`[Tier 3.5 DEBUG] ${batchName} search hint:`, searchHint);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        ...generationConfig,
        responseSchema: schema // Force structured JSON output
      }
    });

    const duration = Date.now() - startTime;
    console.log(`[Tier 3.5] ${batchName} completed in ${duration}ms`);

    // Parse JSON response
    const response = result.response.text();
    console.log(`[Tier 3.5 DEBUG] ${batchName} raw response:`, response);

    const parsedData = JSON.parse(response);
    console.log(`[Tier 3.5 DEBUG] ${batchName} parsed data:`, JSON.stringify(parsedData, null, 2));

    // Count non-null fields
    const nonNullCount = Object.values(parsedData).filter(v => v !== null).length;
    console.log(`[Tier 3.5 DEBUG] ${batchName} returned ${nonNullCount} non-null fields`);

    // Validate with Zod
    const validation = validator(parsedData);

    if (!validation.success) {
      console.warn(`[Tier 3.5] ${batchName} validation warnings:`, validation.error.issues);
      // Return data anyway - Zod just logs issues but doesn't block
    }

    return parsedData;

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Tier 3.5] ${batchName} error after ${duration}ms:`, error);
    throw error; // Will be caught by Promise.allSettled
  }
}

/**
 * Maps Gemini's output format to app's field structure
 *
 * Input:  { "37_tax_rate": 1.85, "60_roof_permit": "2021", ... }
 * Output: {
 *   37: { value: 1.85, source: "Gemini Tier 3.5", tier: 3.5, ... },
 *   60: { value: "2021", source: "Gemini Tier 3.5", tier: 3.5, ... }
 * }
 *
 * @param geminiResult - Raw JSON from Gemini batches
 * @returns Mapped fields in app's standard format
 */
function mapGeminiResultToFields(geminiResult: Record<string, any>): Record<number, any> {
  const finalFields: Record<number, any> = {};

  Object.keys(geminiResult).forEach(key => {
    // Extract field number from key (e.g., "37_tax_rate" -> 37)
    const fieldId = parseInt(key.split('_')[0]);

    if (!isNaN(fieldId) && TIER_35_FIELD_IDS.includes(fieldId)) {
      const value = geminiResult[key];

      finalFields[fieldId] = {
        value: value,
        source: value !== null ? 'Gemini 2.0 Search (Tier 3.5)' : null,
        tier: 3.5,
        confidence: value !== null ? 'High' : 'Low',
        timestamp: new Date().toISOString(),
        metadata: {
          extractionMethod: 'google_search_grounding',
          batchExtraction: true
        }
      };
    }
  });

  return finalFields;
}

/**
 * Helper: Check if any Tier 3.5 fields are null and need extraction
 *
 * @param fields - Current field state
 * @returns True if any Tier 3.5 fields need data
 */
export function needsTier35Extraction(fields: Record<number, any>): boolean {
  return TIER_35_FIELD_IDS.some(fieldId => {
    const field = fields[fieldId];
    return !field || field.value === null || field.tier > 3.5;
  });
}
