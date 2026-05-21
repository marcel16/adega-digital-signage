import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditoriaFilterDto } from './dto/auditoria-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private prisma: PrismaService) {}

  async list(filters: AuditoriaFilterDto) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      userId,
      tenantId,
      action,
      startDate,
      endDate,
      search,
    } = filters;

    const where: Prisma.AuditLogWhereInput = {};

    if (userId) where.userId = userId;
    if (tenantId) where.tenantId = tenantId;
    if (action) where.action = action;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as any).gte = new Date(startDate);
      if (endDate) (where.createdAt as any).lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { ip: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: { id: true, email: true, nome: true, role: true },
          },
          tenant: {
            select: { id: true, nome: true, slug: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
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
    const log = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, nome: true, role: true },
        },
        tenant: {
          select: { id: true, nome: true, slug: true },
        },
      },
    });

    if (!log) throw new NotFoundException('Log de auditoria não encontrado');
    return log;
  }

  async export(filters: AuditoriaFilterDto): Promise<{ csv: string }> {
    const { data } = await this.list({ ...filters, page: 1, limit: 10000 });

    const header = ['ID', 'Ação', 'Usuário', 'Email', 'Tenant', 'IP', 'User Agent', 'Metadados', 'Data'].join(',');

    const rows = data.map((log: any) =>
      [
        `"${log.id}"`,
        `"${log.action}"`,
        `"${log.user?.nome || 'N/A'}"`,
        `"${log.user?.email || 'N/A'}"`,
        `"${log.tenant?.nome || 'N/A'}"`,
        `"${log.ip || ''}"`,
        `"${(log.userAgent || '').replace(/"/g, '""')}"`,
        `"${log.metadata ? JSON.stringify(log.metadata).replace(/"/g, '""') : ''}"`,
        `"${log.createdAt}"`,
      ].join(','),
    );

    const csv = '\uFEFF' + [header, ...rows].join('\n');
    return { csv };
  }
}