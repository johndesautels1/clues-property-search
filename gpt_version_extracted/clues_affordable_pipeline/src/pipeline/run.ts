import fs from "node:fs";
import path from "node:path";
import { PIPELINE } from "../config/pipeline.js";
import { MODELS } from "../config/models.js";
import { log } from "../utils/log.js";
import { FieldDefinition, PropertyInput, FieldBundle } from "../schema/fields.js";
import { buildQuery } from "../search/queryBuilder.js";
import { tavilySearch, tavilyExtract } from "../search/tavily.js";
import { extractFieldBatch } from "../llm/extractFields.js";
import { PipelineResponseSchema, type PipelineResponse } from "../schema/resultSchema.js";
import { clampText } from "../utils/chunk.js";

function loadSchema(schemaPath: string): FieldDefinition[] {
  const abs = path.isAbsolute(schemaPath) ? schemaPath : path.join(process.cwd(), schemaPath);
  const raw = fs.readFileSync(abs, "utf-8");
  const json = JSON.parse(raw);
  if (!Array.isArray(json)) throw new Error("Schema must be an array of FieldDefinition objects.");
  return json as FieldDefinition[];
}

function chunkFields(fields: FieldDefinition[], size: number): FieldDefinition[][] {
  const out: FieldDefinition[][] = [];
  for (let i = 0; i < fields.length; i += size) out.push(fields.slice(i, i + size));
  return out;
}

function mergeBundles(all: FieldBundle[]): FieldBundle[] {
  // last-write-wins by key (batches shouldn't overlap; but safe)
  const map = new Map<string, FieldBundle>();
  for (const b of all) map.set(b.key, b);
  return Array.from(map.values());
}

export async function runPipeline(args: {
  properties: PropertyInput[];
  schemaPath: string;
  knownData?: Record<string, any>;
  options?: {
    maxBatches?: number;
    tavilySearchDepth?: "basic" | "fast" | "ultra-fast" | "advanced";
    tavilyMaxResults?: number;
    useExtract?: boolean;
    preferFallbackModel?: boolean;
  };
}): Promise<PipelineResponse> {
  const { properties, schemaPath, knownData = {}, options = {} } = args;

  if (!properties?.length) throw new Error("properties[] is required");

  const fields = loadSchema(schemaPath);

  const batches = chunkFields(fields, PIPELINE.BATCH_SIZE)
    .slice(0, options.maxBatches ?? 999);

  const useExtract = options.useExtract ?? PIPELINE.USE_EXTRACT;

  const allBundles: FieldBundle[] = [];

  for (let bi = 0; bi < batches.length; bi++) {
    const batchFields = batches[bi];
    log.info(`Batch ${bi+1}/${batches.length}`, { fields: batchFields.length });

    // For each property, run a Tavily search for this batch.
    const webSources = [];
    for (const p of properties) {
      const query = buildQuery(p, batchFields);

      const searchResults = await tavilySearch({
        query,
        search_depth: options.tavilySearchDepth ?? PIPELINE.TAVILY_SEARCH_DEPTH,
        max_results: options.tavilyMaxResults ?? PIPELINE.TAVILY_MAX_RESULTS,
        include_answer: false,
        include_raw_content: false,
        auto_parameters: false, // IMPORTANT: don't let Tavily auto-switch to advanced unless you choose it
        chunks_per_source: 2,
      });

      // optional extract on top 2 sources
      let extracts: Record<string, string> = {};
      if (useExtract) {
        const topUrls = searchResults.slice(0, 2).map(r => r.url);
        try {
          const ext = await tavilyExtract({ urls: topUrls, extract_depth: "basic" });
          for (const item of ext) {
            const txt = item.raw_content ?? item.content ?? "";
            extracts[item.url] = clampText(txt, 4000);
          }
        } catch (e) {
          log.warn("Tavily extract failed (continuing with snippets)", String(e));
        }
      }

      webSources.push({
        propertyId: p.id,
        items: searchResults.map(r => ({
          url: r.url,
          title: r.title,
          snippet: clampText(r.content ?? "", 800),
          extracted: extracts[r.url] ?? undefined,
        })),
      });
    }

    const batchBundles = await extractFieldBatch({
      properties,
      fields: batchFields,
      knownData,
      sources: webSources,
      preferFallbackModel: options.preferFallbackModel ?? false,
      maxInputChars: PIPELINE.MAX_INPUT_CHARS,
    });

    allBundles.push(...batchBundles);
  }

  const merged = mergeBundles(allBundles);

  const out: PipelineResponse = {
    meta: {
      generated_at_iso: new Date().toISOString(),
      model_primary: MODELS.primary,
      model_fallback: MODELS.fallback,
      properties_count: properties.length,
      fields_count: fields.length,
      batches: batches.length,
    },
    fields: merged,
  };

  return PipelineResponseSchema.parse(out);
}
