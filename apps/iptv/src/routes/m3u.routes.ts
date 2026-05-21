import { Router, Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config';
import { verifyToken } from '../utils/token';
import { generateM3U } from '../utils/m3u-generator';
import { getCachedPlaylist, cachePlaylist, logAccess } from '../services/playlist.service';
import { rateLimiter } from '../middleware/rate-limit';
import { logger } from '../utils/logger';

const router = Router();

interface MediaItem {
  id: string;
  name: string;
  duration?: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
}

async function handleM3U(req: Request, res: Response, storeCode: string, tvCode?: string): Promise<void> {
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

  if (payload.storeCode !== storeCode) {
    res.status(403).json({ error: 'Token does not match store' });
    return;
  }

  try {
    const storeRes = await axios.get(`${config.apiUrl}/api/stores/${storeCode}`, {
      headers: { Authorization: `Bearer ${config.jwtSecret}` },
      timeout: 5000,
    });

    const store = storeRes.data;
    const storeName = store.name || storeCode;

    const cached = await getCachedPlaylist(storeCode);
    if (cached) {
      const m3uContent = generateM3U({
        storeName,
        tvName: tvCode || storeName,
        items: cached.items || [],
        baseUrl: `http://tv.adega.queroservico.store`,
        iptvSecret: config.iptvSecret,
      });

      res.set('Content-Type', 'audio/x-mpegurl');
      res.set('Cache-Control', 'public, max-age=30');
      res.send(m3uContent);
      return;
    }

    const playlistUrl = tvCode
      ? `${config.apiUrl}/api/iptv/${storeCode}/${tvCode}`
      : `${config.apiUrl}/api/iptv/${storeCode}`;

    const playlistRes = await axios.get(playlistUrl, {
      headers: { Authorization: `Bearer ${config.jwtSecret}` },
      timeout: 10000,
    });

    const playlist = playlistRes.data;
    const items: MediaItem[] = playlist.items || playlist.media || playlist;

    await cachePlaylist(storeCode, { items, storeCode, tvCode });

    const m3uContent = generateM3U({
      storeName,
      tvName: tvCode || storeName,
      items,
      baseUrl: `http://tv.adega.queroservico.store`,
      iptvSecret: config.iptvSecret,
    });

    await logAccess(
      storeCode,
      tvCode || 'all',
      req.ip || req.socket.remoteAddress || 'unknown',
      'm3u_generated',
      'success'
    );

    res.set('Content-Type', 'audio/x-mpegurl');
    res.set('Cache-Control', 'public, max-age=30');
    res.send(m3uContent);
  } catch (err: any) {
    logger.error('M3U generation error', err);
    if (err.response?.status === 404) {
      res.status(404).json({ error: 'Store or playlist not found' });
      return;
    }
    res.status(500).json({ error: 'Failed to generate playlist' });
  }
}

router.get('/:storeCode.m3u', rateLimiter('m3u'), async (req: Request, res: Response) => {
  await handleM3U(req, res, req.params.storeCode);
});

router.get('/:storeCode/:tvCode.m3u', rateLimiter('m3u'), async (req: Request, res: Response) => {
  await handleM3U(req, res, req.params.storeCode, req.params.tvCode);
});

export default router;
