import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTvDto } from './dto/create-tv.dto';
import { UpdateTvDto } from './dto/update-tv.dto';
import { PingTvDto } from './dto/ping-tv.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class TvService {
  private readonly logger = new Logger(TvService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTvDto, tenantId: string) {
    const estabelecimento = await this.prisma.estabelecimento.findFirst({
      where: { id: dto.estabelecimentoId, tenantId },
    });
    if (!estabelecimento) {
      throw new NotFoundException('Estabelecimento não encontrado');
    }

    const identificador = nanoid(12);

    return this.prisma.tv.create({
      data: {
        ...dto,
        identificador,
        tenantId,
        status: 'offline',
        ultimoPing: null,
      },
    });
  }

  async findAll(query: PaginationDto, tenantId: string, estabelecimentoId?: string): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: any = { tenantId, deletedAt: null };

    if (estabelecimentoId) {
      where.estabelecimentoId = estabelecimentoId;
    }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { identificador: { contains: search, mode: 'insensitive' } },
        { modelo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.tv.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          estabelecimento: { select: { id: true, nome: true } },
        },
      }),
      this.prisma.tv.count({ where }),
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
    const tv = await this.prisma.tv.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        estabelecimento: { select: { id: true, nome: true } },
      },
    });
    if (!tv) throw new NotFoundException('TV não encontrada');
    return tv;
  }

  async findByIdentificador(identificador: string) {
    const tv = await this.prisma.tv.findFirst({
      where: { identificador, deletedAt: null },
      include: {
        estabelecimento: { select: { id: true, nome: true } },
      },
    });
    if (!tv) throw new NotFoundException('TV não encontrada');
    return tv;
  }

  async update(id: string, dto: UpdateTvDto, tenantId: string) {
    await this.findById(id, tenantId);

    if (dto.estabelecimentoId) {
      const estabelecimento = await this.prisma.estabelecimento.findFirst({
        where: { id: dto.estabelecimentoId, tenantId },
      });
      if (!estabelecimento) {
        throw new NotFoundException('Estabelecimento não encontrado');
      }
    }

    return this.prisma.tv.update({ where: { id }, data: dto });
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    await this.prisma.tv.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'TV removida com sucesso' };
  }

  async updateStatus(id: string, status: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.prisma.tv.update({ where: { id }, data: { status } });
  }

  async ping(identificador: string, dto?: PingTvDto) {
    const tv = await this.prisma.tv.findFirst({
      where: { identificador, deletedAt: null },
    });
    if (!tv) throw new NotFoundException('TV não encontrada');

    const updateData: any = {
      ultimoPing: new Date(),
      status: 'online',
    };

    if (dto?.ipAddress) {
      updateData.ipAddress = dto.ipAddress;
    }

    return this.prisma.tv.update({
      where: { id: tv.id },
      data: updateData,
    });
  }

  async countByEstabelecimento(estabelecimentoId: string, tenantId: string) {
    return this.prisma.tv.count({
      where: { estabelecimentoId, tenantId, deletedAt: null },
    });
  }
}