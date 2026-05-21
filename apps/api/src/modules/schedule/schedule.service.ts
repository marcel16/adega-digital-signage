import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/logger.service';
import { CreateScheduleDto, UpdateScheduleDto, UpdateScheduleStatusDto, ScheduleFilterDto } from './dto/create-schedule.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private prisma: PrismaService,
    private appLogger: AppLoggerService,
  ) {}

  async findAll(tenantId: string, filter: ScheduleFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (filter.tvId) where.tvId = filter.tvId;
    if (filter.status) where.status = filter.status;
    if (filter.startDate) where.startDate = { gte: new Date(filter.startDate) };
    if (filter.endDate) where.endDate = { lte: new Date(filter.endDate) };

    const [data, total] = await Promise.all([
      this.prisma.schedule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { tv: { select: { name: true } }, campaign: { select: { name: true } }, playlist: { select: { name: true } } },
      }),
      this.prisma.schedule.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;
    const schedule = await this.prisma.schedule.findFirst({
      where,
      include: { tv: true, campaign: { include: { mediaItems: { include: { media: true }, orderBy: { order: 'asc' } } } }, playlist: { include: { items: { include: { media: true }, orderBy: { order: 'asc' } } } } },
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  async create(dto: CreateScheduleDto, tenantId: string) {
    const tv = await this.prisma.tv.findFirst({ where: { id: dto.tvId, tenantId } });
    if (!tv) throw new NotFoundException('TV not found');

    if (!dto.campaignId && !dto.playlistId) {
      throw new BadRequestException('Either campaignId or playlistId is required');
    }

    const schedule = await this.prisma.schedule.create({
      data: {
        tvId: dto.tvId,
        campaignId: dto.campaignId || null,
        playlistId: dto.playlistId || null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        daysOfWeek: dto.daysOfWeek || [],
        startTime: dto.startTime || null,
        endTime: dto.endTime || null,
        status: dto.status || 'ACTIVE',
        isRecurring: dto.isRecurring ?? false,
        tenantId,
      },
    });
    this.appLogger.audit('SCHEDULE_CREATED', 'Schedule', schedule.id, 'system', { tvId: dto.tvId });
    return schedule;
  }

  async update(id: string, dto: UpdateScheduleDto, tenantId?: string) {
    await this.findById(id, tenantId);
    const data: any = { ...dto };
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);

    const schedule = await this.prisma.schedule.update({ where: { id }, data });
    this.appLogger.audit('SCHEDULE_UPDATED', 'Schedule', id, 'system', dto);
    return schedule;
  }

  async remove(id: string, tenantId?: string) {
    await this.findById(id, tenantId);
    await this.prisma.schedule.delete({ where: { id } });
    this.appLogger.audit('SCHEDULE_DELETED', 'Schedule', id, 'system');
  }

  async updateStatus(id: string, dto: UpdateScheduleStatusDto, tenantId?: string) {
    await this.findById(id, tenantId);
    return this.prisma.schedule.update({ where: { id }, data: { status: dto.status } });
  }

  async getNowPlaying(tvId: string, tenantId?: string) {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const today = days[now.getDay()];

    const where: any = {
      tvId,
      status: 'ACTIVE',
      startDate: { lte: now },
      OR: [{ endDate: { gte: now } }, { endDate: null }],
    };
    if (tenantId) where.tenantId = tenantId;

    const schedules = await this.prisma.schedule.findMany({
      where,
      include: { campaign: { include: { mediaItems: { include: { media: true }, orderBy: { order: 'asc' } } } }, playlist: { include: { items: { include: { media: true }, orderBy: { order: 'asc' } } } } },
    });

    const active = schedules.filter(s => {
      const daysMatch = !s.daysOfWeek || s.daysOfWeek.length === 0 || s.daysOfWeek.includes(today as any);
      const timeMatch = !s.startTime || !s.endTime || (currentTime >= s.startTime && currentTime <= s.endTime);
      return daysMatch && timeMatch;
    });

    return active;
  }

  async getTodaySchedule(tvId: string, tenantId?: string) {
    const now = new Date();
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const today = days[now.getDay()];

    const where: any = {
      tvId,
      status: 'ACTIVE',
      startDate: { lte: now },
      OR: [{ endDate: { gte: now } }, { endDate: null }],
    };
    if (tenantId) where.tenantId = tenantId;

    const schedules = await this.prisma.schedule.findMany({
      where,
      include: { campaign: { select: { name: true } }, playlist: { select: { name: true } }, tv: { select: { name: true } } },
      orderBy: { startTime: 'asc' },
    });

    return schedules.filter(s => !s.daysOfWeek || s.daysOfWeek.length === 0 || s.daysOfWeek.includes(today as any));
  }
}
