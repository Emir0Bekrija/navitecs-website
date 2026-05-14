import "server-only";

type CacheEntry<T> = { data: T; expiresAt: number };

const store = new Map<string, CacheEntry<unknown>>();

const globalForCache = globalThis as unknown as {
  __memCache: Map<string, CacheEntry<unknown>>;
};
if (!globalForCache.__memCache) globalForCache.__memCache = store;
const cache = globalForCache.__memCache;

/** No automatic expiry — all eviction is explicit via invalidate/invalidatePrefix. */
const DEFAULT_TTL_MS = Infinity;

/**
 * Get-or-set: returns cached value if fresh, otherwise calls `fn`, caches, and returns.
 * `ttl` is in milliseconds (default 5 min).
 */
export async function cached<T>(
  key: string,
  fn: () => Promise<T>,
  ttl = DEFAULT_TTL_MS,
): Promise<T> {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data;
  }

  const data = await fn();
  cache.set(key, { data, expiresAt: Date.now() + ttl });
  return data;
}

/** Invalidate a single key. */
export function invalidate(key: string): void {
  cache.delete(key);
}

/** Invalidate all keys that start with the given prefix. */
export function invalidatePrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

/** Invalidate everything. */
export function invalidateAll(): void {
  cache.clear();
}
