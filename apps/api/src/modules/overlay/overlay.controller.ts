import { Controller, Get, Post, Patch, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OverlayService } from './overlay.service';
import { CreateOverlayDto, UpdateOverlayDto, ReorderOverlaysDto, OverlayFilterDto } from './dto/create-overlay.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Overlays')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('overlays')
export class OverlayController {
  constructor(private readonly overlayService: OverlayService) {}

  @Get()
  @ApiOperation({ summary: 'List overlays by campaign' })
  async findAll(@Query() filter: OverlayFilterDto) {
    return this.overlayService.findAll(filter);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new overlay' })
  async create(@Body() dto: CreateOverlayDto) {
    return this.overlayService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get overlay by ID' })
  async findById(@Param('id') id: string) {
    return this.overlayService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update overlay' })
  async update(@Param('id') id: string, @Body() dto: UpdateOverlayDto) {
    return this.overlayService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete overlay' })
  async remove(@Param('id') id: string) {
    return this.overlayService.remove(id);
  }

  @Post(':id/preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate preview URL for overlay' })
  async preview(@Param('id') id: string) {
    return this.overlayService.preview(id);
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch update overlay positions/zIndex' })
  async reorder(@Body() dto: ReorderOverlaysDto) {
    return this.overlayService.reorder(dto);
  }
}
