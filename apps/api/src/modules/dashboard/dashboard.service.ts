import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  async getStats(tenantId: string) {
    const [
      totalTvs, onlineTvs, totalStores,
      totalMedia, totalCampaigns, activeCampaigns,
      totalSchedules, storageUsed,
    ] = await Promise.all([
      this.prisma.tv.count({ where: { tenantId } }),
      this.prisma.tv.count({ where: { tenantId, status: 'ONLINE' } }),
      this.prisma.store.count({ where: { tenantId } }),
      this.prisma.media.count({ where: { tenantId } }),
      this.prisma.campaign.count({ where: { tenantId } }),
      this.prisma.campaign.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.schedule.count({ where: { tenantId, status: 'ACTIVE' } }),
      this.prisma.media.aggregate({ where: { tenantId }, _sum: { fileSize: true } }),
    ]);

    return {
      tvs: { total: totalTvs, online: onlineTvs, offline: totalTvs - onlineTvs },
      stores: totalStores,
      media: totalMedia,
      campaigns: { total: totalCampaigns, active: activeCampaigns },
      schedules: totalSchedules,
      storageUsed: storageUsed._sum.fileSize || 0,
    };
  }

  async getRecentActivity(tenantId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { user: { select: { name: true, email: true } } },
    });
    return logs;
  }

  async getStorageUsage(tenantId: string) {
    const byType = await this.prisma.media.groupBy({
      by: ['type'],
      where: { tenantId },
      _count: true,
      _sum: { fileSize: true },
    });

    const total = byType.reduce((acc, t) => acc + (t._sum.fileSize || 0), 0);

    return { total, byType };
  }
}
