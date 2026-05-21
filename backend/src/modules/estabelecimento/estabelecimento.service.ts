import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEstabelecimentoDto, UpdateEstabelecimentoDto } from './dto/create-estabelecimento.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class EstabelecimentoService {
  private readonly logger = new Logger(EstabelecimentoService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateEstabelecimentoDto, tenantId: string) {
    const existing = await this.prisma.estabelecimento.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug já em uso');

    return this.prisma.estabelecimento.create({
      data: { ...dto, tenantId },
    });
  }

  async findAll(query: PaginationDto, tenantId: string): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { cidade: { contains: search, mode: 'insensitive' } },
        { estado: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.estabelecimento.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { _count: { select: { tvs: true, campanhas: true } } },
      }),
      this.prisma.estabelecimento.count({ where }),
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
    const estabelecimento = await this.prisma.estabelecimento.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { tvs: true, campanhas: true } },
        tvs: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!estabelecimento) throw new NotFoundException('Estabelecimento não encontrado');
    return estabelecimento;
  }

  async update(id: string, dto: UpdateEstabelecimentoDto, tenantId: string) {
    await this.findById(id, tenantId);
    return this.prisma.estabelecimento.update({ where: { id }, data: dto });
  }

  async delete(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    await this.prisma.estabelecimento.delete({ where: { id } });
    return { message: 'Estabelecimento removido com sucesso' };
  }
}