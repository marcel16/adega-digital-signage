import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { nanoid } from 'nanoid';
import * as sharp from 'sharp';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { CreateMidiaDto } from './dto/create-midia.dto';
import { UpdateMidiaDto } from './dto/update-midia.dto';
import { MidiaFilterDto } from './dto/midia-filter.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class MidiaService {
  private readonly logger = new Logger(MidiaService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async upload(
    file: Express.Multer.File,
    metadata: CreateMidiaDto,
    tenantId: string,
    userId: string,
  ) {
    const extension = file.originalname.split('.').pop();
    const key = `${tenantId}/${nanoid()}.${extension}`;
    const url = await this.storage.upload(key, file.buffer, file.mimetype);

    let thumbnailUrl: string | null = null;
    let largura: number | null = null;
    let altura: number | null = null;

    if (file.mimetype.startsWith('image/')) {
      try {
        const metadata = await sharp(file.buffer).metadata();
        largura = metadata.width || null;
        altura = metadata.height || null;

        const thumb = await sharp(file.buffer)
          .resize(320, 180, { fit: 'cover' })
          .jpeg({ quality: 70 })
          .toBuffer();

        const thumbKey = `${tenantId}/thumbnails/${nanoid()}.jpg`;
        thumbnailUrl = await this.storage.upload(thumbKey, thumb, 'image/jpeg');
      } catch (err) {
        this.logger.warn(`Could not generate thumbnail: ${err.message}`);
      }
    }

    const tipo = this.resolveTipo(file.mimetype);

    return this.prisma.midia.create({
      data: {
        nome: metadata.nome,
        descricao: metadata.descricao,
        tipo,
        mimeType: file.mimetype,
        tamanho: file.size,
        url,
        thumbnailUrl,
        largura,
        altura,
        tags: metadata.tags,
        pasta: metadata.pasta,
        status: 'ready',
        tenantId,
        uploadedById: userId,
      },
    });
  }

  async findAll(
    tenantId: string,
    filters: MidiaFilterDto,
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    const where: any = { tenantId };

    if (filters.tipo) where.tipo = filters.tipo;
    if (filters.status) where.status = filters.status;
    if (filters.pasta) where.pasta = filters.pasta;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
        { pasta: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.midia.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          uploadedBy: { select: { id: true, nome: true, email: true } },
        },
      }),
      this.prisma.midia.count({ where }),
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
    const midia = await this.prisma.midia.findFirst({
      where: { id, tenantId },
      include: {
        uploadedBy: { select: { id: true, nome: true, email: true } },
      },
    });
    if (!midia) throw new NotFoundException('Mídia não encontrada');
    return midia;
  }

  async update(id: string, dto: UpdateMidiaDto, tenantId: string) {
    await this.findById(id, tenantId);
    return this.prisma.midia.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string, tenantId: string) {
    const midia = await this.findById(id, tenantId);

    try {
      await this.storage.delete(midia.url);
      if (midia.thumbnailUrl) {
        await this.storage.delete(midia.thumbnailUrl);
      }
    } catch (err) {
      this.logger.warn(`Could not delete file from storage: ${err.message}`);
    }

    await this.prisma.midia.delete({ where: { id } });
    return { message: 'Mídia removida com sucesso' };
  }

  async getStorageUsage(tenantId: string): Promise<{ totalBytes: number; totalMb: number }> {
    const result = await this.prisma.midia.aggregate({
      where: { tenantId },
      _sum: { tamanho: true },
    });

    const totalBytes = result._sum.tamanho || 0;
    return {
      totalBytes,
      totalMb: Math.round((totalBytes / (1024 * 1024)) * 100) / 100,
    };
  }

  async download(id: string, tenantId: string): Promise<{ buffer: Buffer; mimetype: string; nome: string }> {
    const midia = await this.findById(id, tenantId);
    const buffer = await this.storage.download(midia.url);
    return { buffer, mimetype: midia.mimeType, nome: midia.nome };
  }

  private resolveTipo(mimetype: string): string {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'url';
  }
}