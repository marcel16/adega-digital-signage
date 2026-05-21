import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/logger.service';
import { CreateTvDto, UpdateTvDto, UpdateTvStatusDto, TvFilterDto } from './dto/create-tv.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class TvService {
  private readonly logger = new Logger(TvService.name);

  constructor(
    private prisma: PrismaService,
    private appLogger: AppLoggerService,
  ) {}

  private generatePairingCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async findAll(tenantId: string, filter: TvFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { pairingCode: { contains: filter.search } },
      ];
    }
    if (filter.storeId) where.storeId = filter.storeId;
    if (filter.status) where.status = filter.status;

    const [data, total] = await Promise.all([
      this.prisma.tv.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { store: { select: { name: true, code: true } } } }),
      this.prisma.tv.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;
    const tv = await this.prisma.tv.findFirst({ where, include: { store: true } });
    if (!tv) throw new NotFoundException('TV not found');
    return tv;
  }

  async create(dto: CreateTvDto, tenantId: string) {
    if (dto.storeId) {
      const store = await this.prisma.store.findFirst({ where: { id: dto.storeId, tenantId } });
      if (!store) throw new NotFoundException('Store not found');
    }

    const pairingCode = this.generatePairingCode();
    const token = uuid();

    const tv = await this.prisma.tv.create({
      data: {
        ...dto as any,
        pairingCode,
        token,
        tenantId,
        status: 'UNPAIRED',
      },
    });
    this.appLogger.audit('TV_CREATED', 'Tv', tv.id, 'system', { name: dto.name });
    return tv;
  }

  async update(id: string, dto: UpdateTvDto, tenantId?: string) {
    await this.findById(id, tenantId);
    const tv = await this.prisma.tv.update({ where: { id }, data: dto as any });
    this.appLogger.audit('TV_UPDATED', 'Tv', id, 'system', dto);
    return tv;
  }

  async remove(id: string, tenantId?: string) {
    await this.findById(id, tenantId);
    await this.prisma.tv.delete({ where: { id } });
    this.appLogger.audit('TV_DELETED', 'Tv', id, 'system');
  }

  async updateStatus(id: string, dto: UpdateTvStatusDto, tenantId?: string) {
    await this.findById(id, tenantId);
    const tv = await this.prisma.tv.update({ where: { id }, data: { status: dto.status } });
    return tv;
  }

  async generatePairingCode(id: string, tenantId?: string) {
    await this.findById(id, tenantId);
    const pairingCode = this.generatePairingCode();
    const token = uuid();
    const tv = await this.prisma.tv.update({
      where: { id },
      data: { pairingCode, token, status: 'UNPAIRED' },
    });
    return tv;
  }

  async getM3uUrl(id: string, tenantId?: string) {
    const tv = await this.findById(id, tenantId);
    return { m3uUrl: `/api/iptv/${tv.store?.code || 'default'}/${tv.id}.m3u`, tvId: tv.id };
  }

  async ping(body: { pairingCode?: string; token?: string; status?: string }) {
    const where: any = {};
    if (body.pairingCode) where.pairingCode = body.pairingCode;
    else if (body.token) where.token = body.token;
    else throw new BadRequestException('pairingCode or token required');

    const tv = await this.prisma.tv.findFirst({ where });
    if (!tv) throw new NotFoundException('TV not found');

    await this.prisma.tv.update({
      where: { id: tv.id },
      data: {
        lastPingAt: new Date(),
        status: (body.status as any) || 'ONLINE',
        ip: null,
      },
    });

    return { ok: true, tvId: tv.id, tenantId: tv.tenantId };
  }
}
