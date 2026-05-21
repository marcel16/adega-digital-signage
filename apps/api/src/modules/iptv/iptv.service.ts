import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class IptvService {
  private readonly logger = new Logger(IptvService.name);

  constructor(private prisma: PrismaService) {}

  async generateStoreM3u(storeCode: string, format?: string) {
    const store = await this.prisma.store.findUnique({
      where: { code: storeCode },
      include: { tenant: true, tvs: { include: { schedules: { include: { campaign: { include: { mediaItems: { include: { media: true }, orderBy: { order: 'asc' } } } }, playlist: { include: { items: { include: { media: true }, orderBy: { order: 'asc' } } } } } } } } },
    });
    if (!store) throw new NotFoundException('Store not found');

    let m3u = '#EXTM3U\n';
    m3u += `#PLAYLIST: ${store.name}\n`;
    m3u += `#DESCRIPTION: ${store.tenant?.name || ''} - ${store.name}\n\n`;

    const seenMedia = new Set<string>();
    for (const tv of store.tvs) {
      for (const schedule of tv.schedules) {
        const items = schedule.campaign?.mediaItems || schedule.playlist?.items || [];
        for (const item of items) {
          const media = item.media || (item as any).media;
          if (!media || seenMedia.has(media.id)) continue;
          seenMedia.add(media.id);

          const duration = media.duration || 10;
          const name = media.name.replace(/,/g, '').replace(/[^a-zA-Z0-9\s_-]/g, '');
          const logo = media.thumbnailUrl || '';
          const tvgId = `adega-${media.id}`;

          let url: string;
          if (media.type === 'YOUTUBE') {
            url = media.youtubeUrl || '';
          } else if (media.url) {
            const token = this.generateStreamToken(media.id, store.tenantId);
            url = `/api/iptv/stream/${token}`;
          } else {
            continue;
          }

          m3u += `#EXTINF:${duration} tvg-id="${tvgId}" tvg-logo="${logo}" group-title="${store.name}",${name}\n${url}\n`;
        }
      }
    }

    if (format === 'm3u8') {
      return m3u;
    }
    return m3u;
  }

  async generateTvM3u(storeCode: string, tvCode: string, format?: string) {
    const store = await this.prisma.store.findUnique({ where: { code: storeCode } });
    if (!store) throw new NotFoundException('Store not found');

    const tv = await this.prisma.tv.findFirst({
      where: { id: tvCode, tenantId: store.tenantId },
      include: { schedules: { include: { campaign: { include: { mediaItems: { include: { media: true }, orderBy: { order: 'asc' } } } }, playlist: { include: { items: { include: { media: true }, orderBy: { order: 'asc' } } } } } } },
    });
    if (!tv) throw new NotFoundException('TV not found');

    let m3u = '#EXTM3U\n';
    m3u += `#PLAYLIST: ${store.name} - ${tv.name}\n`;
    m3u += `#DESCRIPTION: Canal exclusivo ${tv.name}\n\n`;

    const seenMedia = new Set<string>();
    for (const schedule of tv.schedules) {
      const items = schedule.campaign?.mediaItems || schedule.playlist?.items || [];
      for (const item of items) {
        const media = item.media || (item as any).media;
        if (!media || seenMedia.has(media.id)) continue;
        seenMedia.add(media.id);

        const duration = media.duration || 10;
        const name = media.name.replace(/,/g, '').replace(/[^a-zA-Z0-9\s_-]/g, '');
        const logo = media.thumbnailUrl || '';
        const tvgId = `adega-${media.id}`;

        let url: string;
        if (media.type === 'YOUTUBE') {
          url = media.youtubeUrl || '';
        } else if (media.url) {
          const token = this.generateStreamToken(media.id, store.tenantId);
          url = `/api/iptv/stream/${token}`;
        } else {
          continue;
        }

        m3u += `#EXTINF:${duration} tvg-id="${tvgId}" tvg-logo="${logo}" group-title="${tv.name}",${name}\n${url}\n`;
      }
    }

    if (format === 'm3u8') return m3u;
    return m3u;
  }

  async getStreamUrl(token: string) {
    const payload = this.verifyStreamToken(token);
    if (!payload) throw new NotFoundException('Invalid or expired stream token');

    const media = await this.prisma.media.findUnique({ where: { id: payload.mediaId } });
    if (!media || !media.url) throw new NotFoundException('Media not found');

    await this.prisma.iptvLog.create({
      data: {
        mediaId: media.id,
        tenantId: payload.tenantId,
        ip: null,
        userAgent: null,
        action: 'STREAM_ACCESS',
      },
    });

    return { url: media.url, media };
  }

  private generateStreamToken(mediaId: string, tenantId: string): string {
    const secret = process.env.STREAM_SECRET || 'stream-secret-key';
    const payload = `${mediaId}:${tenantId}:${Date.now() + 3600000}`;
    const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const encoded = Buffer.from(payload).toString('base64');
    return `${encoded}.${hash}`;
  }

  private verifyStreamToken(token: string): { mediaId: string; tenantId: string; expiresAt: number } | null {
    try {
      const [encoded, hash] = token.split('.');
      if (!encoded || !hash) return null;

      const secret = process.env.STREAM_SECRET || 'stream-secret-key';
      const payload = Buffer.from(encoded, 'base64').toString('utf-8');
      const [mediaId, tenantId, expiresAt] = payload.split(':');

      const expectedHash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      if (hash !== expectedHash) return null;
      if (parseInt(expiresAt) < Date.now()) return null;

      return { mediaId, tenantId, expiresAt: parseInt(expiresAt) };
    } catch {
      return null;
    }
  }
}
