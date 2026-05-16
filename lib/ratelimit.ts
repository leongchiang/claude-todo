/**
 * In-memory per-user rate limit. Sliding-fixed-window: 60 requests per
 * 60 seconds per user. Process-local — fine for the tutorial / single
 * instance; multi-instance deployments need Redis-backed buckets.
 */

const WINDOW_MS = 60_000;
const LIMIT = 60;

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(userId: string, now: number = Date.now()): RateLimitResult {
  const bucket = buckets.get(userId);
  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    buckets.set(userId, { count: 1, windowStart: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (bucket.count >= LIMIT) {
    const retryAfterSeconds = Math.ceil((WINDOW_MS - (now - bucket.windowStart)) / 1000);
    return { allowed: false, retryAfterSeconds };
  }
  bucket.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Test-only: clear all buckets between cases. */
export function _resetRateLimitForTesting(): void {
  buckets.clear();
}
