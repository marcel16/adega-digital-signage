import axios from 'axios';
import Redis from 'ioredis';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../utils/logger';

const redis = new Redis(config.redisUrl);

export async function fetchPlaylist(storeCode: string, tvCode?: string): Promise<any> {
  const url = tvCode
    ? `${config.apiUrl}/api/iptv/${storeCode}/${tvCode}`
    : `${config.apiUrl}/api/iptv/${storeCode}`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${config.jwtSecret}` },
    timeout: 10000,
  });

  return response.data;
}

export function parsePlaylistData(raw: any): any {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

export async function cachePlaylist(storeCode: string, data: any): Promise<void> {
  try {
    const key = `playlist:${storeCode}`;
    await redis.setex(key, 30, JSON.stringify(data));
  } catch (err) {
    logger.error('Failed to cache playlist', err);
  }
}

export async function getCachedPlaylist(storeCode: string): Promise<any | null> {
  try {
    const key = `playlist:${storeCode}`;
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached);
    }
    return null;
  } catch (err) {
    logger.error('Failed to get cached playlist', err);
    return null;
  }
}

export function validateToken(token: string): any {
  try {
    return jwt.verify(token, config.iptvSecret);
  } catch {
    return null;
  }
}

export function generateSignedUrl(storeCode: string, tvCode: string, mediaId: string): string {
  const payload = { storeCode, tvCode, mediaId };
  const token = jwt.sign(payload, config.iptvSecret, { expiresIn: 3600 });
  return `${config.apiUrl}/stream/${token}`;
}

export async function logAccess(
  storeCode: string,
  tvCode: string,
  ip: string,
  action: string,
  status: string
): Promise<void> {
  try {
    await axios.post(`${config.apiUrl}/api/iptv/logs`, {
      storeCode,
      tvCode,
      ip,
      action,
      status,
    }, {
      headers: { Authorization: `Bearer ${config.jwtSecret}` },
      timeout: 3000,
    });
  } catch (err) {
    logger.error('Failed to log access', err);
  }
}
