import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  skipInTest?: boolean;
}

/**
 * Creates an in-memory rate limiting middleware.
 * Tracks client IP requests within a sliding time window.
 * 
 * ARCHITECTURAL LIMITATIONS & DEPLOYMENT ASSUMPTIONS:
 * 1. In-Memory Process Scope:
 *    - State is maintained in a local Map<string, RateLimitRecord> per Node.js process.
 *    - In multi-instance / clustered deployments (Kubernetes, AWS ECS, PM2 cluster),
 *      request counts are NOT shared between instances, allowing distributed clients
 *      to make N * max requests across N replicas.
 *    - Process restarts or container redeployments immediately reset active rate limit counters.
 * 2. Reverse Proxy & IP Derivation:
 *    - Derives IP from the first address in the `x-forwarded-for` header or `req.ip`.
 *    - In production behind reverse proxies (Nginx, Cloudflare, AWS ALB), Express must be
 *      configured with `app.set('trust proxy', numberOfHops)` to prevent header spoofing.
 * 3. Production Recommendation:
 *    - For multi-instance production environments, replace the in-memory store with a distributed
 *      backend such as Redis (e.g. `express-rate-limit` + `rate-limit-redis`) with centralized TTL.
 */
export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = 'Too many requests. Please try again later.', skipInTest = true } = options;
  const ipStore = new Map<string, RateLimitRecord>();

  // Periodically clean up expired entries every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipStore.entries()) {
      if (now > record.resetTime) {
        ipStore.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  // Unref interval so it does not keep node process alive in tests
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    // If in test environment and skipInTest is true, bypass throttling
    if (skipInTest && process.env.NODE_ENV === 'test') {
      return next();
    }

    // Determine client identifier
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();
    const record = ipStore.get(clientIp);

    if (!record || now > record.resetTime) {
      ipStore.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', max - 1);
      return next();
    }

    if (record.count >= max) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.status(429).json({
        success: false,
        error: 'RateLimitError',
        message,
        retryAfterSeconds,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    record.count += 1;
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    return next();
  };
}
