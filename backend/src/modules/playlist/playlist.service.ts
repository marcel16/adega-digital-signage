import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddItemDto, ReorderItemsDto } from './dto/add-item.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PlaylistService {
  private readonly logger = new Logger(PlaylistService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePlaylistDto, tenantId: string, userId: string) {
    const { itens, ...data } = dto;

    return this.prisma.playlist.create({
      data: {
        ...data,
        tenantId,
        criadoPorId: userId,
        itens: itens?.length
          ? {
              create: itens.map((item, index) => ({
                midiaId: item.midiaId,
                ordem: item.ordem ?? index,
                duracao: item.duracao,
              })),
            }
          : undefined,
      },
      include: {
        itens: {
          orderBy: { ordem: 'asc' },
          include: {
            midia: { select: { id: true, nome: true, tipo: true, url: true, duracao: true, mimeType: true } },
          },
        },
        criadoPor: { select: { id: true, nome: true, email: true } },
      },
    });
  }

  async findAll(query: PaginationDto, tenantId: string): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.playlist.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          itens: {
            orderBy: { ordem: 'asc' },
            include: {
              midia: { select: { id: true, nome: true, tipo: true, url: true, duracao: true, thumbnailUrl: true } },
            },
          },
          criadoPor: { select: { id: true, nome: true } },
          _count: { select: { itens: true, agendamentos: true } },
        },
      }),
      this.prisma.playlist.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrevious: page > 1,
      },
    };
  }

  async findById(id: string, tenantId: string) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { id, tenantId },
      include: {
        itens: {
          orderBy: { ordem: 'asc' },
          include: {
            midia: { select: { id: true, nome: true, tipo: true, url: true, duracao: true, mimeType: true, thumbnailUrl: true } },
          },
        },
        criadoPor: { select: { id: true, nome: true, email: true } },
        _count: { select: { agendamentos: true } },
      },
    });
    if (!playlist) throw new NotFoundException('Playlist não encontrada');
    return playlist;
  }

  async update(id: string, dto: UpdatePlaylistDto, tenantId: string) {
    await this.findById(id, tenantId);

    const { itens, ...data } = dto;

    if (itens) {
      await this.prisma.playlistItem.deleteMany({ where: { playlistId: id } });
      await this.prisma.playlistItem.createMany({
        data: itens.map((item, index) => ({
          playlistId: id,
          midiaId: item.midiaId,
          ordem: item.ordem ?? index,
          duracao: item.duracao,
        })),
      });
    }

    return this.prisma.playlist.update({
      where: { id },
      data,
      include: {
        itens: {
          orderBy: { ordem: 'asc' },
          include: {
            midia: { select: { id: true, nome: true, tipo: true, url: true, duracao: true, mimeType: true } },
          },
        },
        criadoPor: { select: { id: true, nome: true, email: true } },
      },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    await this.prisma.playlist.delete({ where: { id } });
    return { message: 'Playlist removida com sucesso' };
  }

  async addItem(playlistId: string, dto: AddItemDto, tenantId: string) {
    await this.findById(playlistId, tenantId);

    const midia = await this.prisma.midia.findFirst({
      where: { id: dto.midiaId, tenantId },
    });
    if (!midia) throw new NotFoundException('Mídia não encontrada no tenant');

    const maxOrdem = await this.prisma.playlistItem.aggregate({
      where: { playlistId },
      _max: { ordem: true },
    });

    return this.prisma.playlistItem.create({
      data: {
        playlistId,
        midiaId: dto.midiaId,
        ordem: dto.ordem ?? (maxOrdem._max.ordem ?? -1) + 1,
        duracao: dto.duracao,
      },
      include: {
        midia: { select: { id: true, nome: true, tipo: true, url: true, duracao: true } },
      },
    });
  }

  async removeItem(playlistId: string, itemId: string, tenantId: string) {
    await this.findById(playlistId, tenantId);

    const item = await this.prisma.playlistItem.findFirst({
      where: { id: itemId, playlistId },
    });
    if (!item) throw new NotFoundException('Item não encontrado na playlist');

    await this.prisma.playlistItem.delete({ where: { id: itemId } });
    return { message: 'Item removido da playlist' };
  }

  async reorderItems(playlistId: string, dto: ReorderItemsDto, tenantId: string) {
    await this.findById(playlistId, tenantId);

    await this.prisma.$transaction(
      dto.itens.map((item) =>
        this.prisma.playlistItem.update({
          where: { id: item.itemId },
          data: { ordem: item.ordem },
        }),
      ),
    );

    return this.prisma.playlistItem.findMany({
      where: { playlistId },
      orderBy: { ordem: 'asc' },
      include: {
        midia: { select: { id: true, nome: true, tipo: true, url: true, duracao: true } },
      },
    });
  }

  async generateM3u(playlistId: string, tenantId: string): Promise<string> {
    const playlist = await this.findById(playlistId, tenantId);

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    const lines: string[] = ['#EXTM3U'];
    lines.push(`#PLAYLIST:${playlist.nome}`);

    for (let i = 0; i < playlist.itens.length; i++) {
      const item = playlist.itens[i];
      const midia = item.midia;

      let typeTag: string;
      switch (midia.tipo) {
        case 'video':
          typeTag = `type="video/${midia.mimeType.split('/')[1] || 'mp4'}`;
          break;
        case 'image':
          typeTag = `type="image/${midia.mimeType.split('/')[1] || 'jpeg'}"`;
          break;
        case 'audio':
          typeTag = `type="audio/${midia.mimeType.split('/')[1] || 'mp3'}"`;
          break;
        default:
          typeTag = `type="video/mp2t"`;
      }

      const duration = item.duracao ?? midia.duracao ?? 10;

      lines.push(
        `#EXTINF:${duration},${midia.nome}`,
        `#EXT-X-ORDER:${i}`,
        `#EXT-X-TYPE:${typeTag}`,
        `${baseUrl}/iptv/tv/_/content/${midia.id}`,
      );
    }

    lines.push('#EXT-X-ENDLIST');
    return lines.join('\n');
  }
}