import { Controller, Get, Param, Query, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { IptvService } from './iptv.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('IPTV')
@Controller('iptv')
export class IptvController {
  constructor(private readonly iptvService: IptvService) {}

  @Public()
  @Get(':storeCode.m3u')
  @ApiOperation({ summary: 'Get M3U playlist for store' })
  async getStoreM3u(@Param('storeCode') storeCode: string, @Query('format') format: string, @Res() res: Response) {
    const m3u = await this.iptvService.generateStoreM3u(storeCode, format);
    res.setHeader('Content-Type', 'audio/mpegurl');
    res.setHeader('Content-Disposition', `attachment; filename="${storeCode}.m3u"`);
    res.send(m3u);
  }

  @Public()
  @Get(':storeCode/:tvCode.m3u')
  @ApiOperation({ summary: 'Get M3U playlist for specific TV' })
  async getTvM3u(@Param('storeCode') storeCode: string, @Param('tvCode') tvCode: string, @Query('format') format: string, @Res() res: Response) {
    const m3u = await this.iptvService.generateTvM3u(storeCode, tvCode, format);
    res.setHeader('Content-Type', 'audio/mpegurl');
    res.setHeader('Content-Disposition', `attachment; filename="${tvCode}.m3u"`);
    res.send(m3u);
  }

  @Public()
  @Get('stream/:token')
  @ApiOperation({ summary: 'Get signed stream URL' })
  async getStream(@Param('token') token: string) {
    return this.iptvService.getStreamUrl(token);
  }
}
