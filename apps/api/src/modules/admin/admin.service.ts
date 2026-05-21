import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/logger.service';
import { CreatePlanDto, UpdatePlanDto, UpdateSystemSettingsDto, AdminFilterDto } from './dto/create-admin.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private appLogger: AppLoggerService,
  ) {}

  async getDashboard() {
    const [
      totalTenants, activeTenants, blockedTenants,
      totalStores, totalTvs, totalUsers, totalMedia,
      totalCampaigns, totalInvoices, recentInvoices,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { blocked: false } }),
      this.prisma.tenant.count({ where: { blocked: true } }),
      this.prisma.store.count(),
      this.prisma.tv.count(),
      this.prisma.user.count(),
      this.prisma.media.count(),
      this.prisma.campaign.count(),
      this.prisma.invoice.count(),
      this.prisma.invoice.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { tenant: { select: { name: true } } } }),
    ]);

    return {
      tenants: { total: totalTenants, active: activeTenants, blocked: blockedTenants },
      stores: totalStores,
      tvs: totalTvs,
      users: totalUsers,
      media: totalMedia,
      campaigns: totalCampaigns,
      invoices: totalInvoices,
      recentInvoices,
    };
  }

  async getClients(filter: AdminFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { document: { contains: filter.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { _count: { select: { users: true, stores: true, tvs: true } } } }),
      this.prisma.tenant.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async getClientById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { _count: { select: { users: true, stores: true, tvs: true, media: true, campaigns: true, invoices: true } } },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async blockClient(id: string, blocked: boolean) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return this.prisma.tenant.update({ where: { id }, data: { blocked } });
  }

  async getStores(filter: AdminFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.store.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { tenant: { select: { name: true } }, _count: { select: { tvs: true } } } }),
      this.prisma.store.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async getTvs(filter: AdminFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.search) where.name = { contains: filter.search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.tv.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { tenant: { select: { name: true } }, store: { select: { name: true } } } }),
      this.prisma.tv.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async getUsers(filter: AdminFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, role: true, blocked: true, tenantId: true, createdAt: true, lastLoginAt: true }, include: { tenant: { select: { name: true } } } }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async getPayments(filter: AdminFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' }, include: { tenant: { select: { name: true } } } }),
      this.prisma.invoice.count(),
    ]);

    return paginate(data, total, page, limit);
  }

  async getPlans() {
    return this.prisma.plan.findMany({ orderBy: { price: 'asc' } });
  }

  async createPlan(dto: CreatePlanDto) {
    return this.prisma.plan.create({ data: dto as any });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    return this.prisma.plan.update({ where: { id }, data: dto as any });
  }

  async deletePlan(id: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('Plan not found');
    await this.prisma.plan.delete({ where: { id } });
  }

  async updateSettings(dto: UpdateSystemSettingsDto) {
    for (const [key, value] of Object.entries(dto.settings)) {
      await this.prisma.systemSetting.upsert({
        where: { key },
        create: { key, value: typeof value === 'string' ? value : JSON.stringify(value) },
        update: { value: typeof value === 'string' ? value : JSON.stringify(value) },
      });
    }
    return { success: true };
  }

  async getMetrics() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const [totalTenants, newTenants, totalTvs, onlineTvs, totalMedia, totalCampaigns, apiCalls] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.tv.count(),
      this.prisma.tv.count({ where: { status: 'ONLINE' } }),
      this.prisma.media.count(),
      this.prisma.campaign.count(),
      this.prisma.auditLog.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    return {
      totalTenants, newTenants,
      totalTvs, onlineTvs, offlineTvs: totalTvs - onlineTvs,
      totalMedia, totalCampaigns,
      apiCalls30d: apiCalls,
    };
  }
}
