import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Slug já em uso');

    return this.prisma.tenant.create({
      data: {
        nome: dto.nome,
        slug: dto.slug,
        documento: dto.documento,
        email: dto.email,
        telefone: dto.telefone,
      },
    });
  }

  async findAll(query: PaginationDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    const where: any = {};
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { _count: { select: { usuarios: true, estabelecimentos: true } } },
      }),
      this.prisma.tenant.count({ where }),
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

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { usuarios: true, estabelecimentos: true, assinaturas: true } },
        assinaturas: { include: { faturas: { take: 5, orderBy: { dataVencimento: 'desc' } } } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant não encontrado');
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findById(id);
    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async updateStatus(id: string, status: string) {
    await this.findById(id);
    return this.prisma.tenant.update({ where: { id }, data: { status: status as any } });
  }

  async delete(id: string) {
    await this.findById(id);
    await this.prisma.tenant.delete({ where: { id } });
    return { message: 'Tenant removido com sucesso' };
  }

  async getStats(id: string) {
    const [tvs, midias, campanhas, estabelecimentos] = await Promise.all([
      this.prisma.tv.count({ where: { tenantId: id } }),
      this.prisma.midia.count({ where: { tenantId: id } }),
      this.prisma.campanha.count({ where: { tenantId: id } }),
      this.prisma.estabelecimento.count({ where: { tenantId: id } }),
    ]);

    return { tvs, midias, campanhas, estabelecimentos };
  }
}