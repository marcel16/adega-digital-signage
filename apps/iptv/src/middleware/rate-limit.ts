import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

const redis = new Redis(config.redisUrl);

const limits: Record<string, number> = {
  m3u: 30,
  stream: 100,
};

export function rateLimiter(type: 'm3u' | 'stream') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `rate:${type}:${ip}`;
    const max = limits[type];

    try {
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, 60);
      }
      const ttl = await redis.ttl(key);

      if (current > max) {
        res.set('Retry-After', String(ttl));
        res.status(429).json({ error: 'Too many requests', retryAfter: ttl });
        return;
      }

      res.set('X-RateLimit-Limit', String(max));
      res.set('X-RateLimit-Remaining', String(max - current));
      res.set('X-RateLimit-Reset', String(ttl));
      next();
    } catch (err) {
      logger.error('Rate limiter error', err);
      next();
    }
  };
}
