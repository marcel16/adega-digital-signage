import jwt from 'jsonwebtoken';
import { config } from '../config';

interface TokenPayload {
  storeCode: string;
  tvCode?: string;
  mediaId?: string;
  [key: string]: unknown;
}

export function generateToken(payload: TokenPayload, expiresIn?: number): string {
  return jwt.sign(payload, config.iptvSecret, {
    expiresIn: expiresIn || config.tokenExpiration,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.iptvSecret) as TokenPayload;
  } catch {
    return null;
  }
}

export function generateStreamToken(storeCode: string, tvCode: string, mediaId: string): string {
  return generateToken({ storeCode, tvCode, mediaId }, 3600);
}

export function verifyStreamToken(token: string): { storeCode: string; tvCode: string; mediaId: string } | null {
  const payload = verifyToken(token);
  if (!payload || !payload.storeCode || !payload.mediaId) {
    return null;
  }
  return {
    storeCode: payload.storeCode,
    tvCode: payload.tvCode || '',
    mediaId: payload.mediaId,
  };
}
