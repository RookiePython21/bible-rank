import "server-only";

/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Good enough for MVP launch, but each serverless instance keeps its own
 * counters, so the effective limit multiplies with concurrent instances on
 * Vercel. If abuse becomes a real problem, swap this for Upstash Redis
 * (@upstash/ratelimit) without changing call sites — see isRateLimited().
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}

export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
