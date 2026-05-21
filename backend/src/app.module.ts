import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { StorageModule } from './common/storage/storage.module';
import { LoggerModule } from './common/logger/logger.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { EstabelecimentoModule } from './modules/estabelecimento/estabelecimento.module';
import { TvModule } from './modules/tv/tv.module';
import { MidiaModule } from './modules/midia/midia.module';
import { CampanhaModule } from './modules/campanha/campanha.module';
import { AgendamentoModule } from './modules/agendamento/agendamento.module';
import { PlaylistModule } from './modules/playlist/playlist.module';
import { IptvModule } from './modules/iptv/iptv.module';
import { PagamentoModule } from './modules/pagamento/pagamento.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    StorageModule,
    LoggerModule,
    AuthModule,
    TenantModule,
    EstabelecimentoModule,
    TvModule,
    MidiaModule,
    CampanhaModule,
    AgendamentoModule,
    PlaylistModule,
    IptvModule,
    PagamentoModule,
    AuditoriaModule,
    DashboardModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}