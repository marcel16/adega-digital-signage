import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    super(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });
  }

  async onModuleInit() {
    this.on('connect', () => this.logger.log('Conectado ao Redis'));
    this.on('ready', () => this.logger.log('Redis pronto'));
    this.on('error', (err) => this.logger.error('Erro Redis:', err));
  }

  async onModuleDestroy() {
    await this.quit();
    this.logger.log('Desconectado do Redis');
  }

  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl = 300): Promise<T> {
    const cached = await this.get(key);
    if (cached) return JSON.parse(cached);
    const value = await factory();
    await this.setex(key, ttl, JSON.stringify(value));
    return value;
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const stream = this.scanStream({ match: pattern, count: 100 });
    const pipeline = this.pipeline();
    for await (const keys of stream) {
      if (keys.length) pipeline.del(...keys);
    }
    await pipeline.exec();
  }
}