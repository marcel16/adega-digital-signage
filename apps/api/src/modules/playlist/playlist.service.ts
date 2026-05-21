import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/logger.service';
import { CreatePlaylistDto, UpdatePlaylistDto, AddPlaylistItemDto, ReorderPlaylistItemsDto, PlaylistFilterDto } from './dto/create-playlist.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PlaylistService {
  private readonly logger = new Logger(PlaylistService.name);

  constructor(
    private prisma: PrismaService,
    private appLogger: AppLoggerService,
  ) {}

  async findAll(tenantId: string, filter: PlaylistFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (filter.search) where.name = { contains: filter.search, mode: 'insensitive' };
    if (filter.isActive !== undefined) where.isActive = filter.isActive;

    const [data, total] = await Promise.all([
      this.prisma.playlist.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { items: true } } },
      }),
      this.prisma.playlist.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;
    const playlist = await this.prisma.playlist.findFirst({
      where,
      include: { items: { include: { media: true }, orderBy: { order: 'asc' } } },
    });
    if (!playlist) throw new NotFoundException('Playlist not found');
    return playlist;
  }

  async create(dto: CreatePlaylistDto, tenantId: string) {
    const playlist = await this.prisma.playlist.create({
      data: {
        name: dto.name,
        description: dto.description || null,
        isActive: dto.isActive ?? true,
        tenantId,
      },
    });

    if (dto.mediaIds && dto.mediaIds.length > 0) {
      await this.prisma.playlistItem.createMany({
        data: dto.mediaIds.map((mediaId, index) => ({
          playlistId: playlist.id,
          mediaId,
          order: index + 1,
        })),
      });
    }

    this.appLogger.audit('PLAYLIST_CREATED', 'Playlist', playlist.id, 'system', { name: dto.name });
    return this.findById(playlist.id);
  }

  async update(id: string, dto: UpdatePlaylistDto, tenantId?: string) {
    await this.findById(id, tenantId);
    const playlist = await this.prisma.playlist.update({ where: { id }, data: dto as any });
    this.appLogger.audit('PLAYLIST_UPDATED', 'Playlist', id, 'system', dto);
    return playlist;
  }

  async remove(id: string, tenantId?: string) {
    await this.findById(id, tenantId);
    await this.prisma.playlistItem.deleteMany({ where: { playlistId: id } });
    await this.prisma.playlist.delete({ where: { id } });
    this.appLogger.audit('PLAYLIST_DELETED', 'Playlist', id, 'system');
  }

  async addItems(id: string, dto: AddPlaylistItemDto, tenantId?: string) {
    await this.findById(id, tenantId);
    const lastItem = await this.prisma.playlistItem.findFirst({
      where: { playlistId: id },
      orderBy: { order: 'desc' },
    });
    let nextOrder = lastItem ? lastItem.order + 1 : 1;

    await this.prisma.playlistItem.createMany({
      data: dto.mediaIds.map((mediaId) => ({
        playlistId: id,
        mediaId,
        order: nextOrder++,
      })),
    });
    return this.findById(id);
  }

  async removeItem(playlistId: string, itemId: string, tenantId?: string) {
    await this.findById(playlistId, tenantId);
    await this.prisma.playlistItem.delete({ where: { id: itemId } });
    return this.findById(playlistId);
  }

  async reorderItems(id: string, dto: ReorderPlaylistItemsDto, tenantId?: string) {
    await this.findById(id, tenantId);
    for (const item of dto.items) {
      await this.prisma.playlistItem.update({
        where: { id: item.id },
        data: { order: item.order },
      });
    }
    return this.findById(id);
  }

  async getM3u(id: string, tenantId?: string) {
    const playlist = await this.findById(id, tenantId);
    let m3u = '#EXTM3U\n';
    for (const item of playlist.items) {
      const media = item.media;
      const duration = media.duration || 10;
      const name = media.name.replace(/,/g, '');
      const url = media.url ? `/storage/uploads/${media.url}` : (media.youtubeUrl || '');
      m3u += `#EXTINF:${duration},${name}\n${url}\n`;
    }
    return m3u;
  }

  async generateFromCampaigns(tenantId: string, campaignIds?: string[]) {
    const where: any = { tenantId, status: 'ACTIVE' };
    if (campaignIds && campaignIds.length > 0) where.id = { in: campaignIds };

    const campaigns = await this.prisma.campaign.findMany({
      where,
      include: { mediaItems: { include: { media: true }, orderBy: { order: 'asc' } } },
    });

    const allMedia: any[] = [];
    for (const campaign of campaigns) {
      for (const item of campaign.mediaItems) {
        allMedia.push(item.media);
      }
    }

    return allMedia;
  }
}
