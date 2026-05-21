import { Module } from '@nestjs/common';
import { IptvController } from './iptv.controller';
import { IptvService } from './iptv.service';
import { TvModule } from '../tv/tv.module';
import { PlaylistModule } from '../playlist/playlist.module';
import { CampanhaModule } from '../campanha/campanha.module';
import { MidiaModule } from '../midia/midia.module';

@Module({
  imports: [TvModule, PlaylistModule, CampanhaModule, MidiaModule],
  controllers: [IptvController],
  providers: [IptvService],
  exports: [IptvService],
})
export class IptvModule {}