import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.route?.path || request.url;
    const user = request.user;
    const tenantId = request.tenantId || user?.tenantId;

    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (responseBody) => {
        try {
          const entity = url.split('/').filter(Boolean)[0] || 'unknown';
          const entityId = request.params?.id || responseBody?.id;

          await this.prisma.auditLog.create({
            data: {
              action: `${method}:${url}`,
              entity,
              entityId: entityId || null,
              userId: user?.id || null,
              tenantId,
              metadata: {
                method,
                url,
                ip: request.ip,
                userAgent: request.headers['user-agent'],
                statusCode: context.switchToHttp().getResponse()?.statusCode,
              },
            },
          });
        } catch (error) {
          this.logger.error('Failed to create audit log', error);
        }
      }),
    );
  }
}
