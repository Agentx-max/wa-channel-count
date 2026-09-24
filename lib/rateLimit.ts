// =====================================================================
// Simple in-memory rate limiter for API routes
// =====================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    Array.from(store.entries()).forEach(([key, entry]) => {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

/**
 * Check and apply rate limit for an IP.
 * @returns true if the request is within the limit, false if it should be rejected.
 */
export function checkRateLimit(
  ip: string,
  maxRequests = 12,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Extract the client IP from a Next.js Request.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}
