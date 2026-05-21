import { Router, Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config';
import { verifyStreamToken, generateStreamToken } from '../utils/token';
import { logAccess } from '../services/playlist.service';
import { rateLimiter } from '../middleware/rate-limit';
import { logger } from '../utils/logger';

const router = Router();

router.get('/stream/:token', rateLimiter('stream'), async (req: Request, res: Response) => {
  const { token } = req.params;

  const payload = verifyStreamToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired stream token' });
    return;
  }

  const { storeCode, tvCode, mediaId } = payload;

  try {
    const mediaRes = await axios.get(`${config.apiUrl}/api/media/${mediaId}`, {
      headers: { Authorization: `Bearer ${config.jwtSecret}` },
      timeout: 10000,
    });

    const media = mediaRes.data;
    const mediaUrl = media.url || media.fileUrl || media.path;

    if (!mediaUrl) {
      res.status(404).json({ error: 'Media URL not found' });
      return;
    }

    await logAccess(
      storeCode,
      tvCode || 'unknown',
      req.ip || req.socket.remoteAddress || 'unknown',
      'stream_redirect',
      'success'
    );

    res.redirect(302, mediaUrl);
  } catch (err: any) {
    logger.error('Stream error', err);
    if (err.response?.status === 404) {
      res.status(404).json({ error: 'Media not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to resolve media stream' });
  }
});

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

router.get('/health/ready', async (_req: Request, res: Response) => {
  const checks: Record<string, string> = {};

  try {
    await axios.get(`${config.apiUrl}/api/health`, { timeout: 3000 });
    checks.api = 'ok';
  } catch {
    checks.api = 'unreachable';
  }

  try {
    const Redis = require('ioredis');
    const redis = new Redis(config.redisUrl);
    await redis.ping();
    checks.redis = 'ok';
    redis.disconnect();
  } catch {
    checks.redis = 'unreachable';
  }

  const allOk = Object.values(checks).every((v) => v === 'ok');
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    checks,
    timestamp: new Date().toISOString(),
  });
});

router.get('/health/live', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

export default router;
