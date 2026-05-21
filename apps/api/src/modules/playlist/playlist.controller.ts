import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { PlaylistService } from './playlist.service';
import { CreatePlaylistDto, UpdatePlaylistDto, AddPlaylistItemDto, ReorderPlaylistItemsDto, PlaylistFilterDto } from './dto/create-playlist.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Playlists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('playlists')
export class PlaylistController {
  constructor(private readonly playlistService: PlaylistService) {}

  @Get()
  @ApiOperation({ summary: 'List playlists' })
  async findAll(@TenantId() tenantId: string, @Query() filter: PlaylistFilterDto) {
    return this.playlistService.findAll(tenantId, filter);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create playlist with items' })
  async create(@Body() dto: CreatePlaylistDto, @TenantId() tenantId: string) {
    return this.playlistService.create(dto, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get playlist by ID' })
  async findById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.playlistService.findById(id, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update playlist' })
  async update(@Param('id') id: string, @Body() dto: UpdatePlaylistDto, @TenantId() tenantId: string) {
    return this.playlistService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete playlist' })
  async remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.playlistService.remove(id, tenantId);
  }

  @Post(':id/items')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add media items to playlist' })
  async addItems(@Param('id') id: string, @Body() dto: AddPlaylistItemDto, @TenantId() tenantId: string) {
    return this.playlistService.addItems(id, dto, tenantId);
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove item from playlist' })
  async removeItem(@Param('id') id: string, @Param('itemId') itemId: string, @TenantId() tenantId: string) {
    return this.playlistService.removeItem(id, itemId, tenantId);
  }

  @Put(':id/items/reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reorder playlist items' })
  async reorderItems(@Param('id') id: string, @Body() dto: ReorderPlaylistItemsDto, @TenantId() tenantId: string) {
    return this.playlistService.reorderItems(id, dto, tenantId);
  }

  @Get(':id/m3u')
  @ApiOperation({ summary: 'Generate M3U playlist' })
  async getM3u(@Param('id') id: string, @TenantId() tenantId: string, @Res() res: Response) {
    const m3u = await this.playlistService.getM3u(id, tenantId);
    res.setHeader('Content-Type', 'audio/mpegurl');
    res.setHeader('Content-Disposition', `attachment; filename="playlist-${id}.m3u"`);
    res.send(m3u);
  }

  @Get(':id/generate')
  @ApiOperation({ summary: 'Generate playlist from campaigns/schedules' })
  async generate(@Param('id') id: string, @TenantId() tenantId: string, @Query('campaignIds') campaignIds?: string) {
    const ids = campaignIds ? campaignIds.split(',') : undefined;
    return this.playlistService.generateFromCampaigns(tenantId, ids);
  }
}
