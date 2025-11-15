// src/lib/utils/rateLimiter.ts
// Simple in-memory rate limiter keyed by user or IP.
// NOTE: Works for a single runtime instance. For distributed deployments,
// adopt a shared store such as Redis or Upstash.

const buckets = new Map<string, { hits: number; resetAt: number }>();

export class RateLimitError extends Error {
  status: number;

  constructor(message: string, status = 429) {
    super(message);
    this.name = "RateLimitError";
    this.status = status;
  }
}

export async function enforceRateLimit({
  key,
  limit,
  windowMs,
  message = "Too many requests. Please try again later.",
}: {
  key: string;
  limit: number;
  windowMs: number;
  message?: string;
}): Promise<void> {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { hits: 1, resetAt: now + windowMs });
    return;
  }

  if (bucket.hits >= limit) {
    throw new RateLimitError(message);
  }

  bucket.hits += 1;
}
