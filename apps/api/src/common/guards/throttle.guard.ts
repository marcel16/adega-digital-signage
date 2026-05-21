import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(private redisService: RedisService) {
    super();
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    if (user?.role === 'SUPER_ADMIN') return true;
    return super.shouldSkip(context);
  }
}
