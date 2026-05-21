import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCampanhaDto, CampanhaMidiaDto } from './dto/create-campanha.dto';
import { UpdateCampanhaDto } from './dto/update-campanha.dto';
import { CampanhaFilterDto } from './dto/campanha-filter.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

const STATUS_FLOW: Record<string, string[]> = {
  draft: ['active'],
  active: ['paused', 'completed', 'canceled'],
  paused: ['active', 'completed', 'canceled'],
  completed: [],
  canceled: [],
};

@Injectable()
export class CampanhaService {
  private readonly logger = new Logger(CampanhaService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCampanhaDto, tenantId: string, userId: string) {
    const { midiaIds, ...data } = dto;

    return this.prisma.campanha.create({
      data: {
        ...data,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : undefined,
        dataFim: dto.dataFim ? new Date(dto.dataFim) : undefined,
        tenantId,
        criadoPorId: userId,
        midias: midiaIds?.length
          ? {
              create: midiaIds.map((m) => ({
                midiaId: m.id,
                ordem: m.ordem ?? 0,
                duracao: m.duracao,
              })),
            }
          : undefined,
      },
      include: {
        midias: {
          orderBy: { ordem: 'asc' },
          include: { midia: true },
        },
        estabelecimento: { select: { id: true, nome: true } },
        criadoPor: { select: { id: true, nome: true, email: true } },
      },
    });
  }

  async findAll(tenantId: string, filters: CampanhaFilterDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    const where: any = { tenantId };

    if (filters.status) where.status = filters.status;
    if (filters.tipo) where.tipo = filters.tipo;
    if (filters.estabelecimentoId) where.estabelecimentoId = filters.estabelecimentoId;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.campanha.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          midias: {
            orderBy: { ordem: 'asc' },
            include: { midia: { select: { id: true, nome: true, tipo: true, url: true, thumbnailUrl: true } } },
          },
          estabelecimento: { select: { id: true, nome: true } },
          criadoPor: { select: { id: true, nome: true } },
          _count: { select: { midias: true, agendamentos: true } },
        },
      }),
      this.prisma.campanha.count({ where }),
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
    const campanha = await this.prisma.campanha.findFirst({
      where: { id, tenantId },
      include: {
        midias: {
          orderBy: { ordem: 'asc' },
          include: { midia: true },
        },
        estabelecimento: { select: { id: true, nome: true } },
        criadoPor: { select: { id: true, nome: true, email: true } },
        _count: { select: { agendamentos: true } },
      },
    });
    if (!campanha) throw new NotFoundException('Campanha não encontrada');
    return campanha;
  }

  async update(id: string, dto: UpdateCampanhaDto, tenantId: string) {
    await this.findById(id, tenantId);

    const { midiaIds, ...data } = dto;

    if (midiaIds) {
      await this.prisma.campanhaMidia.deleteMany({ where: { campanhaId: id } });
      await this.prisma.campanhaMidia.createMany({
        data: midiaIds.map((m) => ({
          campanhaId: id,
          midiaId: m.id,
          ordem: m.ordem ?? 0,
          duracao: m.duracao,
        })),
      });
    }

    return this.prisma.campanha.update({
      where: { id },
      data: {
        ...data,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : undefined,
        dataFim: dto.dataFim ? new Date(dto.dataFim) : undefined,
      },
      include: {
        midias: {
          orderBy: { ordem: 'asc' },
          include: { midia: true },
        },
        estabelecimento: { select: { id: true, nome: true } },
        criadoPor: { select: { id: true, nome: true, email: true } },
      },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    await this.prisma.campanha.delete({ where: { id } });
    return { message: 'Campanha removida com sucesso' };
  }

  async updateStatus(id: string, newStatus: string, tenantId: string) {
    const campanha = await this.findById(id, tenantId);
    const allowed = STATUS_FLOW[campanha.status];

    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Transição inválida: não é permitido mudar de "${campanha.status}" para "${newStatus}"`,
      );
    }

    return this.prisma.campanha.update({
      where: { id },
      data: { status: newStatus as any },
      include: {
        midias: {
          orderBy: { ordem: 'asc' },
          include: { midia: { select: { id: true, nome: true, tipo: true, url: true } } },
        },
      },
    });
  }

  async addMidia(id: string, dto: CampanhaMidiaDto, tenantId: string) {
    await this.findById(id, tenantId);

    const midia = await this.prisma.midia.findFirst({
      where: { id: dto.id, tenantId },
    });
    if (!midia) throw new NotFoundException('Mídia não encontrada no tenant');

    const existing = await this.prisma.campanhaMidia.findUnique({
      where: { campanhaId_midiaId: { campanhaId: id, midiaId: dto.id } },
    });
    if (existing) throw new BadRequestException('Mídia já associada a esta campanha');

    return this.prisma.campanhaMidia.create({
      data: {
        campanhaId: id,
        midiaId: dto.id,
        ordem: dto.ordem ?? 0,
        duracao: dto.duracao,
      },
      include: { midia: true },
    });
  }

  async removeMidia(id: string, midiaId: string, tenantId: string) {
    await this.findById(id, tenantId);

    const rel = await this.prisma.campanhaMidia.findUnique({
      where: { campanhaId_midiaId: { campanhaId: id, midiaId } },
    });
    if (!rel) throw new NotFoundException('Mídia não está associada a esta campanha');

    await this.prisma.campanhaMidia.delete({
      where: { campanhaId_midiaId: { campanhaId: id, midiaId } },
    });
    return { message: 'Mídia removida da campanha' };
  }

  async reorderMidias(id: string, ordem: { midiaId: string; ordem: number }[], tenantId: string) {
    await this.findById(id, tenantId);

    await this.prisma.$transaction(
      ordem.map((item) =>
        this.prisma.campanhaMidia.update({
          where: { campanhaId_midiaId: { campanhaId: id, midiaId: item.midiaId } },
          data: { ordem: item.ordem },
        }),
      ),
    );

    return this.prisma.campanhaMidia.findMany({
      where: { campanhaId: id },
      orderBy: { ordem: 'asc' },
      include: { midia: true },
    });
  }
}