import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) return false;

    const tenantParam = request.params.tenantId || request.headers['x-tenant-id'];

    if (user.role === 'super_admin') return true;

    if (user.tenantId && user.tenantId !== tenantParam && tenantParam) {
      throw new ForbiddenException('Acesso negado a este tenant');
    }

    request.tenantId = user.tenantId;
    return true;
  }
}