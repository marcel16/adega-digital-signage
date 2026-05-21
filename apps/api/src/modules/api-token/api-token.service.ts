import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppLoggerService } from '../../common/logger/logger.service';
import { CreateApiTokenDto, ApiTokenFilterDto } from './dto/create-api-token.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ApiTokenService {
  private readonly logger = new Logger(ApiTokenService.name);

  constructor(
    private prisma: PrismaService,
    private appLogger: AppLoggerService,
  ) {}

  async findAll(tenantId: string, filter: ApiTokenFilterDto): Promise<PaginatedResult<any>> {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.apiToken.findMany({
        where: { tenantId, revoked: false },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, scopes: true, lastUsedAt: true, createdAt: true, createdAt: true },
      }),
      this.prisma.apiToken.count({ where: { tenantId, revoked: false } }),
    ]);

    return paginate(data, total, page, limit);
  }

  async create(dto: CreateApiTokenDto, tenantId: string) {
    const rawToken = `adega_${uuid().replace(/-/g, '')}_${crypto.randomBytes(16).toString('hex')}`;
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await this.prisma.apiToken.create({
      data: {
        name: dto.name,
        token: hashedToken,
        scopes: dto.scopes || [],
        tenantId,
      },
    });

    this.appLogger.audit('API_TOKEN_CREATED', 'ApiToken', dto.name, 'system');

    return { token: rawToken, name: dto.name, scopes: dto.scopes || [] };
  }

  async remove(id: string, tenantId: string) {
    await this.prisma.apiToken.updateMany({
      where: { id, tenantId },
      data: { revoked: true },
    });
    this.appLogger.audit('API_TOKEN_REVOKED', 'ApiToken', id, 'system');
  }
}
