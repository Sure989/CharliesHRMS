// Simple in-memory cache for metrics (replace with Redis for production)
const cache: Record<string, { data: any, expires: number }> = {};

export function setCache(key: string, data: any, ttlMs: number) {
  cache[key] = { data, expires: Date.now() + ttlMs };
}

export function getCache(key: string) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    delete cache[key];
    return null;
  }
  return entry.data;
}
