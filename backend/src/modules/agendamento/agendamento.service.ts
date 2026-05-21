import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAgendamentoDto } from './dto/create-agendamento.dto';
import { UpdateAgendamentoDto } from './dto/update-agendamento.dto';
import { AgendamentoFilterDto } from './dto/agendamento-filter.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { AgendamentoStatus, DiaSemana } from '@prisma/client';

const STATUS_FLOW: Record<string, string[]> = {
  scheduled: ['playing', 'canceled'],
  playing: ['completed', 'canceled'],
  completed: [],
  canceled: [],
};

@Injectable()
export class AgendamentoService {
  private readonly logger = new Logger(AgendamentoService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAgendamentoDto, tenantId: string, userId: string) {
    await this.validateNoConflict(dto.tvId, dto.diasSemana, dto.horarioInicio, dto.horarioFim, undefined, tenantId);

    const hoje = new Date();
    const diaSemanaAtual = this.getDiaSemanaEnum(hoje);

    const status: AgendamentoStatus = this.shouldStartImmediately(dto, diaSemanaAtual, hoje)
      ? 'playing'
      : 'scheduled';

    return this.prisma.agendamento.create({
      data: {
        nome: dto.nome,
        descricao: dto.descricao,
        diasSemana: dto.diasSemana,
        horarioInicio: dto.horarioInicio,
        horarioFim: dto.horarioFim,
        dataInicio: new Date(dto.dataInicio),
        dataFim: dto.dataFim ? new Date(dto.dataFim) : null,
        recorrente: dto.recorrente ?? true,
        status,
        tvId: dto.tvId,
        campanhaId: dto.campanhaId,
        playlistId: dto.playlistId,
        tenantId,
        criadoPorId: userId,
      },
      include: {
        tv: { select: { id: true, nome: true } },
        campanha: { select: { id: true, nome: true } },
        playlist: { select: { id: true, nome: true } },
        criadoPor: { select: { id: true, nome: true, email: true } },
      },
    });
  }

