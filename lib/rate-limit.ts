import crypto from "crypto";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Map<string, RateLimitEntry>>();

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Extracts the client IP conservatively without trusting client-spoofed leftmost
 * X-Forwarded-For values. Standard reverse proxies (Nginx, Cloudflare, ALB)
 * append the connecting peer IP as the rightmost X-Forwarded-For entry.
 */
export function getClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp && cfIp.length <= 64) {
    return cfIp;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return parts[parts.length - 1].slice(0, 64);
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp && realIp.length <= 64) {
    return realIp;
  }

  return "unknown";
}

/**
 * Bounded-memory fixed-window rate limiter.
 * Prevents unbounded Map growth under IP/key-rotation floods and never extends
 * window reset times on rejected requests.
 */
export function checkRateLimit(
  bucketName: string,
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const maxKeys = options.maxKeys ?? 5000;
  let store = buckets.get(bucketName);
  if (!store) {
    store = new Map<string, RateLimitEntry>();
    buckets.set(bucketName, store);
  }

  // Prune expired entries when store approaches capacity
  if (store.size >= maxKeys) {
    for (const [k, entry] of store.entries()) {
      if (now >= entry.resetAt) {
        store.delete(k);
      }
    }
    // Hard cap eviction (FIFO/oldest) if still at limit
    while (store.size >= maxKeys) {
      const oldestKey = store.keys().next().value;
      if (oldestKey === undefined) break;
      store.delete(oldestKey);
    }
  }

  const existing = store.get(key);
  if (!existing || now >= existing.resetAt) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return {
      allowed: true,
      remaining: Math.max(0, options.limit - 1),
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, options.limit - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

export function resetRateLimit(bucketName: string, key: string): void {
  buckets.get(bucketName)?.delete(key);
}

/**
 * Constant-time string comparison that hashes both inputs with SHA-256 first
 * so secret byte length is never leaked via early-return timing side channels.
 */
export function safeSecretCompare(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const hashA = crypto.createHash("sha256").update(provided, "utf8").digest();
  const hashB = crypto.createHash("sha256").update(expected, "utf8").digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

