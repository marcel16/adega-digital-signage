import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/logger.service';
import { CreateStoreDto, UpdateStoreDto, BlockStoreDto, StoreFilterDto } from './dto/create-store.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class StoreService {
  private readonly logger = new Logger(StoreService.name);

  constructor(
    private prisma: PrismaService,
    private appLogger: AppLoggerService,
  ) {}

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async findAll(tenantId: string, filter: StoreFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search } },
        { city: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.blocked !== undefined) where.blocked = filter.blocked;

    const [data, total] = await Promise.all([
      this.prisma.store.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { _count: { select: { tvs: true } } } }),
      this.prisma.store.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string, tenantId?: string) {
    const where: any = { id };
    if (tenantId) where.tenantId = tenantId;

    const store = await this.prisma.store.findFirst({
      where,
      include: { _count: { select: { tvs: true } } },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async findByCode(code: string) {
    const store = await this.prisma.store.findUnique({
      where: { code },
      include: { _count: { select: { tvs: true } } },
    });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async create(dto: CreateStoreDto, tenantId: string) {
    let code = this.generateCode();
    let attempts = 0;
    while (await this.prisma.store.findUnique({ where: { code } })) {
      code = this.generateCode();
      attempts++;
      if (attempts > 10) throw new ConflictException('Unable to generate unique code');
    }

    const store = await this.prisma.store.create({
      data: { ...dto as any, code, tenantId },
    });
    this.appLogger.audit('STORE_CREATED', 'Store', store.id, 'system', { name: dto.name, code });
    return store;
  }

  async update(id: string, dto: UpdateStoreDto, tenantId?: string) {
    await this.findById(id, tenantId);
    const store = await this.prisma.store.update({ where: { id }, data: dto as any });
    this.appLogger.audit('STORE_UPDATED', 'Store', id, 'system', dto);
    return store;
  }

  async block(id: string, dto: BlockStoreDto, tenantId?: string) {
    await this.findById(id, tenantId);
    const store = await this.prisma.store.update({ where: { id }, data: { blocked: dto.blocked } });
    this.appLogger.audit(dto.blocked ? 'STORE_BLOCKED' : 'STORE_UNBLOCKED', 'Store', id, 'system');
    return store;
  }

  async remove(id: string, tenantId?: string) {
    await this.findById(id, tenantId);
    await this.prisma.store.delete({ where: { id } });
    this.appLogger.audit('STORE_DELETED', 'Store', id, 'system');
  }
}
