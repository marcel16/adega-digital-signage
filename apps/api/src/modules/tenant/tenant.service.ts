import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/logger.service';
import { CreateTenantDto, UpdateTenantDto, BlockTenantDto, TenantFilterDto } from './dto/create-tenant.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    private prisma: PrismaService,
    private appLogger: AppLoggerService,
  ) {}

  async findAll(filter: TenantFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { document: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.plan) where.plan = filter.plan;
    if (filter.blocked !== undefined) where.blocked = filter.blocked;

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { users: true, stores: true, tvs: true } } },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, stores: true, tvs: true, media: true, campaigns: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async create(dto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findFirst({
      where: { name: dto.name },
    });
    if (existing) throw new ConflictException('Tenant name already exists');

    const tenant = await this.prisma.tenant.create({ data: dto as any });
    this.appLogger.audit('TENANT_CREATED', 'Tenant', tenant.id, 'system', { name: dto.name });
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findById(id);
    const tenant = await this.prisma.tenant.update({ where: { id }, data: dto as any });
    this.appLogger.audit('TENANT_UPDATED', 'Tenant', id, 'system', dto);
    return tenant;
  }

  async block(id: string, dto: BlockTenantDto) {
    await this.findById(id);
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { blocked: dto.blocked },
    });
    this.appLogger.audit(dto.blocked ? 'TENANT_BLOCKED' : 'TENANT_UNBLOCKED', 'Tenant', id, 'system');
    return tenant;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.tenant.delete({ where: { id } });
    this.appLogger.audit('TENANT_DELETED', 'Tenant', id, 'system');
  }

  async getStats(id: string) {
    await this.findById(id);
    const [users, stores, tvs, media, campaigns] = await Promise.all([
      this.prisma.user.count({ where: { tenantId: id } }),
      this.prisma.store.count({ where: { tenantId: id } }),
      this.prisma.tv.count({ where: { tenantId: id } }),
      this.prisma.media.count({ where: { tenantId: id } }),
      this.prisma.campaign.count({ where: { tenantId: id } }),
    ]);

    return { users, stores, tvs, media, campaigns };
  }
}
