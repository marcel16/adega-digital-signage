import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/logger.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponCodeDto, CouponFilterDto } from './dto/create-coupon.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CouponService {
  private readonly logger = new Logger(CouponService.name);

  constructor(
    private prisma: PrismaService,
    private appLogger: AppLoggerService,
  ) {}

  async findAll(filter: CouponFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.search) {
      where.code = { contains: filter.search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.coupon.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.coupon.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async create(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (existing) throw new ConflictException('Coupon code already exists');

    const coupon = await this.prisma.coupon.create({
      data: {
        code: dto.code.toUpperCase(),
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        maxRedemptions: dto.maxRedemptions || 1,
        redeemed: 0,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        minValue: dto.minValue || null,
        planId: dto.planId || null,
        description: dto.description || null,
      },
    });
    this.appLogger.audit('COUPON_CREATED', 'Coupon', coupon.id, 'system', { code: dto.code });
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.findById(id);
    const data: any = { ...dto };
    if (dto.expiresAt) data.expiresAt = new Date(dto.expiresAt);
    const coupon = await this.prisma.coupon.update({ where: { id }, data });
    this.appLogger.audit('COUPON_UPDATED', 'Coupon', id, 'system', dto);
    return coupon;
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.coupon.delete({ where: { id } });
    this.appLogger.audit('COUPON_DELETED', 'Coupon', id, 'system');
  }

  async validate(dto: ValidateCouponCodeDto) {
    const coupon = await this.prisma.coupon.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (!coupon) throw new BadRequestException('Invalid coupon code');
    if (coupon.redeemed >= coupon.maxRedemptions) throw new BadRequestException('Coupon has reached maximum redemptions');
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) throw new BadRequestException('Coupon has expired');
    if (dto.planId && coupon.planId && coupon.planId !== dto.planId) throw new BadRequestException('Coupon not applicable to this plan');

    return { valid: true, coupon };
  }
}
