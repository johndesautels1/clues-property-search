import { log } from "../utils/log.js";
import { tavilyCache, cacheKey } from "../utils/cache.js";

export type TavilySearchDepth = "basic" | "fast" | "ultra-fast" | "advanced";

export type TavilySearchParams = {
  query: string;
  search_depth: TavilySearchDepth;
  max_results: number;
  include_answer: boolean;
  include_raw_content: boolean;
  include_images?: boolean;
  include_domains?: string[];
  exclude_domains?: string[];
  auto_parameters?: boolean;
  chunks_per_source?: number;
};

export type TavilySearchResult = {
  title?: string;
  url: string;
  content?: string; // snippet
  score?: number;
};

export async function tavilySearch(params: TavilySearchParams): Promise<TavilySearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("Missing TAVILY_API_KEY");

  const key = cacheKey({ op: "search", ...params });
  const cached = tavilyCache.get(key);
  if (cached) return cached;

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Tavily /search error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const results: TavilySearchResult[] = (json?.results ?? []).map((r: any) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    score: r.score,
  }));

  tavilyCache.set(key, results);
  log.debug("Tavily search", { q: params.query, n: results.length });
  return results;
}

export type TavilyExtractParams = {
  urls: string[]; // Tavily extract supports one or more URLs
  include_images?: boolean;
  extract_depth?: "basic" | "advanced";
};

export type TavilyExtractItem = {
  url: string;
  raw_content?: string;
  content?: string;
};

export async function tavilyExtract(params: TavilyExtractParams): Promise<TavilyExtractItem[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("Missing TAVILY_API_KEY");

  const key = cacheKey({ op: "extract", ...params });
  const cached = tavilyCache.get(key);
  if (cached) return cached;

  const res = await fetch("https://api.tavily.com/extract", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Tavily /extract error ${res.status}: ${body}`);
  }

  const json = await res.json();
  const items: TavilyExtractItem[] = (json?.results ?? []).map((r: any) => ({
    url: r.url,
    raw_content: r.raw_content,
    content: r.content,
  }));

  tavilyCache.set(key, items);
  log.debug("Tavily extract", { n: items.length });
  return items;
}
