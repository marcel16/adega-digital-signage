import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/logger.service';
import { CreateCampaignDto, UpdateCampaignDto, UpdateCampaignStatusDto, AddMediaToCampaignDto, ReorderMediaDto, CampaignFilterDto, CampaignStatus } from './dto/create-campaign.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private prisma: PrismaService,
    private appLogger: AppLoggerService,
  ) {}

  async findAll(tenantId: string, filter: CampaignFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (filter.search) {
      where.name = { contains: filter.search, mode: 'insensitive' };
    }
    if (filter.status) where.status = filter.status;
    if (filter.storeId) where.storeIds = { has: filter.storeId };
    if (filter.startDate) where.startDate = { gte: new Date(filter.startDate) };
    if (filter.endDate) where.endDate = { lte: new Date(filter.endDate) };

    const [data, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          mediaItems: { include: { media: true }, orderBy: { order: 'asc' } },
          overlays: true,
          _count: { select: { mediaItems: true, overlays: true } },
        },
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;
    const campaign = await this.prisma.campaign.findFirst({
      where,
      include: {
        mediaItems: { include: { media: true }, orderBy: { order: 'asc' } },
        overlays: { orderBy: { zIndex: 'asc' } },
      },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async create(dto: CreateCampaignDto, tenantId: string) {
    const data: any = {
      name: dto.name,
      description: dto.description || null,
      status: dto.status || CampaignStatus.DRAFT,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      storeIds: dto.storeIds || [],
      tenantId,
    };

    const campaign = await this.prisma.campaign.create({ data });

    if (dto.mediaIds && dto.mediaIds.length > 0) {
      await this.prisma.campaignMedia.createMany({
        data: dto.mediaIds.map((mediaId, index) => ({
          campaignId: campaign.id,
          mediaId,
          order: index + 1,
        })),
      });
    }

    const result = await this.findById(campaign.id);
    this.appLogger.audit('CAMPAIGN_CREATED', 'Campaign', campaign.id, 'system', { name: dto.name });
    return result;
  }

  async update(id: string, dto: UpdateCampaignDto, tenantId?: string) {
    await this.findById(id, tenantId);
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    const campaign = await this.prisma.campaign.update({ where: { id }, data });
    this.appLogger.audit('CAMPAIGN_UPDATED', 'Campaign', id, 'system', dto);
    return campaign;
  }

  async remove(id: string, tenantId?: string) {
    await this.findById(id, tenantId);
    await this.prisma.campaignMedia.deleteMany({ where: { campaignId: id } });
    await this.prisma.overlay.deleteMany({ where: { campaignId: id } });
    await this.prisma.campaign.delete({ where: { id } });
    this.appLogger.audit('CAMPAIGN_DELETED', 'Campaign', id, 'system');
  }

  async updateStatus(id: string, dto: UpdateCampaignStatusDto, tenantId?: string) {
    await this.findById(id, tenantId);
    const campaign = await this.prisma.campaign.update({
      where: { id },
      data: { status: dto.status },
    });
    this.appLogger.audit('CAMPAIGN_STATUS_CHANGED', 'Campaign', id, 'system', { status: dto.status });
    return campaign;
  }

  async duplicate(id: string, tenantId?: string) {
    const original = await this.findById(id, tenantId);
    const { id: origId, createdAt, updatedAt, mediaItems, overlays, ...data } = original;

    const campaign = await this.prisma.campaign.create({
      data: {
        ...data,
        name: `${data.name} (copy)`,
        status: CampaignStatus.DRAFT,
        tenantId: tenantId || data.tenantId,
      },
    });

    if (mediaItems?.length > 0) {
      await this.prisma.campaignMedia.createMany({
        data: mediaItems.map((item: any) => ({
          campaignId: campaign.id,
          mediaId: item.mediaId,
          order: item.order,
        })),
      });
    }

    if (overlays?.length > 0) {
      await this.prisma.overlay.createMany({
        data: overlays.map((overlay: any) => {
          const { id: oid, campaignId, createdAt: oc, updatedAt: ou, ...odata } = overlay;
          return { ...odata, campaignId: campaign.id };
        }),
      });
    }

    this.appLogger.audit('CAMPAIGN_DUPLICATED', 'Campaign', campaign.id, 'system', { originalId: origId });
    return this.findById(campaign.id);
  }

  async addMedia(id: string, dto: AddMediaToCampaignDto, tenantId?: string) {
    await this.findById(id, tenantId);
    const existingOrders = await this.prisma.campaignMedia.findMany({
      where: { campaignId: id },
      select: { order: true },
      orderBy: { order: 'desc' },
      take: 1,
    });
    let nextOrder = existingOrders.length > 0 ? existingOrders[0].order + 1 : 1;

    const data = dto.mediaIds.map((mediaId) => ({
      campaignId: id,
      mediaId,
      order: nextOrder++,
    }));

    await this.prisma.campaignMedia.createMany({ data });
    this.appLogger.audit('MEDIA_ADDED_TO_CAMPAIGN', 'Campaign', id, 'system', { mediaIds: dto.mediaIds });
    return this.findById(id);
  }

  async removeMedia(campaignId: string, mediaId: string, tenantId?: string) {
    await this.findById(campaignId, tenantId);
    await this.prisma.campaignMedia.deleteMany({
      where: { campaignId, mediaId },
    });
    this.appLogger.audit('MEDIA_REMOVED_FROM_CAMPAIGN', 'Campaign', campaignId, 'system', { mediaId });
    return this.findById(campaignId);
  }

  async reorderMedia(id: string, dto: ReorderMediaDto, tenantId?: string) {
    await this.findById(id, tenantId);
    for (const item of dto.items) {
      await this.prisma.campaignMedia.updateMany({
        where: { campaignId: id, mediaId: item.mediaId },
        data: { order: item.order },
      });
    }
    return this.findById(id);
  }
}
