import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { AppLoggerService } from '../../common/logger/logger.service';
import { CreateMediaDto, UpdateMediaDto, MediaFilterDto, ImportYouTubeDto, MediaType } from './dto/create-media.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

const allowedMimeTypes: Record<string, string[]> = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  VIDEO: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/mpeg'],
  AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'],
};

const maxFileSizes: Record<string, number> = {
  FREE: 50 * 1024 * 1024,
  BASIC: 100 * 1024 * 1024,
  PROFESSIONAL: 500 * 1024 * 1024,
  ENTERPRISE: 1024 * 1024 * 1024,
};

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private appLogger: AppLoggerService,
  ) {}

  async findAll(tenantId: string, filter: MediaFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.type) where.type = filter.type;

    const [data, total] = await Promise.all([
      this.prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [filter.sortBy || 'createdAt']: filter.sortOrder || 'desc' },
      }),
      this.prisma.media.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;
    const media = await this.prisma.media.findFirst({ where });
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }

  async upload(file: Express.Multer.File, tenantId: string, name?: string, description?: string, tags?: string[]) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const maxSize = maxFileSizes[tenant?.plan || 'FREE'] || maxFileSizes.FREE;

    if (file.size > maxSize) {
      throw new BadRequestException(`File exceeds maximum size for plan ${tenant?.plan || 'FREE'}`);
    }

    const mimeType = file.mimetype;
    let mediaType: MediaType | null = null;
    for (const [type, mimes] of Object.entries(allowedMimeTypes)) {
      if (mimes.includes(mimeType)) {
        mediaType = type as MediaType;
        break;
      }
    }
    if (!mediaType) {
      throw new BadRequestException(`File type ${mimeType} is not allowed`);
    }

    const ext = path.extname(file.originalname);
    const fileName = `media/${tenantId}/${uuid()}${ext}`;
    const storedPath = await this.storage.upload(file, fileName);

    let thumbnailUrl: string | null = null;
    if (mediaType === MediaType.IMAGE) {
      try {
        const sharp = require('sharp');
        const thumbBuffer = await sharp(file.buffer).resize(320, 180).jpeg({ quality: 80 }).toBuffer();
        const thumbFile: Express.Multer.File = {
          ...file,
          buffer: thumbBuffer,
          originalname: `thumb_${fileName}`,
          mimetype: 'image/jpeg',
        } as any;
        const thumbPath = `media/${tenantId}/thumb_${uuid()}.jpg`;
        thumbnailUrl = await this.storage.upload(thumbFile, thumbPath);
      } catch (err) {
        this.logger.warn('Failed to generate thumbnail', err);
      }
    }

    const media = await this.prisma.media.create({
      data: {
        name: name || file.originalname.replace(ext, ''),
        description: description || null,
        type: mediaType,
        url: storedPath,
        thumbnailUrl,
        fileSize: file.size,
        mimeType,
        originalName: file.originalname,
        duration: null,
        tags: tags || [],
        tenantId,
      },
    });

    this.appLogger.audit('MEDIA_UPLOADED', 'Media', media.id, 'system', { type: mediaType, size: file.size });
    return media;
  }

  async importYouTube(dto: ImportYouTubeDto, tenantId: string) {
    const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = dto.url.match(youtubeRegex);
    if (!match) throw new BadRequestException('Invalid YouTube URL');

    const youtubeId = match[1];

    let videoInfo: any = {};
    try {
      const axios = require('axios');
      const response = await axios.get(`https://www.youtube.com/oembed?url=${dto.url}&format=json`);
      videoInfo = response.data;
    } catch {
      videoInfo = { title: dto.url, author_name: 'Unknown' };
    }

    const media = await this.prisma.media.create({
      data: {
        name: dto.name || videoInfo.title || 'YouTube Video',
        description: `YouTube video by ${videoInfo.author_name || 'Unknown'}`,
        type: MediaType.YOUTUBE,
        youtubeUrl: dto.url,
        youtubeId,
        url: null,
        thumbnailUrl: videoInfo.thumbnail_url || null,
        duration: null,
        tags: dto.tags || [],
        tenantId,
      },
    });

    this.appLogger.audit('YOUTUBE_IMPORTED', 'Media', media.id, 'system', { youtubeId });
    return media;
  }

  async update(id: string, dto: UpdateMediaDto, tenantId?: string) {
    await this.findById(id, tenantId);
    const media = await this.prisma.media.update({ where: { id }, data: dto as any });
    this.appLogger.audit('MEDIA_UPDATED', 'Media', id, 'system', dto);
    return media;
  }

  async remove(id: string, tenantId?: string) {
    const media = await this.findById(id, tenantId);
    if (media.url) {
      try { await this.storage.delete(media.url); } catch {}
    }
    if (media.thumbnailUrl) {
      try { await this.storage.delete(media.thumbnailUrl); } catch {}
    }
    await this.prisma.media.delete({ where: { id } });
    this.appLogger.audit('MEDIA_DELETED', 'Media', id, 'system');
  }

  async getDownloadUrl(id: string, tenantId?: string) {
    const media = await this.findById(id, tenantId);
    if (!media.url) throw new BadRequestException('No file available for this media');
    const url = this.storage.getUrl(media.url);
    return { url, filename: media.originalName || media.name };
  }

  async getStats(tenantId: string) {
    const [total, byType, totalSize] = await Promise.all([
      this.prisma.media.count({ where: { tenantId } }),
      this.prisma.media.groupBy({
        by: ['type'],
        where: { tenantId },
        _count: true,
        _sum: { fileSize: true },
      }),
      this.prisma.media.aggregate({
        where: { tenantId },
        _sum: { fileSize: true },
      }),
    ]);

    return { total, byType, totalSize: totalSize._sum.fileSize || 0 };
  }
}
