import { Module } from '@nestjs/common';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { StorageModule } from './common/storage/storage.module';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [PrismaModule, RedisModule, StorageModule, LoggerModule],
})
export class WorkerModule {}