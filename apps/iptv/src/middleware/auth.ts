import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { config } from '../config';
import { verifyToken } from '../utils/token';
import { logger } from '../utils/logger';

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = (req.query.token as string) || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Token is required' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  if (!payload.storeCode) {
    res.status(400).json({ error: 'Invalid token payload' });
    return;
  }

  try {
    const response = await axios.get(`${config.apiUrl}/api/stores/${payload.storeCode}`, {
      headers: { Authorization: `Bearer ${config.jwtSecret}` },
      timeout: 5000,
    });

    if (!response.data || response.status !== 200) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }

    (req as any).store = response.data;
    (req as any).storeCode = payload.storeCode;
    (req as any).tvCode = payload.tvCode || null;
    (req as any).tokenPayload = payload;

    try {
      await axios.post(`${config.apiUrl}/api/iptv/logs`, {
        storeCode: payload.storeCode,
        tvCode: payload.tvCode || null,
        ip: req.ip || req.socket.remoteAddress,
        action: req.path.includes('.m3u') ? 'm3u_access' : 'stream_access',
        status: 'allowed',
      }, {
        headers: { Authorization: `Bearer ${config.jwtSecret}` },
        timeout: 3000,
      });
    } catch {
      // Logging is non-critical
    }

    next();
  } catch (err: any) {
    if (err.response?.status === 404) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }
    logger.error('Auth middleware error', err);
    res.status(500).json({ error: 'Authentication service unavailable' });
  }
}
