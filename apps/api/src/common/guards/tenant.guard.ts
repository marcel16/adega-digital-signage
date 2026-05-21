import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.headers['x-tenant-id'] || user?.tenantId;

    if (!tenantId) {
      if (user?.role === 'SUPER_ADMIN') return true;
      throw new ForbiddenException('Tenant ID required');
    }

    if (user && user.role !== 'SUPER_ADMIN' && user.tenantId !== tenantId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, blocked: true },
    });

    if (!tenant) throw new ForbiddenException('Tenant not found');
    if (tenant.blocked) throw new ForbiddenException('Tenant is blocked');

    request.tenantId = tenantId;
    return true;
  }
}
