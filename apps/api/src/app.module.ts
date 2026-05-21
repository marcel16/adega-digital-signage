import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { StorageModule } from './common/storage/storage.module';
import { LoggerModule } from './common/logger/logger.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { StoreModule } from './modules/store/store.module';
import { TvModule } from './modules/tv/tv.module';
import { MediaModule } from './modules/media/media.module';
import { CampaignModule } from './modules/campaign/campaign.module';
import { OverlayModule } from './modules/overlay/overlay.module';
import { PlaylistModule } from './modules/playlist/playlist.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { IptvModule } from './modules/iptv/iptv.module';
import { BillingModule } from './modules/billing/billing.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { ApiTokenModule } from './modules/api-token/api-token.module';
import { SettingsModule } from './modules/settings/settings.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { YouTubeModule } from './modules/youtube/youtube.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    StorageModule,
    LoggerModule,
    HealthModule,
    AuthModule,
    TenantModule,
    StoreModule,
    TvModule,
    MediaModule,
    CampaignModule,
    OverlayModule,
    PlaylistModule,
    ScheduleModule,
    IptvModule,
    BillingModule,
    AdminModule,
    AuditModule,
    ApiTokenModule,
    SettingsModule,
    WebhookModule,
    CouponModule,
    YouTubeModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
