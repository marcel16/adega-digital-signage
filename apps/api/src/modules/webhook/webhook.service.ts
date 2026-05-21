import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WebhookLogFilterDto } from './dto/create-webhook.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(filter: WebhookLogFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.event) where.event = filter.event;
    if (filter.status) where.status = filter.status;

    const [data, total] = await Promise.all([
      this.prisma.webhookLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.webhookLog.count({ where }),
    ]);

    return paginate(data, total, page, limit);
  }

  async findById(id: string) {
    return this.prisma.webhookLog.findUnique({ where: { id } });
  }
}
