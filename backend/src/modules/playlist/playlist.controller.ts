import {
  Controller, Get, Post, Body, Param, Put, Delete, Query,
  UseGuards, Res, Header, StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProduces } from '@nestjs/swagger';
import { type Response } from 'express';
import { PlaylistService } from './playlist.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddItemDto, ReorderItemsDto } from './dto/add-item.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('Playlists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('playlists')
export class PlaylistController {
  constructor(private playlistService: PlaylistService) {}

  @Get()
  @ApiOperation({ summary: 'Listar playlists (paginado)' })
  findAll(@Query() query: PaginationDto, @TenantId() tenantId: string) {
    return this.playlistService.findAll(query, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova playlist' })
  create(
    @Body() dto: CreatePlaylistDto,
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.playlistService.create(dto, tenantId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter playlist por ID' })
  findById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.playlistService.findById(id, tenantId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar playlist' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePlaylistDto,
    @TenantId() tenantId: string,
  ) {
    return this.playlistService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover playlist' })
  delete(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.playlistService.delete(id, tenantId);
  }

  @Post(':id/itens')
  @ApiOperation({ summary: 'Adicionar item à playlist' })
  addItem(
    @Param('id') id: string,
    @Body() dto: AddItemDto,
    @TenantId() tenantId: string,
  ) {
    return this.playlistService.addItem(id, dto, tenantId);
  }

  @Delete(':id/itens/:itemId')
  @ApiOperation({ summary: 'Remover item da playlist' })
  removeItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @TenantId() tenantId: string,
  ) {
    return this.playlistService.removeItem(id, itemId, tenantId);
  }

  @Put(':id/itens/reorder')
  @ApiOperation({ summary: 'Reordenar itens da playlist' })
  reorderItems(
    @Param('id') id: string,
    @Body() dto: ReorderItemsDto,
    @TenantId() tenantId: string,
  ) {
    return this.playlistService.reorderItems(id, dto, tenantId);
  }

  @Get(':id/m3u')
  @ApiOperation({ summary: 'Download da playlist em formato M3U' })
  @ApiProduces('audio/x-mpegurl')
  @Header('Content-Type', 'audio/x-mpegurl')
  @Header('Content-Disposition', 'inline; filename="playlist.m3u"')
  async downloadM3u(@Param('id') id: string, @TenantId() tenantId: string, @Res() res: Response) {
    const content = await this.playlistService.generateM3u(id, tenantId);
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.setHeader('Content-Disposition', 'inline; filename="playlist.m3u"');
    res.send(content);
  }
}