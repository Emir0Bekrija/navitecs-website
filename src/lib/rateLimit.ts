type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

// Prune expired entries when the store grows large
function pruneIfNeeded() {
  if (store.size < 5000) return;
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/**
 * Sliding fixed-window rate limiter.
 * @param key      Unique key (e.g. "contact:1.2.3.4")
 * @param limit    Max requests allowed in the window
 * @param windowMs Window duration in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfter: number } {
  pruneIfNeeded();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { ok: true, retryAfter: 0 };
}

/** Extract the real client IP from a request's headers. */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();
  const ip = forwarded ?? realIp ?? "unknown";
  // Normalize IPv6 loopback → readable localhost label
  if (ip === "::1" || ip === "::ffff:127.0.0.1") return "127.0.0.1";
  return ip;
}
