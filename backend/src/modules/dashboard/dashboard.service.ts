import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  async getStats(tenantId: string) {
    const [
      totalEstabelecimentos,
      totalTvs,
      tvsOnline,
      tvsOffline,
      totalMidias,
      midiasByTipo,
      campanhas,
      storageResult,
      tenant,
      recentActivity,
    ] = await Promise.all([
      this.prisma.estabelecimento.count({ where: { tenantId } }),
      this.prisma.tv.count({ where: { tenantId } }),
      this.prisma.tv.count({ where: { tenantId, status: 'online' } }),
      this.prisma.tv.count({ where: { tenantId, status: 'offline' } }),
      this.prisma.midia.count({ where: { tenantId } }),
      this.prisma.midia.groupBy({
        by: ['tipo'],
        where: { tenantId },
        _count: { id: true },
      }),
      this.prisma.campanha.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { id: true },
      }),
      this.prisma.midia.aggregate({
        where: { tenantId },
        _sum: { tamanho: true },
      }),
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { maxArmazenamentoMb: true },
      }),
      this.prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: { select: { id: true, nome: true, email: true } },
        },
      }),
    ]);

    const totalMidiasByTipo: Record<string, number> = {
      image: 0,
      video: 0,
      audio: 0,
      url: 0,
    };
    for (const item of midiasByTipo) {
      totalMidiasByTipo[item.tipo] = item._count.id;
    }

    const totalCampanhas: Record<string, number> = {
      draft: 0,
      active: 0,
      completed: 0,
    };
    for (const item of campanhas) {
      if (totalCampanhas[item.status] !== undefined) {
        totalCampanhas[item.status] = item._count.id;
      }
    }

    const storageUsedBytes = storageResult._sum.tamanho ?? 0;
    const storageUsed = Math.round((storageUsedBytes / (1024 * 1024)) * 100) / 100;
    const storageLimit = tenant?.maxArmazenamentoMb ?? 500;
    const storageUsagePercent =
      storageLimit > 0
        ? Math.round((storageUsed / storageLimit) * 10000) / 100
        : 0;

    return {
      totalEstabelecimentos,
      totalTvs,
      tvsOnline,
      tvsOffline,
      totalMidias,
      totalMidiasByTipo,
      totalCampanhas,
      storageUsed,
      storageLimit,
      storageUsagePercent,
      recentActivity,
    };
  }

  async getRecentActivity(tenantId: string) {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { id: true, nome: true, email: true } },
      },
    });
  }
}