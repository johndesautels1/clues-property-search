import LRU from "lru-cache";

const ttl = Number(process.env.PIPELINE_TAVILY_CACHE_TTL_SECONDS ?? 86400);

export const tavilyCache = new LRU<string, any>({
  max: 500,
  ttl: ttl * 1000,
});

export function cacheKey(parts: Record<string, any>): string {
  return JSON.stringify(parts);
}
