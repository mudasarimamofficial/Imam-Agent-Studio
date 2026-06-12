/**
 * Sliding-window rate limiter, in-memory per server instance.
 * Good enough to stop API-budget drain from a single deployment;
 * swap for a Redis/Upstash store if the app scales horizontally.
 */

const windows = new Map<string, number[]>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  userId: string,
  route: string,
  limit: number,
  windowMs: number = 60_000
): RateLimitResult {
  const key = `${userId}:${route}`;
  const now = Date.now();
  const hits = (windows.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    const oldest = Math.min(...hits);
    windows.set(key, hits);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  hits.push(now);
  windows.set(key, hits);

  // Opportunistic cleanup so the map can't grow unbounded.
  if (windows.size > 10_000) {
    for (const [k, v] of windows) {
      if (v.every((t) => now - t >= windowMs)) windows.delete(k);
    }
  }

  return { allowed: true, remaining: limit - hits.length, retryAfterSeconds: 0 };
}

/** Per-route budgets (requests per minute per user). */
export const RATE_LIMITS = {
  agents: 10,
  workflow: 6,
  hunt: 10,
} as const;
