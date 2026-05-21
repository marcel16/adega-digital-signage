import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey) return true;

    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    const token = await this.prisma.apiToken.findFirst({
      where: { token: hashedKey, revoked: false },
      include: { tenant: true },
    });

    if (!token) throw new UnauthorizedException('Invalid API key');
    if (token.tenant?.blocked) throw new UnauthorizedException('Tenant is blocked');

    request.user = { ...token, tenantId: token.tenantId, role: 'TENANT_ADMIN' };
    request.apiKeyAuth = true;
    return true;
  }
}
