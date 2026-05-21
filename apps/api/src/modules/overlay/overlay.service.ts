import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/logger.service';
import { CreateOverlayDto, UpdateOverlayDto, ReorderOverlaysDto, OverlayFilterDto } from './dto/create-overlay.dto';

@Injectable()
export class OverlayService {
  private readonly logger = new Logger(OverlayService.name);

  constructor(
    private prisma: PrismaService,
    private appLogger: AppLoggerService,
  ) {}

  async findAll(filter: OverlayFilterDto) {
    const where: any = {};
    if (filter.campaignId) where.campaignId = filter.campaignId;
    if (filter.type) where.type = filter.type;

    return this.prisma.overlay.findMany({
      where,
      orderBy: { zIndex: 'asc' },
      include: { campaign: { select: { name: true, tenantId: true } } },
    });
  }

  async findById(id: string) {
    const overlay = await this.prisma.overlay.findUnique({ where: { id }, include: { campaign: { select: { name: true, tenantId: true } } } });
    if (!overlay) throw new NotFoundException('Overlay not found');
    return overlay;
  }

  async create(dto: CreateOverlayDto) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: dto.campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const maxZIndex = await this.prisma.overlay.aggregate({
      where: { campaignId: dto.campaignId },
      _max: { zIndex: true },
    });

    const overlay = await this.prisma.overlay.create({
      data: {
        type: dto.type,
        config: dto.config,
        position: dto.position || 'BOTTOM_RIGHT',
        width: dto.width || null,
        height: dto.height || null,
        zIndex: dto.zIndex ?? (maxZIndex._max.zIndex ?? 0) + 1,
        duration: dto.duration || null,
        campaignId: dto.campaignId,
      },
    });
    this.appLogger.audit('OVERLAY_CREATED', 'Overlay', overlay.id, 'system', { type: dto.type });
    return overlay;
  }

  async update(id: string, dto: UpdateOverlayDto) {
    await this.findById(id);
    const overlay = await this.prisma.overlay.update({ where: { id }, data: dto as any });
    this.appLogger.audit('OVERLAY_UPDATED', 'Overlay', id, 'system', dto);
    return overlay;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.overlay.delete({ where: { id } });
    this.appLogger.audit('OVERLAY_DELETED', 'Overlay', id, 'system');
  }

  async preview(id: string) {
    await this.findById(id);
    return { previewUrl: `/api/overlays/${id}/render` };
  }

  async reorder(dto: ReorderOverlaysDto) {
    for (const item of dto.items) {
      await this.prisma.overlay.update({
        where: { id: item.id },
        data: { zIndex: item.zIndex },
      });
    }
    return { success: true };
  }
}
