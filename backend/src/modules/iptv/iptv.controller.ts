import {
  Controller, Get, Param, Query, Res, StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiProduces } from '@nestjs/swagger';
import { type Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { IptvService } from './iptv.service';
import { IptvQueryDto } from './dto/iptv-query.dto';

@ApiTags('IPTV')
@Controller('iptv')
export class IptvController {
  constructor(private iptvService: IptvService) {}

  @Public()
  @Get('tv/:identificador/playlist.m3u')
  @ApiOperation({ summary: 'Retorna playlist M3U para a TV' })
  @ApiProduces('audio/x-mpegurl')
  async getPlaylist(
    @Param('identificador') identificador: string,
    @Query() query: IptvQueryDto,
    @Res() res: Response,
  ) {
    const tv = await this.iptvService.validateTvAccess(identificador, query.token);
    const content = await this.iptvService.generateM3uForTv(tv.id);
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', `inline; filename="tv-${identificador}.m3u"`);
    res.send(content);
  }

  @Public()
  @Get('tv/:identificador/current')
  @ApiOperation({ summary: 'Retorna o conteúdo atual em exibição para a TV' })
  async getCurrent(
    @Param('identificador') identificador: string,
    @Query() query: IptvQueryDto,
  ) {
    const tv = await this.iptvService.validateTvAccess(identificador, query.token);
    return this.iptvService.getCurrentContent(tv.id);
  }

  @Public()
  @Get('tv/:identificador/status')
  @ApiOperation({ summary: 'Retorna informações de status da TV' })
  async getStatus(
    @Param('identificador') identificador: string,
    @Query() query: IptvQueryDto,
  ) {
    await this.iptvService.validateTvAccess(identificador, query.token);
    return this.iptvService.getTvStatus(identificador);
  }

  @Public()
  @Get('tv/:identificador/content/:midiaId')
  @ApiOperation({ summary: 'Proxy de download de conteúdo (mídia) para a TV' })
  async getContent(
    @Param('identificador') identificador: string,
    @Param('midiaId') midiaId: string,
    @Res() res: Response,
  ) {
    const content = await this.iptvService.getContent(identificador, midiaId);
    res.setHeader('Content-Type', content.mimetype);
    res.setHeader('Content-Disposition', `inline; filename="${content.nome}"`);
    res.setHeader('X-Content-Duration', String(content.duracao || 0));
    res.send(content.buffer);
  }
}