import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditFilterDto } from './dto/create-audit.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(filter: AuditFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.userId) where.userId = filter.userId;
    if (filter.action) where.action = { contains: filter.action, mode: 'insensitive' };
    if (filter.entity) where.entity = filter.entity;
    if (filter.entityId) where.entityId = filter.entityId;
    if (filter.startDate) where.createdAt = { ...(where.createdAt || {}), gte: new Date(filter.startDate) };
    if (filter.endDate) where.createdAt = { ...(where.createdAt || {}), lte: new Date(filter.endDate) };

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string) {
    return this.prisma.auditLog.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });
  }

  async export(filter: AuditFilterDto): Promise<{ data: any[]; format: string }> {
    const where: any = {};
    if (filter.userId) where.userId = filter.userId;
    if (filter.action) where.action = { contains: filter.action, mode: 'insensitive' };
    if (filter.entity) where.entity = filter.entity;
    if (filter.startDate) where.createdAt = { ...(where.createdAt || {}), gte: new Date(filter.startDate) };
    if (filter.endDate) where.createdAt = { ...(where.createdAt || {}), lte: new Date(filter.endDate) };

    const data = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const format = filter.format || 'json';
    return { data, format };
  }
}
