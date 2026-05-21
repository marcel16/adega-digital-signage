import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          if (user && !url.includes('/auth/')) {
            this.createAuditLog({
              action: `${method} ${url.split('?')[0]}`,
              userId: user.id,
              tenantId: user.tenantId,
              metadata: { method, duration, ip, statusCode: 200 },
            }).catch(() => {});
          }
        },
        error: (error) => {
          if (user) {
            this.createAuditLog({
              action: `${method} ${url.split('?')[0]}`,
              userId: user.id,
              tenantId: user.tenantId,
              metadata: { method, ip, error: error.message, statusCode: error.status || 500 },
            }).catch(() => {});
          }
        },
      }),
    );
  }

  private async createAuditLog(data: { action: string; userId: string; tenantId?: string; metadata: any }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: data.action,
          userId: data.userId,
          tenantId: data.tenantId || '',
          metadata: data.metadata,
        },
      });
    } catch {}
  }
}