  async findAll(tenantId: string, filters: AgendamentoFilterDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    const where: any = { tenantId };

    if (filters.tvId) where.tvId = filters.tvId;
    if (filters.status) where.status = filters.status;

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
      this.prisma.agendamento.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          tv: { select: { id: true, nome: true } },
          campanha: { select: { id: true, nome: true } },
          playlist: { select: { id: true, nome: true } },
          criadoPor: { select: { id: true, nome: true } },
        },
      }),
      this.prisma.agendamento.count({ where }),
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
    const agendamento = await this.prisma.agendamento.findFirst({
      where: { id, tenantId },
      include: {
        tv: { select: { id: true, nome: true } },
        campanha: {
          select: {
            id: true, nome: true, status: true,
            midias: {
              orderBy: { ordem: 'asc' },
              include: { midia: { select: { id: true, nome: true, tipo: true, url: true, thumbnailUrl: true } } },
            },
          },
        },
        playlist: {
          select: {
            id: true, nome: true,
            items: {
              orderBy: { ordem: 'asc' },
              include: { midia: { select: { id: true, nome: true, tipo: true, url: true, thumbnailUrl: true } } },
            },
          },
        },
        criadoPor: { select: { id: true, nome: true, email: true } },
      },
    });
    if (!agendamento) throw new NotFoundException('Agendamento não encontrado');
    return agendamento;
  }

  async update(id: string, dto: UpdateAgendamentoDto, tenantId: string) {
    const existing = await this.findById(id, tenantId);

    const tvId = dto.tvId ?? existing.tvId;
    const diasSemana = dto.diasSemana ?? (existing.diasSemana as DiaSemana[]);
    const horarioInicio = dto.horarioInicio ?? existing.horarioInicio;
    const horarioFim = dto.horarioFim ?? existing.horarioFim;

    await this.validateNoConflict(tvId, diasSemana, horarioInicio, horarioFim, id, tenantId);

    return this.prisma.agendamento.update({
      where: { id },
      data: {
        ...dto,
        dataInicio: dto.dataInicio ? new Date(dto.dataInicio) : undefined,
        dataFim: dto.dataFim !== undefined ? (dto.dataFim ? new Date(dto.dataFim) : null) : undefined,
      },
      include: {
        tv: { select: { id: true, nome: true } },
        campanha: { select: { id: true, nome: true } },
        playlist: { select: { id: true, nome: true } },
        criadoPor: { select: { id: true, nome: true, email: true } },
      },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    await this.prisma.agendamento.delete({ where: { id } });
    return { message: 'Agendamento removido com sucesso' };
  }

  async updateStatus(id: string, newStatus: AgendamentoStatus, tenantId: string) {
    const agendamento = await this.findById(id, tenantId);
    const allowed = STATUS_FLOW[agendamento.status];

    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Transição inválida: não é permitido mudar de "${agendamento.status}" para "${newStatus}"`,
      );
    }

    return this.prisma.agendamento.update({
      where: { id },
      data: { status: newStatus },
      include: {
        tv: { select: { id: true, nome: true } },
        campanha: { select: { id: true, nome: true } },
        playlist: { select: { id: true, nome: true } },
      },
    });
  }

  async getCurrentForTv(tvId: string) {
    const now = new Date();
    const currentDay = this.getDiaSemanaEnum(now);
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const agendamentos = await this.prisma.agendamento.findMany({
      where: {
        tvId,
        status: { in: ['scheduled', 'playing'] },
        dataInicio: { lte: now },
        OR: [
          { dataFim: null },
          { dataFim: { gte: now } },
        ],
      },
      include: {
        campanha: {
          select: {
            id: true, nome: true, status: true,
            midias: {
              orderBy: { ordem: 'asc' },
              include: { midia: { select: { id: true, nome: true, tipo: true, url: true, thumbnailUrl: true } } },
            },
          },
        },
        playlist: {
          select: {
            id: true, nome: true,
            items: {
              orderBy: { ordem: 'asc' },
              include: { midia: { select: { id: true, nome: true, tipo: true, url: true, thumbnailUrl: true } } },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { dataInicio: 'desc' },
      ],
    });

    const matching = agendamentos.filter((a) => {
      const dias = a.diasSemana as DiaSemana[];
      if (!dias.includes(currentDay)) return false;

      if (currentTime < a.horarioInicio) return false;
      if (a.horarioFim && currentTime > a.horarioFim) return false;

      return true;
    });

    if (matching.length > 0) {
      const active = matching[0];
      if (active.status === 'scheduled') {
        await this.prisma.agendamento.update({
          where: { id: active.id },
          data: { status: 'playing' },
        });
        active.status = 'playing';
      }
      return active;
    }

    return null;
  }

  private async validateNoConflict(
    tvId: string,
    diasSemana: DiaSemana[],
    horarioInicio: string,
    horarioFim: string | undefined,
    excludeId: string | undefined,
    tenantId: string,
  ) {
    const conflicts = await this.prisma.agendamento.findMany({
      where: {
        tvId,
        tenantId,
        status: { notIn: ['completed', 'canceled'] },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });

    const overlap = conflicts.some((existing) => {
      const existingDias = existing.diasSemana as DiaSemana[];
      const hasDayOverlap = diasSemana.some((d) => existingDias.includes(d));
      if (!hasDayOverlap) return false;

      return this.timeRangesOverlap(
        horarioInicio, horarioFim,
        existing.horarioInicio, existing.horarioFim ?? undefined,
      );
    });

    if (overlap) {
      throw new ConflictException('Já existe um agendamento ativo para esta TV com horário sobreposto nos mesmos dias');
    }
  }

  private timeRangesOverlap(
    startA: string, endA: string | undefined,
    startB: string, endB: string | undefined,
  ): boolean {
    const aEnd = endA || '23:59';
    const bEnd = endB || '23:59';
    return startA < bEnd && aEnd > startB;
  }

  private getDiaSemanaEnum(date: Date): DiaSemana {
    const dias: DiaSemana[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    return dias[date.getDay()];
  }

  private shouldStartImmediately(dto: CreateAgendamentoDto, diaSemanaAtual: DiaSemana, now: Date): boolean {
    if (!dto.diasSemana.includes(diaSemanaAtual)) return false;

    const dataInicio = new Date(dto.dataInicio);
    if (now < dataInicio) return false;

    if (dto.dataFim && now > new Date(dto.dataFim)) return false;

    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    if (currentTime < dto.horarioInicio) return false;
    if (dto.horarioFim && currentTime > dto.horarioFim) return false;

    return true;
  }
}